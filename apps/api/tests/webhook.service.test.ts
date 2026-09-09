import { describe, it, expect, vi } from 'vitest';
import { createWebhookService, type WebhookUsersDb, type WebhookSubscriptionsDb } from '../src/services/webhook.service';

function fakeUsers(userId: string | null): WebhookUsersDb {
  return { async findByStripeCustomerId() { return userId ? { id: userId } : null; } };
}

function fakeSubscriptions(): WebhookSubscriptionsDb & {
  upsert: ReturnType<typeof vi.fn>;
  updateStatusBySubscriptionId: ReturnType<typeof vi.fn>;
} {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    updateStatusBySubscriptionId: vi.fn().mockResolvedValue(undefined),
  };
}

describe('webhookService.handleEvent — checkout.session.completed', () => {
  it('activates a subscription for the user matching the Stripe customer', async () => {
    const subscriptions = fakeSubscriptions();
    const service = createWebhookService({ users: fakeUsers('user-1'), subscriptions });

    await service.handleEvent({
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_123', subscription: 'sub_123' } },
    });

    expect(subscriptions.upsert).toHaveBeenCalledWith({
      userId: 'user-1',
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      currentPeriodEnd: null,
    });
  });

  it('does nothing when the Stripe customer does not match any known user', async () => {
    const subscriptions = fakeSubscriptions();
    const service = createWebhookService({ users: fakeUsers(null), subscriptions });

    await service.handleEvent({
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_unknown', subscription: 'sub_123' } },
    });

    expect(subscriptions.upsert).not.toHaveBeenCalled();
  });
});

describe('webhookService.handleEvent — customer.subscription.updated', () => {
  it('syncs status and period end for the matching subscription', async () => {
    const subscriptions = fakeSubscriptions();
    const service = createWebhookService({ users: fakeUsers('user-1'), subscriptions });

    await service.handleEvent({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_123', status: 'past_due', current_period_end: 1735689600 } },
    });

    expect(subscriptions.updateStatusBySubscriptionId).toHaveBeenCalledWith(
      'sub_123',
      'past_due',
      new Date(1735689600 * 1000),
    );
  });
});

describe('webhookService.handleEvent — customer.subscription.deleted', () => {
  it('marks the subscription canceled', async () => {
    const subscriptions = fakeSubscriptions();
    const service = createWebhookService({ users: fakeUsers('user-1'), subscriptions });

    await service.handleEvent({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_123' } } });

    expect(subscriptions.updateStatusBySubscriptionId).toHaveBeenCalledWith('sub_123', 'canceled', null);
  });
});

describe('webhookService.handleEvent — unhandled event types', () => {
  it('ignores event types the app does not care about, without throwing', async () => {
    const subscriptions = fakeSubscriptions();
    const service = createWebhookService({ users: fakeUsers('user-1'), subscriptions });

    await expect(
      service.handleEvent({ type: 'invoice.paid', data: { object: {} } }),
    ).resolves.toBeUndefined();
    expect(subscriptions.upsert).not.toHaveBeenCalled();
    expect(subscriptions.updateStatusBySubscriptionId).not.toHaveBeenCalled();
  });
});
