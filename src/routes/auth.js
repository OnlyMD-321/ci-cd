const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'username is required' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (exists) return res.status(409).json({ error: 'username already taken' });

  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO users (username, passwordHash, createdAt) VALUES (?, ?, ?)')
    .run(username.trim(), passwordHash, createdAt);
  const token = signToken({ id: info.lastInsertRowid, username: username.trim() });
  return res.status(201).json({ token });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, username: user.username });
  return res.json({ token });
});

module.exports = router;
