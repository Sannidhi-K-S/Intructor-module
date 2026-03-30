
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const tdata = await prisma.trainingData.findMany({ include: { exercises: true } });
  console.log("TrainingData:", tdata);
  
  const sessions = await prisma.session.findMany({ include: { lessonPlan: { include: { exercises: true } } } });
  console.log("Sessions:", sessions);
  
  process.exit(0);
}

check();
