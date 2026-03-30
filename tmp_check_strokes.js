
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.sessionExercise.findMany();
  console.log("SessionExercises in DB:", JSON.stringify(result.map(se => ({ 
    id: se.id, 
    exercise_name: se.exercise_name, 
    score: se.score, 
    canvasStart: se.canvas_data ? se.canvas_data.substring(0, 50) : "null"
  })), null, 2));
  process.exit(0);
}

check();
