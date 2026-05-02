import request from 'supertest';
import app from '../src/app.js';
import { createTestUser, loginTestUser, createAuthenticatedUser } from './utils.js';

describe('Authentication', () => {
  describe('POST /api/users (Register)', () => {
    it('should register a new user with valid data', async () => {
      const response = await createTestUser();
      
      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBeDefined();
      expect(response.body.user.role).toBe('student');
    });

    it('should reject registration without agree_terms', async () => {
      const response = await createTestUser({ agree_terms: false });
      
      expect(response.status).toBe(500); // Error from service
    });

    it('should reject duplicate email', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        agree_terms: true,
      };

      await request(app).post('/api/users').send(userData);
      const response = await request(app).post('/api/users').send(userData);
      
      expect(response.status).toBe(500);
    });

    it('should always assign student role', async () => {
      const response = await createTestUser({ role: 'admin' });
      
      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('student');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { user } = await createAuthenticatedUser();
      const response = await loginTestUser(user.email);
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' });
      
      // Error handler returns 500 for thrown errors
      expect(response.status).toBe(500);
    });
  });

  describe('JWT Protection', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/study/status');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/study/status')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
    });
  });
});
