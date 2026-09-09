import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { asyncHandler } from '../src/middleware/asyncHandler';
import { errorHandler } from '../src/middleware/errorHandler';

function buildApp() {
  const app = express();
  app.get(
    '/boom',
    asyncHandler(async () => {
      throw new Error('upstream failed');
    }),
  );
  app.use(errorHandler);
  return app;
}

describe('asyncHandler', () => {
  it('forwards a rejected promise to the error-handling middleware instead of crashing the connection', async () => {
    const app = buildApp();

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('INTERNAL_ERROR');
  });
});
