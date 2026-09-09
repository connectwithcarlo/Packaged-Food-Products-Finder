import type { Locale } from '../services/product.mapper';

const SUPPORTED_LOCALES: Locale[] = ['en', 'nl', 'de', 'fr'];
const DEFAULT_LOCALE: Locale = 'en';

export function parseLocale(value: unknown): Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as string[]).includes(value) ? (value as Locale) : DEFAULT_LOCALE;
}
