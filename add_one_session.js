import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addSession() {
  const instructorId = 3;
  const studentId = "f3abe167-dfbb-406b-8c33-3cfe9e83a65d";

  const now = new Date();

  // Session starts in 5 minutes, runs for 1 hour
  const startTime = new Date(now.getTime() + 5 * 60 * 1000);
  const endTime   = new Date(startTime.getTime() + 60 * 60 * 1000);

  // 1. Create Lesson Plan
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      topic: "ILS Approach & Precision Landing",
      instructorNotes: "Focus on maintaining glide slope and localizer throughout the approach. Watch for early flare.",
      expectedOutcome: "Student can execute a stabilized ILS approach and landing within FAA standards.",
      objectives: {
        create: [
          { text: "Understand ILS components: localizer and glide slope" },
          { text: "Execute a full ILS approach from intercept to touchdown" },
          { text: "Apply correct go-around procedure if approach is unstable" },
        ],
      },
      exercises: {
        create: [
          { name: "ILS Intercept and Tracking", type: "Simulator" },
          { name: "Glide Slope Capture", type: "Simulator" },
          { name: "Landing Flare Technique", type: "Simulator" },
          { name: "Missed Approach Procedure", type: "Simulator" },
        ],
      },
    },
  });

  // 2. Create Session linked to Lesson Plan
  const session = await prisma.session.create({
    data: {
      session_title: "ILS Approach & Precision Landing",
      instructor_id: instructorId,
      student_id: studentId,
      training_type: "Simulator",
      simulator_id: 1,
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
  console.log(`   Exercises      : 4`);
}

addSession()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
