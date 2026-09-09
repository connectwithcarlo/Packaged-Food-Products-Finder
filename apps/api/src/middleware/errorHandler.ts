import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  const message = err instanceof Error ? err.message : '';
  if (message.startsWith('OFF_SEARCH_FAILED_') || message.startsWith('OFF_GET_FAILED_')) {
    res.status(502).json({ error: 'UPSTREAM_UNAVAILABLE' });
    return;
  }
  res.status(500).json({ error: 'INTERNAL_ERROR' });
}
