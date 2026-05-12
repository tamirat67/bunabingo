import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { config } from '../config';
import { creditWallet, creditBonus, awardCoins, XP_REWARDS } from './wallet.service';

const REFERRAL_BONUS_ETB = 5;

export async function findOrCreateUser(
  telegramUser: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  },
  referredById?: string,
  phoneNumber?: string
) {
  const telegramId = BigInt(telegramUser.id);
  logger.info(`[Auth] findOrCreateUser triggered for TG ID: ${telegramId.toString()}`);

  try {
    logger.info(`[Auth] Checking DB for user ${telegramId.toString()}...`);
    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      logger.info(`[Auth] User not found. Creating new user record...`);
      
      // Determine role based on config
      const isAdminUser = config.bot.adminIds.includes(telegramUser.id.toString());
      const role = isAdminUser ? 'ADMIN' : 'PLAYER';

      // Check if referredById is an Agent
      let agentId: string | undefined = undefined;
      if (referredById && referredById.length > 20) {
        const referrer = await prisma.user.findUnique({ where: { id: referredById } });
        if (referrer?.role === 'AGENT' || referrer?.role === 'ADMIN') {
          agentId = referrer.id;
          logger.info(`[Auth] New user ${telegramUser.first_name} linked to Agent ${referrer.firstName}`);
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          isAdmin: isAdminUser,
          role,
          referredById: referredById && referredById.length > 20 ? referredById : undefined,
          agentId, // Permanently link player to this agent
          phoneNumber: phoneNumber || undefined,
        },
      });
      logger.info(`[Auth] User record created: ${user.id} with role ${role}`);

      logger.info(`[Auth] Initializing wallet for user ${user.id}...`);
      await prisma.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: 1000 },
        update: {},
      });
      logger.info(`[Auth] Wallet initialized for user ${user.id}`);

      if (user.referredById) {
        logger.info(`[Auth] Referral link attributed: new user ${user.id} ← parent ${user.referredById}`);
        await prisma.user.update({
          where: { id: user.referredById },
          data: { referralCount: { increment: 1 } },
        });
      }
      logger.info(`🎉 [Auth] New user registered: ${user.firstName} (TG: ${telegramId})`);
    } else {
      logger.info(`[Auth] Returning existing user: ${user.firstName} (ID: ${user.id})`);
      
      // LIVE SYNC: Update name and username in case they changed in Telegram
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: telegramUser.username || user.telegramUsername,
          firstName: telegramUser.first_name || user.firstName,
          lastName: telegramUser.last_name || user.lastName,
          // Sync admin status from config if it changed
          role: config.bot.adminIds.includes(telegramUser.id.toString()) ? 'ADMIN' : user.role,
          isAdmin: config.bot.adminIds.includes(telegramUser.id.toString()),
        }
      });

      // Ensure they have a test bankroll (refill if < 100)
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet || Number(wallet.balance) < 100) {
        await prisma.wallet.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: 1000 },
          update: { balance: 1000 },
        });
        logger.info(`[Auth] Refilled existing user ${user.id} to 1000 ETB`);
      }
    }

    return user;
  } catch (err: any) {
    logger.error(`[Auth] FATAL ERROR in findOrCreateUser for TG ${telegramId}:`, err);
    throw err;
  }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
}

export async function getUserByTelegramId(telegramId: number) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    include: { wallet: true },
  });
}

export async function getAllUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      include: { wallet: true },
      orderBy: { registeredAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users, total, pages: Math.ceil(total / limit) };
}

export async function suspendUser(userId: string, adminId: string, reason: string) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await prisma.adminLog.create({
    data: {
      adminId,
      targetUserId: userId,
      action: 'SUSPEND_USER',
      details: { reason },
    },
  });
}

export async function banUser(userId: string, adminId: string, reason: string) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });
  await prisma.adminLog.create({
    data: {
      adminId,
      targetUserId: userId,
      action: 'BAN_USER',
      details: { reason },
    },
  });
}

export async function isAdmin(telegramId: number): Promise<boolean> {
  return config.bot.adminIds.includes(telegramId.toString());
}

/**
 * Saves the verified phone number and — if this user was referred —
 * awards the 2 ETB referral bonus to the referrer via creditWallet()
 * so a Transaction record is created (full audit trail).
 *
 * Returns: { user, referrer } so the bot can send a Telegram notification.
 */
export async function updateUserPhone(
  telegramId: number,
  phoneNumber: string
): Promise<{
  user: Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;
  referrer: { id: string; telegramId: bigint; firstName: string } | null;
}> {
  // Save phone
  const user = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data:  { phoneNumber },
  });

  let referrer: { id: string; telegramId: bigint; firstName: string } | null = null;

  // Award referral bonus only once (guard: phone was null before this call)
  if (user.referredById) {
    const bonusAlreadyGiven = await prisma.transaction.findFirst({
      where: {
        userId:      user.referredById,
        type:        'REFERRAL_BONUS',
        referenceId: user.id,          // referenceId = new user's id → unique per pair
      },
    });

    if (!bonusAlreadyGiven) {
      try {
        // Referral bonus goes to bonusBalance (not withdrawable main balance)
        await creditBonus(
          user.referredById,
          REFERRAL_BONUS_ETB,
          `Referral bonus — ${user.firstName} joined`
        );
        // Award XP to referrer
        await awardCoins(
          user.referredById,
          XP_REWARDS.REFER_FRIEND,
          `Referred ${user.firstName}`
        );
        logger.info(
          `[Referral] ${REFERRAL_BONUS_ETB} ETB bonus + ${XP_REWARDS.REFER_FRIEND} XP credited to ${user.referredById} ` +
          `for referring user ${user.id}`
        );

        // Fetch referrer's telegramId so bot can notify them
        const ref = await prisma.user.findUnique({
          where:  { id: user.referredById },
          select: { id: true, telegramId: true, firstName: true },
        });
        referrer = ref ?? null;
      } catch (err) {
        // Non-fatal — bonus failure should never block phone verification
        logger.error('[Referral] Failed to credit bonus:', err);
      }
    } else {
      logger.warn(`[Referral] Bonus already given for ${user.referredById} ← ${user.id}, skipping`);
    }
  }

  return { user, referrer };
}

export async function promoteToAgent(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: 'AGENT' },
  });

  await prisma.adminLog.create({
    data: {
      adminId,
      targetUserId: userId,
      action: 'PROMOTE_TO_AGENT',
      details: {},
    },
  });

  return user;
}

export async function demoteFromAgent(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: 'PLAYER' },
  });

  await prisma.adminLog.create({
    data: {
      adminId,
      targetUserId: userId,
      action: 'DEMOTE_FROM_AGENT',
      details: {},
    },
  });

  return user;
}

export async function getPlayersUnderAgent(agentId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [players, total] = await Promise.all([
    prisma.user.findMany({
      where: { agentId },
      skip,
      take: limit,
      include: { wallet: true },
      orderBy: { registeredAt: 'desc' },
    }),
    prisma.user.count({ where: { agentId } }),
  ]);
  return { players, total, pages: Math.ceil(total / limit) };
}

export async function getAgents(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [agents, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'AGENT' },
      skip,
      take: limit,
      include: { wallet: true, _count: { select: { players: true } } },
      orderBy: { registeredAt: 'desc' },
    }),
    prisma.user.count({ where: { role: 'AGENT' } }),
  ]);
  return { agents, total, pages: Math.ceil(total / limit) };
}
