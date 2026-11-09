'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderGit2,
  Key,
  LayoutDashboard,
  Terminal,
  FlaskConical,
  LogIn,
  LogOut,
} from 'lucide-react';
import { api, SystemHealth } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { KeyModal } from './key-modal';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        const res = await api.checkHealth();
        if (mounted) setHealth(res);
      } catch {
        if (mounted) {
          setHealth({ status: 'error', timestamp: new Date().toISOString() });
        }
      }
    };
    probe();
    const interval = setInterval(probe, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Projects & Routing', href: '/projects', icon: FolderGit2 },
    { name: 'Dispatch Logs', href: '/logs', icon: Terminal },
    { name: 'Sandbox Simulator', href: '/sandbox', icon: FlaskConical },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#140628]/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(16,3,32,0.5)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 font-mono text-lg font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.45)] transition-transform group-hover:scale-105">
                G
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-white transition-colors group-hover:text-purple-300">
                    Central Gateway
                  </span>
                  <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 font-mono text-[11px] text-purple-300">
                    v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.2.1'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-violet-300/60">
                  SSO IAM & Platform Hub
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden items-center gap-1.5 border-l border-white/15 pl-4 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'border border-white/30 bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                        : 'text-violet-200/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Health Status & Secret Key & SSO Login */}
          <div className="flex items-center gap-2.5">
            {/* Health Indicator */}
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-xs font-mono text-white backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.status === 'ok'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : health === null
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
              <span className="hidden sm:inline text-violet-100">
                {health?.status === 'ok'
                  ? 'Operational'
                  : health === null
                    ? 'Connecting...'
                    : 'Degraded'}
              </span>
              {health?.latencyMs !== undefined && (
                <span className="text-violet-300/60 text-[11px]">({health.latencyMs}ms)</span>
              )}
            </div>

            {/* Secret Key Modal Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              title="Configure Gateway Secret Key"
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-xs text-violet-200 backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15 hover:text-white"
            >
              <Key className="h-3.5 w-3.5 text-purple-300" />
              <span className="hidden sm:inline font-mono">API Key</span>
            </button>

            {/* User Session Profile & SSO Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs text-purple-200">
                  <span className="font-semibold text-purple-300">{user.role}</span>
                  <span className="text-white font-medium">@{user.username}</span>
                </div>
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs text-violet-200 hover:bg-white/20 hover:text-white transition-all active:scale-[0.98]"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-300" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#230b42] shadow-[0_0_18px_rgba(255,255,255,0.4)] transition-all hover:bg-white/95 hover:shadow-[0_0_24px_rgba(255,255,255,0.6)] active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex md:hidden border-t border-white/10 bg-[#140628]/80 px-4 py-2 gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                  isActive
                    ? 'border border-white/30 bg-white/20 text-white shadow-sm'
                    : 'text-violet-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      <KeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </>
  );
}
