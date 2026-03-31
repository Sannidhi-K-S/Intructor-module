import express from "express";
import { fetchDashboard, fetchHistory, saveScores, getSessionReport, saveExerciseDetail, getAllExs, createSession, generateDebriefSummary, saveDebriefSummary, createReport, archiveToHistory, getReport, getTrainingDataBySession, getArchivedReportsController } from "./session.controller.js";

const router = express.Router();

router.get("/dashboard", fetchDashboard);
router.get("/history", fetchHistory);
router.get("/archived-reports", getArchivedReportsController);
router.post("/save-scores", saveScores);
router.get("/:id/report", getSessionReport);
router.post("/save-exercise-detail", saveExerciseDetail);
router.get("/exercises", getAllExs);
router.post("/create-session", createSession);
router.get("/debrief/:sessionId", generateDebriefSummary);
router.post("/debrief/:sessionId", saveDebriefSummary);
router.post("/report/:trainingDataId", createReport);
router.post("/archive/:reportId", archiveToHistory);
router.get("/report/training/:trainingDataId", getReport);
router.get("/training-data/session/:sessionId", getTrainingDataBySession);

export default router;
