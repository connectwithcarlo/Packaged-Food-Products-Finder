'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function NavBar() {
  const t = useTranslations('app');
  const tAuth = useTranslations('auth');
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-neutral-900">
          {t('title')}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {user && (
            <button onClick={() => logout()} className="text-sm text-neutral-500 hover:text-neutral-900">
              {tAuth('logoutButton')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
