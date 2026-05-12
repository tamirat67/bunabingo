import { Router, Request, Response } from 'express';
import { agentMiddleware } from '../middleware/auth';
import { getPlayersUnderAgent } from '../services/user.service';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// Apply Agent middleware to all routes in this file
router.use(agentMiddleware);

/**
 * GET /api/agent/stats
 * Returns high-level statistics for the agent's branch
 */
router.get('/stats', async (req: Request, res: Response) => {
  const agent = (req as any).user;
  
  try {
    const [
      playerCount,
      totalDeposits,
      totalGamesPlayed,
      commissionEarned
    ] = await Promise.all([
      prisma.user.count({ where: { agentId: agent.id } }),
      prisma.deposit.aggregate({
        where: { user: { agentId: agent.id }, status: 'APPROVED' },
        _sum: { amount: true }
      }),
      prisma.ticket.count({
        where: { user: { agentId: agent.id } }
      }),
      prisma.wallet.findUnique({
        where: { userId: agent.id },
        select: { commissionBalance: true, totalCommissionEarned: true }
      })
    ]);

    res.json({
      playerCount,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalGamesPlayed,
      commissionBalance: commissionEarned?.commissionBalance || 0,
      totalCommissionEarned: commissionEarned?.totalCommissionEarned || 0
    });
  } catch (err) {
    logger.error(`[AgentAPI] Failed to fetch stats for agent ${agent.id}:`, err);
    res.status(500).json({ error: 'Failed to fetch agent statistics' });
  }
});

/**
 * GET /api/agent/players
 * Paginated list of players belonging to this agent
 */
router.get('/players', async (req: Request, res: Response) => {
  const agent = (req as any).user;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const result = await getPlayersUnderAgent(agent.id, page, limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

/**
 * GET /api/agent/transactions
 * Recent transactions from players in this agent's branch
 */
router.get('/transactions', async (req: Request, res: Response) => {
  const agent = (req as any).user;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { user: { agentId: agent.id } },
      include: { 
        user: { 
          select: { firstName: true, telegramUsername: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
