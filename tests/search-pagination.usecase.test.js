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
const post = (title, extra = {}) =>
  request(app)
    .post('/todos')
    .set(auth())
    .send({ title, ...extra });

describe('search & pagination — use cases', () => {
  describe('search', () => {
    it('returns all todos when no search param given', async () => {
      await post('buy milk');
      await post('read book');
      const res = await request(app).get('/todos').set(auth());
      expect(res.body.total).toBe(2);
    });

    it('filters todos by title substring (case-insensitive)', async () => {
      await post('Buy Milk');
      await post('read book');
      await post('buy eggs');
      const res = await request(app).get('/todos?search=buy').set(auth());
      expect(res.body.total).toBe(2);
      expect(res.body.data.map((t) => t.title).sort()).toEqual(['Buy Milk', 'buy eggs'].sort());
    });

    it('returns empty data when search matches nothing', async () => {
      await post('buy milk');
      const res = await request(app).get('/todos?search=xyz').set(auth());
      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('search and done=false compose correctly', async () => {
      const a = await post('buy milk');
      await post('buy eggs');
      await request(app).patch(`/todos/${a.body.id}/toggle`).set(auth());
      const res = await request(app).get('/todos?search=buy&done=false').set(auth());
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].title).toBe('buy eggs');
    });
  });

  describe('pagination', () => {
    it('response always includes total, page, limit, pages', async () => {
      const res = await request(app).get('/todos').set(auth());
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 10);
      expect(res.body).toHaveProperty('pages');
    });

    it('page=1&limit=2 returns first two items', async () => {
      for (let i = 1; i <= 5; i++) await post(`task ${i}`);
      const res = await request(app).get('/todos?page=1&limit=2').set(auth());
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(5);
      expect(res.body.pages).toBe(3);
    });

    it('page=2&limit=2 returns items 3 and 4', async () => {
      for (let i = 1; i <= 5; i++) await post(`task ${i}`);
      const res = await request(app).get('/todos?page=2&limit=2').set(auth());
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('task 3');
    });

    it('last page may have fewer items than limit', async () => {
      for (let i = 1; i <= 5; i++) await post(`task ${i}`);
      const res = await request(app).get('/todos?page=3&limit=2').set(auth());
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('task 5');
    });
  });
});
