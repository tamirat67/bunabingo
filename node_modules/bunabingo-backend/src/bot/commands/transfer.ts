import { Context, Markup } from 'telegraf';
import { Message } from 'telegraf/types';
import { getUserByTelegramId } from '../../services/user.service';
import { getOrCreateWallet, creditWallet, debitWallet } from '../../services/wallet.service';
import { setSession, getSession, clearSession, TransferSession } from '../session';
import { logger } from '../../lib/logger';
import prisma from '../../lib/prisma';

const CANCEL_BTN = [[Markup.button.callback('❌ Cancel', 'cmd_transfer_cancel')]];

// ─── /transfer — Step 1: intro & ask for recipient ───────────────────────────
export async function handleTransfer(ctx: Context) {
  const tgUser = ctx.from!;

  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    const wallet  = await getOrCreateWallet(user.id);
    const balance = Number(wallet.balance);

    if (balance <= 0) {
      return ctx.reply(
        `💸 <b>Transfer Funds</b>\n\n` +
        `❌ You have no balance to transfer.\n\n` +
        `💰 Current Balance: <b>0.00 ETB</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💵 Deposit Now', 'cmd_deposit')],
          ]),
        }
      );
    }

    setSession(tgUser.id, { type: 'TRANSFER', step: 'AWAITING_RECIPIENT' });

    await ctx.reply(
      `💸 <b>Transfer Funds</b>\n\n` +
      `💰 Your Balance: <b>${balance.toFixed(2)} ETB</b>\n\n` +
      `Enter the <b>Telegram username</b> of the recipient:\n` +
      `<i>(Example: @username)</i>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(CANCEL_BTN),
      }
    );
  } catch (err: any) {
    logger.error('[Transfer] handleTransfer error:', err);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
export async function handleTransferCancel(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCbQuery();
  clearSession(ctx.from!.id);
  await ctx.reply('❌ Transfer cancelled.');
}

// ─── Confirm callback ─────────────────────────────────────────────────────────
export async function handleTransferConfirm(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  const tgUser  = ctx.from!;
  const session = getSession(tgUser.id) as TransferSession | undefined;

  if (!session || session.type !== 'TRANSFER' || session.step !== 'CONFIRMING') {
    return ctx.reply('❌ No active transfer. Use /transfer to start again.');
  }

  const { recipientId, recipientName, recipientUsername, amount } = session;
  clearSession(tgUser.id);

  if (!recipientId || !amount) {
    return ctx.reply('❌ Incomplete transfer data. Please start again with /transfer.');
  }

  try {
    const sender = await getUserByTelegramId(tgUser.id);
    if (!sender) return ctx.reply('❌ Sender not found.');

    // Debit sender
    await debitWallet(
      sender.id,
      amount,
      'WITHDRAWAL',
      undefined,
      `Transfer to @${recipientUsername ?? recipientId}`
    );

    // Credit recipient
    await creditWallet(
      recipientId,
      amount,
      'REFERRAL_BONUS',
      undefined,
      `Transfer from @${sender.telegramUsername ?? sender.firstName}`
    );

    logger.info(`[Transfer] ${sender.id} → ${recipientId}: ${amount} ETB`);

    await ctx.reply(
      `✅ <b>Transfer Successful!</b>\n\n` +
      `👤 To: <b>${recipientName}</b>` +
      `${recipientUsername ? ` (@${recipientUsername})` : ''}\n` +
      `💸 Amount: <b>${amount.toFixed(2)} ETB</b>\n\n` +
      `Funds sent instantly. ☕️`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💰 Check Balance', 'cmd_balance')],
        ]),
      }
    );

    // Notify recipient (non-critical — may fail if they blocked the bot)
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (recipient) {
      try {
        await ctx.telegram.sendMessage(
          Number(recipient.telegramId),
          `💸 <b>You received a transfer!</b>\n\n` +
          `👤 From: <b>${sender.firstName}</b>` +
          `${sender.telegramUsername ? ` (@${sender.telegramUsername})` : ''}\n` +
          `💰 Amount: <b>${amount.toFixed(2)} ETB</b>\n\n` +
          `Your wallet has been credited. ☕️`,
          { parse_mode: 'HTML' }
        );
      } catch {
        logger.warn(`[Transfer] Could not notify recipient ${recipientId}`);
      }
    }
  } catch (err: any) {
    logger.error('[Transfer] Execution error:', err);
    await ctx.reply(`❌ Transfer failed: ${err.message}`);
  }
}

// ─── Message router ───────────────────────────────────────────────────────────
export async function handleTransferMessage(ctx: Context): Promise<boolean> {
  const tgUser  = ctx.from!;
  const session = getSession(tgUser.id) as TransferSession | undefined;
  if (!session || session.type !== 'TRANSFER') return false;

  const msg  = ctx.message as any;
  const text = ((msg as Message.TextMessage)?.text ?? '').trim();

  // ── Step 2: Receive recipient username ────────────────────────────────────
  if (session.step === 'AWAITING_RECIPIENT') {
    if (!text) {
      await ctx.reply('⚠️ Please type a Telegram username.', {
        ...Markup.inlineKeyboard(CANCEL_BTN),
      });
      return true;
    }

    const username = text.replace(/^@/, '').toLowerCase();

    const recipient = await prisma.user.findFirst({
      where: { telegramUsername: { equals: username, mode: 'insensitive' } },
      include: { wallet: true },
    });

    if (!recipient) {
      await ctx.reply(
        `❌ User <b>@${username}</b> not found.\n` +
        `Make sure they are registered with Buna Bingo.`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', 'cmd_transfer')],
            [Markup.button.callback('❌ Cancel',    'cmd_transfer_cancel')],
          ]),
        }
      );
      return true;
    }

    if (recipient.telegramId === BigInt(tgUser.id)) {
      await ctx.reply('❌ You cannot transfer funds to yourself.', {
        ...Markup.inlineKeyboard(CANCEL_BTN),
      });
      return true;
    }

    const updated: TransferSession = {
      ...session,
      step:              'AWAITING_AMOUNT',
      recipientId:       recipient.id,
      recipientName:     recipient.firstName,
      recipientUsername: recipient.telegramUsername ?? username,
    };
    setSession(tgUser.id, updated);

    await ctx.reply(
      `✅ Recipient: <b>${recipient.firstName}</b>` +
      `${recipient.telegramUsername ? ` (@${recipient.telegramUsername})` : ''}\n\n` +
      `💰 How much do you want to send? <i>(ETB, minimum 10)</i>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(CANCEL_BTN),
      }
    );
    return true;
  }

  // ── Step 3: Receive amount ────────────────────────────────────────────────
  if (session.step === 'AWAITING_AMOUNT') {
    const amount = parseFloat(text);

    if (isNaN(amount) || amount < 10) {
      await ctx.reply('⚠️ Enter a valid amount (minimum 10 ETB).', {
        ...Markup.inlineKeyboard(CANCEL_BTN),
      });
      return true;
    }

    const sender = await getUserByTelegramId(tgUser.id);
    if (!sender) return true;

    const wallet = await getOrCreateWallet(sender.id);
    if (Number(wallet.balance) < amount) {
      await ctx.reply(
        `❌ Insufficient balance.\n\n` +
        `💰 Available: <b>${Number(wallet.balance).toFixed(2)} ETB</b>\n` +
        `💸 Requested: <b>${amount.toFixed(2)} ETB</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(CANCEL_BTN),
        }
      );
      return true;
    }

    const updated: TransferSession = { ...session, step: 'CONFIRMING', amount };
    setSession(tgUser.id, updated);

    await ctx.reply(
      `📋 <b>Confirm Transfer</b>\n\n` +
      `👤 To: <b>${session.recipientName}</b>` +
      `${session.recipientUsername ? ` (@${session.recipientUsername})` : ''}\n` +
      `💸 Amount: <b>${amount.toFixed(2)} ETB</b>\n\n` +
      `Proceed?`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Confirm', 'cmd_transfer_confirm'),
            Markup.button.callback('❌ Cancel',  'cmd_transfer_cancel'),
          ],
        ]),
      }
    );
    return true;
  }

  return false;
}
