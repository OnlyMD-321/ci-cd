const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const uid = req.user.id;
  const now = new Date().toISOString();

  const total = db.prepare('SELECT COUNT(*) AS n FROM todos WHERE userId = ?').get(uid).n;
  const done = db
    .prepare('SELECT COUNT(*) AS n FROM todos WHERE userId = ? AND done = 1')
    .get(uid).n;
  const overdue = db
    .prepare(
      'SELECT COUNT(*) AS n FROM todos WHERE userId = ? AND done = 0 AND dueDate IS NOT NULL AND dueDate < ?',
    )
    .get(uid, now).n;

  const byPriority = { low: 0, medium: 0, high: 0 };
  for (const row of db
    .prepare('SELECT priority, COUNT(*) AS n FROM todos WHERE userId = ? GROUP BY priority')
    .all(uid)) {
    if (row.priority in byPriority) byPriority[row.priority] = row.n;
  }

  return res.json({ total, done, pending: total - done, overdue, byPriority });
});

module.exports = router;
