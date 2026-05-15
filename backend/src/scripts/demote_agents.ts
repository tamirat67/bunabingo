import { demoteFromAgent } from '../services/user.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDemotion(telegramId: bigint) {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    console.log(`User with ID ${telegramId} not found.`);
    return;
  }

  try {
    const result = await demoteFromAgent(user.id, '327292b1-eae6-4b52-936e-bba29c13fcf2');
    console.log(`Successfully demoted ${user.telegramUsername || user.firstName} to PLAYER.`);
  } catch (error) {
    console.error(`Failed to demote ${user.telegramUsername || user.firstName}:`, error);
  }
}

async function main() {
  await runDemotion(372050954n);
  await runDemotion(8263717692n);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
