import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.count();
  const trainees = await prisma.trainee.count();
  const instructors = await prisma.instructor.count();
  const lessonPlans = await prisma.lessonPlan.count();

  console.log({ sessions, trainees, instructors, lessonPlans });

  if (instructors > 0) {
    const inst = await prisma.instructor.findFirst();
    console.log("First Instructor:", inst);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
