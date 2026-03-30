import { getDashboardData, saveSessionScores, fetchReportData } from "./session.service.js";
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

export const fetchHistory = async (req, res) => {
  try {
    const data = await getHistorySessions();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load history" });
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