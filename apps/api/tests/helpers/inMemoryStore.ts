import type { Db } from '../../src/lib/db';
import type { Locale } from '../../src/services/product.mapper';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  stripeCustomerId: string | null;
}

interface StoredSubscription {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  currentPeriodEnd: Date | null;
}

export function createInMemoryStore(): Db & { usersList: StoredUser[]; subscriptionsList: StoredSubscription[] } {
  const usersList: StoredUser[] = [];
  const subscriptionsList: StoredSubscription[] = [];
  const searches: { userId: string; query: string; locale: string; createdAt: Date }[] = [];
  let nextId = 1;

  const db: Db = {
    users: {
      async findByEmail(email) {
        return usersList.find((u) => u.email === email) ?? null;
      },
      async create(email, passwordHash) {
        const user: StoredUser = { id: `user-${nextId++}`, email, passwordHash, stripeCustomerId: null };
        usersList.push(user);
        return user;
      },
      async getById(id) {
        const user = usersList.find((u) => u.id === id);
        return user ? { id: user.id, email: user.email, stripeCustomerId: user.stripeCustomerId } : null;
      },
      async setStripeCustomerId(userId, stripeCustomerId) {
        const user = usersList.find((u) => u.id === userId);
        if (user) user.stripeCustomerId = stripeCustomerId;
      },
      async findByStripeCustomerId(stripeCustomerId) {
        const user = usersList.find((u) => u.stripeCustomerId === stripeCustomerId);
        return user ? { id: user.id } : null;
      },
    },
    searches: {
      async record(userId, query, locale) {
        searches.push({ userId, query, locale, createdAt: new Date() });
      },
      async listRecent(userId) {
        return searches
          .filter((s) => s.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((s) => ({ query: s.query, locale: s.locale as Locale, createdAt: s.createdAt }));
      },
    },
    subscriptions: {
      async findByUserId(userId) {
        const sub = subscriptionsList.find((s) => s.userId === userId);
        return sub ? { status: sub.status } : null;
      },
      async upsert(params) {
        const existing = subscriptionsList.find((s) => s.stripeSubscriptionId === params.stripeSubscriptionId);
        if (existing) {
          Object.assign(existing, params);
        } else {
          subscriptionsList.push({ ...params });
        }
      },
      async updateStatusBySubscriptionId(stripeSubscriptionId, status, currentPeriodEnd) {
        const sub = subscriptionsList.find((s) => s.stripeSubscriptionId === stripeSubscriptionId);
        if (sub) {
          sub.status = status;
          sub.currentPeriodEnd = currentPeriodEnd;
        }
      },
    },
  };

  return { ...db, usersList, subscriptionsList };
}
