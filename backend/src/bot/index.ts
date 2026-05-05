import { Telegraf, Context } from 'telegraf';
import { config } from '../config';
import { handleStart } from './commands/start';
import { handleBalance } from './commands/balance';
import { handleDeposit } from './commands/deposit';
import { handleBuyTicket, handleJoinRoom } from './commands/buyticket';
import { handleMyCards, handleResults } from './commands/mycards';
import { handleWithdraw, handleSupport } from './commands/withdraw';
import {
  handleAdminPanel, handleAdminDeposits, handleAdminWithdrawals,
  handleApproveDeposit, handleRejectDeposit,
  handleApproveWithdrawal, handleRejectWithdrawal,
} from './commands/admin';
import { logger } from '../lib/logger';

export function createBot(): Telegraf {
  const bot = new Telegraf(config.bot.token);

  // ─── Commands ─────────────────────────────────────────────
  bot.command('start',      ctx => handleStart(ctx));
  bot.command('balance',    ctx => handleBalance(ctx));
  bot.command('deposit',    ctx => handleDeposit(ctx));
  bot.command('buyticket',  ctx => handleBuyTicket(ctx));
  bot.command('join',       ctx => handleBuyTicket(ctx));
  bot.command('mycards',    ctx => handleMyCards(ctx));
  bot.command('results',    ctx => handleResults(ctx));
  bot.command('withdraw',   ctx => handleWithdraw(ctx));
  bot.command('support',    ctx => handleSupport(ctx));

  // Admin commands
  bot.command('admin',       ctx => handleAdminPanel(ctx));
  bot.command('deposits',    ctx => handleAdminDeposits(ctx));
  bot.command('withdrawals', ctx => handleAdminWithdrawals(ctx));

  // ─── Inline Button Callbacks ──────────────────────────────
  bot.action('cmd_balance',    ctx => handleBalance(ctx));
  bot.action('cmd_buy',        ctx => handleBuyTicket(ctx));
  bot.action('cmd_deposit',    ctx => handleDeposit(ctx));
  bot.action('cmd_withdraw',   ctx => handleWithdraw(ctx));
  bot.action('cmd_cards',      ctx => handleMyCards(ctx));
  bot.action('cmd_results',    ctx => handleResults(ctx));
  bot.action('cmd_support',    ctx => handleSupport(ctx));
  bot.action('admin_deposits',    ctx => handleAdminDeposits(ctx));
  bot.action('admin_withdrawals', ctx => handleAdminWithdrawals(ctx));

  // Room join actions
  bot.action(/^join_(.+)$/, ctx => {
    const roomType = ctx.match[1];
    return handleJoinRoom(ctx, roomType);
  });

  // Deposit approve/reject
  bot.action(/^approve_dep_(.+)$/, ctx => handleApproveDeposit(ctx, ctx.match[1]));
  bot.action(/^reject_dep_(.+)$/,  ctx => handleRejectDeposit(ctx, ctx.match[1]));

  // Withdrawal approve/reject
  bot.action(/^approve_wd_(.+)$/, ctx => handleApproveWithdrawal(ctx, ctx.match[1]));
  bot.action(/^reject_wd_(.+)$/,  ctx => handleRejectWithdrawal(ctx, ctx.match[1]));

  // ─── Error handler ────────────────────────────────────────
  bot.catch((err: any, ctx: Context) => {
    logger.error(`Bot error for ${ctx.updateType}:`, err);
  });

  return bot;
}
