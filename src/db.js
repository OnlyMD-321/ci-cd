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
    priority  TEXT    NOT NULL DEFAULT 'medium',
    dueDate   TEXT,
    createdAt TEXT    NOT NULL
  )
`);

// Migrate existing production DBs that predate rich-fields
for (const col of ['priority', 'dueDate']) {
  const exists = db.prepare(`SELECT COUNT(*) AS n FROM pragma_table_info('todos') WHERE name = ?`).get(col).n;
  if (!exists) {
    if (col === 'priority') db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'`);
    if (col === 'dueDate')  db.exec(`ALTER TABLE todos ADD COLUMN dueDate TEXT`);
  }
}

module.exports = db;
