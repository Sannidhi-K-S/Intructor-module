import express from "express";
import { fetchDashboard, fetchHistory, saveScores, getSessionReport } from "./session.controller.js";

const router = express.Router();

router.get("/dashboard", fetchDashboard);
router.get("/history", fetchHistory);
router.post("/save-scores", saveScores);
router.get("/:id/report", getSessionReport);

export default router;
