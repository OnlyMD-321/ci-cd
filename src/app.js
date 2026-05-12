const express = require('express');
const morgan  = require('morgan');
const rfs     = require('rotating-file-stream');
const path    = require('path');
const fs      = require('fs');
const rateLimit = require('express-rate-limit');
const todosRouter = require('./routes/todos');
const authRouter  = require('./routes/auth');
const statsRouter = require('./routes/stats');

function buildLogger() {
  if (process.env.NODE_ENV === 'test') return null;
  if (process.env.NODE_ENV === 'production') {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const stream = rfs.createStream('access.log', { interval: '1d', path: logDir });
    return morgan('combined', { stream });
  }
  return morgan('dev');
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many requests', retryAfter: 15 * 60 }),
});

function createApp() {
  const app = express();
  const logger = buildLogger();
  if (logger) app.use(logger);
  app.use(limiter);
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth',  authRouter);
  app.use('/todos', todosRouter);
  app.use('/stats', statsRouter);

  return app;
}

module.exports = { createApp };
