const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /todos', () => {
  it('returns an empty list when the store has no todos', async () => {
    const res = await request(createApp()).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
