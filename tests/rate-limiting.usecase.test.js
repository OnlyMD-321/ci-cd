const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('rate-limiting — use cases', () => {
  it('health endpoint responds normally when limit is not exceeded', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
  });

  it('multiple sequential requests succeed without triggering the limit', async () => {
    const app = createApp();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    }
  });
});
