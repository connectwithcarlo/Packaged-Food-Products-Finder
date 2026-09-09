'use client';

import type { ChangeEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { SUPPORTED_LOCALES } from '@/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: event.target.value });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600">
      <span className="sr-only">{t('label')}</span>
      <select
        aria-label={t('label')}
        value={locale}
        onChange={handleChange}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
