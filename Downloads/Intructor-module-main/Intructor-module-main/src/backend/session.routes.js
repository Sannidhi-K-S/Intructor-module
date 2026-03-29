import express from "express";
import { fetchDashboard, fetchHistory } from "./session.controller.js";

const router = express.Router();

router.get("/dashboard", fetchDashboard);
router.get("/history", fetchHistory);

export default router;
