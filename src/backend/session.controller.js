import { getDashboardData, saveSessionScores, fetchReportData, upsertExerciseDetail, getAllExercises } from "./session.service.js";
import { getHistorySessions } from "./history.service.js";

export const fetchDashboard = async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

export const createSession = async (req, res) => {
  try {
    // Find some existing trainee/instructor for demo
    const instructor = await prisma.instructor.findFirst();
    const trainee = await prisma.trainee.findFirst();
    
    const sess = await prisma.session.create({
      data: {
        session_title: "Demo Flight Evaluation",
        instructor_id: instructor?.id || 1,
        student_id: trainee?.id || "f3abe167-dfbb-406b-8c33-3cfe9e83a65d",
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000),
        training_type: "Flight_Training",
      }
    });

    res.json({ session_id: sess.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
};



export const getAllExs = async (req, res) => {
  try {
    const data = await getAllExercises();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load exercises" });
  }
};


export const fetchHistory = async (req, res) => {
  try {
    const data = await getHistorySessions();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load history" });
  }
};

export const saveExerciseDetail = async (req, res) => {
  try {
    const { session_id, exercise_id, ...data } = req.body;
    const result = await upsertExerciseDetail(session_id, exercise_id, data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save exercise detail" });
  }
};

export const saveScores = async (req, res) => {
  try {
    const { sessionId, traineeId, exercises, overallNotes } = req.body;
    const result = await saveSessionScores(sessionId, traineeId, exercises, overallNotes);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Save scores error:", err);
    res.status(500).json({ error: "Failed to save scores" });
  }
};

export const getSessionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetchReportData(id);
    res.json(result);
  } catch (err) {
    console.error("Get Report Error:", err);
    res.status(500).json({ error: "Failed to get report" });
  }
};