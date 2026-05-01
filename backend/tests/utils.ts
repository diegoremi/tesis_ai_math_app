import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

export const createTestUser = async (overrides = {}) => {
  const userData = {
    first_name: 'Test',
    last_name: 'User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    age: 25,
    education_level: 'university',
    goal: 'Test goal',
    agree_terms: true,
    ...overrides,
  };

  const response = await request(app)
    .post('/api/users')
    .send(userData);

  return response;
};

export const loginTestUser = async (email: string, password: string = 'TestPassword123!') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response;
};

export const createAuthenticatedUser = async (overrides = {}) => {
  const registerResponse = await createTestUser(overrides);
  const email = registerResponse.body.user?.email || overrides.email;
  
  const loginResponse = await loginTestUser(email);
  const token = loginResponse.body.token;

  return {
    user: registerResponse.body.user,
    token,
    registerResponse,
    loginResponse,
  };
};

export const submitConsent = async (token: string) => {
  return request(app)
    .post('/api/study/consent')
    .set('Authorization', `Bearer ${token}`)
    .send({
      documentVersion: 'v1.0',
      accepted: true,
    });
};

export const createPretest = async (token: string) => {
  return request(app)
    .post('/api/evaluations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      assessment_type: 'pretest',
      responses: [],
    });
};

export const cleanupDatabase = async () => {
  await prisma.aIFeedback.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.user.deleteMany();
};
