import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE typname = 'InternshipStatus';
    `;
    console.log('Current InternshipStatus Enum values in DB:', result);
  } catch (err) {
    console.error('Error fetching enum values:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
