import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (admin) {
    console.log('Admin ID:', admin.id);
  } else {
    // If no admin exists, create a dummy one or find any user
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('User ID (will use as surrogate admin):', user.id);
    } else {
      console.log('No users found.');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
