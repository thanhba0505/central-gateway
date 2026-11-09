'use client';

import React from 'react';

export function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.2.1';

  return (
    <footer className="shrink-0 z-20 border-t border-white/10 bg-[#120524]/80 py-3.5 sm:py-4 text-center font-mono text-xs text-violet-300/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 sm:flex-row sm:gap-2.5">
        <span>ThanhBa Ecosystem — Central Gateway SSO &amp; Platform Console</span>
        <span className="hidden sm:inline">•</span>
        <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-300/80">
          v{version}
        </span>
      </div>
    </footer>
  );
}
