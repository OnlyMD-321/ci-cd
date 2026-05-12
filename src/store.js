const db = require('./db');

const PRIORITIES = ['low', 'medium', 'high'];

const row2todo = (r) =>
  r
    ? {
        id: r.id,
        title: r.title,
        done: r.done === 1,
        priority: r.priority,
        dueDate: r.dueDate ?? null,
        createdAt: r.createdAt,
      }
    : undefined;

function list() {
  return db.prepare('SELECT * FROM todos ORDER BY id').all().map(row2todo);
}

function create({ title, priority = 'medium', dueDate = null }) {
  const createdAt = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO todos (title, done, priority, dueDate, createdAt) VALUES (?, 0, ?, ?, ?)')
    .run(title, priority, dueDate, createdAt);
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid));
}

function get(id) {
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
}

function update(id, { title, done, priority, dueDate }) {
  const info = db
    .prepare('UPDATE todos SET title = ?, done = ?, priority = ?, dueDate = ? WHERE id = ?')
    .run(title, done ? 1 : 0, priority, dueDate ?? null, id);
  if (info.changes === 0) return undefined;
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
}

function remove(id) {
  return db.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
}

function toggle(id) {
  const info = db.prepare('UPDATE todos SET done = 1 - done WHERE id = ?').run(id);
  if (info.changes === 0) return undefined;
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
}

function clear() {
  db.prepare('DELETE FROM todos').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name = 'todos'").run();
}

module.exports = { list, create, get, update, remove, toggle, clear, PRIORITIES };
