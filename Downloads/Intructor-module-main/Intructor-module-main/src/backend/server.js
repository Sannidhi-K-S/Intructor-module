import express from "express";
import mysql from "mysql2";
import cors from "cors";

// Preserve existing routes if needed
import routes from "./index.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

if (routes) {
  app.use("/api", routes);
}

/* ================= DB CONNECTION ================= */

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "flight_training",
});

db.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err);
  } else {
    console.log("MySQL Connected 🚀");
  }
});

/* ================= FETCH ALL EXERCISES LIST ================= */

app.get("/exercises", (req, res) => {
  db.query("SELECT * FROM exercises ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

/* ================= CREATE SESSION ================= */

app.post("/create-session", (req, res) => {
  const session_code = "SESS-" + Math.floor(1000 + Math.random() * 9000);

  db.query(
    "INSERT INTO sessions (session_code) VALUES (?)",
    [session_code],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ session_id: results.insertId });
    }
  );
});

/* ================= SAVE EXERCISE ================= */

app.post("/save-exercise", (req, res) => {
  const { exercise_id, session_id, score, notes, canvas_data } = req.body;

  if (!exercise_id || !session_id) {
    return res.status(400).send("Missing required fields");
  }

  db.query(
    "SELECT id FROM exercise_submissions WHERE exercise_id = ? AND session_id = ?",
    [exercise_id, session_id],
    (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length > 0) {
        db.query(
          "UPDATE exercise_submissions SET score=?, notes=?, canvas_data=? WHERE exercise_id=? AND session_id=?",
          [
            score || 0,
            notes || "",
            canvas_data ? JSON.stringify(canvas_data) : null,
            exercise_id,
            session_id,
          ],
          (err2) => {
            if (err2) return res.status(500).send(err2);
            res.send("Updated ✅");
          }
        );
      } else {
        db.query(
          "INSERT INTO exercise_submissions (exercise_id, session_id, score, notes, canvas_data) VALUES (?, ?, ?, ?, ?)",
          [
            exercise_id,
            session_id,
            score || 0,
            notes || "",
            canvas_data ? JSON.stringify(canvas_data) : null,
          ],
          (err3) => {
            if (err3) return res.status(500).send(err3);
            res.send("Inserted ✅");
          }
        );
      }
    }
  );
});

/* ================= FETCH EXERCISE ================= */

app.get("/exercise/:id/:session_id", (req, res) => {
  const { id, session_id } = req.params;

  db.query(
    "SELECT * FROM exercise_submissions WHERE exercise_id = ? AND session_id = ?",
    [id, session_id],
    (err, result) => {
      if (err) return res.status(500).send(err);

      if (result.length === 0) return res.json(null);

      res.json(result[0]);
    }
  );
});

/* ================= GRADE ENGINE ================= */

function calculateFinalGrade(exercises) {
  const scoreMap = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };

  let total = 0;
  let count = 0;

  exercises.forEach((ex) => {
    if (ex.score > 0) {
      total += scoreMap[ex.score];
      count++;
    }
  });

  return count === 0 ? 0 : Math.round(total / count);
}

function getGradeLabel(grade) {
  if (grade >= 90) return "Excellent";
  if (grade >= 75) return "Good";
  if (grade >= 60) return "Average";
  if (grade >= 40) return "Weak";
  return "Poor";
}

/* ================= SAVE FINAL GRADE ================= */

app.post("/save-final-grade", (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).send("Missing session_id");
  }

  db.query(
    "SELECT score FROM exercise_submissions WHERE session_id = ?",
    [session_id],
    (err, results) => {
      if (err) return res.status(500).send(err);

      const exercises = results.map((r) => ({
        score: r.score,
      }));

      const finalGrade = calculateFinalGrade(exercises);
      const gradeLabel = getGradeLabel(finalGrade);

      db.query(
        "UPDATE sessions SET final_grade = ?, grade_label = ? WHERE id = ?",
        [finalGrade, gradeLabel, session_id],
        (err2) => {
          if (err2) return res.status(500).send(err2);

          res.json({
            final_grade: finalGrade,
            grade_label: gradeLabel,
          });
        }
      );
    }
  );
});

/* ================= SERVER ================= */

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});