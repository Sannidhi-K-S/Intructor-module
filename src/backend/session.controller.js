import { getDashboardData, saveSessionScores, fetchReportData, upsertExerciseDetail, getAllExercises } from "./session.service.js";
import { getHistorySessions } from "./history.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

// Stubs for missing functions to prevent backend crash
export const generateDebriefSummary = async (req, res) => res.json([]);
export const createReport = async (req, res) => res.json({ success: true });
export const archiveToHistory = async (req, res) => res.json({ success: true });
export const markSessionComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalRemarks } = req.body;
    
    const session = await prisma.session.findUnique({
      where: { id: Number(id) },
      include: {
        lessonplan: {
          include: {
            exercise: true
          }
        }
      }
    });
    
    if (!session) return res.status(404).json({ error: "Session not found" });

    let trainingData = await prisma.trainingdata.findUnique({ where: { session_id: Number(id) } });

    if (trainingData) {
      trainingData = await prisma.trainingdata.update({
        where: { id: trainingData.id },
        data: { 
          session_outcome: 'completed',
          additional_remarks: additionalRemarks
        }
      });
    } else {
      trainingData = await prisma.trainingdata.create({
        data: {
          session_id: Number(id),
          traineeId: session.student_id,
          instructor_id: session.instructor_id,
          topic: session.session_title,
          session_outcome: 'completed',
          additional_remarks: additionalRemarks
        }
      });
    }

    // Ensure session exercises are captured from lesson plan if not already there
    if (session.lessonplan?.exercise) {
      for (const ex of session.lessonplan.exercise) {
        const existing = await prisma.sessionexercise.findFirst({
          where: {
            training_id: trainingData.id,
            exercise_id: ex.id
          }
        });
        
        if (!existing) {
          await prisma.sessionexercise.create({
            data: {
              training_id: trainingData.id,
              exercise_id: ex.id,
              exercise_name: ex.name,
              exercise_type: ex.type || 'General',
              score: 0,
              completed: false
            }
          });
        }
      }
    }

    res.json({ success: true, message: "Session marked as complete" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark session complete" });
  }
};

export const saveDebriefSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { debriefSummary, additionalRemarks } = req.body;
    
    let trainingData = await prisma.trainingdata.findUnique({
      where: { session_id: Number(sessionId) }
    });
    
    if (trainingData) {
      trainingData = await prisma.trainingdata.update({
        where: { id: trainingData.id },
        data: {
          debrief_summary: debriefSummary,
          additional_remarks: additionalRemarks
        }
      });
    } else {
      const session = await prisma.session.findUnique({ where: { id: Number(sessionId) } });
      if (!session) return res.status(404).json({ error: "Session not found" });
      
      trainingData = await prisma.trainingdata.create({
        data: {
          session_id: Number(sessionId),
          traineeId: session.student_id,
          instructor_id: session.instructor_id,
          topic: session.session_title,
          debrief_summary: debriefSummary,
          additional_remarks: additionalRemarks
        }
      });
    }
    
    res.json({ success: true, data: trainingData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save debrief summary" });
  }
};

export const getReport = async (req, res) => res.json({});
export const getTrainingDataBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const trainingData = await prisma.trainingdata.findUnique({
      where: { session_id: Number(sessionId) },
      include: { sessionexercise: true }
    });
    if (!trainingData) return res.json(null);
    res.json(trainingData);
  } catch (err) {
    console.error("Get training data error:", err);
    res.status(500).json({ error: "Failed to fetch training data" });
  }
};
export const getArchivedReportsController = async (req, res) => res.json([]);