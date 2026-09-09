import { describe, it, expect } from 'vitest';
import { normalizeProduct, extractNutrition, type OFFProduct } from '../src/services/product.mapper';

describe('normalizeProduct', () => {
  it('uses the locale-specific name when present', () => {
    const product: OFFProduct = { code: '123', product_name: 'Granola', product_name_nl: 'Granola NL' };
    expect(normalizeProduct(product, 'nl').name).toBe('Granola NL');
  });

  it('falls back to the default name when no locale-specific name exists', () => {
    const product: OFFProduct = { code: '123', product_name: 'Granola' };
    expect(normalizeProduct(product, 'de').name).toBe('Granola');
  });

  it('returns a null name (not an English placeholder) when no name exists in any language, so the frontend can localize the fallback text', () => {
    const product: OFFProduct = { code: '123' };
    expect(normalizeProduct(product, 'en').name).toBeNull();
  });

  it('takes only the first brand when multiple are comma-separated', () => {
    const product: OFFProduct = { code: '123', brands: 'Bjorg, Bio Village' };
    expect(normalizeProduct(product, 'en').brand).toBe('Bjorg');
  });

  it('returns a null brand when none is provided', () => {
    const product: OFFProduct = { code: '123' };
    expect(normalizeProduct(product, 'en').brand).toBeNull();
  });

  it('returns a null image when none is provided, instead of an empty string', () => {
    const product: OFFProduct = { code: '123' };
    expect(normalizeProduct(product, 'en').imageUrl).toBeNull();
  });
});

describe('extractNutrition', () => {
  it('returns null when the product has no nutriments at all', () => {
    const product: OFFProduct = { code: '123' };
    expect(extractNutrition(product)).toBeNull();
  });

  it('maps known nutriment fields to the app shape', () => {
    const product: OFFProduct = {
      code: '123',
      nutriments: {
        'energy-kcal_100g': 410,
        fat_100g: 12.5,
        carbohydrates_100g: 58,
        sugars_100g: 18,
        proteins_100g: 9,
        salt_100g: 0.4,
      },
    };

    expect(extractNutrition(product)).toEqual({
      energyKcal100g: 410,
      fat100g: 12.5,
      carbohydrates100g: 58,
      sugars100g: 18,
      proteins100g: 9,
      salt100g: 0.4,
    });
  });

  it('reports individual missing fields as null rather than dropping the whole object', () => {
    const product: OFFProduct = { code: '123', nutriments: { fat_100g: 12.5 } };

    expect(extractNutrition(product)).toEqual({
      energyKcal100g: null,
      fat100g: 12.5,
      carbohydrates100g: null,
      sugars100g: null,
      proteins100g: null,
      salt100g: null,
    });
  });
});
