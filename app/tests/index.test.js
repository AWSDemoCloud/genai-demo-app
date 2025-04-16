const request = require('supertest');
const { app, start } = require('../index');

let server;
beforeAll(() => { server = start(); });
afterAll(() => server.close());

test('GET / returns greeting', async () => {
  const res = await request(app).get('/');
  expect(res.text).toContain('Hello');
});
