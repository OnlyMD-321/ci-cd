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

describe('stats — use cases', () => {
  it('returns zeros when user has no todos', async () => {
    const res = await request(app).get('/stats').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 0, done: 0, pending: 0, overdue: 0 });
    expect(res.body.byPriority).toMatchObject({ low: 0, medium: 0, high: 0 });
  });

  it('total, done, and pending reflect created and toggled todos', async () => {
    await post('a');
    await post('b');
    await post('c');
    const t = await post('d');
    await request(app).patch(`/todos/${t.body.id}/toggle`).set(auth());
    const res = await request(app).get('/stats').set(auth());
    expect(res.body.total).toBe(4);
    expect(res.body.done).toBe(1);
    expect(res.body.pending).toBe(3);
  });

  it('byPriority counts todos by priority correctly', async () => {
    await post('a', { priority: 'high' });
    await post('b', { priority: 'high' });
    await post('c', { priority: 'low' });
    await post('d'); // default medium
    const res = await request(app).get('/stats').set(auth());
    expect(res.body.byPriority).toMatchObject({ high: 2, low: 1, medium: 1 });
  });

  it('overdue counts pending todos with dueDate in the past', async () => {
    await post('past due', { dueDate: '2000-01-01' });
    await post('future', { dueDate: '2099-12-31' });
    await post('no date');
    const res = await request(app).get('/stats').set(auth());
    expect(res.body.overdue).toBe(1);
  });

  it('overdue does not count completed todos even if past due', async () => {
    const t = await post('past done', { dueDate: '2000-01-01' });
    await request(app).patch(`/todos/${t.body.id}/toggle`).set(auth());
    const res = await request(app).get('/stats').set(auth());
    expect(res.body.overdue).toBe(0);
  });

  it('stats are per-user — does not include other users todos', async () => {
    const other = await request(app)
      .post('/auth/register')
      .send({ username: 'bob', password: 'password123' });
    await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${other.body.token}`)
      .send({ title: 'bobs task' });
    const res = await request(app).get('/stats').set(auth());
    expect(res.body.total).toBe(0);
  });
});
