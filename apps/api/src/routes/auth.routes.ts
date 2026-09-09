import { Router, type NextFunction, type Response } from 'express';
import type { AuthService } from '../services/auth.service';
import type { Db } from '../lib/db';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from '../lib/constants';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/asyncHandler';

const AUTH_ERROR_STATUS: Record<string, number> = {
  EMAIL_TAKEN: 409,
  WEAK_PASSWORD: 400,
  INVALID_CREDENTIALS: 401,
};

function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function respondWithAuthError(res: Response, next: NextFunction, error: unknown): void {
  const status = error instanceof Error ? AUTH_ERROR_STATUS[error.message] : undefined;
  if (status) {
    res.status(status).json({ error: (error as Error).message });
    return;
  }
  next(error);
}

export function createAuthRouter(authService: AuthService, db: Db): Router {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (req, res, next) => {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT' });
        return;
      }
      try {
        const { user, token } = await authService.register(email, password);
        setSessionCookie(res, token);
        res.status(201).json({ user });
      } catch (err) {
        respondWithAuthError(res, next, err);
      }
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (req, res, next) => {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT' });
        return;
      }
      try {
        const { user, token } = await authService.login(email, password);
        setSessionCookie(res, token);
        res.json({ user });
      } catch (err) {
        respondWithAuthError(res, next, err);
      }
    }),
  );

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  router.get(
    '/me',
    requireAuth(authService),
    asyncHandler(async (req: AuthedRequest, res) => {
      const user = await db.users.getById(req.userId!);
      if (!user) {
        res.status(401).json({ error: 'UNAUTHENTICATED' });
        return;
      }
      res.json({ user: { id: user.id, email: user.email } });
    }),
  );

  return router;
}
