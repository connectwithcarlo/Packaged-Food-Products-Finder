import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, type AppDeps } from '../src/app';
import { createInMemoryStore } from './helpers/inMemoryStore';
import { createSearchService } from '../src/services/search.service';
import { createEntitlementService } from '../src/services/entitlement.service';
import { createStripeService } from '../src/services/stripe.service';
import { createWebhookService } from '../src/services/webhook.service';
import type { AuthService } from '../src/services/auth.service';

function brokenAuthService(): AuthService {
  return {
    async register() {
      throw new Error('connect ECONNREFUSED 127.0.0.1:3306');
    },
    async login() {
      throw new Error('connect ECONNREFUSED 127.0.0.1:3306');
    },
    signSession: () => '',
    verifySession: () => null,
  };
}

function buildAppWithBrokenAuth(): ReturnType<typeof createApp> {
  const store = createInMemoryStore();
  const deps: AppDeps = {
    authService: brokenAuthService(),
    searchService: createSearchService({
      offClient: { searchProducts: async () => [], getProductByCode: async () => null },
      searches: store.searches,
    }),
    entitlementService: createEntitlementService({ subscriptions: store.subscriptions }),
    stripeService: createStripeService({
      stripe: { customers: {}, checkout: {}, webhooks: {} } as never,
      priceId: 'price_1',
      successUrl: 'https://app.example/success',
      cancelUrl: 'https://app.example/cancel',
      webhookSecret: 'whsec_1',
    }),
    webhookService: createWebhookService({ users: store.users, subscriptions: store.subscriptions }),
    db: store,
    corsOrigin: 'http://localhost:3000',
  };
  return createApp(deps);
}

describe('auth routes — unexpected errors', () => {
  it('register: does not leak the internal error message, and reports it as a server error', async () => {
    const app = buildAppWithBrokenAuth();

    const res = await request(app).post('/api/auth/register').send({ email: 'a@example.com', password: 'Str0ngPass!' });

    expect(res.status).toBe(500);
    expect(res.body.error).not.toContain('ECONNREFUSED');
  });

  it('login: does not leak the internal error message, and reports it as a server error', async () => {
    const app = buildAppWithBrokenAuth();

    const res = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'Str0ngPass!' });

    expect(res.status).toBe(500);
    expect(res.body.error).not.toContain('ECONNREFUSED');
  });
});
