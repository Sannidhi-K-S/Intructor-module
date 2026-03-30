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
    const instructors = await prisma.instructor.findFirst();
    const sessions = await prisma.session.findMany({
      include: {
        trainee: true,
        lessonPlan: {
          include: {
            objectives: true,
            exercises: true,
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Fetch all grading results for these sessions
    const sessionExercises = await prisma.sessionExercise.findMany({
      where: {
        session_id: { in: sessions.map(s => s.id) }
      }
    });

    const result = sessions.map((s) => {
      return {
        id: s.id,
        topic: s.session_title,
        startTime: formatTime(s.start_time),
        endTime: formatTime(s.end_time),
        type: s.training_type ? s.training_type.replace("_", " ") : "Flight",

        status: getStatus(s),

        trainee: s.trainee?.name || "Trainee Name",
        resourceUsed: getResource(s),
        debriefSummary: null, // Logic for debrief can be added here later

        lessonPlan: s.lessonPlan
          ? {
              topic: s.lessonPlan.topic,
              objectives: s.lessonPlan.objectives.map((o) => o.text),
              instructorNotes: s.lessonPlan.instructorNotes,
              expectedOutcome: s.lessonPlan.expectedOutcome,
              exercises: s.lessonPlan.exercises.map((ex) => {
                // Attach the actual score from results table if available
                const grade = sessionExercises.find(g => g.session_id === s.id && g.exercise_id === ex.id);
                return {
                  id: ex.id,
                  name: ex.name,
                  type: ex.type,
                  score: grade?.score || 0,
                  notes: grade?.notes || ""
                };
              }),
            }
          : null,
      };
    });

    return {
      user: {
        name: instructors?.name || "Capt. Morgan",
        role: instructors?.designation || "Senior Instructor",
      },
      sessions: result,
    };
  } catch (err) {
    console.error("Dashboard Service Error:", err);
    throw err;
  }
};