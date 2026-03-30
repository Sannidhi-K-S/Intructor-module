
import mysql from "mysql2";

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "flight_training",
});

connection.connect((err) => {
  if (err) {
    console.error("error: " + err.message);
    process.exit(1);
  }
  console.log("Connected to MySQL.");
  
  connection.query("SHOW TABLES", (err, results) => {
    if (err) throw err;
    console.log("Tables in DB:", results);
    
    // Check if both exist
    const names = results.map(r => Object.values(r)[0]);
    console.log("Table names:", names);
    
    process.exit(0);
  });
});
