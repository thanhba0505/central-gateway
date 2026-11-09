'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, X, Loader2, ArrowRight } from 'lucide-react';

export interface DevAccount {
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  badge: string;
  avatarBg: string;
  avatarText: string;
}

const PRESET_ACCOUNTS: DevAccount[] = [
  {
    name: 'Quản trị viên Hệ thống',
    email: 'admin@wonderlab.local',
    role: 'ADMIN',
    badge: 'ADMIN',
    avatarBg: 'bg-violet-600',
    avatarText: 'AD',
  },
  {
    name: 'Nhà nghiên cứu Wonderlab',
    email: 'researcher@wonderlab.local',
    role: 'USER',
    badge: 'RESEARCHER',
    avatarBg: 'bg-emerald-600',
    avatarText: 'RS',
  },
  {
    name: 'Sinh viên Thực nghiệm',
    email: 'student@wonderlab.local',
    role: 'USER',
    badge: 'STUDENT',
    avatarBg: 'bg-blue-600',
    avatarText: 'ST',
  },
];

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name: string }) => Promise<void> | void;
  appName?: string;
}

export function GoogleAccountChooserModal({
  isOpen,
  onClose,
  onSelectAccount,
  appName = 'Central Gateway',
}: GoogleAccountChooserModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectingEmail, setSelectingEmail] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<DevAccount[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('central_gateway_dev_accounts');
      if (stored) {
        const parsed = JSON.parse(stored) as DevAccount[];
        setSavedAccounts(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  const handleSelect = async (account: { email: string; name: string }) => {
    setSelectingEmail(account.email);
    try {
      await onSelectAccount(account);
    } finally {
      setSelectingEmail(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const email = customEmail.trim().toLowerCase();
    const name = customName.trim() || (email.split('@')[0] ?? 'User');

    const isPreset = PRESET_ACCOUNTS.some((p) => p.email === email);
    if (!isPreset && !savedAccounts.some((s) => s.email === email)) {
      const newAcc: DevAccount = {
        name,
        email,
        role: 'USER',
        badge: 'CUSTOM',
        avatarBg: 'bg-amber-600',
        avatarText: (name.slice(0, 2) || 'US').toUpperCase(),
      };
      const updated = [newAcc, ...savedAccounts].slice(0, 5);
      setSavedAccounts(updated);
      try {
        localStorage.setItem('central_gateway_dev_accounts', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    await handleSelect({ email, name });
  };

  const allAccounts = [
    ...PRESET_ACCOUNTS,
    ...savedAccounts.filter((s) => !PRESET_ACCOUNTS.some((p) => p.email === s.email)),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#160728]/95 p-6 shadow-[0_25px_70px_rgba(88,28,135,0.5)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
            <div>
              <h3 className="font-bold text-sm text-white leading-none">Đăng nhập bằng Google</h3>
              <p className="text-xs text-violet-200/70 mt-1">
                Chọn tài khoản để tiếp tục tới {appName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Account List */}
        <div className="py-4 space-y-2.5 max-h-[380px] overflow-y-auto">
          {allAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={selectingEmail !== null}
              onClick={() => handleSelect({ email: acc.email, name: acc.name })}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/25 transition-all text-left group active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${acc.avatarBg} shrink-0 shadow-sm`}
                >
                  {acc.avatarText}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm truncate">{acc.name}</span>
                    {acc.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-400/30">
                        <ShieldCheck className="h-3 w-3 text-amber-300" />
                        ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-violet-200/80 border border-white/10">
                        {acc.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-violet-200/60 truncate">{acc.email}</p>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                {selectingEmail === acc.email ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </button>
          ))}

          {/* Custom Account Form */}
          {!showCustomInput ? (
            <button
              type="button"
              disabled={selectingEmail !== null}
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/20 text-left hover:bg-white/[0.08] hover:border-white/40 text-violet-200/70 transition-all cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-white/80">
                Sử dụng một tài khoản khác...
              </span>
            </button>
          ) : (
            <form
              onSubmit={handleCustomSubmit}
              className="space-y-2.5 p-4 rounded-2xl border border-white/15 bg-white/[0.04] animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">
                  Tài khoản kiểm thử tùy chỉnh:
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <input
                type="email"
                required
                placeholder="Email Google (ví dụ: test@wonderlab.local)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Tên hiển thị (Tùy chọn)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={selectingEmail !== null || !customEmail.trim()}
                className="w-full rounded-full bg-white text-[#2a0e4e] py-2 text-xs font-bold hover:bg-white/90 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {selectingEmail ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Đăng nhập với email này'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-3 text-center">
          <p className="text-xs text-violet-200/50">
            Môi trường phát triển cục bộ • Tự động đồng bộ với Wonderlab
          </p>
        </div>
      </div>
    </div>
  );
}
