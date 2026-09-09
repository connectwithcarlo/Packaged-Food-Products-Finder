'use client';

import { useTranslations } from 'next-intl';
import type { RecentSearch } from '@/lib/apiClient';

export function RecentSearches({ searches, onSelect }: { searches: RecentSearch[]; onSelect: (query: string) => void }) {
  const t = useTranslations('search');

  if (searches.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-neutral-500">{t('recentTitle')}:</span>
      {searches.map((search, index) => (
        <button
          key={`${search.query}-${index}`}
          onClick={() => onSelect(search.query)}
          className="rounded-full border border-neutral-300 px-3 py-1 text-neutral-700 hover:bg-neutral-100"
        >
          {search.query}
        </button>
      ))}
    </div>
  );
}
