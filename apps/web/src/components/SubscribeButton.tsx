'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/apiClient';

export function SubscribeButton({ active }: { active: boolean }) {
  const t = useTranslations('subscription');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (active) {
    return (
      <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
        {t('subscribedBadge')}
      </span>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {t('subscribeButton')}
      </button>
      {error && <p className="text-xs text-red-600">{tCommon('error')}</p>}
    </div>
  );
}
