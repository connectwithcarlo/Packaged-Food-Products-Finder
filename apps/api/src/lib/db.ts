import type { PrismaClient } from '@prisma/client';
import type { Locale } from '../services/product.mapper';

const RECENT_SEARCH_LIMIT = 10;

export interface Db {
  users: {
    findByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null>;
    create(email: string, passwordHash: string): Promise<{ id: string; email: string; passwordHash: string }>;
    getById(id: string): Promise<{ id: string; email: string; stripeCustomerId: string | null } | null>;
    setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;
    findByStripeCustomerId(stripeCustomerId: string): Promise<{ id: string } | null>;
  };
  searches: {
    record(userId: string, query: string, locale: Locale): Promise<void>;
    listRecent(userId: string): Promise<{ query: string; locale: Locale; createdAt: Date }[]>;
  };
  subscriptions: {
    findByUserId(userId: string): Promise<{ status: string } | null>;
    upsert(params: {
      userId: string;
      stripeSubscriptionId: string;
      stripeCustomerId: string;
      status: string;
      currentPeriodEnd: Date | null;
    }): Promise<void>;
    updateStatusBySubscriptionId(
      stripeSubscriptionId: string,
      status: string,
      currentPeriodEnd: Date | null,
    ): Promise<void>;
  };
}

export function createDb(prisma: PrismaClient): Db {
  return {
    users: {
      findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
      },
      create(email, passwordHash) {
        return prisma.user.create({ data: { email, passwordHash } });
      },
      getById(id) {
        return prisma.user.findUnique({
          where: { id },
          select: { id: true, email: true, stripeCustomerId: true },
        });
      },
      async setStripeCustomerId(userId, stripeCustomerId) {
        await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
      },
      findByStripeCustomerId(stripeCustomerId) {
        return prisma.user.findUnique({ where: { stripeCustomerId }, select: { id: true } });
      },
    },
    searches: {
      async record(userId, query, locale) {
        await prisma.recentSearch.create({ data: { userId, query, locale } });
      },
      async listRecent(userId) {
        const rows = await prisma.recentSearch.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: RECENT_SEARCH_LIMIT,
        });
        return rows.map((row) => ({
          query: row.query,
          locale: row.locale as Locale,
          createdAt: row.createdAt,
        }));
      },
    },
    subscriptions: {
      findByUserId(userId) {
        return prisma.subscription.findUnique({ where: { userId }, select: { status: true } });
      },
      async upsert({ userId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodEnd }) {
        await prisma.subscription.upsert({
          where: { userId },
          create: { userId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodEnd },
          update: { stripeSubscriptionId, stripeCustomerId, status, currentPeriodEnd },
        });
      },
      async updateStatusBySubscriptionId(stripeSubscriptionId, status, currentPeriodEnd) {
        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: { status, currentPeriodEnd },
        });
      },
    },
  };
}
