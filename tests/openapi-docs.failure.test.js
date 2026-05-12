const request = require('supertest');
const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const { createApp } = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.clear());

describe('openapi-docs — failure cases', () => {
  it('openapi.yaml is valid YAML and has required OpenAPI fields', () => {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8');
    const doc = yaml.load(raw);
    expect(doc).toHaveProperty('openapi');
    expect(doc).toHaveProperty('info');
    expect(doc).toHaveProperty('paths');
  });

  it('GET /unknown-route returns 404 (docs does not swallow unknown paths)', async () => {
    const res = await request(createApp()).get('/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});
