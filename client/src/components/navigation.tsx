'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderGit2,
  LayoutDashboard,
  Terminal,
  LogIn,
  LogOut,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Projects & Routing', href: '/projects', icon: FolderGit2 },
    { name: 'Dispatch Logs', href: '/logs', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[#140628]/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(16,3,32,0.5)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2 select-none py-1">
            <span className="text-lg font-black tracking-tight text-white transition-colors group-hover:text-purple-200">
              Central
            </span>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-indigo-200 transition-all">
              Gateway
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)] group-hover:scale-125 transition-transform" />
          </Link>

          {/* Desktop Navigation Tabs */}
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

        {/* Right Controls: User Account Tag with Dropdown */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs text-purple-200 backdrop-blur-md transition-all hover:border-purple-400/50 hover:bg-purple-500/25 active:scale-[0.98]"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="font-semibold text-purple-300">{user.role}</span>
                <span className="text-white font-medium">@{user.username}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-violet-300/80 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Account Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-[#180733]/95 p-2 shadow-[0_12px_45px_rgba(16,3,32,0.85)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Summary Header */}
                  <div className="px-3 py-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-xs font-semibold text-white">
                          @{user.username}
                        </p>
                        <p className="truncate text-[11px] text-violet-300/70">
                          {user.email || 'Admin Profile'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span className="font-mono text-[10px] text-emerald-300">
                        Role: {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all active:scale-[0.98]"
                    >
                      <LogOut className="h-4 w-4 text-rose-400" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
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

      {/* Mobile Navigation Links */}
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
  );
}
