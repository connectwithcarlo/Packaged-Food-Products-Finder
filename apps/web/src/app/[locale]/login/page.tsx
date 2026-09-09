'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/AuthContext';
import { ApiError } from '@/lib/apiClient';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const t = useTranslations('auth');
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrorKey(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      // AuthGate redirects after login/register
    } catch (err) {
      setErrorKey(err instanceof ApiError ? err.message : 'UNKNOWN_ERROR');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 pt-12">
      <h1 className="text-xl font-semibold text-neutral-900">{mode === 'login' ? t('loginTitle') : t('registerTitle')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('emailLabel')}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('passwordLabel')}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {errorKey && <p className="text-sm text-red-600">{t(`errors.${errorKey}` as 'errors.UNKNOWN_ERROR')}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {mode === 'login' ? t('loginButton') : t('registerButton')}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setErrorKey(null);
        }}
        className="text-sm text-neutral-500 underline hover:text-neutral-900"
      >
        {mode === 'login' ? t('toggleToRegister') : t('toggleToLogin')}
      </button>

      <p className="text-xs text-neutral-400">{t('demoHint')}</p>
    </div>
  );
}
