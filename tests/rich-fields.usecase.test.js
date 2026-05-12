const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('rich-fields — use cases', () => {
  describe('POST /todos with priority and dueDate', () => {
    it('creates a todo with default priority medium when omitted', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task' });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('medium');
      expect(res.body.dueDate).toBeNull();
    });

    it('creates a todo with priority high', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'urgent', priority: 'high' });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('high');
    });

    it('creates a todo with priority low', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'someday', priority: 'low' });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('low');
    });

    it('creates a todo with a dueDate', async () => {
      const res = await request(createApp())
        .post('/todos')
        .send({ title: 'deadline', dueDate: '2025-12-31' });
      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBe('2025-12-31');
    });

    it('creates a todo with both priority and dueDate', async () => {
      const res = await request(createApp())
        .post('/todos')
        .send({ title: 'critical', priority: 'high', dueDate: '2025-06-01' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ priority: 'high', dueDate: '2025-06-01' });
    });

    it('response includes createdAt as an ISO string', async () => {
      const res = await request(createApp()).post('/todos').send({ title: 'task' });
      expect(res.status).toBe(201);
      expect(typeof res.body.createdAt).toBe('string');
      expect(() => new Date(res.body.createdAt)).not.toThrow();
    });
  });

  describe('PUT /todos/:id updates rich fields', () => {
    it('updates priority on an existing todo', async () => {
      const app = createApp();
      const created = await request(app).post('/todos').send({ title: 'task' });
      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: 'task', done: false, priority: 'high' });
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('high');
    });

    it('updates dueDate on an existing todo', async () => {
      const app = createApp();
      const created = await request(app).post('/todos').send({ title: 'task' });
      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: 'task', done: false, dueDate: '2026-01-01' });
      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBe('2026-01-01');
    });

    it('clears dueDate by setting it to null', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/todos')
        .send({ title: 'task', dueDate: '2025-12-31' });
      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: 'task', done: false, dueDate: null });
      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBeNull();
    });
  });

  describe('GET /todos returns rich fields', () => {
    it('list includes priority and dueDate for every todo', async () => {
      const app = createApp();
      await request(app).post('/todos').send({ title: 'a', priority: 'low' });
      await request(app).post('/todos').send({ title: 'b', priority: 'high', dueDate: '2025-09-01' });
      const res = await request(app).get('/todos');
      expect(res.body[0]).toHaveProperty('priority', 'low');
      expect(res.body[1]).toHaveProperty('priority', 'high');
      expect(res.body[1]).toHaveProperty('dueDate', '2025-09-01');
    });
  });
});
