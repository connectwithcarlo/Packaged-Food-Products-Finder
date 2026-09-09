import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 won't catch async rejections — pass them to next().
export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
