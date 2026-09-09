import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ProductNutrition } from '@/components/ProductNutrition';
import messages from '../messages/en.json';

const SAMPLE_NUTRITION = {
  energyKcal100g: 410,
  fat100g: 12,
  carbohydrates100g: 58,
  sugars100g: 18,
  proteins100g: 9,
  salt100g: 0.4,
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('ProductNutrition — entitlement gating', () => {
  it('shows an upsell message and no values when the caller is not entitled, even if nutrition data was passed in', () => {
    renderWithIntl(<ProductNutrition entitled={false} nutrition={SAMPLE_NUTRITION} />);

    expect(screen.getByText(messages.product.subscribeToUnlock)).toBeInTheDocument();
    expect(screen.queryByText('410 kcal')).not.toBeInTheDocument();
  });

  it('shows the nutrition values when the caller is entitled', () => {
    renderWithIntl(<ProductNutrition entitled nutrition={SAMPLE_NUTRITION} />);

    expect(screen.getByText('410 kcal')).toBeInTheDocument();
    expect(screen.getByText('12 g')).toBeInTheDocument();
    expect(screen.queryByText(messages.product.subscribeToUnlock)).not.toBeInTheDocument();
  });

  it('shows an "unavailable" message when entitled but Open Food Facts has no nutriments for this product', () => {
    renderWithIntl(<ProductNutrition entitled nutrition={null} />);

    expect(screen.getByText(messages.product.nutritionUnavailable)).toBeInTheDocument();
  });
});
