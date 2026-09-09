import { Router } from 'express';
import type { Db } from '../lib/db';
import type { AuthedRequest } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/asyncHandler';

export function createSearchesRouter(db: Db): Router {
  const router = Router();

  router.get(
    '/recent',
    asyncHandler(async (req: AuthedRequest, res) => {
      const searches = await db.searches.listRecent(req.userId!);
      res.json({ searches });
    }),
  );

  return router;
}
