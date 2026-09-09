'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
}

export function SearchBar({ value, onChange, onSearch }: Props) {
  const t = useTranslations('search');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={t('placeholder')}
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        {t('button')}
      </button>
    </form>
  );
}
