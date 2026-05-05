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

module.exports = router;
