import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth.service';
import { SESSION_COOKIE } from '../lib/constants';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(authService: Pick<AuthService, 'verifySession'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies?.[SESSION_COOKIE];
    const session = token ? authService.verifySession(token) : null;

    if (!session) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    req.userId = session.userId;
    next();
  };
}
