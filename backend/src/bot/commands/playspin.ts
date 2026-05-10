import { Context, Markup } from 'telegraf';
import { config } from '../../config';

export async function handlePlaySpinMenu(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  await ctx.reply(
    `🍀 Best of luck on your Spin game adventure! 🎮`,
    Markup.inlineKeyboard([
      // ── Row 1 ────────────────────────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Spin 10',  `${config.bot.miniAppUrl}/spin?bet=10`),
        Markup.button.webApp('🎮 Play Spin 20',  `${config.bot.miniAppUrl}/spin?bet=20`),
      ],
      // ── Row 2 ────────────────────────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Spin 50',  `${config.bot.miniAppUrl}/spin?bet=50`),
        Markup.button.webApp('🎮 Play Spin 100', `${config.bot.miniAppUrl}/spin?bet=100`),
      ],
      // ── Row 3: Demo (full-width) ──────────────────────────────────────────────
      [
        Markup.button.webApp('🎮 Play Spin Demo', `${config.bot.miniAppUrl}/spin?mode=demo`),
      ],
    ])
  );
}
