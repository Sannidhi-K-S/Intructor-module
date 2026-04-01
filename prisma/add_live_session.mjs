import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Fetching existing instructor and trainee...");

  const instructor = await prisma.instructor.findFirst();
  const trainee = await prisma.trainee.findFirst();

  if (!instructor || !trainee) {
    console.error("❌ No instructor or trainee found in DB. Please seed base data first.");
    process.exit(1);
  }

  console.log(`✅ Using Instructor: ${instructor.name} (ID: ${instructor.id})`);
  console.log(`✅ Using Trainee: ${trainee.name} (ID: ${trainee.id})`);

  // 1. Create Lesson Plan with objectives and exercises
  console.log("\n📚 Creating lesson plan...");
  const lessonPlan = await prisma.lessonplan.create({
    data: {
      topic: "Advanced Instrument Approaches – ILS & Missed Approach",
      instructorNotes:
        "Focus on glide slope interception accuracy. Watch for stabilized approach criteria below 1000ft AGL. Ensure go-around is initiated promptly on simulated engine failure.",
      expectedOutcome:
        "Trainee should demonstrate a stabilized ILS approach to minimums and execute a safe missed approach procedure with no deviations exceeding half-scale deflection.",
      lessonobjective: {
        create: [
          { text: "Understand ILS components: Localizer, Glide Slope, and Outer Marker" },
          { text: "Intercept and track the ILS localizer from a radar vector" },
          { text: "Maintain glide slope within ±0.5 dots during final approach" },
          { text: "Execute a missed approach at Decision Altitude (DA) using published procedure" },
          { text: "Perform post-maneuver debrief and self-assessment" },
        ],
      },
      exercise: {
        create: [
          { name: "Pre-flight IFR Briefing & Weather Analysis", type: "Theoretical" },
          { name: "Avionics Setup & ILS Frequency Tuning", type: "Simulation Setup" },
          { name: "Radar Vectors to ILS Localizer Intercept", type: "Flight Maneuver" },
          { name: "Precision ILS Z Approach – Runway 26", type: "Flight Maneuver" },
          { name: "Missed Approach Execution & Holding Entry", type: "Flight Maneuver" },
          { name: "Post-flight Systems Check & Debrief", type: "Debrief" },
        ],
      },
    },
  });

  console.log(`✅ Lesson plan created: ID ${lessonPlan.id} — "${lessonPlan.topic}"`);

  // 2. Create a LIVE session (starts 30 mins ago, ends 1.5 hrs from now)
  const now = new Date();
  const liveStart = new Date(now.getTime() - 30 * 60 * 1000);   // started 30 mins ago
  const liveEnd   = new Date(now.getTime() + 90 * 60 * 1000);   // ends in 90 mins

  console.log("\n🛫 Creating live session...");
  const liveSession = await prisma.session.create({
    data: {
      session_title: "ILS Approach & Missed Approach Training",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: lessonPlan.id,
      start_time: liveStart,
      end_time: liveEnd,
      notes: "Trainee is being evaluated on first solo IFR approach. Emphasis on glide slope discipline.",
    },
  });

  console.log(`✅ Live session created: ID ${liveSession.id} — "${liveSession.session_title}"`);
  console.log(`   Start: ${liveStart.toLocaleTimeString()} | End: ${liveEnd.toLocaleTimeString()}`);
  console.log(`   Status will show as: ONGOING (started 30 mins ago, still active)`);
  console.log("\n🎉 Done! Refresh your dashboard to see the live session.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
