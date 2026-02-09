const request = require('supertest');
const appPath = require('../src/testApp');

let server;
beforeAll(async () => {
  server = await appPath.startAppForTests();
});

afterAll(async () => {
  await appPath.stopAppForTests(server);
});

test('POST /api/patients creates a patient and returns it', async () => {
  const payload = {
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+24100000000',
    address: 'Av. Example 1',
    city: 'Libreville',
    services: ['laboratoire']
  };

  const res = await request('http://localhost:4000').post('/api/patients').send(payload);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('ok', true);
  expect(res.body).toHaveProperty('patient');
  expect(res.body.patient).toHaveProperty('id');
  expect(res.body.patient.firstName).toBe(payload.firstName);
  expect(res.body.patient.lastName).toBe(payload.lastName);
  expect(Array.isArray(res.body.patient.services)).toBe(true);
  expect(res.body.patient.services).toContain('laboratoire');
});