import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  const instructorId = 3;
  const studentId = "f3abe167-dfbb-406b-8c33-3cfe9e83a65d";

  const now = new Date();
  
  // Session 1: 15 min (starts in 5 min)
  const start1 = new Date(now.getTime() + 5 * 60000);
  const end1 = new Date(start1.getTime() + 15 * 60000);

  // Session 2: 30 min (after session 1)
  const start2 = new Date(end1.getTime());
  const end2 = new Date(start2.getTime() + 30 * 60000);

  // Session 3: 30 min (after session 2)
  const start3 = new Date(end2.getTime());
  const end3 = new Date(start3.getTime() + 30 * 60000);

  const sessions = [
    {
      title: "Instrument Essentials (15m)",
      start: start1,
      end: end1,
      type: "Ground_School",
      lesson: {
        topic: "Core Instrument Proficiency",
        notes: "A rapid review of core IFR procedures, focus on altitude and lost comms.",
        outcome: "Successful identification of emergency procedures.",
        objectives: ["Review Altimeter Corrections", "Emergency Signal Comm Protocols"],
        exercises: [{ name: "Procedural Quiz", type: "Oral" }]
      }
    },
    {
      title: "Precision Approaches (30m)",
      start: start2,
      end: end2,
      type: "Simulator",
      lesson: {
        topic: "Advanced ILS Techniques",
        notes: "Intensive 30-minute block on CAT II/III precision approaches.",
        outcome: "Student handles glide slope intercept and tracking with precision.",
        objectives: ["Stabilized ILS Approach", "Handling Wind Shear on Final"],
        exercises: [
          { name: "ILS Approach Runway 26", type: "Flight" },
          { name: "Missed Approach Execute", type: "Flight" }
        ]
      }
    },
    {
      title: "Navigation Legs (30m)",
      start: start3,
      end: end3,
      type: "Flight_Training",
      lesson: {
        topic: "Enroute Navigational Exercise",
        notes: "Final 30-minute block on real-world cross-country navigation.",
        outcome: "Correction for wind drift is applied effectively.",
        objectives: ["VOR-to-VOR Navigation", "Dead Reckoning Accuracy"],
        exercises: [
          { name: "Enroute Course Correction", type: "Flight" },
          { name: "Approach Transition", type: "Flight" }
        ]
      }
    }
  ];

  for (const s of sessions) {
    const lp = await prisma.lessonPlan.create({
      data: {
        topic: s.lesson.topic,
        instructorNotes: s.lesson.notes,
        expectedOutcome: s.lesson.outcome,
        objectives: {
          create: s.lesson.objectives.map(o => ({ text: o }))
        },
        exercises: {
          create: s.lesson.exercises.map(e => ({ name: e.name, type: e.type }))
        }
      }
    });

    await prisma.session.create({
      data: {
        session_title: s.title,
        instructor_id: instructorId,
        student_id: studentId,
        start_time: s.start,
        end_time: s.end,
        training_type: s.type,
        lesson_plan_id: lp.id
      }
    });
  }

  console.log('Successfully seeded 3 sessions.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
