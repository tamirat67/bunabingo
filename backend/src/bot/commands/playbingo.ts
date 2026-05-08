import { Context, Markup } from 'telegraf';
import { config } from '../../config';

export async function handlePlayBingoMenu(ctx: Context) {
  const text = `🍀 Best of luck on your Bingo game adventure! 🎮`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.webApp('🎮 Play Bingo 10', `${config.bot.miniAppUrl}/game?bet=10`),
      Markup.button.webApp('🎮 Play Bingo 20', `${config.bot.miniAppUrl}/game?bet=20`),
    ],
    [
      Markup.button.webApp('🎮 Play Bingo 50', `${config.bot.miniAppUrl}/game?bet=50`),
      Markup.button.webApp('🎮 Play Bingo 100', `${config.bot.miniAppUrl}/game?bet=100`),
    ],
    [
      Markup.button.webApp('🎮 Play Bingo Demo', `${config.bot.miniAppUrl}/game?mode=demo`),
    ],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
    await ctx.reply(text, keyboard);
  } else {
    await ctx.reply(text, keyboard);
  }
}
