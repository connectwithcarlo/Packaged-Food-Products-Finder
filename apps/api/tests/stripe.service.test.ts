import { describe, it, expect, vi } from 'vitest';
import Stripe from 'stripe';
import { createStripeService, type StripeClient } from '../src/services/stripe.service';

const CONFIG = {
  priceId: 'price_123',
  successUrl: 'https://app.example/success',
  cancelUrl: 'https://app.example/cancel',
  webhookSecret: 'whsec_test_secret',
};

function fakeStripeClient(overrides: Partial<StripeClient> = {}): StripeClient {
  return {
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_new' }) } as any,
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' } as any) } } as any,
    webhooks: { constructEvent: vi.fn() } as any,
    ...overrides,
  };
}

describe('stripeService.ensureCustomer', () => {
  it('reuses an existing Stripe customer id without calling the API', async () => {
    const stripe = fakeStripeClient();
    const service = createStripeService({ stripe, ...CONFIG });

    const id = await service.ensureCustomer({ id: 'u1', email: 'jane@example.com', stripeCustomerId: 'cus_existing' });

    expect(id).toBe('cus_existing');
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });

  it('creates a new Stripe customer when the user has none yet', async () => {
    const stripe = fakeStripeClient();
    const service = createStripeService({ stripe, ...CONFIG });

    const id = await service.ensureCustomer({ id: 'u1', email: 'jane@example.com', stripeCustomerId: null });

    expect(id).toBe('cus_new');
    expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'jane@example.com', metadata: { userId: 'u1' } });
  });
});

describe('stripeService.createCheckoutSession', () => {
  it('creates a subscription-mode session for the configured price and returns its URL', async () => {
    const stripe = fakeStripeClient();
    const service = createStripeService({ stripe, ...CONFIG });

    const url = await service.createCheckoutSession('cus_123');

    expect(url).toBe('https://checkout.stripe.com/session');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      customer: 'cus_123',
      line_items: [{ price: 'price_123', quantity: 1 }],
      success_url: CONFIG.successUrl,
      cancel_url: CONFIG.cancelUrl,
    });
  });

  it('throws if Stripe returns a session without a URL', async () => {
    const stripe = fakeStripeClient({
      checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: null } as any) } } as any,
    });
    const service = createStripeService({ stripe, ...CONFIG });

    await expect(service.createCheckoutSession('cus_123')).rejects.toThrow('STRIPE_SESSION_MISSING_URL');
  });
});

describe('stripeService.verifyWebhookEvent', () => {
  it('parses an event whose signature matches the webhook secret', () => {
    const realStripe = new Stripe('sk_test_dummy');
    const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
    const header = realStripe.webhooks.generateTestHeaderString({ payload, secret: CONFIG.webhookSecret });
    const service = createStripeService({ stripe: realStripe, ...CONFIG });

    const event = service.verifyWebhookEvent(Buffer.from(payload), header);

    expect(event.type).toBe('checkout.session.completed');
  });

  it('rejects a payload with an invalid signature', () => {
    const realStripe = new Stripe('sk_test_dummy');
    const service = createStripeService({ stripe: realStripe, ...CONFIG });

    expect(() => service.verifyWebhookEvent(Buffer.from('{}'), 'not-a-real-signature')).toThrow();
  });
});
