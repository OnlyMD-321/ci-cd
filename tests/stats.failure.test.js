const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

let app;

beforeEach(() => {
  store.clear();
  app = createApp();
});

describe('stats — failure cases', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app).get('/stats').set('Authorization', 'Bearer fake.token.here');
    expect(res.status).toBe(401);
  });
});
