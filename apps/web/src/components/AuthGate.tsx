'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/AuthContext';
import { usePathname, useRouter } from '@/i18n/navigation';

const PUBLIC_PATHS = new Set(['/login']);

export function AuthGate({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.replace('/login');
    }
    if (!loading && user && pathname === '/login') {
      router.replace('/');
    }
  }, [loading, user, isPublicPath, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-neutral-500">
        {t('loading')}
      </div>
    );
  }

  if (!user && !isPublicPath) return null;

  return <>{children}</>;
}
