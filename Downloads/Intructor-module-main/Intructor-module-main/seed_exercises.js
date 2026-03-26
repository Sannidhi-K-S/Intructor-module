import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "flight_training",
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
});

db.query(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  )
`, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  const exercisesData = [
    [1, "Pre-flight IFR Briefing"],
    [2, "Avionics Setup & GPS Programming"],
    [3, "Precision ILS Z Rwy 26"],
    [4, "Missed Approach Procedures"],
    [5, "Post-flight Systems Check"]
  ];

  db.query(`INSERT IGNORE INTO exercises (id, name) VALUES ?`, [exercisesData], (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log("Successfully seeded exercises table!");
    db.end();
  });
});
