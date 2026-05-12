const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('rich-fields — failure cases', () => {
  describe('POST /todos — invalid priority', () => {
    it('rejects priority "urgent" with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', priority: 'urgent' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects priority "MEDIUM" (wrong case) with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', priority: 'MEDIUM' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority/);
    });

    it('rejects priority as a number with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', priority: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /todos — invalid dueDate', () => {
    it('rejects dueDate "tomorrow" (not ISO) with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', dueDate: 'tomorrow' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects dueDate "31/12/2025" (wrong format) with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', dueDate: '31/12/2025' });
      expect(res.status).toBe(400);
    });

    it('rejects dueDate as a number with 400', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task', dueDate: 20251231 });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /todos/:id — invalid rich fields', () => {
    it('rejects invalid priority on update with 400', async () => {
      const app = createApp();
      const created = await request(app).post('/todos').send({ title: 'task' });
      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: 'task', done: false, priority: 'critical' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority/);
    });

    it('rejects invalid dueDate on update with 400', async () => {
      const app = createApp();
      const created = await request(app).post('/todos').send({ title: 'task' });
      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: 'task', done: false, dueDate: 'next week' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/dueDate/);
    });
  });
});
