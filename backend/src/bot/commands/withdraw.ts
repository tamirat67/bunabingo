import { Context, Markup } from 'telegraf';
import { getUserByTelegramId } from '../../services/user.service';
import { createWithdrawalRequest } from '../../services/withdrawal.service';
import { config } from '../../config';

export async function handleWithdraw(ctx: Context) {
  const tgUser = ctx.from!;
  try {
    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first.');

    const balance = Number(user.wallet?.balance ?? 0);

    await ctx.reply(
      `💸 *Withdraw Funds*\n\n` +
      `💰 Available Balance: *${balance.toFixed(2)} ETB*\n\n` +
      `📋 *Withdrawal Rules:*\n` +
      `• Minimum: ${config.withdrawal.minAmount} ETB\n` +
      `• Maximum: ${config.withdrawal.maxAmount} ETB\n` +
      `• Admin approval required (usually within 2 hours)\n` +
      `• Only one pending request at a time\n\n` +
      `Use the Mini App to submit your request 👇`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('💸 Request Withdrawal', `${config.bot.miniAppUrl}/withdraw`)],
        ]),
      }
    );
  } catch {
    await ctx.reply('❌ Error. Please try again.');
  }
}

export async function handleSupport(ctx: Context) {
  await ctx.reply(
    `🆘 *Support*\n\n` +
    `Need help? Here's how to reach us:\n\n` +
    `📧 Issues: Use the Mini App support form\n` +
    `⏱ Response time: Within 24 hours\n\n` +
    `*Common Issues:*\n` +
    `• Deposit not credited → Submit reference + screenshot\n` +
    `• Can't join game → Check wallet balance (/balance)\n` +
    `• Withdrawal pending → Allow up to 2 hours\n\n` +
    `📱 For fastest support, use the Mini App 👇`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🆘 Open Support', `${process.env.MINI_APP_URL}/support`)],
      ]),
    }
  );
}
