const express = require('express');
const store = require('../store');

const router = express.Router();

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;

function validatePriority(p) {
  return p === undefined || store.PRIORITIES.includes(p);
}

function validateDueDate(d) {
  return d === undefined || d === null || (typeof d === 'string' && ISO_DATE_RE.test(d));
}

router.get('/', (req, res) => {
  const { done } = req.query;
  if (done !== undefined && done !== 'true' && done !== 'false') {
    return res.status(400).json({ error: "query 'done' must be 'true' or 'false'" });
  }
  const todos = store.list();
  if (done === undefined) return res.json(todos);
  const wanted = done === 'true';
  return res.json(todos.filter((t) => t.done === wanted));
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
  const todo = store.create({ title: title.trim(), priority, dueDate });
  return res.status(201).json(todo);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = store.get(id);
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
  const updated = store.update(id, {
    title: title.trim(),
    done,
    priority: priority ?? 'medium',
    dueDate,
  });
  if (!updated) return res.status(404).json({ error: 'todo not found' });
  return res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const removed = store.remove(id);
  if (!removed) return res.status(404).json({ error: 'todo not found' });
  return res.status(204).end();
});

router.patch('/:id/toggle', (req, res) => {
  const id = Number(req.params.id);
  const todo = store.toggle(id);
  if (!todo) return res.status(404).json({ error: 'todo not found' });
  return res.json(todo);
});

module.exports = router;
