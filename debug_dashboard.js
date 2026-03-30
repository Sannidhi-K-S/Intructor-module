import { getDashboardData } from "./src/backend/session.service.js";

async function run() {
  try {
    const data = await getDashboardData();
    console.log("Data loaded successfully:", data);
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

run();
