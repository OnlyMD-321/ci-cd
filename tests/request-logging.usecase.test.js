const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('request-logging — use cases', () => {
  it('requests succeed normally when logger is inactive in test env', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
  });

  it('POST /auth/register is not blocked by logging middleware', async () => {
    const res = await request(createApp())
      .post('/auth/register')
      .send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
