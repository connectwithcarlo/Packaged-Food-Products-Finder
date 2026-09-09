import { describe, it, expect } from 'vitest';
import { createEntitlementService, type SubscriptionsDb } from '../src/services/entitlement.service';

function subscriptionsReturning(status: string | null): SubscriptionsDb {
  return {
    async findByUserId() {
      return status === null ? null : { status };
    },
  };
}

describe('entitlementService.isEntitled', () => {
  it('is true for an active subscription', async () => {
    const svc = createEntitlementService({ subscriptions: subscriptionsReturning('active') });
    expect(await svc.isEntitled('user-1')).toBe(true);
  });

  it('is true for a trialing subscription', async () => {
    const svc = createEntitlementService({ subscriptions: subscriptionsReturning('trialing') });
    expect(await svc.isEntitled('user-1')).toBe(true);
  });

  it('is false for a canceled subscription', async () => {
    const svc = createEntitlementService({ subscriptions: subscriptionsReturning('canceled') });
    expect(await svc.isEntitled('user-1')).toBe(false);
  });

  it('is false for a past_due subscription', async () => {
    const svc = createEntitlementService({ subscriptions: subscriptionsReturning('past_due') });
    expect(await svc.isEntitled('user-1')).toBe(false);
  });

  it('is false when the user has no subscription row at all', async () => {
    const svc = createEntitlementService({ subscriptions: subscriptionsReturning(null) });
    expect(await svc.isEntitled('user-1')).toBe(false);
  });
});
