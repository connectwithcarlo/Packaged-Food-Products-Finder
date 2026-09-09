import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Db } from '../lib/db';

export type UsersDb = Pick<Db['users'], 'findByEmail' | 'create'>;

export interface AuthServiceConfig {
  users: UsersDb;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export interface SessionPayload {
  userId: string;
}

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;

export function createAuthService({ users, jwtSecret, jwtExpiresIn }: AuthServiceConfig) {
  function signSession(userId: string): string {
    const payload: SessionPayload = { userId };
    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
  }

  function verifySession(token: string): SessionPayload | null {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        return { userId: (decoded as SessionPayload).userId };
      }
      return null;
    } catch {
      return null;
    }
  }

  async function register(email: string, password: string) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error('WEAK_PASSWORD');
    }
    const existing = await users.findByEmail(email);
    if (existing) {
      throw new Error('EMAIL_TAKEN');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await users.create(email, passwordHash);
    return { user: { id: user.id, email: user.email }, token: signSession(user.id) };
  }

  async function login(email: string, password: string) {
    const user = await users.findByEmail(email);
    // same message for bad email or bad password
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('INVALID_CREDENTIALS');
    }
    return { user: { id: user.id, email: user.email }, token: signSession(user.id) };
  }

  return { register, login, signSession, verifySession };
}

export type AuthService = ReturnType<typeof createAuthService>;
