export type Locale = 'en' | 'nl' | 'de' | 'fr';

export interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  quantity?: string;
  nutriments?: Record<string, number>;
  [localizedField: string]: unknown; // product_name_nl, etc.
}

export interface NormalizedProduct {
  code: string;
  name: string | null; // null → UI shows localized "unnamed"
  brand: string | null;
  imageUrl: string | null;
  quantity: string | null;
}

export interface NutritionInfo {
  energyKcal100g: number | null;
  fat100g: number | null;
  carbohydrates100g: number | null;
  sugars100g: number | null;
  proteins100g: number | null;
  salt100g: number | null;
}

function localizedField(product: OFFProduct, baseField: string, locale: Locale): string | undefined {
  const localized = product[`${baseField}_${locale}`];
  return (typeof localized === 'string' && localized) || (product[baseField as keyof OFFProduct] as string | undefined);
}

export function normalizeProduct(product: OFFProduct, locale: Locale): NormalizedProduct {
  return {
    code: product.code,
    name: localizedField(product, 'product_name', locale) || null,
    brand: product.brands?.split(',')[0]?.trim() || null,
    imageUrl: product.image_front_url || null,
    quantity: product.quantity || null,
  };
}

function numOrNull(value: number | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

export function extractNutrition(product: OFFProduct): NutritionInfo | null {
  if (!product.nutriments) return null;

  const n = product.nutriments;
  return {
    energyKcal100g: numOrNull(n['energy-kcal_100g']),
    fat100g: numOrNull(n.fat_100g),
    carbohydrates100g: numOrNull(n.carbohydrates_100g),
    sugars100g: numOrNull(n.sugars_100g),
    proteins100g: numOrNull(n.proteins_100g),
    salt100g: numOrNull(n.salt_100g),
  };
}
