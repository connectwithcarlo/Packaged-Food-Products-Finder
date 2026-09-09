import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import messages from '../messages/en.json';

const replaceMock = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/products/123',
  useRouter: () => ({ replace: replaceMock }),
}));

function renderSwitcher() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

describe('LanguageSwitcher', () => {
  it('offers all four supported locales', () => {
    renderSwitcher();
    expect(screen.getByRole('option', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NL' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'DE' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'FR' })).toBeInTheDocument();
  });

  it('navigates to the same page with the newly selected locale', () => {
    renderSwitcher();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nl' } });

    expect(replaceMock).toHaveBeenCalledWith('/products/123', { locale: 'nl' });
  });
});
