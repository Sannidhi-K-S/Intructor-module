import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessionCount = await prisma.session.count();
  
  if (sessionCount > 0) {
    console.log("DATABASE ALREADY SEEDED, SKIPPING...");
    return;
  }

  console.log("SEEDING LIVE ONGOING SESSIONS...");

  // 1. Core Instructor
  const instructor = await prisma.instructor.create({
    data: {
      name: "Capt. Arjan Moore",
      email: "arjan.moore@flightacademy.com",
      designation: "Senior Flight Instructor",
      status: "ACTIVE",
      updated_at: new Date(),
    },
  });

  // 2. Core Trainee
  const trainee = await prisma.trainee.create({
    data: {
      id: "TRN-9021",
      traineeId: "TR-2024-001",
      name: "Sarah Jenkins",
      email: "sarah.j@student.com",
      enrollmentDate: new Date(),
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  // 3. Lesson Plans for each mode
  const flightPlan = await prisma.lessonplan.create({
    data: {
      topic: "Advanced Instrument Flight",
      exercise: {
        create: [
          { name: "ILS Approach Z Rwy 26", type: "Flight Maneuver" },
          { name: "Engine Failure in IMC", type: "Emergency" },
        ],
      },
    },
  });

  const simPlan = await prisma.lessonplan.create({
    data: {
      topic: "Multi-Engine Management",
      exercise: {
        create: [
          { name: "Prop Feathering Logic", type: "Procedure" },
          { name: "Single-Engine Takeoff", type: "Sim Maneuver" },
        ],
      },
    },
  });

  const groundPlan = await prisma.lessonplan.create({
    data: {
      topic: "Aeronautical Meteorology",
      exercise: {
        create: [
          { name: "Decoding METAR/TAF", type: "Theoretical" },
          { name: "Frontal Systems Analysis", type: "Theory" },
        ],
      },
    },
  });

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600000);
  const hourLater = new Date(now.getTime() + 7200000); // 2 hours from now

  // 4a. Flight Training (Ongoing Now)
  await prisma.session.create({
    data: {
      session_title: "Flight: Advanced Instruments",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: flightPlan.id,
      start_time: hourAgo,
      end_time: hourLater,
    },
  });

  // 4b. Simulator (Ongoing Now)
  await prisma.session.create({
    data: {
      session_title: "Sim: Multi-Engine Drills",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Simulator",
      simulator_id: 1,
      lesson_plan_id: simPlan.id,
      start_time: hourAgo,
      end_time: hourLater,
    },
  });

  // 4c. Ground School (Ongoing Now)
  await prisma.session.create({
    data: {
      session_title: "Ground: Weather Theory",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Ground_School",
      lesson_plan_id: groundPlan.id,
      start_time: hourAgo,
      end_time: hourLater,
    },
  });

  console.log("SEEDING COMPLETE. DATA PREPARED.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
