import { describe, it, expect } from 'vitest';
import { createAuthService, type UsersDb } from '../src/services/auth.service';

type UserRow = { id: string; email: string; passwordHash: string };

function createFakeUsers(initial: UserRow[] = []): UsersDb & { rows: UserRow[] } {
  const rows = [...initial];
  return {
    rows,
    async findByEmail(email) {
      return rows.find((u) => u.email === email) ?? null;
    },
    async create(email, passwordHash) {
      const user: UserRow = { id: `id-${rows.length + 1}`, email, passwordHash };
      rows.push(user);
      return user;
    },
  };
}

const AUTH_CONFIG = { jwtSecret: 'test-secret', jwtExpiresIn: '1h' };

describe('authService.register', () => {
  it('creates a new user and never stores the plaintext password', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    const result = await auth.register('jane@example.com', 'Str0ngPass!');

    expect(result.user.email).toBe('jane@example.com');
    expect(users.rows[0].passwordHash).not.toBe('Str0ngPass!');
  });

  it('returns a session token usable to identify the new user', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    const { user, token } = await auth.register('jane@example.com', 'Str0ngPass!');

    expect(auth.verifySession(token)?.userId).toBe(user.id);
  });

  it('rejects an email that is already registered', async () => {
    const users = createFakeUsers([{ id: '1', email: 'jane@example.com', passwordHash: 'x' }]);
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    await expect(auth.register('jane@example.com', 'whatever1')).rejects.toThrow('EMAIL_TAKEN');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    await expect(auth.register('jane@example.com', 'short')).rejects.toThrow('WEAK_PASSWORD');
  });
});

describe('authService.login', () => {
  it('logs in with correct credentials and returns a session token', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });
    await auth.register('jane@example.com', 'Str0ngPass!');

    const result = await auth.login('jane@example.com', 'Str0ngPass!');

    expect(result.user.email).toBe('jane@example.com');
    expect(typeof result.token).toBe('string');
  });

  it('rejects an unknown email', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    await expect(auth.login('nobody@example.com', 'whatever1')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('rejects the wrong password', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });
    await auth.register('jane@example.com', 'Str0ngPass!');

    await expect(auth.login('jane@example.com', 'WrongPass!')).rejects.toThrow('INVALID_CREDENTIALS');
  });
});

describe('authService.verifySession', () => {
  it('returns null for a garbage token', () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });

    expect(auth.verifySession('not-a-real-token')).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const users = createFakeUsers();
    const auth = createAuthService({ users, ...AUTH_CONFIG });
    const other = createAuthService({ users, jwtSecret: 'other-secret', jwtExpiresIn: '1h' });
    const { token } = await other.register('jane@example.com', 'Str0ngPass!');

    expect(auth.verifySession(token)).toBeNull();
  });
});
