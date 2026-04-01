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
function getStatus(session, trainingData) {
  const now = new Date();
  if (trainingData && trainingData.session_outcome === "completed") return "completed";
  if (now > session.end_time) return "action_required";
  if (now < session.start_time) return "pending";
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
        lessonplan: {
          include: {
            lessonobjective: true,
            exercise: true,
          },
        },
      },
    });

    // Fetch all training data for these sessions to check for debriefs
    const trainingDataRecords = await prisma.trainingdata.findMany({
      where: {
        session_id: { in: sessions.map(s => s.id) }
      },
      include: {
        sessionexercise: true
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
        type: s.training_type === "Flight_Training" ? "Flight" : s.training_type === "Ground_School" ? "Class" : (s.training_type || "Class").replace("_", " ").replace(" Training", ""),

        status: getStatus(s, trainingData),

        trainee: trainee?.name || "Unknown Trainee",
        resourceUsed: getResource(s),
        debriefSummary: trainingData?.debrief_summary || null,

        lessonPlan: s.lessonplan
          ? {
              topic: s.lessonplan.topic,
              objectives: s.lessonplan.lessonobjective.map((o) => o.text),
              instructorNotes: s.lessonplan.instructorNotes,
              expectedOutcome: s.lessonplan.expectedOutcome,
              exercises: s.lessonplan.exercise.map((ex) => {
                const saved = trainingData?.sessionexercise?.find(se => se.exercise_id === ex.id || se.exercise_name === ex.name);
                return {
                  id: ex.id,
                  name: ex.name,
                  type: ex.type,
                  score: saved?.score || 0,
                  canvasData: saved?.canvas_data ? JSON.parse(saved.canvas_data) : null,
                  notes: saved?.notes || "",
                  completed: saved?.completed || false,
                };
              }),

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

    let record = await prisma.trainingdata.findFirst({
      where: { session_id: Number(sessionId) }
    });

    if (record) {
      record = await prisma.trainingdata.update({
        where: { id: record.id },
        data: {
          debrief_summary: overallNotes || record.debrief_summary,
        }
      });
      await prisma.sessionexercise.deleteMany({
        where: { training_id: record.id }
      });
    } else {
      record = await prisma.trainingdata.create({
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
      await prisma.sessionexercise.createMany({ data: exerciseData });
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
    const perf = await prisma.trainingdata.findFirst({
      where: { session_id: Number(sessionId) },
      include: { sessionexercise: true }
    });

    const averageScore = perf?.sessionexercise?.length ? perf.sessionexercise.reduce((acc, curr) => acc + curr.score, 0) / perf.sessionexercise.length : 0;

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

export const upsertExerciseDetail = async (sessionId, exerciseId, data) => {
  try {
    const sessionRecord = await prisma.session.findUnique({ where: { id: Number(sessionId) } });
    if (!sessionRecord) throw new Error("Session not found");

    let trainingRecord = await prisma.trainingdata.findUnique({
      where: { session_id: Number(sessionId) }
    });

    if (!trainingRecord) {
      trainingRecord = await prisma.trainingdata.create({
        data: {
          session_id: Number(sessionId),
          traineeId: sessionRecord.student_id,
          instructor_id: sessionRecord.instructor_id,
          topic: sessionRecord.session_title,
        }
      });
    }

    const savedExercise = await prisma.sessionexercise.findFirst({
      where: {
        training_id: trainingRecord.id,
        OR: [
          { exercise_id: Number(exerciseId) },
          { exercise_name: data.name }
        ]
      }
    });

    console.log("Upserting Exercise Detail for session", sessionId, "ex", exerciseId);
    console.log("Received canvas_data length:", data.canvas_data ? JSON.stringify(data.canvas_data).length : "null");

    const exerciseInfo = {
      training_id: trainingRecord.id,
      exercise_id: Number(exerciseId),
      exercise_name: data.name || "Unknown Exercise",
      exercise_type: data.type || "General",
      score: Number(data.score) || 0,
      canvas_data: data.canvas_data ? JSON.stringify(data.canvas_data) : null,
      notes: data.notes || null,
      completed: true,
    };


    if (savedExercise) {
      return await prisma.sessionexercise.update({
        where: { id: savedExercise.id },
        data: exerciseInfo
      });
    } else {
      return await prisma.sessionexercise.create({
        data: exerciseInfo
      });
    }
  } catch (err) {
    console.error("Upsert Exercise Detail Error:", err);
    throw err;
  }
};

export const getAllExercises = async () => {
  try {
    return await prisma.exercise.findMany();
  } catch (err) {
    console.error("Get All Exercises Error:", err);
    throw err;
  }
};