import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SearchBar } from '@/components/SearchBar';
import messages from '../messages/en.json';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('SearchBar', () => {
  it('is a controlled input: it always reflects the value prop, however it changed', () => {
    const { rerender } = renderWithIntl(<SearchBar value="granola" onChange={vi.fn()} onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveValue('granola');

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SearchBar value="chocolate" onChange={vi.fn()} onSearch={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('searchbox')).toHaveValue('chocolate');
  });

  it('calls onSearch with the trimmed value on submit, but not for a blank value', () => {
    const onSearch = vi.fn();
    renderWithIntl(<SearchBar value="  granola  " onChange={vi.fn()} onSearch={onSearch} />);

    fireEvent.submit(screen.getByRole('searchbox').closest('form')!);

    expect(onSearch).toHaveBeenCalledWith('granola');
  });
});
