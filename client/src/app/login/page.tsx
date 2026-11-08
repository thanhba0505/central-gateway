'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // If this is an OAuth2 SSO login flow
      if (clientId && redirectUri) {
        const authorizeUrl = new URL('/api/proxy/auth/oauth/authorize', window.location.origin);
        authorizeUrl.searchParams.set('client_id', clientId);
        authorizeUrl.searchParams.set('redirect_uri', redirectUri);
        if (state) authorizeUrl.searchParams.set('state', state);
        if (codeChallenge) authorizeUrl.searchParams.set('code_challenge', codeChallenge);

        window.location.href = authorizeUrl.toString();
        return;
      }

      // Standard Gateway login redirect
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Child App SSO Scope Banner (if applicable) */}
        {clientId && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-purple-400/30 bg-white/10 px-4 py-1.5 text-xs text-purple-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            <span>
              Single Sign-On access for{' '}
              <strong className="font-semibold text-white capitalize">{clientId}</strong>
            </span>
          </div>
        )}

        <GlassCard className="p-8 sm:p-10 shadow-[0_12px_45px_rgba(88,28,135,0.4)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Login</h1>
            <p className="mt-2 text-xs text-violet-200/80">
              Welcome to the ThanhBa Ecosystem SSO Hub
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-center text-xs font-medium text-rose-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <GlassInput
              type="text"
              placeholder="Username"
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
              placeholder="Password"
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
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password recovery is managed by Central Gateway admin.')}
                className="font-medium text-white/80 hover:text-white hover:underline transition-colors"
              >
                Forgot password?
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
                Login
              </GlassButton>
            </div>

            {/* Register Link */}
            <div className="pt-2 text-center text-xs text-white/80">
              Don&apos;t have an account?{' '}
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
                Register
              </Link>
            </div>
          </form>
        </GlassCard>
      </div>
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
