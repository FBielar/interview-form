const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const questions = require("./questions");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      start_time INTEGER,
      current_question INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      interview_id TEXT,
      question_index INTEGER,
      answer TEXT
    )
  `);
});

app.post("/create-interview", (req, res) => {
  const id = crypto.randomUUID();
  const startTime = Date.now();

  db.run(
    "INSERT INTO interviews VALUES (?, ?, ?)",
    [id, startTime, 0],
    () => res.json({ link: `http://localhost:3000/?id=${id}` })
  );
});

app.get("/question/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    "SELECT * FROM interviews WHERE id = ?",
    [id],
    (err, interview) => {
      if (!interview) return res.status(404).json({ error: "Invalid link" });

      const elapsed = Date.now() - interview.start_time;
      if (elapsed > 4 * 60 * 60 * 1000) {
        return res.json({ done: true, expired: true });
      }

      const qIndex = interview.current_question;
      if (qIndex >= questions.length) {
        return res.json({ done: true });
      }

      res.json({
        question: questions[qIndex]
      });
    }
  );
});

app.post("/answer/:id", (req, res) => {
  const id = req.params.id;
  const { answer } = req.body;

  db.get(
    "SELECT * FROM interviews WHERE id = ?",
    [id],
    (err, interview) => {
      if (!interview) return res.sendStatus(404);

      const elapsed = Date.now() - interview.start_time;
      if (elapsed > 4 * 60 * 60 * 1000) {
        return res.status(403).json({ error: "Time expired" });
      }

      const qIndex = interview.current_question;

      db.run(
        "INSERT INTO answers VALUES (?, ?, ?)",
        [id, qIndex, answer],
        () => {
          db.run(
            "UPDATE interviews SET current_question = ? WHERE id = ?",
            [qIndex + 1, id],
            () => res.json({ success: true })
          );
        }
      );
    }
  );
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});