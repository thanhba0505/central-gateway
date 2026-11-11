'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Sparkles, ShieldAlert, LogOut, Database } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/i18n';
import { GoogleAccountChooserModal } from '@/components/google-account-chooser-modal';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading, refreshUser, loginWithGoogle, logout } = useAuth();
  const { dict } = useTranslation();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isClientDev, setIsClientDev] = useState(false);

  useEffect(() => {
    setIsClientDev(
      process.env.NODE_ENV !== 'production' &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.local')),
    );
  }, []);

  // Auto-redirect if already logged in as Admin
  useEffect(() => {
    if (!isAuthLoading && user && user.role === 'ADMIN' && !clientId) {
      router.replace(returnUrl);
    }
  }, [isAuthLoading, user, clientId, returnUrl, router]);

  const handleAuthSuccess = async (authUser: { role: string; username: string }) => {
    // If this is an OAuth2 SSO login flow for a client app (e.g. Wonderlab)
    if (clientId && redirectUri) {
      const authorizeUrl = new URL('/api/proxy/auth/oauth/authorize', window.location.origin);
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      if (state) authorizeUrl.searchParams.set('state', state);
      if (codeChallenge) authorizeUrl.searchParams.set('code_challenge', codeChallenge);

      window.location.href = authorizeUrl.toString();
      return;
    }

    // Direct access to Central Gateway Control Plane requires ADMIN role
    if (authUser.role !== 'ADMIN') {
      setError(
        dict.auth.no_admin_role_desc
          .replace('{username}', authUser.username)
          .replace('{role}', authUser.role),
      );
      return;
    }

    await refreshUser();
    router.push(returnUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/proxy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please verify your credentials.');
      }

      await handleAuthSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    if (!isClientDev) {
      setError(dict.auth.google_production_notice);
      return;
    }
    setIsGoogleChooserOpen(true);
  };

  const handleSelectAccount = async (account: {
    username: string;
    email: string;
    name: string;
  }) => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      // 1. Thử đăng nhập qua API chuẩn kèm devBypass
      const res = await fetch('/api/proxy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: account.username,
          password: '',
          devBypass: true,
          rememberMe: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setIsGoogleChooserOpen(false);
        await handleAuthSuccess(data.user);
        return;
      }

      // 2. Fallback sang Google login nếu là tài khoản custom không có trong DB
      const gRes = await loginWithGoogle({
        email: account.email.trim(),
        name: account.name,
        googleId: `google_${Date.now()}`,
      });

      setIsGoogleChooserOpen(false);
      await handleAuthSuccess(gRes.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.auth.google_fail);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
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
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              {dict.auth.title}
            </h1>
            <p className="mt-2 text-xs text-violet-200/80">
              {clientId ? dict.auth.subtitle_sso : dict.auth.subtitle_admin}
            </p>
          </div>

          {/* Current User Warning if logged in without admin role */}
          {user && user.role !== 'ADMIN' && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3.5 text-center text-xs text-amber-200 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-300 mb-1">
                <ShieldAlert className="h-4 w-4" />
                <span>{dict.auth.no_admin_role}</span>
              </div>
              <p className="leading-relaxed">
                {dict.auth.no_admin_role_desc
                  .replace('{username}', user.username)
                  .replace('{role}', user.role)}
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-white underline hover:text-amber-200"
              >
                <LogOut className="h-3 w-3" /> {dict.auth.logout_account}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-center text-xs font-medium text-rose-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Local Dev: Quick Login from DB */}
          {isClientDev && (
            <button
              type="button"
              onClick={() => setIsGoogleChooserOpen(true)}
              disabled={isLoading || isGoogleLoading}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 hover:border-amber-400/60 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Database className="h-4 w-4 text-amber-300" />
              Chọn tài khoản trong DB để test (Local Dev)
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <GlassInput
              type="text"
              placeholder={dict.auth.field_username_email}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              required
              autoComplete="username"
            />

            {/* Password Input */}
            <GlassInput
              type="password"
              placeholder={dict.auth.field_password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-5 w-5 text-white/70" />}
              iconPosition="right"
              required
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs text-white/90 px-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-white/15 text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="font-medium text-white/80 hover:text-white transition-colors">
                  {dict.auth.remember_me}
                </span>
              </label>

              <button
                type="button"
                onClick={() => alert(dict.auth.forgot_password_contact)}
                className="font-medium text-white/80 hover:text-white hover:underline transition-colors"
              >
                {dict.auth.forgot_password}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full text-base py-3.5"
              >
                {isLoading ? dict.auth.signing_in : dict.auth.sign_in_btn}
              </GlassButton>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#240b42] px-3 font-mono text-violet-300/70">
                {dict.common.or}
              </span>
            </div>
          </div>

          {/* Google Sign-in Option */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {isGoogleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{dict.auth.google_btn}</span>
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-white/80">
            {dict.auth.no_account}{' '}
            <Link
              href={
                clientId && redirectUri
                  ? `/register?client_id=${clientId}&redirect_uri=${encodeURIComponent(
                      redirectUri,
                    )}`
                  : '/register'
              }
              className="font-bold text-white hover:underline transition-colors"
            >
              {dict.auth.register_link}
            </Link>
          </div>
        </GlassCard>
      </div>

      {isClientDev && (
        <GoogleAccountChooserModal
          isOpen={isGoogleChooserOpen}
          onClose={() => setIsGoogleChooserOpen(false)}
          onSelectAccount={handleSelectAccount}
          appName={clientId === 'wonderlab' ? 'Wonderlab' : 'Central Gateway'}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
