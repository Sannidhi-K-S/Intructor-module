import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addSession() {
  const instructorId = 3;
  const studentId = "f3abe167-dfbb-406b-8c33-3cfe9e83a65d";

  const now = new Date();

  // Create start time for 12:00 PM today
  const startTime = new Date(now);
  startTime.setHours(12, 0, 0, 0);

  // End time 1 hour later (13:00 / 1:00 PM)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  // 1. Create Lesson Plan
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      topic: "Cross-Country Navigation & Diversion",
      instructorNotes: "Focus on in-flight calculations and fuel management. Simulate changing weather to trigger a diversion.",
      expectedOutcome: "Student can calculate new ETA and fuel burn while managing the aircraft during an enroute diversion.",
      objectives: {
        create: [
          { text: "Complete pre-flight navigation log" },
          { text: "Execute planned cross-country leg" },
          { text: "Identify need for diversion and calculate new heading/ETA" },
        ],
      },
      exercises: {
        create: [
          { name: "Dead Reckoning Implementation", type: "Flight Maneuver" },
          { name: "Radio Checkpoints", type: "Flight Maneuver" },
          { name: "Unplanned Diversion Execution", type: "Flight Maneuver" },
        ],
      },
    },
  });

  // 2. Create Session linked to Lesson Plan
  const session = await prisma.session.create({
    data: {
      session_title: "Cross-Country Navigation & Diversion",
      instructor_id: instructorId,
      student_id: studentId,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: lessonPlan.id,
      start_time: startTime,
      end_time: endTime,
    },
  });

  console.log("✅ Session created successfully!");
  console.log(`   Session ID     : ${session.id}`);
  console.log(`   Title          : ${session.session_title}`);
  console.log(`   Starts at      : ${startTime.toLocaleTimeString()}`);
  console.log(`   Ends at        : ${endTime.toLocaleTimeString()}`);
  console.log(`   Lesson Plan ID : ${lessonPlan.id}`);
  console.log(`   Exercises      : 3`);
}

addSession()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
