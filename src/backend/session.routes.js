import express from "express";
import { fetchDashboard, fetchHistory, saveScores, getSessionReport, saveExerciseDetail, getAllExs, createSession } from "./session.controller.js";

const router = express.Router();

router.get("/dashboard", fetchDashboard);
router.get("/history", fetchHistory);
router.post("/save-scores", saveScores);
router.get("/:id/report", getSessionReport);
router.post("/save-exercise-detail", saveExerciseDetail);
router.get("/exercises", getAllExs);
router.post("/create-session", createSession);

export default router;
