const express = require('express');
const store = require('../store');
const { requireAuth } = require('../middleware/auth');
const emitter = require('../emitter');

const router = express.Router();

router.use(requireAuth);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;

function validatePriority(p) {
  return p === undefined || store.PRIORITIES.includes(p);
}

function validateDueDate(d) {
  return d === undefined || d === null || (typeof d === 'string' && ISO_DATE_RE.test(d));
}

router.get('/', (req, res) => {
  const { done, search, page: pageStr, limit: limitStr } = req.query;

  if (done !== undefined && done !== 'true' && done !== 'false') {
    return res.status(400).json({ error: "query 'done' must be 'true' or 'false'" });
  }

  const page = pageStr !== undefined ? Number(pageStr) : 1;
  const limit = limitStr !== undefined ? Number(limitStr) : 10;

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: "'page' must be a positive integer" });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: "'limit' must be an integer between 1 and 100" });
  }

  const doneFilter = done === undefined ? undefined : done === 'true';
  return res.json(store.list(req.user.id, { search, done: doneFilter, page, limit }));
});

router.post('/', (req, res) => {
  const { title, priority, dueDate } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (!validatePriority(priority)) {
    return res.status(400).json({ error: 'priority must be low, medium, or high' });
  }
  if (!validateDueDate(dueDate)) {
    return res.status(400).json({ error: 'dueDate must be an ISO 8601 date string or null' });
  }
  const todo = store.create({ title: title.trim(), priority, dueDate, userId: req.user.id });
  emitter.emit('todos:update');
  return res.status(201).json(todo);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = store.get(id, req.user.id);
  if (!todo) return res.status(404).json({ error: 'todo not found' });
  return res.json(todo);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, done, priority, dueDate } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean' });
  }
  if (!validatePriority(priority)) {
    return res.status(400).json({ error: 'priority must be low, medium, or high' });
  }
  if (!validateDueDate(dueDate)) {
    return res.status(400).json({ error: 'dueDate must be an ISO 8601 date string or null' });
  }
  const updated = store.update(
    id,
    { title: title.trim(), done, priority: priority ?? 'medium', dueDate },
    req.user.id,
  );
  if (!updated) return res.status(404).json({ error: 'todo not found' });
  emitter.emit('todos:update');
  return res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const removed = store.remove(id, req.user.id);
  if (!removed) return res.status(404).json({ error: 'todo not found' });
  emitter.emit('todos:update');
  return res.status(204).end();
});

router.patch('/:id/toggle', (req, res) => {
  const id = Number(req.params.id);
  const todo = store.toggle(id, req.user.id);
  if (!todo) return res.status(404).json({ error: 'todo not found' });
  emitter.emit('todos:update');
  return res.json(todo);
});

module.exports = router;
