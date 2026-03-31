import app from "./app.js";
import { exec } from "child_process";

const PORT = 5000;

// 🚀 Bootstrapper: Ensures sessions exist without wiping current progress
console.log("Checking database state and ensuring ongoing sessions exist...");
exec("node prisma/seed_ongoing.js", (err, stdout, stderr) => {
  if (stdout) console.log("Bootstrapper:", stdout.trim());
  if (err && !err.message.includes("DATABASE ALREADY SEEDED")) {
    console.error("Bootstrapper Notification:", err.message);
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Ready for Training Module tests!`);
  });
});