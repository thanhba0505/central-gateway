'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/i18n';
import { GlassCard } from '@/components/ui/glass-card';

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const { dict } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    let mounted = true;

    async function handleExchange() {
      // 1. Check for Google OAuth id_token in URL hash (#id_token=...)
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const idToken = hashParams.get('id_token');
      const hashError = hashParams.get('error') || searchParams.get('error');

      if (hashError) {
        if (typeof window !== 'undefined' && window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_ERROR', error: hashError },
            window.location.origin,
          );
          window.close();
          return;
        }
        if (mounted) {
          setError(hashError);
          setStatus('failed');
        }
        return;
      }

      if (idToken) {
        if (typeof window !== 'undefined' && window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_SUCCESS', credential: idToken },
            window.location.origin,
          );
          window.close();
          return;
        }

        try {
          await loginWithGoogle({ credential: idToken });
          if (mounted) {
            setStatus('success');
            const returnUrl = searchParams.get('returnUrl') || '/';
            setTimeout(() => {
              router.push(returnUrl);
            }, 600);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err.message : dict.auth.google_fail);
            setStatus('failed');
          }
        }
        return;
      }

      if (mounted) {
        setError(dict.auth.google_fail);
        setStatus('failed');
      }
    }

    handleExchange();

    return () => {
      mounted = false;
    };
  }, [searchParams, loginWithGoogle, router, dict.auth.google_fail]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <GlassCard className="w-full max-w-md p-8">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-white" aria-hidden="true" />
            <h2 className="text-lg font-bold text-white">{dict.auth.google_connecting}</h2>
            <p className="text-xs text-white/70">{dict.auth.signing_in}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-white">{dict.auth.sign_in_btn}</h2>
            <p className="text-xs text-emerald-200">OK</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-white">{dict.auth.google_fail}</h2>
            <p className="text-xs text-rose-200 font-medium">{error}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-pointer"
              >
                {dict.auth.login_link}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden="true" />
        </div>
      }
    >
      <GoogleCallbackHandler />
    </Suspense>
  );
}
