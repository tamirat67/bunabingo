import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'tanga_dreams';
  const adminId = 5310030963n;
  const passwordPlain = 'admin123';

  console.log(`Processing Admin: ${adminUsername} (${adminId})`);

  let user = await prisma.user.findUnique({ where: { telegramId: adminId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: adminId,
        telegramUsername: adminUsername,
        firstName: adminUsername,
        role: 'ADMIN',
        isAdmin: true,
        status: 'ACTIVE'
      }
    });
    console.log(`  - Created new admin profile`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        role: 'ADMIN', 
        isAdmin: true,
        telegramUsername: adminUsername 
      }
    });
    console.log(`  - Updated existing user to ADMIN`);
  }

  // Set Password
  const hash = await bcrypt.hash(passwordPlain, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash }
  });
  console.log(`  - Password set to: ${passwordPlain}`);

  console.log('\n--- ALL USERS LIST ---');
  const allUsers = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { createdAt: 'desc' }
  });

  allUsers.forEach((u, i) => {
    console.log(`${i+1}. [${u.role}] ${u.firstName} (@${u.telegramUsername || 'no_user'}) - ID: ${u.telegramId} - Balance: ${u.wallet?.balance || 0} ETB`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
