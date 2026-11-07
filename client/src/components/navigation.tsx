'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderGit2, Key, LayoutDashboard, Terminal, FlaskConical } from 'lucide-react';
import { api, SystemHealth } from '../lib/api';
import { KeyModal } from './key-modal';

export function Navigation() {
  const pathname = usePathname();
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
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 font-mono text-lg font-bold text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                G
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    Central Gateway
                  </span>
                  <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.2 font-mono text-[11px] text-cyan-400">
                    v0.1.0
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Platform Control Plane</span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800/90 text-cyan-400 border border-slate-700/60 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Health Status & Secret Key */}
          <div className="flex items-center gap-3">
            {/* Health Indicator */}
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.status === 'ok'
                    ? 'bg-emerald-500 animate-pulse'
                    : health === null
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline text-slate-300">
                {health?.status === 'ok'
                  ? 'Operational'
                  : health === null
                    ? 'Connecting...'
                    : 'Degraded'}
              </span>
              {health?.latencyMs !== undefined && (
                <span className="text-slate-500 text-[11px]">({health.latencyMs}ms)</span>
              )}
            </div>

            {/* Secret Key Modal Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              title="Configure Gateway Secret Key"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Key className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline font-mono">API Key</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex md:hidden border-t border-slate-800/80 bg-slate-900/40 px-4 py-2 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
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
