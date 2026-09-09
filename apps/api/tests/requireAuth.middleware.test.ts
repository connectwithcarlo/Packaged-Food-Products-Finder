import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { requireAuth } from '../src/middleware/requireAuth';
import { createAuthService, type UsersDb } from '../src/services/auth.service';

function buildTestApp() {
  const rows: { id: string; email: string; passwordHash: string }[] = [];
  const users: UsersDb = {
    async findByEmail(email) {
      return rows.find((u) => u.email === email) ?? null;
    },
    async create(email, passwordHash) {
      const user = { id: 'user-1', email, passwordHash };
      rows.push(user);
      return user;
    },
  };
  const authService = createAuthService({ users, jwtSecret: 'test-secret', jwtExpiresIn: '1h' });

  const app = express();
  app.use(cookieParser());
  app.get('/protected', requireAuth(authService), (req, res) => {
    res.json({ userId: (req as any).userId });
  });

  return { app, authService };
}

describe('requireAuth middleware', () => {
  it('returns 401 when there is no session cookie', async () => {
    const { app } = buildTestApp();

    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage session cookie', async () => {
    const { app } = buildTestApp();

    const res = await request(app).get('/protected').set('Cookie', 'session=garbage');

    expect(res.status).toBe(401);
  });

  it('attaches userId and calls next() for a valid session cookie', async () => {
    const { app, authService } = buildTestApp();
    const { token } = await authService.register('jane@example.com', 'Str0ngPass!');

    const res = await request(app).get('/protected').set('Cookie', `session=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-1');
  });
});
