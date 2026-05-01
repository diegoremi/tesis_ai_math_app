import request from 'supertest';
import app from '../src/app.js';
import { createAuthenticatedUser, submitConsent, createPretest } from './utils.js';
import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcrypt';

describe('AI Access Control', () => {
  it('should allow GE users to access AI after pretest', async () => {
    const { token, user } = await createAuthenticatedUser();
    
    // Force GE assignment
    await prisma.assignment.updateMany({
      where: { user_id: user.user_id },
      data: { group: 'GE' },
    });
    await prisma.featureFlag.update({
      where: { user_id: user.user_id },
      data: { chatbot: true, adaptativo: true },
    });

    await submitConsent(token);
    await createPretest(token);
    
    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    // Should pass middleware (might fail at AI module, but not 403)
    expect(response.status).not.toBe(403);
  });

  it('should block GC users from AI even after pretest', async () => {
    const { token, user } = await createAuthenticatedUser();
    
    // Force GC assignment
    await prisma.assignment.updateMany({
      where: { user_id: user.user_id },
      data: { group: 'GC' },
    });
    await prisma.featureFlag.update({
      where: { user_id: user.user_id },
      data: { chatbot: false, adaptativo: false },
    });

    await submitConsent(token);
    await createPretest(token);
    
    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    expect(response.status).toBe(403);
  });
});

describe('Admin Routes', () => {
  const createAdminUser = async () => {
    const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
    const admin = await prisma.user.create({
      data: {
        first_name: 'Admin',
        last_name: 'User',
        email: `admin_${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: 'admin',
      },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'AdminPass123!' });

    return { admin, token: loginResponse.body.token };
  };

  it('should allow admin to access admin routes', async () => {
    const { token } = await createAdminUser();
    
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should block non-admin from admin routes', async () => {
    const { token } = await createAuthenticatedUser();
    
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('should allow admin to export ANCOVA data', async () => {
    const { token } = await createAdminUser();
    
    const response = await request(app)
      .get('/api/admin/export?type=ancova')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });
});
