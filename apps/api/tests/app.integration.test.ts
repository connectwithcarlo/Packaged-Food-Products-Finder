import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import Stripe from 'stripe';
import { createApp } from '../src/app';
import { createAuthService } from '../src/services/auth.service';
import { createSearchService } from '../src/services/search.service';
import { createEntitlementService } from '../src/services/entitlement.service';
import { createStripeService, type StripeClient } from '../src/services/stripe.service';
import { createWebhookService } from '../src/services/webhook.service';
import { createInMemoryStore } from './helpers/inMemoryStore';
import type { OpenFoodFactsClient } from '../src/services/openFoodFacts.service';

const WEBHOOK_SECRET = 'whsec_test_secret';

function buildApp() {
  const store = createInMemoryStore();
  const authService = createAuthService({ users: store.users, jwtSecret: 'test-secret', jwtExpiresIn: '1h' });

  const offClient: OpenFoodFactsClient = {
    searchProducts: vi.fn().mockResolvedValue([{ code: 'p1', product_name: 'Granola' }]),
    getProductByCode: vi.fn().mockResolvedValue({
      code: 'p1',
      product_name: 'Granola',
      nutriments: { fat_100g: 12.5 },
    }),
  };
  const searchService = createSearchService({ offClient, searches: store.searches });
  const entitlementService = createEntitlementService({ subscriptions: store.subscriptions });

  const realStripe = new Stripe('sk_test_dummy');
  const stripeClient: StripeClient = {
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_1' }) } as any,
    checkout: {
      sessions: { create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' } as any) },
    } as any,
    webhooks: realStripe.webhooks,
  };
  const stripeService = createStripeService({
    stripe: stripeClient,
    priceId: 'price_123',
    successUrl: 'https://app.example/success',
    cancelUrl: 'https://app.example/cancel',
    webhookSecret: WEBHOOK_SECRET,
  });

  const webhookService = createWebhookService({
    users: store.users,
    subscriptions: store.subscriptions,
  });

  const app = createApp({
    authService,
    searchService,
    entitlementService,
    stripeService,
    webhookService,
    db: store,
    corsOrigin: 'http://localhost:3000',
  });

  return { app, store };
}

async function registerAndGetCookie(app: import('express').Express) {
  const res = await request(app).post('/api/auth/register').send({ email: 'jane@example.com', password: 'Str0ngPass!' });
  const cookie = res.headers['set-cookie'][0];
  return { cookie, userId: res.body.user.id as string };
}

describe('auth routes', () => {
  it('registers, then allows login with the same credentials', async () => {
    const { app } = buildApp();
    await request(app).post('/api/auth/register').send({ email: 'jane@example.com', password: 'Str0ngPass!' });

    const res = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'Str0ngPass!' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('jane@example.com');
  });

  it('rejects login with a wrong password', async () => {
    const { app } = buildApp();
    await request(app).post('/api/auth/register').send({ email: 'jane@example.com', password: 'Str0ngPass!' });

    const res = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'wrong-pass' });

    expect(res.status).toBe(401);
  });
});

describe('product routes — require auth', () => {
  it('rejects search with no session', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/products/search').query({ q: 'granola' });
    expect(res.status).toBe(401);
  });

  it('returns results for an authenticated search', async () => {
    const { app } = buildApp();
    const { cookie } = await registerAndGetCookie(app);

    const res = await request(app).get('/api/products/search').query({ q: 'granola', lang: 'en' }).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([{ code: 'p1', name: 'Granola', brand: null, imageUrl: null, quantity: null }]);
  });
});

describe('entitlement gating on product detail', () => {
  it('hides nutrition for a user without an active subscription', async () => {
    const { app } = buildApp();
    const { cookie } = await registerAndGetCookie(app);

    const res = await request(app).get('/api/products/p1').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.entitled).toBe(false);
    expect(res.body.nutrition).toBeNull();
  });

  it('reveals nutrition once the Stripe webhook activates the subscription', async () => {
    const { app, store } = buildApp();
    const { cookie, userId } = await registerAndGetCookie(app);

    await request(app).post('/api/subscriptions/checkout-session').set('Cookie', cookie);
    const stripeCustomerId = store.usersList.find((u) => u.id === userId)!.stripeCustomerId!;

    const payload = JSON.stringify({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { customer: stripeCustomerId, subscription: 'sub_1' } },
    });
    const realStripe = new Stripe('sk_test_dummy');
    const signature = realStripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

    const webhookRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(webhookRes.status).toBe(200);

    const detailRes = await request(app).get('/api/products/p1').set('Cookie', cookie);

    expect(detailRes.body.entitled).toBe(true);
    expect(detailRes.body.nutrition).toEqual({
      energyKcal100g: null,
      fat100g: 12.5,
      carbohydrates100g: null,
      sugars100g: null,
      proteins100g: null,
      salt100g: null,
    });
  });

  it('rejects a webhook with an invalid signature', async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 'not-a-real-signature')
      .send(JSON.stringify({ type: 'checkout.session.completed' }));

    expect(res.status).toBe(400);
  });
});
