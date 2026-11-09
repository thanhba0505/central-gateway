'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { Footer } from './footer';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const safePathname = pathname || '/';
  const isAuthPage = safePathname === '/login' || safePathname === '/register';

  return (
    <div className="relative z-10 flex h-screen h-[100dvh] flex-col overflow-hidden">
      {/* Header (Pinned Top) */}
      {!isAuthPage && <Navigation />}

      {/* Main Content Area (Bounded strictly between Header and Footer) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">{children}</div>

      {/* Footer (Pinned Bottom) */}
      <Footer />
    </div>
  );
}
