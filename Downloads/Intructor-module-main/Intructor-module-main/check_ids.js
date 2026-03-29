import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instructors = await prisma.instructor.findMany();
  const trainees = await prisma.trainee.findMany();
  console.log('Instructors:', JSON.stringify(instructors.map(i => ({ id: i.id, name: i.name }))));
  console.log('Trainees:', JSON.stringify(trainees.map(t => ({ id: t.id, name: t.name }))));
}

main().catch(console.error).finally(() => prisma.$disconnect());
