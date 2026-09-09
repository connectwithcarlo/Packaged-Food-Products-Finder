'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { RecentSearches } from '@/components/RecentSearches';
import { api, type NormalizedProduct, type RecentSearch } from '@/lib/apiClient';

export default function SearchPage() {
  const locale = useLocale();
  const t = useTranslations('search');
  const tCommon = useTranslations('common');

  const [results, setResults] = useState<NormalizedProduct[] | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .recentSearches()
      .then(({ searches }) => setRecent(searches))
      .catch(() => {});
  }, []);

  async function runSearch(query: string) {
    setLastQuery(query);
    setLoading(true);
    setError(false);
    try {
      const { results } = await api.search(query, locale);
      setResults(results);
      try {
        const { searches } = await api.recentSearches();
        setRecent(searches);
      } catch {
        // keep existing recent list
      }
    } catch {
      setError(true);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar value={lastQuery} onChange={setLastQuery} onSearch={runSearch} />
      <RecentSearches searches={recent} onSelect={runSearch} />

      {loading && <p className="text-sm text-neutral-500">{t('loading')}</p>}
      {error && <p className="text-sm text-red-600">{tCommon('error')}</p>}
      {!loading && !error && results !== null && results.length === 0 && (
        <p className="text-sm text-neutral-500">{t('noResults')}</p>
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.code} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
