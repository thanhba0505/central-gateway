'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  X,
  Loader2,
  ArrowRight,
  UserCheck,
  Database,
  RefreshCw,
} from 'lucide-react';
import { DevDbUser } from '@/lib/api';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: {
    username: string;
    email: string;
    name: string;
  }) => Promise<void> | void;
  appName?: string;
}

export function GoogleAccountChooserModal({
  isOpen,
  onClose,
  onSelectAccount,
  appName = 'Central Gateway',
}: GoogleAccountChooserModalProps) {
  const [dbUsers, setDbUsers] = useState<DevDbUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/proxy/auth/dev/users');
      if (res.ok) {
        const data = (await res.json()) as DevDbUser[];
        if (Array.isArray(data)) {
          setDbUsers(data);
          return;
        }
      }
      setDbUsers([]);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách tài khoản');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  if (!isOpen) return null;

  const handleSelect = async (account: { username: string; email: string; name: string }) => {
    setSelectingId(account.username);
    try {
      await onSelectAccount(account);
    } finally {
      setSelectingId(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const email = customEmail.trim().toLowerCase();
    const username = email.split('@')[0] ?? 'custom_user';
    const name = customName.trim() || username;

    await handleSelect({ username, email, name });
  };

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
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-none">
                Tài khoản CSDL (Local Dev)
              </h3>
              <p className="text-xs text-violet-200/70 mt-1">
                Chọn tài khoản trong DB để tiếp tục tới {appName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer disabled:opacity-40"
              title="Làm mới danh sách từ CSDL"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Account List */}
        <div className="py-4 space-y-2.5 max-h-[380px] overflow-y-auto">
          {isLoadingUsers && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-violet-300">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <span className="text-xs">Đang tải tài khoản từ Central Gateway DB...</span>
            </div>
          )}

          {!isLoadingUsers && fetchError && (
            <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-200 flex items-center justify-between">
              <span>{fetchError}</span>
              <button
                type="button"
                onClick={fetchUsers}
                className="underline hover:text-white font-medium cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {!isLoadingUsers &&
            dbUsers.map((user) => {
              const isAdmin = user.role === 'ADMIN';
              const initial = (user.username.slice(0, 2) || 'US').toUpperCase();
              const isSelected = selectingId === user.username;

              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={selectingId !== null}
                  onClick={() =>
                    handleSelect({
                      username: user.username,
                      email: user.email || `${user.username}@central-gateway.local`,
                      name: user.username,
                    })
                  }
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/25 transition-all text-left group active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        isAdmin ? 'bg-amber-600' : 'bg-purple-600'
                      } shrink-0 shadow-sm`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">
                          @{user.username}
                        </span>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-400/30">
                            <ShieldCheck className="h-3 w-3 text-amber-300" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-violet-200/80 border border-white/10">
                            <UserCheck className="h-3 w-3" />
                            USER
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-violet-200/60 truncate">
                        {user.email || 'Chưa liên kết email'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    {isSelected ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}

          {!isLoadingUsers && dbUsers.length === 0 && !fetchError && (
            <div className="py-6 text-center text-xs text-violet-200/60">
              Không tìm thấy tài khoản nào trong CSDL.
            </div>
          )}

          {/* Custom Account Option */}
          {!showCustomInput ? (
            <button
              type="button"
              disabled={selectingId !== null}
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/20 text-left hover:bg-white/[0.08] hover:border-white/40 text-violet-200/70 transition-all cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-white/80">
                Nhập tài khoản kiểm thử tùy chỉnh...
              </span>
            </button>
          ) : (
            <form
              onSubmit={handleCustomSubmit}
              className="space-y-2.5 p-4 rounded-2xl border border-white/15 bg-white/[0.04] animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">Tài khoản tùy chỉnh:</span>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Username hoặc Email (vd: test_admin)"
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
                disabled={selectingId !== null || !customEmail.trim()}
                className="w-full rounded-full bg-white text-[#2a0e4e] py-2 text-xs font-bold hover:bg-white/90 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {selectingId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Đăng nhập với tài khoản này'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-3 text-center">
          <p className="text-xs text-violet-200/50">
            Môi trường phát triển cục bộ • Trực tiếp từ CSDL Central Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
