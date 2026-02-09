const request = require('supertest');
const appPath = require('../src/testApp');

let server;
beforeAll(async () => {
  server = await appPath.startAppForTests();
});

afterAll(async () => {
  await appPath.stopAppForTests(server);
});

test('GET /api/health responds ok', async () => {
  const res = await request('http://localhost:4000').get('/api/health');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
