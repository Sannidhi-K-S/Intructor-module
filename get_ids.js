import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.trainee.findFirst();
  console.log('Trainee ID:', t.id);
  const i = await prisma.instructor.findFirst();
  console.log('Instructor ID:', i.id);
}

check().catch(console.error).finally(() => prisma.$disconnect());
