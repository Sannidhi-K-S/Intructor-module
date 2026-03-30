import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🧠 Helper: format to HH:MM AM/PM
function formatTime(date) {
  if (!date) return "";
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

// 🧠 Helper: calculate status
function getStatus(session) {
  const now = new Date();
  if (now < session.start_time) return "upcoming";
  if (now > session.end_time) return "completed";
  return "ongoing";
}

// 🧠 Helper: get resource
function getResource(session) {
  if (session.training_type === "Flight_Training") {
    return `Aircraft ${session.aircraft_id || "Unassigned"}`;
  }
  if (session.training_type === "Simulator") {
    return `Simulator ${session.simulator_id || "Unassigned"}`;
  }
  return "Classroom";
}

// 🚀 MAIN FUNCTION
export const getDashboardData = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.session.findMany({
      where: {
        start_time: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        lessonPlan: {
          include: {
            objectives: true,
            exercises: true,
          },
        },
      },
    });

    // Fetch all training data for these sessions to check for debriefs
    const trainingDataRecords = await prisma.trainingData.findMany({
      where: {
        session_id: { in: sessions.map(s => s.id) }
      }
    });

    const trainees = await prisma.trainee.findMany();
    const instructors = await prisma.instructor.findFirst();

    const result = sessions.map((s) => {
      const trainee = trainees.find((t) => t.id === s.student_id);
      const trainingData = trainingDataRecords.find((td) => td.session_id === s.id);

      return {
        id: s.id,
        topic: s.session_title,
        startTime: formatTime(s.start_time),
        endTime: formatTime(s.end_time),
        type: s.training_type === "Ground_School" ? "Class" : (s.training_type || "Class").replace("_", " "),

        status: getStatus(s),

        trainee: trainee?.name || "Unknown Trainee",
        resourceUsed: getResource(s),
        debriefSummary: trainingData?.debrief_summary || null,

        lessonPlan: s.lessonPlan
          ? {
              topic: s.lessonPlan.topic,
              objectives: s.lessonPlan.objectives.map((o) => o.text),
              instructorNotes: s.lessonPlan.instructorNotes,
              expectedOutcome: s.lessonPlan.expectedOutcome,
              exercises: s.lessonPlan.exercises.map((ex) => ({
                id: ex.id,
                name: ex.name,
                type: ex.type,
                completed: false,
              })),

            }
          : null,
      };
    });

    return {
      user: {
        name: instructors?.name || "Instructor",
        role: instructors?.designation || "Senior Instructor",
        instructorId: instructors?.instructorId || "INST-001",
        email: instructors?.email || "instructor@fsms.aero",
        phone: instructors?.phone || "+1 (555) 000-0000",
        designation: instructors?.designation || "Senior Flight Instructor",
      },
      sessions: result, // Return all today's sessions
    };
  } catch (err) {
    console.error("Service Error:", err);
    throw err;
  }
};

export const saveSessionScores = async (sessionId, traineeId, exercises, overallNotes) => {
  try {
    if (!exercises || exercises.length === 0 || !sessionId) return null;
    
    const sessionRecord = await prisma.session.findUnique({ where: { id: Number(sessionId) } });
    if (!sessionRecord) throw new Error("Session not found");
    
    const realTraineeId = traineeId || sessionRecord.student_id;
    const instructorId = sessionRecord.instructor_id;

    let record = await prisma.trainingData.findFirst({
      where: { session_id: Number(sessionId) }
    });

    if (record) {
      record = await prisma.trainingData.update({
        where: { id: record.id },
        data: {
          debrief_summary: overallNotes || record.debrief_summary,
        }
      });
      await prisma.sessionExercise.deleteMany({
        where: { training_id: record.id }
      });
    } else {
      record = await prisma.trainingData.create({
        data: {
          session_id: Number(sessionId),
          traineeId: realTraineeId,
          instructor_id: instructorId,
          topic: sessionRecord.session_title,
          debrief_summary: overallNotes,
        }
      });
    }

    const exerciseData = exercises.map(ex => ({
      training_id: record.id,
      exercise_name: ex.name || "Unknown Exercise",
      exercise_type: ex.type || "General",
      score: Number(ex.score) || 0,
      completed: true,
      notes: ex.notes || null,
    }));

    if (exerciseData.length > 0) {
      await prisma.sessionExercise.createMany({ data: exerciseData });
    }

    return record;
  } catch (err) {
    console.error("Save Session Scores Error:", err);
    throw err;
  }
};

export const fetchReportData = async (sessionId) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: {
        lessonPlan: true,
      }
    });

    if (!session) return null;

    const traineeObj = await prisma.trainee.findUnique({
      where: { id: session.student_id }
    });

    // Formatting based on ReportsPage needs
    const perf = await prisma.trainingData.findFirst({
      where: { session_id: Number(sessionId) },
      include: { exercises: true }
    });

    const averageScore = perf?.exercises?.length ? perf.exercises.reduce((acc, curr) => acc + curr.score, 0) / perf.exercises.length : 0;

    return {
      id: session.id,
      trainee: traineeObj?.name || "Unknown Trainee",
      topic: session.session_title || session.lessonPlan?.topic || "No Topic",
      type: (session.training_type || "Simulation").replace("_", " "),
      resourceUsed: session.aircraft_id ? `Aircraft ${session.aircraft_id}` : session.simulator_id ? `Simulator ${session.simulator_id}` : "Standard Resource",
      sessionOutcome: averageScore >= 3 ? "completed" : "needs review",
      averageScore: averageScore,
      lessonPlan: {
        exercises: perf?.exercises?.map(ex => ({
          name: ex.exercise_name,
          type: ex.exercise_type,
          score: ex.score,
          notes: ex.notes
        })) || []
      },
      debriefSummary: perf?.debrief_summary || ""
    };
  } catch (err) {
    console.error("Fetch Report Data Error:", err);
    throw err;
  }
};