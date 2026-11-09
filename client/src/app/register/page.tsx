'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from '@/i18n';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useTranslation();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(dict.auth.passwords_mismatch);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/proxy/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Redirect to login with previous params
      const loginUrl = new URL('/login', window.location.origin);
      if (clientId) loginUrl.searchParams.set('client_id', clientId);
      if (redirectUri) loginUrl.searchParams.set('redirect_uri', redirectUri);

      router.push(loginUrl.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Language Switcher Bar */}
        <div className="mb-4 flex items-center justify-between">
          {clientId ? (
            <div className="flex items-center gap-2 rounded-full border border-purple-400/30 bg-white/10 px-3.5 py-1 text-xs text-purple-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>{dict.auth.sso_scope_banner.replace('{client}', clientId)}</span>
            </div>
          ) : (
            <div />
          )}
          <LanguageSwitcher variant="toggle" />
        </div>

        <GlassCard className="p-8 sm:p-10 shadow-[0_12px_45px_rgba(88,28,135,0.4)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              {dict.auth.register_title}
            </h1>
            <p className="mt-2 text-xs text-violet-200/80">{dict.auth.register_subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-center text-xs font-medium text-rose-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              type="text"
              placeholder={dict.auth.field_username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              required
              autoComplete="username"
            />

            <GlassInput
              type="email"
              placeholder={dict.auth.field_email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              autoComplete="email"
            />

            <GlassInput
              type="password"
              placeholder={dict.auth.field_password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              required
              autoComplete="new-password"
            />

            <GlassInput
              type="password"
              placeholder={dict.auth.field_confirm_password}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              required
              autoComplete="new-password"
            />

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full text-base py-3.5"
              >
                {isLoading ? dict.auth.registering : dict.auth.register_btn}
              </GlassButton>
            </div>

            <div className="pt-2 text-center text-xs text-white/80">
              {dict.auth.has_account}{' '}
              <Link
                href={
                  clientId && redirectUri
                    ? `/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
                    : '/login'
                }
                className="font-bold text-white hover:underline transition-colors"
              >
                {dict.auth.login_link}
              </Link>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
