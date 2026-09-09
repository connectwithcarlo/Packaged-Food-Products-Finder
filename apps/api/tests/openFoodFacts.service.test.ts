import { describe, it, expect, vi } from 'vitest';
import { createOpenFoodFactsClient } from '../src/services/openFoodFacts.service';

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const CONFIG = { baseUrl: 'https://off.example', userAgent: 'test-agent' };

describe('openFoodFactsClient.searchProducts', () => {
  it('sends the query and returns the products array', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ products: [{ code: '1' }, { code: '2' }] }));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    const results = await client.searchProducts('granola', 1);

    expect(results).toEqual([{ code: '1' }, { code: '2' }]);
    const [calledUrl] = fetchFn.mock.calls[0];
    expect(calledUrl).toContain('granola');
  });

  it('returns an empty array when OFF responds without a products field', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    expect(await client.searchProducts('nothing-found', 1)).toEqual([]);
  });

  it('throws when Open Food Facts responds with an error status', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    await expect(client.searchProducts('granola', 1)).rejects.toThrow('OFF_SEARCH_FAILED_500');
  });

  it('retries transient 503 responses then returns products', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ products: [{ code: '9' }] }));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn, retryDelayMs: 0 });

    expect(await client.searchProducts('pizza', 1)).toEqual([{ code: '9' }]);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('gives up after repeated transient failures', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 503));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn, retryDelayMs: 0 });

    await expect(client.searchProducts('pizza', 1)).rejects.toThrow('OFF_SEARCH_FAILED_503');
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });
});

describe('openFoodFactsClient.getProductByCode', () => {
  it('returns the product when found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: 1, product: { code: '123' } }));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    expect(await client.getProductByCode('123')).toEqual({ code: '123' });
  });

  it('returns null when OFF reports status 0 (not found, but HTTP 200)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: 0 }));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    expect(await client.getProductByCode('missing')).toBeNull();
  });

  it('returns null on an HTTP 404', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    const client = createOpenFoodFactsClient({ ...CONFIG, fetchFn });

    expect(await client.getProductByCode('missing')).toBeNull();
  });
});
