const supertest = require('supertest');
const { createApp } = require('../../src/app');

describe('App', () => {
  const api = supertest(createApp());

  it('GET / responds that the API is ready', async () => {
    const res = await api.get('/').expect(200);
    expect(res.text).toBe('I am ready!!');
  });

  it('GET /api-docs/ serves the Swagger UI', async () => {
    const res = await api.get('/api-docs/').expect(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('swagger-ui');
  });
});
