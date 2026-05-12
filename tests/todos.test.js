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

describe('GET /todos', () => {
  it('returns an empty list when the store has no todos', async () => {
    const res = await request(app).get('/todos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('?done=true returns only completed todos', async () => {
    const a = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'b' });
    await request(app).patch(`/todos/${a.body.id}/toggle`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/todos?done=true').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['a']);
  });

  it('?done=false returns only pending todos', async () => {
    const a = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'b' });
    await request(app).patch(`/todos/${a.body.id}/toggle`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/todos?done=false').set('Authorization', `Bearer ${token}`);
    expect(res.body.map((t) => t.title)).toEqual(['b']);
  });

  it('returns 400 when done query is not "true" or "false"', async () => {
    const res = await request(app).get('/todos?done=yes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /todos', () => {
  it('creates a todo and returns 201 with the new resource', async () => {
    const res = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'buy milk' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'buy milk', done: false });
  });

  it('rejects a missing title with 400', async () => {
    const res = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-string title with 400', async () => {
    const res = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 42 });
    expect(res.status).toBe(400);
  });

  it('rejects a request without a JSON body with 400', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'text/plain')
      .send('hello');
    expect(res.status).toBe(400);
  });

  it('makes the new todo visible in GET /todos', async () => {
    await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'b' });
    const res = await request(app).get('/todos').set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t) => t.title)).toEqual(['a', 'b']);
  });
});

describe('GET /todos/:id', () => {
  it('returns the todo when it exists', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'buy milk' });
    const res = await request(app).get(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'buy milk' });
  });

  it('returns 404 when the id does not exist', async () => {
    const res = await request(app).get('/todos/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when the id is not a number', async () => {
    const res = await request(app).get('/todos/abc').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /todos/:id', () => {
  it('updates title and done, returns 200', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    const res = await request(app)
      .put(`/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'b', done: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'b', done: true });
  });

  it('persists the update for subsequent GETs', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).put(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ title: 'b', done: true });
    const res = await request(app).get(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.body).toMatchObject({ title: 'b', done: true });
  });

  it('returns 404 when the id does not exist', async () => {
    const res = await request(app).put('/todos/999').set('Authorization', `Bearer ${token}`).send({ title: 'b', done: true });
    expect(res.status).toBe(404);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).put('/todos/1').set('Authorization', `Bearer ${token}`).send({ done: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is empty', async () => {
    const res = await request(app).put('/todos/1').set('Authorization', `Bearer ${token}`).send({ title: '   ', done: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when done is not a boolean', async () => {
    const res = await request(app).put('/todos/1').set('Authorization', `Bearer ${token}`).send({ title: 'b', done: 'yes' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /todos/:id', () => {
  it('removes the todo and returns 204', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    const res = await request(app).delete(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('makes the todo no longer reachable via GET /todos/:id', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).delete(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get(`/todos/${created.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 when the id does not exist', async () => {
    const res = await request(app).delete('/todos/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /todos/:id/toggle', () => {
  it('flips done from false to true', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    const res = await request(app).patch(`/todos/${created.body.id}/toggle`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it('flips done from true back to false on a second call', async () => {
    const created = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ title: 'a' });
    await request(app).patch(`/todos/${created.body.id}/toggle`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).patch(`/todos/${created.body.id}/toggle`).set('Authorization', `Bearer ${token}`);
    expect(res.body.done).toBe(false);
  });

  it('returns 404 when the id does not exist', async () => {
    const res = await request(app).patch('/todos/999/toggle').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
