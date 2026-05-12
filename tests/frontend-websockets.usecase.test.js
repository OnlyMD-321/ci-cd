const request = require('supertest');
const http    = require('http');
const { createApp, createIo } = require('../src/app');
const store = require('../src/store');
const { getToken } = require('./helpers/auth');

let app, server, token;

beforeEach(async () => {
  store.clear();
  app    = createApp();
  server = http.createServer(app);
  createIo(server);
  await new Promise((r) => server.listen(0, r));
  token = await getToken(app);
});

afterEach(() => new Promise((r) => server.close(r)));

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('frontend — use cases', () => {
  it('GET / serves the SPA HTML page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/Todo App/);
  });

  it('SPA includes socket.io client script reference', async () => {
    const res = await request(app).get('/');
    expect(res.text).toMatch(/socket\.io/);
  });

  it('/socket.io/socket.io.js is served', async () => {
    const res = await request(server).get('/socket.io/socket.io.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
  });
});

describe('websockets — use cases', () => {
  it('server emits todos:update when a todo is created', (done) => {
    const { io: ioClient } = require('socket.io-client');
    const addr = server.address();
    const client = ioClient(`http://localhost:${addr.port}`);
    client.once('todos:update', () => { client.disconnect(); done(); });
    client.once('connect', () => {
      request(app).post('/todos').set(auth()).send({ title: 'ws test' }).end(() => {});
    });
  });
});
