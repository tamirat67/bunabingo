import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n--- UPDATED ALL USERS LIST ---');
  const allUsers = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { createdAt: 'desc' }
  });

  allUsers.forEach((u, i) => {
    console.log(`${i+1}. [${u.role}] ${u.firstName} (@${u.telegramUsername || 'no_user'}) - ID: ${u.telegramId} - Balance: ${u.wallet?.balance || 0} ETB`);
  });
  console.log('------------------------------\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
