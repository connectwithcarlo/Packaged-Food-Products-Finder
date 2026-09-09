import { defineRouting } from 'next-intl/routing';

export const SUPPORTED_LOCALES = ['en', 'nl', 'de', 'fr'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'en',
});
