import request from 'supertest';
import app from '../src/app.js';
import { createAuthenticatedUser, submitConsent, createPretest } from './utils.js';
import { prisma } from '../src/lib/prisma.js';

describe('Experimental Flow', () => {
  describe('Randomization', () => {
    it('should assign user to GE or GC on registration', async () => {
      const { user } = await createAuthenticatedUser();
      
      const assignment = await prisma.assignment.findFirst({
        where: { user_id: user.user_id },
      });

      expect(assignment).toBeDefined();
      expect(['GE', 'GC']).toContain(assignment?.group);
    });

    it('should maintain 1:1 ratio across multiple users', async () => {
      const groups: string[] = [];
      
      for (let i = 0; i < 6; i++) {
        const { user } = await createAuthenticatedUser();
        const assignment = await prisma.assignment.findFirst({
          where: { user_id: user.user_id },
        });
        groups.push(assignment?.group || '');
      }

      const geCount = groups.filter(g => g === 'GE').length;
      const gcCount = groups.filter(g => g === 'GC').length;
      
      // Should be close to 1:1 (5:5 or 6:4)
      expect(Math.abs(geCount - gcCount)).toBeLessThanOrEqual(2);
    });

    it('should create feature flags matching assignment', async () => {
      const { user } = await createAuthenticatedUser();
      
      const flags = await prisma.featureFlag.findUnique({
        where: { user_id: user.user_id },
      });

      const assignment = await prisma.assignment.findFirst({
        where: { user_id: user.user_id },
      });

      expect(flags).toBeDefined();
      expect(flags?.chatbot).toBe(assignment?.group === 'GE');
      expect(flags?.adaptativo).toBe(assignment?.group === 'GE');
    });
  });

  describe('Consent Enforcement', () => {
    it('should block evaluation creation without consent', async () => {
      const { token } = await createAuthenticatedUser();
      
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send({ assessment_type: 'pretest' });

      expect(response.status).toBe(403);
    });

    it('should allow evaluation creation after consent', async () => {
      const { token } = await createAuthenticatedUser();
      
      await submitConsent(token);
      
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send({ assessment_type: 'pretest' });

      expect(response.status).toBe(201);
    });

    it('should block AI access without consent', async () => {
      const { token } = await createAuthenticatedUser();
      
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' });

      expect(response.status).toBe(403);
    });

    it('should block activities without consent', async () => {
      const { token } = await createAuthenticatedUser();
      
      const response = await request(app)
        .get('/api/activities/exercise')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Pretest Requirement', () => {
    it('should block AI access without pretest', async () => {
      const { token } = await createAuthenticatedUser();
      await submitConsent(token);
      
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' });

      expect(response.status).toBe(403);
    });

    it('should allow AI access after consent + pretest', async () => {
      const { token } = await createAuthenticatedUser();
      await submitConsent(token);
      await createPretest(token);
      
      // Note: This might still fail if AI module is not running
      // but the middleware should let it through
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' });

      // Should pass middleware but might fail at AI module connection
      expect(response.status).not.toBe(403);
    });
  });
});
