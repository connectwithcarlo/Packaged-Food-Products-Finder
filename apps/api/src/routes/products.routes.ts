import { Router } from 'express';
import type { SearchService } from '../services/search.service';
import type { EntitlementService } from '../services/entitlement.service';
import type { AuthedRequest } from '../middleware/requireAuth';
import { parseLocale } from '../lib/locale';
import { asyncHandler } from '../middleware/asyncHandler';

export function createProductsRouter(searchService: SearchService, entitlementService: EntitlementService): Router {
  const router = Router();

  router.get(
    '/search',
    asyncHandler(async (req: AuthedRequest, res) => {
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (!query) {
        res.status(400).json({ error: 'MISSING_QUERY' });
        return;
      }
      const locale = parseLocale(req.query.lang);

      const results = await searchService.search({ query, locale, userId: req.userId! });
      res.json({ query, locale, results });
    }),
  );

  router.get(
    '/:code',
    asyncHandler(async (req: AuthedRequest, res) => {
      const locale = parseLocale(req.query.lang);
      const entitled = await entitlementService.isEntitled(req.userId!);

      const detail = await searchService.getProductDetail({ code: req.params.code, locale, entitled });
      if (!detail) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json({ ...detail, entitled });
    }),
  );

  return router;
}
