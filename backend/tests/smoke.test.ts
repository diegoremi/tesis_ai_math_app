import request from 'supertest';
import app from '../src/app.js';

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('API Smoke Tests', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');
    expect(response.status).toBe(404);
  });

  it('should handle invalid JSON', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('invalid json');
    
    expect(response.status).toBe(400);
  });
});
