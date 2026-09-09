import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/lib/AuthContext';
import { AuthGate } from '@/components/AuthGate';
import { NavBar } from '@/components/NavBar';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Food Product Finder',
  description: 'Search food products and view nutrition details.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body
        className="flex min-h-full flex-col bg-neutral-50 text-neutral-900"
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NavBar />
            <AuthGate>
              <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
            </AuthGate>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
