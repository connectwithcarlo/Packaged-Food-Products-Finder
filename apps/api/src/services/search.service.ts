import type { Db } from '../lib/db';
import type { OpenFoodFactsClient } from './openFoodFacts.service';
import { normalizeProduct, extractNutrition, type Locale, type NormalizedProduct, type NutritionInfo } from './product.mapper';

export type SearchesDb = Pick<Db['searches'], 'record'>;

export interface SearchServiceConfig {
  offClient: OpenFoodFactsClient;
  searches: SearchesDb;
}

export interface SearchParams {
  query: string;
  locale: Locale;
  userId: string;
  page?: number;
}

export interface ProductDetailParams {
  code: string;
  locale: Locale;
  entitled: boolean;
}

export interface NormalizedProductDetail extends NormalizedProduct {
  nutrition: NutritionInfo | null;
}

function isUsable(product: NormalizedProduct): boolean {
  return product.name !== null || product.imageUrl !== null;
}

export function createSearchService({ offClient, searches }: SearchServiceConfig) {
  async function search({ query, locale, userId, page }: SearchParams): Promise<NormalizedProduct[]> {
    const rawResults = await offClient.searchProducts(query, page);
    const results = rawResults.map((product) => normalizeProduct(product, locale)).filter(isUsable);

    void searches.record(userId, query, locale); // fire-and-forget

    return results;
  }

  async function getProductDetail({ code, locale, entitled }: ProductDetailParams): Promise<NormalizedProductDetail | null> {
    const product = await offClient.getProductByCode(code);
    if (!product) return null;

    return {
      ...normalizeProduct(product, locale),
      nutrition: entitled ? extractNutrition(product) : null,
    };
  }

  return { search, getProductDetail };
}

export type SearchService = ReturnType<typeof createSearchService>;
