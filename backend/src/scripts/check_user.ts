import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser() {
  const telegramId = 7374663118;
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User not found. Creating user...');
    const newUser = await prisma.user.create({
      data: {
        telegramId,
        telegramUsername: 'Tekalign09',
        firstName: 'Tekalign',
        role: 'USER',
      },
    });
    console.log('User created:', newUser);
  }
}

findUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
