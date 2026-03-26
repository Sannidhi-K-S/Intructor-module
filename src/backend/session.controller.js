import { getDashboardData } from "./session.service.js";
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