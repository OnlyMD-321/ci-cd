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

function list(userId) {
  return db.prepare('SELECT * FROM todos WHERE userId = ? ORDER BY id').all(userId).map(row2todo);
}

function create({ title, priority = 'medium', dueDate = null, userId }) {
  const createdAt = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO todos (userId, title, done, priority, dueDate, createdAt) VALUES (?, ?, 0, ?, ?, ?)')
    .run(userId, title, priority, dueDate, createdAt);
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid));
}

function get(id, userId) {
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(id, userId));
}

function update(id, { title, done, priority, dueDate }, userId) {
  const info = db
    .prepare('UPDATE todos SET title = ?, done = ?, priority = ?, dueDate = ? WHERE id = ? AND userId = ?')
    .run(title, done ? 1 : 0, priority, dueDate ?? null, id, userId);
  if (info.changes === 0) return undefined;
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
}

function remove(id, userId) {
  return db.prepare('DELETE FROM todos WHERE id = ? AND userId = ?').run(id, userId).changes > 0;
}

function toggle(id, userId) {
  const info = db.prepare('UPDATE todos SET done = 1 - done WHERE id = ? AND userId = ?').run(id, userId);
  if (info.changes === 0) return undefined;
  return row2todo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
}

function clear() {
  db.prepare('DELETE FROM todos').run();
  db.prepare('DELETE FROM users').run();
  for (const t of ['todos', 'users']) {
    try { db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(t); } catch (_) {}
  }
}

module.exports = { list, create, get, update, remove, toggle, clear, PRIORITIES };
