const express = require('express');
const todosRouter = require('./routes/todos');
const authRouter  = require('./routes/auth');
const statsRouter = require('./routes/stats');

function createApp() {
  const app = express();
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
