'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, type ProductDetail } from '@/lib/apiClient';
import { ProductNutrition } from '@/components/ProductNutrition';
import { SubscribeButton } from '@/components/SubscribeButton';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; product: ProductDetail };

export default function ProductDetailPage() {
  const params = useParams<{ code: string }>();
  const locale = useLocale();
  const t = useTranslations('product');
  const tCommon = useTranslations('common');

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    api.getProduct(params.code, locale).then(
      (product) => {
        if (!cancelled) setState({ status: 'ready', product });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [params.code, locale]);

  if (state.status === 'loading') return <p className="text-sm text-neutral-500">{tCommon('loading')}</p>;
  if (state.status === 'error') return <p className="text-sm text-red-600">{tCommon('error')}</p>;

  const { product } = state;
  const name = product.name ?? t('unnamedProduct');

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="w-fit text-sm text-neutral-500 hover:text-neutral-900">
        &larr; {t('backToSearch')}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={name} className="h-full w-full object-contain p-3" />
          ) : (
            <span className="text-6xl" aria-hidden>
              🥫
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-neutral-900">{name}</h1>
          <p className="text-sm text-neutral-500">{product.brand ?? t('unknownBrand')}</p>
          {product.quantity && <p className="text-sm text-neutral-400">{product.quantity}</p>}
          <div className="mt-2">
            <SubscribeButton active={product.entitled} />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t('nutritionTitle')}</h2>
        <ProductNutrition nutrition={product.nutrition} entitled={product.entitled} />
      </section>
    </div>
  );
}
