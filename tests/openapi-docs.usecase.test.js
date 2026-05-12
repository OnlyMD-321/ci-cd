const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('openapi-docs — use cases', () => {
  it('GET /docs returns 200 with HTML content', async () => {
    const res = await request(createApp()).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('GET /docs includes swagger-ui script reference', async () => {
    const res = await request(createApp()).get('/docs/');
    expect(res.text).toMatch(/swagger/i);
  });
});
