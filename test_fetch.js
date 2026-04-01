import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await prisma.session.findMany({
    where: {
      start_time: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      lessonplan: {
        include: {
          lessonobjective: true,
          exercise: true,
        },
      },
    },
  });

  console.log(`Found ${sessions.length} sessions for today (from ${today.toISOString()} to ${tomorrow.toISOString()}):`);
  sessions.forEach(s => {
    console.log(`- ID: ${s.id}, Title: ${s.session_title}, Start: ${s.start_time.toISOString()}, Type: ${s.training_type}, Student ID: ${s.student_id}`);
  });
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
