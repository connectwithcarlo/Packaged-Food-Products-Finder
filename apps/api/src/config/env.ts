import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().min(1),

  OFF_API_BASE_URL: z.string().url(),
  OFF_USER_AGENT: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_ID: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url(),
  STRIPE_CANCEL_URL: z.string().url(),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be a long random string'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  DEMO_USER_EMAIL: z.string().email(),
  DEMO_USER_PASSWORD: z.string().min(8),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration — see above for details.');
  }
  return result.data;
}
