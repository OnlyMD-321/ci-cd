const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

let app;

beforeEach(() => {
  store.clear();
  app = createApp();
});

describe('auth — failure cases', () => {
  describe('POST /auth/register — validation', () => {
    it('rejects missing username with 400', async () => {
      const res = await request(app).post('/auth/register').send({ password: 'secret123' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects empty username with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: '  ', password: 'secret123' });
      expect(res.status).toBe(400);
    });

    it('rejects password shorter than 6 characters with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'alice', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/);
    });

    it('rejects duplicate username with 409', async () => {
      await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'alice', password: 'different123' });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/taken/);
    });
  });

  describe('POST /auth/login — invalid credentials', () => {
    it('rejects unknown username with 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'ghost', password: 'secret123' });
      expect(res.status).toBe(401);
    });

    it('rejects wrong password with 401', async () => {
      await request(app).post('/auth/register').send({ username: 'alice', password: 'secret123' });
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'alice', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid credentials/);
    });
  });

  describe('/todos — missing or invalid token', () => {
    it('returns 401 when Authorization header is absent', async () => {
      const res = await request(app).get('/todos');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 401 when token is malformed', async () => {
      const res = await request(app).get('/todos').set('Authorization', 'Bearer not.a.real.token');
      expect(res.status).toBe(401);
    });

    it('returns 401 when Authorization header uses wrong scheme', async () => {
      const res = await request(app).get('/todos').set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
    });

    it('returns 401 on POST /todos without token', async () => {
      const res = await request(app).post('/todos').send({ title: 'task' });
      expect(res.status).toBe(401);
    });
  });
});
