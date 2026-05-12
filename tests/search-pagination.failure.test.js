const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');
const { getToken } = require('./helpers/auth');

let app;
let token;

beforeEach(async () => {
  store.clear();
  app = createApp();
  token = await getToken(app);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('search & pagination — failure cases', () => {
  describe('invalid page param', () => {
    it('returns 400 when page=0', async () => {
      const res = await request(app).get('/todos?page=0').set(auth());
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/page/);
    });

    it('returns 400 when page is negative', async () => {
      const res = await request(app).get('/todos?page=-1').set(auth());
      expect(res.status).toBe(400);
    });

    it('returns 400 when page is not a number', async () => {
      const res = await request(app).get('/todos?page=abc').set(auth());
      expect(res.status).toBe(400);
    });
  });

  describe('invalid limit param', () => {
    it('returns 400 when limit=0', async () => {
      const res = await request(app).get('/todos?limit=0').set(auth());
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit/);
    });

    it('returns 400 when limit exceeds 100', async () => {
      const res = await request(app).get('/todos?limit=101').set(auth());
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit/);
    });

    it('returns 400 when limit is not a number', async () => {
      const res = await request(app).get('/todos?limit=all').set(auth());
      expect(res.status).toBe(400);
    });
  });
});
