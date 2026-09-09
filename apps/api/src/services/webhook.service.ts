import type { Db } from '../lib/db';

export type WebhookUsersDb = Pick<Db['users'], 'findByStripeCustomerId'>;
export type WebhookSubscriptionsDb = Pick<Db['subscriptions'], 'upsert' | 'updateStatusBySubscriptionId'>;

export interface WebhookServiceConfig {
  users: WebhookUsersDb;
  subscriptions: WebhookSubscriptionsDb;
}

export interface MinimalStripeEvent {
  type: string;
  data: { object: Record<string, any> };
}

function toDate(unixSeconds: number | null | undefined): Date | null {
  return typeof unixSeconds === 'number' ? new Date(unixSeconds * 1000) : null;
}

export function createWebhookService({ users, subscriptions }: WebhookServiceConfig) {
  async function handleEvent(event: MinimalStripeEvent): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const user = await users.findByStripeCustomerId(session.customer);
        if (!user) return; // ignore unknown customers so Stripe doesn't keep retrying
        await subscriptions.upsert({
          userId: user.id,
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          status: 'active',
          currentPeriodEnd: null,
        });
        return;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await subscriptions.updateStatusBySubscriptionId(
          subscription.id,
          subscription.status,
          toDate(subscription.current_period_end),
        );
        return;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await subscriptions.updateStatusBySubscriptionId(subscription.id, 'canceled', null);
        return;
      }
      default:
        return;
    }
  }

  return { handleEvent };
}

export type WebhookService = ReturnType<typeof createWebhookService>;
