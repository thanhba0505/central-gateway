'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { AdminGuard } from '@/components/admin-guard';
import { api, UserItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/i18n';

function UsersManagementContent() {
  const { user: currentAdmin } = useAuth();
  const { dict } = useTranslation();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: roleFilter,
      });
      setUsers(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalUsers(res.total);
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleStatus = async (targetUser: UserItem) => {
    if (currentAdmin && targetUser.id === currentAdmin.id) {
      setNotice({ type: 'error', message: dict.users.self_warning });
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    setUpdatingId(targetUser.id);
    try {
      const newStatus = !targetUser.isActive;
      await api.updateUserStatus(targetUser.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u)),
      );
      setNotice({ type: 'success', message: dict.users.update_success });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.users.update_failed;
      setNotice({ type: 'error', message: msg });
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeRole = async (targetUser: UserItem, nextRole: 'ADMIN' | 'USER') => {
    if (currentAdmin && targetUser.id === currentAdmin.id && nextRole !== 'ADMIN') {
      setNotice({ type: 'error', message: dict.users.self_warning });
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    setUpdatingId(targetUser.id);
    try {
      await api.updateUserRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u)));
      setNotice({ type: 'success', message: dict.users.update_success });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.users.update_failed;
      setNotice({ type: 'error', message: msg });
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{dict.users.badge}</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {dict.users.title}
          </h1>
          <p className="mt-1 text-sm text-violet-200/70">{dict.users.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-2xl border p-4 text-xs font-medium shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
            notice.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <GlassCard className="mb-6 p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/60" />
            <input
              type="text"
              placeholder={dict.users.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/20 bg-white/[0.08] py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:border-purple-400 focus:bg-white/[0.14] focus:outline-none focus:ring-4 focus:ring-purple-400/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-white/20 bg-[#1e0a38] px-4 py-2 font-mono text-xs text-white focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20"
            >
              <option value="all">{dict.users.all_roles}</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>

            <button
              type="submit"
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-[#230b42] shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              {dict.common.search}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.04] font-mono uppercase tracking-wider text-violet-300/80">
              <tr>
                <th className="px-6 py-4">{dict.auth.field_username}</th>
                <th className="px-6 py-4">{dict.auth.field_email}</th>
                <th className="px-6 py-4">{dict.users.role}</th>
                <th className="px-6 py-4 text-center">{dict.users.status}</th>
                <th className="px-6 py-4 text-right">{dict.users.created_at}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-violet-300/60">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{dict.common.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Users className="mx-auto h-10 w-10 text-violet-400/30" />
                    <p className="mt-3 text-sm font-semibold text-white">{dict.users.no_users}</p>
                    <p className="mt-1 text-xs text-violet-200/50">{dict.users.no_users_desc}</p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrent = currentAdmin && item.id === currentAdmin.id;
                  const isRowUpdating = updatingId === item.id;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-white/[0.03]">
                      {/* Username */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-purple-500/20 to-indigo-500/10 font-bold text-purple-200">
                            {item.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>@{item.username}</span>
                              {isCurrent && (
                                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-mono text-[9px] text-purple-300">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-violet-300/50">
                              id: {item.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email (Read-Only) */}
                      <td className="px-6 py-4 font-mono text-violet-200/80">
                        {item.email || (
                          <span className="text-violet-300/40 italic">Chưa liên kết email</span>
                        )}
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={item.role}
                          disabled={isCurrent || isRowUpdating}
                          onChange={(e) =>
                            handleChangeRole(item, e.target.value as 'ADMIN' | 'USER')
                          }
                          className={`rounded-xl border border-white/20 px-3 py-1.5 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all ${
                            item.role === 'ADMIN'
                              ? 'bg-purple-900/60 text-purple-200 border-purple-400/40'
                              : 'bg-white/[0.08] text-violet-200'
                          } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-white/40'}`}
                        >
                          <option value="USER" className="bg-[#1e0a38] text-white">
                            USER
                          </option>
                          <option value="ADMIN" className="bg-[#1e0a38] text-purple-300">
                            ADMIN
                          </option>
                        </select>
                      </td>

                      {/* Status Switch Toggle */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.isActive}
                            disabled={isCurrent || isRowUpdating}
                            onClick={() => handleToggleStatus(item)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              item.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                            } ${isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title={
                              isCurrent
                                ? dict.users.self_warning
                                : item.isActive
                                  ? dict.users.inactive
                                  : dict.users.active
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                item.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`font-mono text-[11px] ${
                              item.isActive ? 'text-emerald-300' : 'text-slate-400'
                            }`}
                          >
                            {item.isActive ? dict.users.active : dict.users.inactive}
                          </span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-right font-mono text-violet-300/60">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-xs text-violet-300/70 font-mono">
            <span>
              Tổng số: {totalUsers} người dùng (Trang {page} / {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function UsersManagementPage() {
  return (
    <AdminGuard>
      <UsersManagementContent />
    </AdminGuard>
  );
}
