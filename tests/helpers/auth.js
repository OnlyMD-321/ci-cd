const request = require('supertest');

async function getToken(app) {
  const res = await request(app)
    .post('/auth/register')
    .send({ username: 'testuser', password: 'password123' });
  return res.body.token;
}

module.exports = { getToken };
