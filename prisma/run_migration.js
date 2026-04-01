import 'dotenv/config';
import mysql from 'mysql2';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const u = new URL(process.env.DATABASE_URL);

const conn = mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 3306,
  user: u.username,
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1),
  multipleStatements: true
});

const sql = fs.readFileSync(path.join(__dirname, 'add_new_tables.sql'), 'utf8');

conn.connect((err) => {
  if (err) { console.error('Connection failed:', err.message); process.exit(1); }
  console.log('Connected to DB:', u.pathname.slice(1));
  conn.query(sql, (err) => {
    if (err) { console.error('SQL Error:', err.message); conn.end(); process.exit(1); }
    console.log('SUCCESS: New tables (sessions, exercises, exercise_submissions) created without touching existing data.');
    conn.end();
  });
});
