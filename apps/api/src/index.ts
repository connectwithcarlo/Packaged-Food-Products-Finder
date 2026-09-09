import 'dotenv/config';
import Stripe from 'stripe';
import { loadEnv } from './config/env';
import { prisma } from './lib/prisma';
import { createDb } from './lib/db';
import { createApp } from './app';
import { createAuthService } from './services/auth.service';
import { createSearchService } from './services/search.service';
import { createEntitlementService } from './services/entitlement.service';
import { createOpenFoodFactsClient } from './services/openFoodFacts.service';
import { createStripeService } from './services/stripe.service';
import { createWebhookService } from './services/webhook.service';

const env = loadEnv();
const db = createDb(prisma);

const authService = createAuthService({
  users: db.users,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
});

const offClient = createOpenFoodFactsClient({ baseUrl: env.OFF_API_BASE_URL, userAgent: env.OFF_USER_AGENT });
const searchService = createSearchService({ offClient, searches: db.searches });
const entitlementService = createEntitlementService({ subscriptions: db.subscriptions });

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const stripeService = createStripeService({
  stripe,
  priceId: env.STRIPE_PRICE_ID,
  successUrl: env.STRIPE_SUCCESS_URL,
  cancelUrl: env.STRIPE_CANCEL_URL,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
});
const webhookService = createWebhookService({ users: db.users, subscriptions: db.subscriptions });

const app = createApp({
  authService,
  searchService,
  entitlementService,
  stripeService,
  webhookService,
  db,
  corsOrigin: env.CORS_ORIGIN,
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
