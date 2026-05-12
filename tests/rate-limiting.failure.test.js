const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('rate-limiting — failure cases', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
          res.status(429).json({ error: 'Too many requests', retryAfter: 60 }),
      }),
    );
    app.get('/ping', (_req, res) => res.json({ ok: true }));

    await request(app).get('/ping');
    await request(app).get('/ping');
    const res = await request(app).get('/ping');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error', 'Too many requests');
    expect(res.body).toHaveProperty('retryAfter');
  });

  it('429 response includes RateLimit headers', async () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
          res.status(429).json({ error: 'Too many requests', retryAfter: 60 }),
      }),
    );
    app.get('/ping', (_req, res) => res.json({ ok: true }));

    await request(app).get('/ping');
    const res = await request(app).get('/ping');
    expect(res.status).toBe(429);
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});
