'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/i18n';
import { GlassCard } from './ui/glass-card';
import { GlassButton } from './ui/glass-button';
import { IntroScreen } from './intro-screen';

const PUBLIC_PATHS = ['/login', '/register', '/health'];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { dict } = useTranslation();
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  const safePathname = pathname || '/';
  const isPublic = PUBLIC_PATHS.some((p) => safePathname === p || safePathname.startsWith('/api/'));

  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);

    if (user && user.role === 'ADMIN') {
      // If user is already authenticated as ADMIN and currently on login/register, route to dashboard
      if (safePathname === '/login' || safePathname === '/register') {
        router.replace('/');
      }
    } else if (!isPublic) {
      // Unauthenticated non-admin accessing protected dashboard -> route to login
      router.replace(`/login?returnUrl=${encodeURIComponent(safePathname)}`);
    }
  }, [user, isPublic, safePathname, router]);

  useEffect(() => {
    if (isIntroComplete && !isLoading && !user && !isPublic) {
      router.replace(`/login?returnUrl=${encodeURIComponent(safePathname)}`);
    }
  }, [isIntroComplete, isLoading, user, isPublic, safePathname, router]);

  return (
    <>
      {/* Intro Splash Screen Overlay */}
      {!isIntroComplete && <IntroScreen onComplete={handleIntroComplete} />}

      {/* Main App Content Flow */}
      {isPublic ? (
        children
      ) : isLoading ? (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-400/20 border-t-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
            <span className="font-mono text-xs text-violet-200/80">
              {dict.admin_guard.authenticating}
            </span>
          </div>
        </div>
      ) : !user ? (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400/20 border-t-purple-400" />
            <p className="text-xs text-violet-200/70 font-mono">{dict.admin_guard.redirecting}</p>
          </div>
        </div>
      ) : user.role !== 'ADMIN' ? (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-[480px]">
            <GlassCard className="p-8 sm:p-10 text-center border-rose-500/30 shadow-[0_12px_45px_rgba(244,63,94,0.25)]">
              {/* Warning Icon Badge */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
                <ShieldAlert className="h-8 w-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-rose-300" />
                <span>{dict.admin_guard.required_admin_badge}</span>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                {dict.admin_guard.restricted_title}
              </h1>

              <p className="mt-3 text-xs leading-relaxed text-violet-200/80">
                {dict.admin_guard.restricted_desc}
              </p>

              {/* Account Info Pill */}
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-left font-mono text-xs backdrop-blur-md">
                <div className="flex items-center justify-between py-1 border-b border-white/10">
                  <span className="text-violet-300/60">{dict.admin_guard.account_label}</span>
                  <span className="font-semibold text-white">@{user.username}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/10">
                  <span className="text-violet-300/60">{dict.admin_guard.email_label}</span>
                  <span className="text-white/80">{user.email || dict.admin_guard.not_linked}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-violet-300/60">{dict.admin_guard.role_label}</span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3">
                <GlassButton
                  variant="primary"
                  onClick={() => logout()}
                  className="w-full gap-2 py-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{dict.admin_guard.switch_account_btn}</span>
                </GlassButton>

                <a
                  href={process.env.NEXT_PUBLIC_WONDERLAB_URL || 'http://localhost:4200'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 py-2.5 text-xs font-semibold text-violet-200 transition-all hover:bg-white/20 hover:text-white"
                >
                  <span>{dict.admin_guard.back_to_wonderlab}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}
