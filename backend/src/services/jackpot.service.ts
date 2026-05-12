import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '../lib/logger';
import { triggerGameEvent } from '../lib/pusher';

export async function getJackpot() {
  let jackpot = await prisma.jackpot.findUnique({ where: { id: 'GLOBAL' } });
  if (!jackpot) {
    jackpot = await prisma.jackpot.create({
      data: { id: 'GLOBAL', currentAmount: 0, targetAmount: 1000 }
    });
  }
  return jackpot;
}

export async function contributeToJackpot(ticketCount: number, ticketPrice: Decimal) {
  const jackpot = await getJackpot();
  const contribution = new Decimal(ticketPrice).mul(ticketCount).mul(jackpot.contributionPercent).div(100);
  
  const updated = await prisma.jackpot.update({
    where: { id: 'GLOBAL' },
    data: { currentAmount: { increment: contribution } }
  });

  logger.info(`[Jackpot] Added ${contribution} ETB. New total: ${updated.currentAmount}`);
  return updated;
}

/**
 * Check if a win qualifies for Jackpot.
 * Rules:
 * 1. Must be a FULL_HOUSE.
 * 2. Must be within the first 40 numbers drawn (Hot Jackpot).
 * 3. Or random chance if currentAmount > targetAmount.
 */
export async function checkJackpotWin(userId: string, ticketId: string, winMode: string, numbersDrawnCount: number) {
  if (winMode !== 'FULL_HOUSE') return null;

  const jackpot = await getJackpot();
  let won = false;

  // Rule 1: Extreme speed win (within 40 balls)
  if (numbersDrawnCount <= 40) {
    won = true;
    logger.info(`[Jackpot] SPEED WIN! User ${userId} won in ${numbersDrawnCount} balls!`);
  } 
  // Rule 2: If pool is "Hot" (over target), add a random chance (1 in 500)
  else if (new Decimal(jackpot.currentAmount).gte(jackpot.targetAmount)) {
    if (Math.random() < 0.002) {
      won = true;
      logger.info(`[Jackpot] HOT WIN! User ${userId} triggered random jackpot!`);
    }
  }

  if (won) {
    const winAmount = jackpot.currentAmount;
    
    await prisma.$transaction(async (tx) => {
      // Reset jackpot
      await tx.jackpot.update({
        where: { id: 'GLOBAL' },
        data: { 
          currentAmount: 0, 
          lastWonAt: new Date(), 
          lastWinnerId: userId 
        }
      });

      // Credit user bonus balance (Jackpot goes to bonus balance for playthrough)
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (wallet) {
        await tx.wallet.update({
          where: { userId },
          data: { bonusBalance: { increment: winAmount } }
        });

        await tx.transaction.create({
          data: {
            userId,
            type: 'PRIZE_WIN',
            amount: winAmount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance, // No change to main balance
            status: 'COMPLETED',
            description: `🏆 JACKPOT WIN! (${numbersDrawnCount} balls)`
          }
        });
      }
    });

    await triggerGameEvent('GLOBAL', 'jackpot-won', {
      userId,
      amount: winAmount.toFixed(2),
      balls: numbersDrawnCount
    });

    return winAmount;
  }

  return null;
}
