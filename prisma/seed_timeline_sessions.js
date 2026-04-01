import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Fetch any existing instructor and trainee
  const trainee = await prisma.trainee.findFirst();
  const instructor = await prisma.instructor.findFirst();

  if (!trainee || !instructor) {
    console.error("No trainee or instructor found! Wait, we will create dummies if missing.");
    process.exit(1);
  }

  const now = new Date();

  // Scenario 1: Ongoing session, ending in 2 minutes
  const s1Start = new Date(now.getTime() - 58 * 60000); 
  const s1End = new Date(now.getTime() + 2 * 60000); 

  // Scenario 2: Upcoming session, starting in 5 mins
  const s2Start = new Date(now.getTime() + 5 * 60000); 
  const s2End = new Date(now.getTime() + 65 * 60000);

  // Scenario 3: Later today, starting in 3 hours
  const s3Start = new Date(now.getTime() + 180 * 60000); 
  const s3End = new Date(now.getTime() + 240 * 60000);

  const scenarios = [
    { title: "(Live Test) Emergency Procedures", start: s1Start, end: s1End, type: "Flight_Training" },
    { title: "(Next) Cross-Country IFR Setup", start: s2Start, end: s2End, type: "Simulator" },
    { title: "(Later) Pre-Flight Aerodynamics", start: s3Start, end: s3End, type: "Ground_School" },
  ];

  for (const sc of scenarios) {
    // Create Lesson Plan with Exercises
    const lp = await prisma.lessonplan.create({
      data: {
        topic: sc.title,
        instructorNotes: "Evaluate procedural adherence and strict communication guidelines during execution.",
        expectedOutcome: "Trainee completes the checklist smoothly without any instructor intervention.",
        exercise: {
          create: [
            { name: "Pre-Flight Sequence", type: "Procedure" },
            { name: "Standard Comms", type: "Communication" },
            { name: "Emergency Response", type: "Technical" }
          ]
        },
        lessonobjective: {
          create: [
            { text: "Successfully identify and mitigate simulated engine stall." },
            { text: "Maintain correct altitude and heading." }
          ]
        }
      }
    });

    // Create the associated Session
    await prisma.session.create({
      data: {
        session_title: sc.title,
        instructor_id: parseInt(instructor.id),
        student_id: trainee.id,
        simulator_id: sc.type === "Simulator" ? 101 : null,
        aircraft_id: sc.type === "Flight_Training" ? 201 : null,
        training_type: sc.type,
        lesson_plan_id: lp.id,
        start_time: sc.start,
        end_time: sc.end,
      }
    });
  }

  console.log("Successfully inserted 3 distinct scenario sessions:");
  console.log(" 1 -> Live Session (Ends in 2 mins)");
  console.log(" 2 -> Upcoming Session (Starts in 5 mins)");
  console.log(" 3 -> Later Session (Starts in 3 hours)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
