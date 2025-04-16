const request = require('supertest');
const app = require('../index');

describe('GET /', () => {
  it('should return a greeting', async () => {
    const res = await request('http://localhost:3000').get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Hello from genai-demo-app');
  });
});
