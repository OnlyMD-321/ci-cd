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
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    NOT NULL UNIQUE,
    passwordHash TEXT    NOT NULL,
    createdAt    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS todos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL REFERENCES users(id),
    title     TEXT    NOT NULL,
    done      INTEGER NOT NULL DEFAULT 0,
    priority  TEXT    NOT NULL DEFAULT 'medium',
    dueDate   TEXT,
    createdAt TEXT    NOT NULL
  )
`);

// Migrate existing production DBs
const todoCols = db.prepare(`SELECT name FROM pragma_table_info('todos')`).all().map((r) => r.name);
if (!todoCols.includes('priority')) db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'`);
if (!todoCols.includes('dueDate'))  db.exec(`ALTER TABLE todos ADD COLUMN dueDate TEXT`);
if (!todoCols.includes('userId'))   db.exec(`ALTER TABLE todos ADD COLUMN userId INTEGER`);

module.exports = db;
