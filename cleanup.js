import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function clean() {
  try {
    await prisma.sessionExercise.deleteMany();
    await prisma.session.deleteMany();
    await prisma.lessonObjective.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.lessonPlan.deleteMany();
    await prisma.trainee.deleteMany();
    await prisma.instructor.deleteMany();
    console.log('Database successfully cleaned.');
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
clean();
