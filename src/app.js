const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const swaggerUi  = require('swagger-ui-express');
const yaml       = require('js-yaml');
const morgan     = require('morgan');
const rfs        = require('rotating-file-stream');
const path       = require('path');
const fs         = require('fs');
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

const swaggerDoc = yaml.load(fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8'));

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

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  app.use('/auth',  authRouter);
  app.use('/todos', todosRouter);
  app.use('/stats', statsRouter);

  return app;
}

const emitter = require('./emitter');

function createIo(server) {
  const io = new Server(server, { cors: { origin: '*' } });
  emitter.on('todos:update', () => io.emit('todos:update'));
  return io;
}

module.exports = { createApp, createIo };
