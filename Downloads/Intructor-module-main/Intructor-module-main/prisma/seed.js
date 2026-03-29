import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.sessionExercise.deleteMany();
  await prisma.trainingData.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lessonObjective.deleteMany();
  await prisma.session.deleteMany();
  await prisma.lessonPlan.deleteMany();
  await prisma.trainee.deleteMany();
  await prisma.instructor.deleteMany();


  console.log("Seeding data...");

  // 1. Create Instructor
  const instructor = await prisma.instructor.create({
    data: {
      name: "Capt. Arjan Moore",
      email: "arjan.moore@flightacademy.com",
      designation: "Senior Flight Instructor",
      status: "ACTIVE",
    },
  });

  // 2. Create Trainee
  const trainee = await prisma.trainee.create({
    data: {
      traineeId: "TR-2024-001",
      name: "Sarah Jenkins",
      email: "sarah.j@student.com",
      enrollmentDate: new Date(),
      status: "ACTIVE",
    },
  });

  // 3. Create Lesson Plan with Objectives and Exercises
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      topic: "Emergency Procedures & Stall Recovery",
      instructorNotes: "Focus on smooth control inputs during recovery. Watch for secondary stalls.",
      expectedOutcome: "Student should be able to recover from a power-off stall with minimal altitude loss.",
      objectives: {
        create: [
          { text: "Understand aerodynamic factors of a stall" },
          { text: "Demonstrate power-off stall entry" },
          { text: "Execute correct recovery procedure" },
        ],
      },
      exercises: {
        create: [
          { name: "Pre-flight Briefing on Stalls", type: "Theoretical" },
          { name: "Slow Flight Maneuver", type: "Flight Maneuver" },
          { name: "Power-Off Stall Recovery", type: "Flight Maneuver" },
        ],
      },
    },
  });

  // 4. Create Sessions
  const now = new Date();
  
  // Add Test Session 1: Live (Starts Now, ends in 3 mins)
  const liveStart = new Date(now);
  const liveEnd = new Date(liveStart.getTime() + 3 * 60000); // + 3 mins

  await prisma.session.create({
    data: {
      session_title: "Live Test: 3 min Session",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Simulator",
      simulator_id: 2,
      start_time: liveStart,
      end_time: liveEnd,
    },
  });

  // Add Test Session 2: Upcoming (Starts in 1 min, ends in 4 mins)
  const upcomingStart = new Date(now.getTime() + 1 * 60000); // + 1 min
  const upcomingEnd = new Date(upcomingStart.getTime() + 3 * 60000); // + 3 mins

  await prisma.session.create({
    data: {
      session_title: "Upcoming Test: 3 min Session",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 152,
      start_time: upcomingStart,
      end_time: upcomingEnd,
    },
  });

  // Session 1: Today, starting in 1 hour
  const start1 = new Date(now);
  start1.setHours(now.getHours() + 1, 0, 0, 0);
  const end1 = new Date(start1);
  end1.setHours(start1.getHours() + 2);

  await prisma.session.create({
    data: {
      session_title: "Stall Recovery Training",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      lesson_plan_id: lessonPlan.id,
      start_time: start1,
      end_time: end1,
    },
  });

  // Session 2: Today, starting in 4 hours
  const start2 = new Date(now);
  start2.setHours(now.getHours() + 4, 30, 0, 0);
  const end2 = new Date(start2);
  end2.setHours(start2.getHours() + 1, 30);

  await prisma.session.create({
    data: {
      session_title: "Instrument Landing System (ILS)",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Simulator",
      simulator_id: 1,
      start_time: start2,
      end_time: end2,
    },
  });

  // Past Sessions for History
  const pastDate1 = new Date(now);
  pastDate1.setDate(now.getDate() - 10); // 10 days ago
  const pastEnd1 = new Date(pastDate1);
  pastEnd1.setHours(pastDate1.getHours() + 2);

  const pastSession1 = await prisma.session.create({
    data: {
      session_title: "Circuit Patterns & Touch-and-Go",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Flight_Training",
      aircraft_id: 172,
      start_time: pastDate1,
      end_time: pastEnd1,
    },
  });

  const training1 = await prisma.trainingData.create({
    data: {
      session_id: pastSession1.id,
      mode: "Flight_Training",
      topic: pastSession1.session_title,
      instructor_id: instructor.id,
      resource_id: "Aircraft 172",
      traineeId: trainee.traineeId,
      debrief_summary: "Excellent aircraft handling. Smooth touch-and-go transitions. Needs slightly more attention to crosswind correction.",
      session_outcome: "completed",
      exercises: {
        create: [
          { exercise_name: "Takeoff & Initial Climb", exercise_type: "Flight Maneuver", score: 4.5, completed: true, notes: "Steady climb rate maintained." },
          { exercise_name: "Standard Traffic Circuit", exercise_type: "Flight Maneuver", score: 4.2, completed: true, notes: "Good altitude management." },
          { exercise_name: "Crosswind Landing", exercise_type: "Flight Maneuver", score: 3.8, completed: true, notes: "Late correction on final." },
        ]
      }
    }
  });

  const pastDate2 = new Date(now);
  pastDate2.setDate(now.getDate() - 25); // 25 days ago
  const pastEnd2 = new Date(pastDate2);
  pastEnd2.setHours(pastDate2.getHours() + 1);

  const pastSession2 = await prisma.session.create({
    data: {
      session_title: "Radio Communications & Navigation",
      instructor_id: instructor.id,
      student_id: trainee.id,
      training_type: "Ground_School",
      start_time: pastDate2,
      end_time: pastEnd2,
    },
  });

  await prisma.trainingData.create({
    data: {
      session_id: pastSession2.id,
      mode: "Ground_School",
      topic: pastSession2.session_title,
      instructor_id: instructor.id,
      traineeId: trainee.traineeId,
      debrief_summary: "Strong understanding of VOR navigation. Radio calls are clear and standardized.",
      session_outcome: "completed",
      exercises: {
        create: [
          { exercise_name: "Standard Phraseology", exercise_type: "Theoretical", score: 5.0, completed: true, notes: "Perfect execution." },
          { exercise_name: "VOR Interception", exercise_type: "Theoretical", score: 4.8, completed: true, notes: "Understands the concepts well." },
        ]
      }
    }
  });

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
