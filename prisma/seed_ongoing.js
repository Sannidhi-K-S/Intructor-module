import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding base entities...");

  // 1. Ensure an Instructor exists
  let instructor = await prisma.instructor.findFirst();
  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: {
        instructorId: "INST-001",
        name: "Capt. Arjan Maneuver",
        email: "arjan@fsms.aero",
        designation: "Senior Flight Instructor",
        status: "active",
      }
    });
    console.log(`Created Instructor: ${instructor.name}`);
  } else {
    console.log(`Using existing Instructor: ${instructor.name}`);
  }

  // 2. Ensure a Trainee exists
  let trainee = await prisma.trainee.findFirst();
  if (!trainee) {
    trainee = await prisma.trainee.create({
      data: {
        traineeId: "TRN-900",
        name: "Student Alpha",
        email: "alpha@fsms.aero",
        enrollmentDate: new Date(),
        course: "PPL",
        licenseType: "Student Pilot",
        status: "active",
      }
    });
    console.log(`Created Trainee: ${trainee.name}`);
  } else {
    console.log(`Using existing Trainee: ${trainee.name}`);
  }

  // 3. Create a comprehensive Lesson Plan
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      topic: "Cross-Country Navigation Live Test",
      instructorNotes: "Focus on dead reckoning, pilotage, and diversion tactics. Ensure student logs times accurately.",
      expectedOutcome: "Student successfully navigates a 50nm leg without GPS assistance, maintaining +/- 100ft altitude.",
      objectives: {
        create: [
          { text: "Complete pre-flight navigation log accurately" },
          { text: "Execute planned cross-country leg via pilotage" },
          { text: "Perform an inflight diversion to an alternate airport" }
        ]
      },
      exercises: {
        create: [
          { name: "Dead Reckoning Implementation", type: "Flight Maneuver" },
          { name: "Inflight Diversion Calculation", type: "Oral/Knowledge" },
          { name: "Altitude and Heading Maintenance", type: "Flight Maneuver" }
        ]
      }
    }
  });

  console.log(`Created Lesson Plan: ${lessonPlan.topic}`);

  // 4. Create an ONGOING session (Started 10 mins ago, Ends in 50 mins)
  const now = new Date();
  const startTime = new Date(now.getTime() - 10 * 60000); // 10 minutes ago
  const endTime = new Date(now.getTime() + 50 * 60000); // 50 minutes from now

  const session = await prisma.session.create({
    data: {
      session_title: "Cross-Country Navigation Live Test",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: lessonPlan.id,
      start_time: startTime,
      end_time: endTime,
    }
  });

  console.log(`\n===========================================`);
  console.log(`✅ SUCCESS! Created ONGOING Session ID: ${session.id}`);
  console.log(`Started: ${startTime.toLocaleTimeString()}`);
  console.log(`Ends: ${endTime.toLocaleTimeString()}`);
  console.log(`This session will appear as "LIVE/ONGOING" right now!`);
  console.log(`===========================================\n`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
