import { Context, Markup } from 'telegraf';
import { getUserByTelegramId } from '../../services/user.service';
import { logger } from '../../lib/logger';
import prisma from '../../lib/prisma';

const PAGE_SIZE = 5;

const TYPE_ICONS: Record<string, string> = {
  DEPOSIT:        '📥',
  WITHDRAWAL:     '📤',
  TICKET_PURCHASE:'🎫',
  PRIZE_WIN:      '🏆',
  REFUND:         '↩️',
  REFERRAL_BONUS: '🎁',
};

const STATUS_ICONS: Record<string, string> = {
  COMPLETED: '✅',
  PENDING:   '⏳',
  FAILED:    '❌',
  REVERSED:  '↩️',
};

// ─── /check_transaction ───────────────────────────────────────────────────────
export async function handleCheckTransaction(ctx: Context, page = 1) {
  const tgUser = ctx.from!;

  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    const skip = (page - 1) * PAGE_SIZE;

    const [txns, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.transaction.count({ where: { userId: user.id } }),
    ]);

    if (!txns.length) {
      return ctx.reply(
        `📋 <b>Transaction History</b>\n\nYou have no transactions yet.`,
        { parse_mode: 'HTML' }
      );
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const lines = txns.map((tx, i) => {
      const num       = skip + i + 1;
      const typeIcon  = TYPE_ICONS[tx.type]   ?? '💱';
      const statIcon  = STATUS_ICONS[tx.status] ?? '•';
      const amount    = Number(tx.amount);
      const isCredit  = ['DEPOSIT', 'PRIZE_WIN', 'REFUND', 'REFERRAL_BONUS'].includes(tx.type);
      const sign      = isCredit ? '+' : '-';
      const date      = tx.createdAt.toLocaleDateString('en-ET', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      return (
        `${num}. ${typeIcon} <b>${tx.type.replace(/_/g, ' ')}</b> ${statIcon}\n` +
        `   ${sign}${amount.toFixed(2)} ETB  •  📅 ${date}\n` +
        `   Balance: ${Number(tx.balanceBefore).toFixed(2)} → ${Number(tx.balanceAfter).toFixed(2)} ETB`
      );
    });

    // Pagination
    const navButtons = [];
    if (page > 1)          navButtons.push(Markup.button.callback('◀️ Prev', `tx_page_${page - 1}`));
    if (page < totalPages) navButtons.push(Markup.button.callback('Next ▶️', `tx_page_${page + 1}`));

    const keyboard = [];
    if (navButtons.length) keyboard.push(navButtons);

    const replyText =
      `📋 <b>Transaction History</b>  (page ${page}/${totalPages})\n` +
      `Total: ${total} transactions\n\n` +
      lines.join('\n\n');

    if (ctx.callbackQuery) {
      await ctx.editMessageText(replyText, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(keyboard),
      });
    } else {
      await ctx.reply(replyText, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(keyboard),
      });
    }
  } catch (err: any) {
    logger.error('[CheckTransaction] Error:', err);
    await ctx.reply('❌ Could not load transactions. Please try again.');
  }
}
