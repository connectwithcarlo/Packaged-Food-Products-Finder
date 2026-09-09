'use client';

import { useTranslations } from 'next-intl';
import type { NutritionInfo } from '@/lib/apiClient';

interface Props {
  nutrition: NutritionInfo | null;
  entitled: boolean;
}

export function ProductNutrition({ nutrition, entitled }: Props) {
  const t = useTranslations('product');

  if (!entitled) {
    return <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('subscribeToUnlock')}</p>;
  }

  if (!nutrition) {
    return <p className="text-sm text-neutral-500">{t('nutritionUnavailable')}</p>;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
      <NutritionRow label={t('energy')} value={nutrition.energyKcal100g} unit="kcal" />
      <NutritionRow label={t('fat')} value={nutrition.fat100g} unit="g" />
      <NutritionRow label={t('carbohydrates')} value={nutrition.carbohydrates100g} unit="g" />
      <NutritionRow label={t('sugars')} value={nutrition.sugars100g} unit="g" />
      <NutritionRow label={t('proteins')} value={nutrition.proteins100g} unit="g" />
      <NutritionRow label={t('salt')} value={nutrition.salt100g} unit="g" />
    </dl>
  );
}

function NutritionRow({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value === null ? '—' : `${value} ${unit}`}</dd>
    </>
  );
}
