import { Context, Markup } from 'telegraf';
import { getUserByTelegramId } from '../../services/user.service';
import { config } from '../../config';

/**
 * handleDeposit now skips the selection menu and starts the manual deposit flow directly.
 * "Telegram Stars" has been safely removed as requested.
 */
export async function handleDeposit(ctx: Context) {
  const tgUser = ctx.from!;

  try {
    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    // Directly trigger manual deposit flow
    const { handleDepositManualStart } = await import('./depositFlow');
    await handleDepositManualStart(ctx);
  } catch (err) {
    await ctx.reply('❌ Error. Please try again.');
  }
}

// Keeping handleDepositManual for callback compatibility if needed
export async function handleDepositManual(ctx: Context) {
  const { handleDepositManualStart } = await import('./depositFlow');
  await handleDepositManualStart(ctx);
}
