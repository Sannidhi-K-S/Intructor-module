import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function s() {
  await prisma.trainee.upsert({
    where: { id: 'f3abe167-dfbb-406b-8c33-3cfe9e83a65d' },
    update: { name: 'Trainee Name' },
    create: { id: 'f3abe167-dfbb-406b-8c33-3cfe9e83a65d', name: 'Trainee Name' }
  });
  await prisma.instructor.upsert({
    where: { id: 3 },
    update: { name: 'Capt. Morgan' },
    create: { id: 3, name: 'Capt. Morgan', designation: 'Senior Flight Instructor' }
  });
  console.log('Seeded basics.');
}
s().catch(console.error).finally(() => prisma.$disconnect());
