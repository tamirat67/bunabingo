import { promoteToAgent } from '../services/user.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runPromotion() {
  const userId = '327292b1-eae6-4b52-936e-bba29c13fcf2'; 
  const adminId = '327292b1-eae6-4b52-936e-bba29c13fcf2'; 
  
  try {
    const result = await promoteToAgent(userId, adminId);
    console.log('User promoted to AGENT successfully:', result);
  } catch (error) {
    console.error('Failed to promote user:', error);
  }
}

runPromotion()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
