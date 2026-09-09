'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function SubscriptionCancelPage() {
  const t = useTranslations('subscription');

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-3 pt-16 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">{t('cancelTitle')}</h1>
      <p className="text-sm text-neutral-600">{t('cancelMessage')}</p>
      <Link href="/" className="mt-2 text-sm font-medium text-neutral-900 underline">
        {t('backToApp')}
      </Link>
    </div>
  );
}
