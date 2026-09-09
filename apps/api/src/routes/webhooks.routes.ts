import { Router } from 'express';
import type { StripeService } from '../services/stripe.service';
import type { WebhookService } from '../services/webhook.service';
import { asyncHandler } from '../middleware/asyncHandler';

export function createWebhooksRouter(stripeService: StripeService, webhookService: WebhookService): Router {
  const router = Router();

  router.post(
    '/stripe',
    asyncHandler(async (req, res) => {
      const signature = req.headers['stripe-signature'];
      if (typeof signature !== 'string') {
        res.status(400).json({ error: 'MISSING_SIGNATURE' });
        return;
      }

      let event;
      try {
        event = stripeService.verifyWebhookEvent(req.body as Buffer, signature);
      } catch {
        res.status(400).json({ error: 'INVALID_SIGNATURE' });
        return;
      }

      await webhookService.handleEvent(event);
      res.status(200).json({ received: true });
    }),
  );

  return router;
}
