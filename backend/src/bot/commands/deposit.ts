import { Context, Markup } from 'telegraf';
import { getUserByTelegramId } from '../../services/user.service';
import { config } from '../../config';

export async function handleDeposit(ctx: Context) {
  const tgUser = ctx.from!;

  try {
    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    await ctx.reply(
      `💳 *Deposit Funds*\n\n` +
      `To deposit, open the Mini App and fill out the deposit form.\n\n` +
      `📋 *How it works:*\n` +
      `1️⃣ Transfer money via CBE/Telebirr/HelloCash\n` +
      `2️⃣ Enter amount + payment reference in the Mini App\n` +
      `3️⃣ Upload screenshot (optional but recommended)\n` +
      `4️⃣ Admin verifies and credits your wallet ⚡\n\n` +
      `⏱ Processing time: Usually within 30 minutes`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('💳 Open Deposit Form', `${config.bot.miniAppUrl}/deposit`)],
        ]),
      }
    );
  } catch (err) {
    await ctx.reply('❌ Error. Please try again.');
  }
}
