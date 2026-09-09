'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { NormalizedProduct } from '@/lib/apiClient';

export function ProductCard({ product }: { product: NormalizedProduct }) {
  const t = useTranslations('product');
  const name = product.name ?? t('unnamedProduct');

  return (
    <Link
      href={`/products/${encodeURIComponent(product.code)}`}
      className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="flex h-36 items-center justify-center bg-neutral-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={name} className="h-full w-full object-contain p-2" />
        ) : (
          <span className="text-4xl" aria-hidden>
            🥫
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-neutral-900">{name}</p>
        <p className="text-xs text-neutral-500">{product.brand ?? t('unknownBrand')}</p>
        {product.quantity && <p className="text-xs text-neutral-400">{product.quantity}</p>}
      </div>
    </Link>
  );
}
