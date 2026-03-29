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
      },
      sessions: result, // Return all today's sessions
    };
  } catch (err) {
    console.error("Service Error:", err);
    throw err;
  }
};