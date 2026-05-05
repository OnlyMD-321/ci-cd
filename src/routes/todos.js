const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(store.list());
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  const todo = store.create({ title: title.trim() });
  return res.status(201).json(todo);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = store.get(id);
  if (!todo) {
    return res.status(404).json({ error: 'todo not found' });
  }
  return res.json(todo);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean' });
  }
  const updated = store.update(id, { title: title.trim(), done });
  if (!updated) {
    return res.status(404).json({ error: 'todo not found' });
  }
  return res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const removed = store.remove(id);
  if (!removed) {
    return res.status(404).json({ error: 'todo not found' });
  }
  return res.status(204).end();
});

module.exports = router;
