import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { AuthService } from './services/auth.service';
import type { SearchService } from './services/search.service';
import type { EntitlementService } from './services/entitlement.service';
import type { StripeService } from './services/stripe.service';
import type { WebhookService } from './services/webhook.service';
import type { Db } from './lib/db';
import { createAuthRouter } from './routes/auth.routes';
import { createProductsRouter } from './routes/products.routes';
import { createSearchesRouter } from './routes/searches.routes';
import { createSubscriptionsRouter } from './routes/subscriptions.routes';
import { createWebhooksRouter } from './routes/webhooks.routes';
import { requireAuth } from './middleware/requireAuth';
import { errorHandler } from './middleware/errorHandler';

export interface AppDeps {
  authService: AuthService;
  searchService: SearchService;
  entitlementService: EntitlementService;
  stripeService: StripeService;
  webhookService: WebhookService;
  db: Db;
  corsOrigin: string;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(cors({ origin: deps.corsOrigin, credentials: true }));
  app.use(cookieParser());

  // stripe webhook needs the raw body for signature verification
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), createWebhooksRouter(deps.stripeService, deps.webhookService));

  app.use(express.json());

  app.use('/api/auth', createAuthRouter(deps.authService, deps.db));
  app.use('/api/products', requireAuth(deps.authService), createProductsRouter(deps.searchService, deps.entitlementService));
  app.use('/api/searches', requireAuth(deps.authService), createSearchesRouter(deps.db));
  app.use(
    '/api/subscriptions',
    requireAuth(deps.authService),
    createSubscriptionsRouter(deps.stripeService, deps.entitlementService, deps.db),
  );

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use(errorHandler);

  return app;
}
