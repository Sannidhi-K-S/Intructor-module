import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  // 1. Ensure we have at least one instructor
  let instructor = await prisma.instructor.findFirst();
  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: {
        instructorId: "INST-001",
        name: "Capt. John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        designation: "Senior Flight Instructor",
        updated_at: new Date()
      }
    });
    console.log("Created missing instructor:", instructor);
  } else {
    console.log("Found instructor:", instructor.name);
  }

  // 2. Add different students to the trainee table
  const traineesData = [
    {
      id: "T-001",
      traineeId: "TRN-001",
      name: "Alice Smith",
      email: "alice@example.com",
      phone: "+1987654321",
      enrollmentDate: new Date(),
      course: "PPL",
      licenseType: "Private",
      status: "Active",
      updatedAt: new Date()
    },
    {
      id: "T-002",
      traineeId: "TRN-002",
      name: "Bob Johnson",
      email: "bob@example.com",
      phone: "+1987654322",
      enrollmentDate: new Date(),
      course: "CPL",
      licenseType: "Commercial",
      status: "Active",
      updatedAt: new Date()
    },
    {
      id: "T-003",
      traineeId: "TRN-003",
      name: "Charlie Davis",
      email: "charlie@example.com",
      phone: "+1987654323",
      enrollmentDate: new Date(),
      course: "IR",
      licenseType: "Instrument",
      status: "Active",
      updatedAt: new Date()
    }
  ];

  const createdTrainees = [];
  for (const tData of traineesData) {
    const existing = await prisma.trainee.findUnique({ where: { id: tData.id } });
    if (!existing) {
      const trainee = await prisma.trainee.create({ data: tData });
      createdTrainees.push(trainee);
    } else {
      createdTrainees.push(existing);
    }
  }
  console.log("Trainees ready:", createdTrainees.map(t => t.name).join(", "));

  // 3. Add a lesson plan
  const lessonPlan = await prisma.lessonplan.create({
    data: {
      topic: "Advanced Maneuvers Practicum",
      instructorNotes: "Focus on steep turns and unusual attitude recoveries.",
      expectedOutcome: "Student should be able to perform steep turns within 50 feet and 5 degrees.",
      exercise: {
        create: [
          { name: "Steep Turns", type: "Flight" },
          { name: "Unusual Attitudes", type: "Flight" },
          { name: "Emergency Procedures", type: "Ground" }
        ]
      },
      lessonobjective: {
        create: [
          { text: "Understand power distribution during steep turns" },
          { text: "Quick recovery from nose-high attitude" }
        ]
      }
    }
  });
  console.log("Created Lesson Plan ID:", lessonPlan.id);

  // 4. Add 5 sessions starting at 10, 12, 2, 3, 5
  // We'll set them for "today"
  const startHours = [10, 12, 14, 15, 17]; // 10 AM, 12 PM, 2 PM, 3 PM, 5 PM
  const now = new Date();

  for (let i = 0; i < startHours.length; i++) {
    const hour = startHours[i];
    const trainee = createdTrainees[i % createdTrainees.length]; // cyclical assign

    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 1, 0, 0); // 1 hour duration

    const session = await prisma.session.create({
      data: {
        session_title: `Flight Training - ${hour}:00`,
        instructor_id: instructor.id,
        student_id: String(trainee.id),
        training_type: "Flight_Training",
        lesson_plan_id: lessonPlan.id,
        start_time: startTime,
        end_time: endTime,
        notes: `Scheduled session for ${trainee.name} today.`
      }
    });

    console.log(`Created Session at ${hour}:00 for ${trainee.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
