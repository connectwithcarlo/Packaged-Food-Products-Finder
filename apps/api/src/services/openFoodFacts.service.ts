import type { OFFProduct } from './product.mapper';

export interface OpenFoodFactsClientConfig {
  baseUrl: string;
  userAgent: string;
  fetchFn?: typeof fetch; // optional so tests can stub fetch
  /** Test-only: override retry delay (ms). Defaults to exponential backoff. */
  retryDelayMs?: number;
}

const SEARCH_PAGE_SIZE = 24;
const MAX_ATTEMPTS = 4;
const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createOpenFoodFactsClient({
  baseUrl,
  userAgent,
  fetchFn,
  retryDelayMs,
}: OpenFoodFactsClientConfig) {
  const doFetch = fetchFn ?? fetch;

  async function fetchOff(url: string): Promise<Response> {
    let last: Response | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const res = await doFetch(url, { headers: { 'User-Agent': userAgent } });
      last = res;
      if (res.ok || !TRANSIENT_STATUSES.has(res.status)) {
        return res;
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = retryDelayMs ?? 400 * 2 ** attempt;
        await sleep(delay);
      }
    }
    return last!;
  }

  async function searchProducts(query: string, page = 1): Promise<OFFProduct[]> {
    const url =
      `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
      `&json=1&page=${page}&page_size=${SEARCH_PAGE_SIZE}`;
    const res = await fetchOff(url);
    if (!res.ok) {
      throw new Error(`OFF_SEARCH_FAILED_${res.status}`);
    }
    const data = (await res.json()) as { products?: OFFProduct[] };
    return data.products ?? [];
  }

  async function getProductByCode(code: string): Promise<OFFProduct | null> {
    const url = `${baseUrl}/api/v2/product/${encodeURIComponent(code)}.json`;
    const res = await fetchOff(url);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`OFF_GET_FAILED_${res.status}`);
    }
    const data = (await res.json()) as { status: number; product?: OFFProduct };
    return data.status === 1 && data.product ? data.product : null;
  }

  return { searchProducts, getProductByCode };
}

export type OpenFoodFactsClient = ReturnType<typeof createOpenFoodFactsClient>;
