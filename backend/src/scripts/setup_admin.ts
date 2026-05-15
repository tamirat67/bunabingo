import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  let admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  
  if (!admin) {
    console.log('No admin found, creating one...');
    admin = await prisma.user.create({
      data: {
        telegramId: 1n,
        telegramUsername: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        isAdmin: true,
        status: 'ACTIVE'
      }
    });
  }

  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { id: admin.id },
    data: { 
      passwordHash: hash,
      telegramUsername: 'admin' // Ensure the username is 'admin'
    }
  });

  console.log('--- ADMIN ACCESS ---');
  console.log('Username:', 'admin');
  console.log('Password:', 'admin123');
  console.log('URL: /admin/login');
  console.log('-------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
