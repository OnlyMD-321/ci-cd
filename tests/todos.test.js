const request = require('supertest');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('GET /todos', () => {
  it('returns an empty list when the store has no todos', async () => {
    const res = await request(createApp()).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /todos', () => {
  it('creates a todo and returns 201 with the new resource', async () => {
    const res = await request(createApp()).post('/todos').send({ title: 'buy milk' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'buy milk', done: false });
  });

  it('rejects a missing title with 400', async () => {
    const res = await request(createApp()).post('/todos').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(createApp()).post('/todos').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-string title with 400', async () => {
    const res = await request(createApp()).post('/todos').send({ title: 42 });
    expect(res.status).toBe(400);
  });

  it('rejects a request without a JSON body with 400', async () => {
    const res = await request(createApp())
      .post('/todos')
      .set('Content-Type', 'text/plain')
      .send('hello');
    expect(res.status).toBe(400);
  });

  it('makes the new todo visible in GET /todos', async () => {
    const app = createApp();
    await request(app).post('/todos').send({ title: 'a' });
    await request(app).post('/todos').send({ title: 'b' });
    const res = await request(app).get('/todos');
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t) => t.title)).toEqual(['a', 'b']);
  });
});

describe('GET /todos/:id', () => {
  it('returns the todo when it exists', async () => {
    const app = createApp();
    const created = await request(app).post('/todos').send({ title: 'buy milk' });
    const res = await request(app).get(`/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('returns 404 when the id does not exist', async () => {
    const res = await request(createApp()).get('/todos/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when the id is not a number', async () => {
    const res = await request(createApp()).get('/todos/abc');
    expect(res.status).toBe(404);
  });
});
