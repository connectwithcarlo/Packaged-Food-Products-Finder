const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, code: string) {
    super(code);
  }
}

export interface User {
  id: string;
  email: string;
}

export interface NormalizedProduct {
  code: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  quantity: string | null;
}

export interface NutritionInfo {
  energyKcal100g: number | null;
  fat100g: number | null;
  carbohydrates100g: number | null;
  sugars100g: number | null;
  proteins100g: number | null;
  salt100g: number | null;
}

export interface ProductDetail extends NormalizedProduct {
  nutrition: NutritionInfo | null;
  entitled: boolean;
}

export interface RecentSearch {
  query: string;
  locale: string;
  createdAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'UNKNOWN_ERROR');
  }
  return body as T;
}

export const api = {
  register: (email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: User }>('/api/auth/me'),

  search: (query: string, locale: string) =>
    apiFetch<{ query: string; locale: string; results: NormalizedProduct[] }>(
      `/api/products/search?q=${encodeURIComponent(query)}&lang=${locale}`,
    ),
  getProduct: (code: string, locale: string) => apiFetch<ProductDetail>(`/api/products/${encodeURIComponent(code)}?lang=${locale}`),
  recentSearches: () => apiFetch<{ searches: RecentSearch[] }>('/api/searches/recent'),

  createCheckoutSession: () => apiFetch<{ url: string }>('/api/subscriptions/checkout-session', { method: 'POST' }),
  subscriptionStatus: () => apiFetch<{ active: boolean }>('/api/subscriptions/status'),
};
