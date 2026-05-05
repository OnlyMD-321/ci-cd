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

module.exports = router;
