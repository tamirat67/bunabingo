import { Context, Markup } from 'telegraf';
import { getUserByTelegramId } from '../../services/user.service';
import { logger } from '../../lib/logger';

// ─── /invite ──────────────────────────────────────────────────────────────────
export async function handleInvite(ctx: Context) {
  const tgUser = ctx.from!;

  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    const botUsername  = ctx.botInfo?.username ?? 'BunaBingoBot';
    const inviteLink   = `https://t.me/${botUsername}?start=${user.id}`;
    const shareMessage = encodeURIComponent(
      `🎰 Join me on Buna Bingo — the ultimate Ethiopian bingo experience!\n` +
      `☕️ We both get a bonus when you sign up!\n\n` +
      `👉 ${inviteLink}`
    );
    const shareUrl = `https://t.me/share/url?url=${inviteLink}&text=${shareMessage}`;

    logger.info(`[Invite] User ${tgUser.id} requested invite link`);

    const bannerUrl = `${process.env.WEBHOOK_URL}/uploads/banner.jpg`;
    const messageText = 
      `✉️ <b>Invite Your Friends</b>\n\n` +
      `Share your personal invite link and earn <b>5 ETB bonus</b> for every friend who joins!\n\n` +
      `🔗 <b>Your invite link:</b>\n` +
      `<code>${inviteLink}</code>\n\n` +
      `👥 Friends referred: <b>${user.referralCount}</b>\n` +
      `💰 Bonus earned: <b>${(user.referralCount * 5).toFixed(2)} ETB</b>`;

    await ctx.replyWithPhoto(bannerUrl, {
      caption: messageText,
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📤 Share Invite Link', shareUrl)],
        [Markup.button.callback('📊 Check Balance', 'cmd_balance')],
      ]),
    }).catch(() => {
      // Fallback
      return ctx.reply(messageText, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('📤 Share Invite Link', shareUrl)],
          [Markup.button.callback('📊 Check Balance', 'cmd_balance')],
        ]),
      });
    });
  } catch (err: any) {
    logger.error('[Invite] Error:', err);
    await ctx.reply('❌ Could not generate invite link. Please try again.');
  }
}
