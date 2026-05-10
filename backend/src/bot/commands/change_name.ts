import { Context, Markup } from 'telegraf';
import { Message } from 'telegraf/types';
import { getUserByTelegramId } from '../../services/user.service';
import { setSession, getSession, clearSession } from '../session';
import { logger } from '../../lib/logger';
import prisma from '../../lib/prisma';

// ─── /change_name ─────────────────────────────────────────────────────────────
export async function handleChangeName(ctx: Context) {
  const tgUser = ctx.from!;

  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const user = await getUserByTelegramId(tgUser.id);
    if (!user) return ctx.reply('❌ Please /start first to register.');

    setSession(tgUser.id, { type: 'CHANGE_NAME', step: 'AWAITING_NAME' });

    await ctx.reply(
      `✏️ <b>Change Account Name</b>\n\n` +
      `Current name: <b>${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}</b>\n\n` +
      `Please enter your new display name:\n` +
      `<i>(2–32 characters, letters and spaces only)</i>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'cmd_change_name_cancel')],
        ]),
      }
    );
  } catch (err: any) {
    logger.error('[ChangeName] Error:', err);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
export async function handleChangeNameCancel(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCbQuery();
  clearSession(ctx.from!.id);
  await ctx.reply('❌ Name change cancelled.');
}

// ─── Message router ───────────────────────────────────────────────────────────
export async function handleChangeNameMessage(ctx: Context): Promise<boolean> {
  const tgUser = ctx.from!;
  const session = getSession(tgUser.id);
  if (!session || session.type !== 'CHANGE_NAME') return false;

  const msg = ctx.message as any;
  const newName = ((msg as Message.TextMessage)?.text ?? '').trim();

  // Validate
  if (!newName || newName.length < 2 || newName.length > 32) {
    await ctx.reply(
      '⚠️ Name must be between 2 and 32 characters. Please try again.',
      { ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cmd_change_name_cancel')]]) }
    );
    return true;
  }

  if (!/^[\p{L}\p{M} '-]+$/u.test(newName)) {
    await ctx.reply(
      '⚠️ Name can only contain letters, spaces, hyphens and apostrophes.',
      { ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cmd_change_name_cancel')]]) }
    );
    return true;
  }

  clearSession(tgUser.id);

  try {
    const [firstName, ...rest] = newName.split(' ');
    const lastName = rest.join(' ') || null;

    await prisma.user.update({
      where: { telegramId: BigInt(tgUser.id) },
      data: { firstName, lastName: lastName ?? undefined },
    });

    logger.info(`[ChangeName] User ${tgUser.id} changed name to "${newName}"`);

    await ctx.reply(
      `✅ <b>Name updated successfully!</b>\n\n` +
      `Your new display name: <b>${newName}</b>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Main Menu', 'cmd_start')],
        ]),
      }
    );
  } catch (err: any) {
    logger.error('[ChangeName] DB error:', err);
    await ctx.reply('❌ Failed to update name. Please try again.');
  }

  return true;
}
