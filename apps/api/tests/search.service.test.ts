import { describe, it, expect, vi } from 'vitest';
import { createSearchService, type SearchesDb } from '../src/services/search.service';
import type { OpenFoodFactsClient } from '../src/services/openFoodFacts.service';

function fakeOffClient(overrides: Partial<OpenFoodFactsClient> = {}): OpenFoodFactsClient {
  return {
    searchProducts: vi.fn().mockResolvedValue([]),
    getProductByCode: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function fakeSearches(): SearchesDb & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async record(userId, query, locale) {
      calls.push({ userId, query, locale });
    },
  };
}

describe('searchService.search', () => {
  it('normalizes results for the given locale', async () => {
    const offClient = fakeOffClient({
      searchProducts: vi.fn().mockResolvedValue([{ code: '1', product_name_nl: 'Muesli NL', product_name: 'Muesli' }]),
    });
    const searches = fakeSearches();
    const service = createSearchService({ offClient, searches });

    const results = await service.search({ query: 'muesli', locale: 'nl', userId: 'user-1' });

    expect(results).toEqual([{ code: '1', name: 'Muesli NL', brand: null, imageUrl: null, quantity: null }]);
  });

  it('drops entries that have neither a usable name nor an image', async () => {
    const offClient = fakeOffClient({
      searchProducts: vi.fn().mockResolvedValue([
        { code: 'good', product_name: 'Real Product' },
        { code: 'bad' },
      ]),
    });
    const service = createSearchService({ offClient, searches: fakeSearches() });

    const results = await service.search({ query: 'x', locale: 'en', userId: 'user-1' });

    expect(results.map((r) => r.code)).toEqual(['good']);
  });

  it('records the search for the requesting user', async () => {
    const offClient = fakeOffClient();
    const searches = fakeSearches();
    const service = createSearchService({ offClient, searches });

    await service.search({ query: 'granola', locale: 'fr', userId: 'user-42' });

    expect(searches.calls).toEqual([{ userId: 'user-42', query: 'granola', locale: 'fr' }]);
  });
});

describe('searchService.getProductDetail', () => {
  it('includes nutrition when the caller is entitled', async () => {
    const offClient = fakeOffClient({
      getProductByCode: vi.fn().mockResolvedValue({
        code: '123',
        product_name: 'Granola',
        nutriments: { fat_100g: 12.5 },
      }),
    });
    const service = createSearchService({ offClient, searches: fakeSearches() });

    const detail = await service.getProductDetail({ code: '123', locale: 'en', entitled: true });

    expect(detail?.nutrition?.fat100g).toBe(12.5);
  });

  it('omits nutrition when the caller is not entitled', async () => {
    const offClient = fakeOffClient({
      getProductByCode: vi.fn().mockResolvedValue({
        code: '123',
        product_name: 'Granola',
        nutriments: { fat_100g: 12.5 },
      }),
    });
    const service = createSearchService({ offClient, searches: fakeSearches() });

    const detail = await service.getProductDetail({ code: '123', locale: 'en', entitled: false });

    expect(detail?.nutrition).toBeNull();
  });

  it('returns null when the product does not exist', async () => {
    const offClient = fakeOffClient({ getProductByCode: vi.fn().mockResolvedValue(null) });
    const service = createSearchService({ offClient, searches: fakeSearches() });

    expect(await service.getProductDetail({ code: 'missing', locale: 'en', entitled: true })).toBeNull();
  });
});
