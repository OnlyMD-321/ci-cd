const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('frontend — failure cases', () => {
  it('GET /nonexistent returns 404 (static files do not swallow unknown paths)', async () => {
    const res = await request(createApp()).get('/nonexistent-page-xyz');
    expect(res.status).toBe(404);
  });

  it('API endpoints are not overridden by static middleware', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
