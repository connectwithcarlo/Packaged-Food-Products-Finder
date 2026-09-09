import type { Db } from '../lib/db';

const ENTITLED_STATUSES = new Set(['active', 'trialing']);

export type SubscriptionsDb = Pick<Db['subscriptions'], 'findByUserId'>;

export function createEntitlementService({ subscriptions }: { subscriptions: SubscriptionsDb }) {
  async function isEntitled(userId: string): Promise<boolean> {
    const subscription = await subscriptions.findByUserId(userId);
    return subscription !== null && ENTITLED_STATUSES.has(subscription.status);
  }

  return { isEntitled };
}

export type EntitlementService = ReturnType<typeof createEntitlementService>;
