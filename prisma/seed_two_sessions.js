import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Locating entities...");
  let instructor = await prisma.instructor.findFirst();
  let student = await prisma.trainee.findFirst();

  if (!instructor || !student) {
    console.error("No instructor or student found. Please run your initial seed first.");
    process.exit(1);
  }

  console.log(`Using Instructor ID: ${instructor.id}, Student ID: ${student.id}`);

  // Create Lesson Plan for Session 1 (starts in 3 mins)
  const lessonPlan1 = await prisma.lessonPlan.create({
    data: {
      topic: "Emergency Procedures & Stalls",
      instructorNotes: "Focus on recovery techniques and recognizing early stall warnings. Briefing should cover altitude loss margins.",
      expectedOutcome: "Student executes clean stall recoveries losing less than 100ft. Shows immediate reaction to buffet.",
      objectives: {
        create: [
          { text: "Identify incipient stall signs" },
          { text: "Execute power-on stall recovery" },
          { text: "Execute power-off stall recovery" }
        ]
      },
      exercises: {
        create: [
          { name: "Power-On Stall", type: "Flight Maneuver" },
          { name: "Power-Off Stall (Landing Config)", type: "Flight Maneuver" },
          { name: "Spin Awareness & Avoidance", type: "Oral/Knowledge" }
        ]
      }
    }
  });

  // Calculate times for Session 1
  const now = new Date();
  const startTime1 = new Date(now.getTime() + 3 * 60000); // 3 minutes from now
  const endTime1 = new Date(now.getTime() + 10 * 60000); // 10 minutes from now

  const session1 = await prisma.session.create({
    data: {
      session_title: "Emergency Procedures & Stalls",
      instructor_id: instructor.id,
      student_id: student.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: lessonPlan1.id,
      start_time: startTime1,
      end_time: endTime1,
    }
  });

  console.log(`Created Session 1 (ID: ${session1.id}) starting at ${startTime1}`);

  // Create Lesson Plan for Session 2 (starts tomorrow)
  const lessonPlan2 = await prisma.lessonPlan.create({
    data: {
      topic: "Night Flying Operations",
      instructorNotes: "Discuss illusions at night and proper lighting systems. Ensure flashlight is ready before engine start.",
      expectedOutcome: "Student safely completes 3 full-stop night landings.",
      objectives: {
        create: [
          { text: "Understand visual illusions at night" },
          { text: "Execute standard traffic pattern at night" },
          { text: "Identify airport beacon and runway lights" }
        ]
      },
      exercises: {
        create: [
          { name: "Preflight Inspection in dark", type: "Ground Operations" },
          { name: "Taxi and instrument lighting check", type: "Ground Operations" },
          { name: "Full-stop night landings", type: "Flight Maneuver" }
        ]
      }
    }
  });

  // Calculate times for Session 2
  const startTime2 = new Date(now.getTime() + 24 * 60 * 60000); // 24 hours from now
  const endTime2 = new Date(startTime2.getTime() + 90 * 60000); // 90 mins long

  const session2 = await prisma.session.create({
    data: {
      session_title: "Night Flying Operations",
      instructor_id: instructor.id,
      student_id: student.id,
      training_type: "Simulator",
      simulator_id: 101,
      lesson_plan_id: lessonPlan2.id,
      start_time: startTime2,
      end_time: endTime2,
    }
  });

  console.log(`Created Session 2 (ID: ${session2.id}) starting at ${startTime2}`);
  console.log("Successfully seeded database with two dynamic sessions!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
