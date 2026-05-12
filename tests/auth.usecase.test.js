const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

let app;

beforeEach(() => {
  store.clear();
  app = createApp();
});

describe('auth — use cases', () => {
  describe('POST /auth/register', () => {
    it('registers a new user and returns 201 with a token', async () => {
      const res = await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      expect(res.status).toBe(201);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(20);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with correct credentials and returns a token', async () => {
      await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const res = await request(app).post('/auth/login').send({ username: 'alice', password: 'secret123' });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
    });
  });

  describe('token-based access to /todos', () => {
    it('allows access to /todos with a valid token', async () => {
      const reg = await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const res = await request(app).get('/todos').set('Authorization', `Bearer ${reg.body.token}`);
      expect(res.status).toBe(200);
    });

    it('todos are isolated — user A cannot see user B todos', async () => {
      const a = await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const b = await request(app).post('/auth/register').send({ username: 'bob', password: 'secret456' });
      await request(app).post('/todos').set('Authorization', `Bearer ${a.body.token}`).send({ title: 'Alice task' });
      const res = await request(app).get('/todos').set('Authorization', `Bearer ${b.body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });

    it('login token grants the same access as register token', async () => {
      await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const login = await request(app).post('/auth/login').send({ username: 'alice', password: 'secret123' });
      await request(app).post('/todos').set('Authorization', `Bearer ${login.body.token}`).send({ title: 'task' });
      const res = await request(app).get('/todos').set('Authorization', `Bearer ${login.body.token}`);
      expect(res.body.total).toBe(1);
    });
  });
});
