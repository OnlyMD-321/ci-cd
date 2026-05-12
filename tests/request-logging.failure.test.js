const express = require('express');
const morgan = require('morgan');
const request = require('supertest');

describe('request-logging — failure cases', () => {
  it('morgan dev format logs the method and status to stdout without crashing', (done) => {
    const app = express();
    const lines = [];
    app.use(morgan('dev', { stream: { write: (msg) => lines.push(msg) } }));
    app.get('/ping', (_req, res) => res.json({ ok: true }));

    request(app)
      .get('/ping')
      .end((err, res) => {
        expect(res.status).toBe(200);
        expect(lines.length).toBeGreaterThan(0);
        expect(lines[0]).toMatch(/GET/);
        done(err);
      });
  });

  it('morgan logs 404 status for unknown routes', (done) => {
    const app = express();
    const lines = [];
    app.use(morgan('dev', { stream: { write: (msg) => lines.push(msg) } }));
    app.use((_req, res) => res.status(404).json({ error: 'not found' }));

    request(app)
      .get('/nonexistent')
      .end((err, res) => {
        expect(res.status).toBe(404);
        expect(lines[0]).toMatch(/404/);
        done(err);
      });
  });
});
