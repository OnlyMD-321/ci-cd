const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(dataDir, 'todos.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    done      INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT    NOT NULL
  )
`);

module.exports = db;
