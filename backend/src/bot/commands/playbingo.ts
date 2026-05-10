import { Context, Markup } from 'telegraf';
import { config } from '../../config';

export async function handlePlayBingoMenu(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  await ctx.reply(
    `🍀 Best of luck on your Bingo game adventure! 🎮`,
    Markup.inlineKeyboard([
      // ── Row 1 ────────────────────────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Bingo 10',   `${config.bot.miniAppUrl}/`),
        Markup.button.webApp('🎮 Play Bingo 20',   `${config.bot.miniAppUrl}/`),
      ],
      // ── Row 2 ────────────────────────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Bingo 50',   `${config.bot.miniAppUrl}/`),
        Markup.button.webApp('🎮 Play Bingo 100',  `${config.bot.miniAppUrl}/`),
      ],
      // ── Row 3: Demo (full-width) ──────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Bingo Demo', `${config.bot.miniAppUrl}/`),
      ],
    ])
  );
}
