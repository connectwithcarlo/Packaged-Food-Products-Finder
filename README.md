# Packaged Food Products Finder

Search packaged food via [Open Food Facts](https://world.openfoodfacts.org). UI in English, Dutch, German, and French. Nutrition details are locked behind a Stripe subscription.

## Stack

- Web: Next.js (App Router), React, TypeScript, Tailwind, next-intl
- API: Express, TypeScript, Prisma, MySQL
- External: Open Food Facts, Stripe Checkout + webhooks (test mode)

## Setup

**Need:** Node 20+, a MySQL database, and (for subscribe flow) a Stripe test account.

### API

1. `cd apps/api`
2. `npm install`
3. `cp .env.example .env` — then fill `DATABASE_URL`, `JWT_SECRET`, Stripe keys, etc.
4. `npm run prisma:migrate`
5. `npm run prisma:seed` — demo user from `DEMO_USER_*` in `.env`
6. `npm run dev` — http://localhost:4000

### Web

1. `cd apps/web`
2. `npm install`
3. `cp .env.local.example .env.local`
4. `npm run dev` — http://localhost:3000

Open http://localhost:3000, log in with the seeded demo user (`demo@example.com` / `DemoPass123!` by default) or register.

### Stripe webhooks (local)

Run: `stripe listen --forward-to localhost:4000/api/webhooks/stripe`

Put the `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `apps/api/.env`.

## Tests

- API: `cd apps/api` then `npm test`
- Web: `cd apps/web` then `npm test`

API tests use an in-memory fake DB (no MySQL/Stripe/OFF needed). They cover auth, search, entitlement, and the checkout → webhook → unlock path. Web tests cover the nutrition gate UI, language switcher, and search bar.

## Technical decisions

- **Separate api + web apps.** The backend is Express + Prisma on purpose, so integrations and access control stay in one place instead of mixed into Next.js routes.
- **One `Db` helper + injectable deps.** Services take `users` / `searches` / `subscriptions` (from `lib/db.ts`), Stripe, and OFF fetch as arguments. Production wires Prisma; tests pass fakes.
- **Nutrition gated on the server.** If the user isn't subscribed, `getProductDetail` returns `nutrition: null`. The UI hides it too, but the data never leaves the API.
- **Auth via httpOnly JWT cookie.** No session store. `requireAuth` checks the cookie on protected routes. Demo user is seeded; self-registration is also supported.
- **Stripe webhook uses raw body.** Mounted with `express.raw()` before `express.json()` in `app.ts`, otherwise signature verification breaks.
- **`asyncHandler` on async routes.** Express 4 doesn't catch rejected promises; without this, an OFF 503 was resetting the connection instead of returning a proper error.
- **Auth errors are mapped deliberately.** Known cases (wrong password, email taken, weak password) get specific status codes. Anything else becomes a generic 500 so internals don't leak.

## Internationalization

- UI copy lives in `apps/web/messages/{en,nl,de,fr}.json` via next-intl.
- Routes are locale-prefixed (`/en/...`, `/nl/...`, …). Language is picked manually with a `<select>` — no browser auto-detect.
- Product names use OFF locale fields (`product_name_nl`, etc.), then fall back to `product_name`, then `null` so the UI can show a translated "Unnamed product".
- Nutrient labels are translated; numbers stay as OFF returns them (per 100g).

## Known limitations

- OFF translations are incomplete for many products; fallback is intentional.
- OFF public API can 503 / rate-limit under heavy use. We surface a generic error instead of crashing.
- Full Stripe Checkout needs real test keys (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`) in `.env`. Webhook handling is covered by tests with Stripe’s local signature helper.
- No password reset, email verify, or OAuth — out of scope.
- Recent searches: last 10 per user, no delete/pagination.
- No rate limiting / CDN / CI — out of scope for this project.
