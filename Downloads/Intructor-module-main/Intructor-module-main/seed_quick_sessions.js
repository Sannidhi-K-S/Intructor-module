import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trainee = await prisma.trainee.findFirst();
  const instructor = await prisma.instructor.findFirst();

  if (!trainee || !instructor) {
    console.error("No trainee or instructor found in database. Please seed them first.");
    return;
  }

  const now = new Date();
  
  // Session 1: Starts in 1 min, Ends in 5 mins
  const start1 = new Date(now.getTime() + 1 * 60000); // +1 min
  const end1 = new Date(start1.getTime() + 5 * 60000); // 5 mins duration

  // Session 2: Starts after Session 1, Ends in 15 mins
  const start2 = new Date(end1.getTime() + 5 * 60000); // 5 min gap
  const end2 = new Date(start2.getTime() + 15 * 60000); // 15 mins duration

  // Lesson Plan 1
  const lp1 = await prisma.lessonPlan.create({
    data: {
      topic: "Emergency Descent & Fire Procedures (5m)",
      instructorNotes: "Focus on oxygen mask donning and rapid transition to descent.",
      expectedOutcome: "Student executes descent within 30 seconds of simulated fire.",
      objectives: {
        create: [
          { text: "Identify fire warning indications" },
          { text: "Execute emergency descent checklists" }
        ]
      },
      exercises: {
        create: [
          { name: "Cockpit Smoke Identification", type: "Procedure" },
          { name: "Emergency Descent Manifold", type: "Performance" }
        ]
      }
    }
  });

  // Session 1
  await prisma.session.create({
    data: {
      session_title: lp1.topic,
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Simulator",
      lesson_plan_id: lp1.id,
      start_time: start1,
      end_time: end1,
    }
  });

  // Lesson Plan 2
  const lp2 = await prisma.lessonPlan.create({
    data: {
      topic: "Night VFR Departure & Arrival (15m)",
      instructorNotes: "Review light configurations and spatial disorientation risks.",
      expectedOutcome: "Safe navigation and landing in low visibility night conditions.",
      objectives: {
        create: [
          { text: "Perform night cockpit lighting check" },
          { text: "Navigate using visual night references" }
        ]
      },
      exercises: {
        create: [
          { name: "Night Pre-flight Walkaround", type: "Checklist" },
          { name: "Night Circuit & Landing", type: "Performance" }
        ]
      }
    }
  });

  // Session 2
  await prisma.session.create({
    data: {
      session_title: lp2.topic,
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      lesson_plan_id: lp2.id,
      start_time: start2,
      end_time: end2,
    }
  });

  console.log("Quick sessions seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
