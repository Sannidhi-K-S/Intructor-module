import 'dotenv/config';
import mysql from 'mysql2';

const u = new URL(process.env.DATABASE_URL);

const conn = mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 3306,
  user: u.username,
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1),
  multipleStatements: true
});

conn.connect((err) => {
  if (err) throw err;
  const queries = [
    "ALTER TABLE `sessionexercise` ADD COLUMN `exercise_id` INT NULL;",
    "ALTER TABLE `sessionexercise` ADD COLUMN `canvas_data` LONGTEXT NULL;",
    "ALTER TABLE `SessionExercise` ADD COLUMN `exercise_id` INT NULL;",
    "ALTER TABLE `SessionExercise` ADD COLUMN `canvas_data` LONGTEXT NULL;",
    "ALTER IGNORE TABLE `trainingdata` ADD UNIQUE INDEX `TrainingData_session_id_key` (`session_id`);",
    "ALTER IGNORE TABLE `TrainingData` ADD UNIQUE INDEX `TrainingData_session_id_key` (`session_id`);"
  ];

  let completed = 0;
  for (const q of queries) {
    conn.query(q, (err) => {
      if (err) console.log("Note (safe to ignore if duplicated):", err.message);
      else console.log("Successfully ran:", q);
      
      completed++;
      if (completed === queries.length) {
        console.log("Finished applying alters.");
        conn.end();
      }
    });
  }
});
