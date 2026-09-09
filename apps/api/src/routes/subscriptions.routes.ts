import { Router } from 'express';
import type { StripeService } from '../services/stripe.service';
import type { EntitlementService } from '../services/entitlement.service';
import type { Db } from '../lib/db';
import type { AuthedRequest } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/asyncHandler';

export function createSubscriptionsRouter(
  stripeService: StripeService,
  entitlementService: EntitlementService,
  db: Db,
): Router {
  const router = Router();

  router.post(
    '/checkout-session',
    asyncHandler(async (req: AuthedRequest, res) => {
      const user = await db.users.getById(req.userId!);
      if (!user) {
        res.status(401).json({ error: 'UNAUTHENTICATED' });
        return;
      }

      const customerId = await stripeService.ensureCustomer(user);
      if (customerId !== user.stripeCustomerId) {
        await db.users.setStripeCustomerId(user.id, customerId);
      }

      const url = await stripeService.createCheckoutSession(customerId);
      res.json({ url });
    }),
  );

  router.get(
    '/status',
    asyncHandler(async (req: AuthedRequest, res) => {
      const active = await entitlementService.isEntitled(req.userId!);
      res.json({ active });
    }),
  );

  return router;
}
