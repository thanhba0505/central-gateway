'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Check,
  RotateCcw,
  Save,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassSelect } from '@/components/ui/glass-select';
import { useDelayedLoading } from '@/lib/hooks/use-delayed-loading';
import { api, UserItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/i18n';

interface UserDraft {
  role: 'ADMIN' | 'USER';
  isActive: boolean;
}

export default function UsersManagementPage() {
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

  // Anti-flicker delayed loading
  const showLoading = useDelayedLoading(loading, { delay: 180, minDuration: 250 });

  // Draft state: maps userId -> modified values
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [savingUserIds, setSavingUserIds] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
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
      setDrafts({});
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

  // Local draft changes (no immediate API call)
  const handleDraftStatusChange = (targetUser: UserItem) => {
    if (currentAdmin && targetUser.id === currentAdmin.id) {
      setNotice({ type: 'error', message: dict.users.self_warning });
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    const currentDraft = drafts[targetUser.id] ?? {
      role: targetUser.role,
      isActive: targetUser.isActive,
    };

    const nextStatus = !currentDraft.isActive;

    if (nextStatus === targetUser.isActive && currentDraft.role === targetUser.role) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    } else {
      setDrafts((prev) => ({
        ...prev,
        [targetUser.id]: {
          ...currentDraft,
          isActive: nextStatus,
        },
      }));
    }
  };

  const handleDraftRoleChange = (targetUser: UserItem, nextRole: 'ADMIN' | 'USER') => {
    if (currentAdmin && targetUser.id === currentAdmin.id && nextRole !== 'ADMIN') {
      setNotice({ type: 'error', message: dict.users.self_warning });
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    const currentDraft = drafts[targetUser.id] ?? {
      role: targetUser.role,
      isActive: targetUser.isActive,
    };

    if (nextRole === targetUser.role && currentDraft.isActive === targetUser.isActive) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    } else {
      setDrafts((prev) => ({
        ...prev,
        [targetUser.id]: {
          ...currentDraft,
          role: nextRole,
        },
      }));
    }
  };

  const handleCancelRowEdit = (userId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleCancelAll = () => {
    setDrafts({});
  };

  // Save changes for a single user
  const handleSaveUser = async (targetUser: UserItem) => {
    const draft = drafts[targetUser.id];
    if (!draft) return;

    setSavingUserIds((prev) => new Set(prev).add(targetUser.id));

    try {
      const promises: Promise<unknown>[] = [];

      if (draft.role !== targetUser.role) {
        promises.push(api.updateUserRole(targetUser.id, draft.role));
      }

      if (draft.isActive !== targetUser.isActive) {
        promises.push(api.updateUserStatus(targetUser.id, draft.isActive));
      }

      await Promise.all(promises);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, role: draft.role, isActive: draft.isActive } : u,
        ),
      );

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });

      setNotice({ type: 'success', message: dict.users.update_success });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.users.update_failed;
      setNotice({ type: 'error', message: msg });
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setSavingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  // Save all modified users
  const handleSaveAll = async () => {
    const dirtyUserIds = Object.keys(drafts);
    if (dirtyUserIds.length === 0) return;

    setSavingAll(true);

    try {
      const tasks = dirtyUserIds.map(async (userId) => {
        const draft = drafts[userId];
        const targetUser = users.find((u) => u.id === userId);
        if (!draft || !targetUser) return;

        const promises: Promise<unknown>[] = [];
        if (draft.role !== targetUser.role) {
          promises.push(api.updateUserRole(userId, draft.role));
        }
        if (draft.isActive !== targetUser.isActive) {
          promises.push(api.updateUserStatus(userId, draft.isActive));
        }
        await Promise.all(promises);
      });

      await Promise.all(tasks);

      setUsers((prev) =>
        prev.map((u) => {
          const draft = drafts[u.id];
          return draft ? { ...u, role: draft.role, isActive: draft.isActive } : u;
        }),
      );

      setDrafts({});
      setNotice({ type: 'success', message: dict.users.update_success });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.users.update_failed;
      setNotice({ type: 'error', message: msg });
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setSavingAll(false);
    }
  };

  const unsavedCount = Object.keys(drafts).length;

  const roleFilterOptions = useMemo(
    () => [
      { value: 'all', label: dict.users.all_roles },
      { value: 'ADMIN', label: 'ADMIN', icon: <Shield className="h-3.5 w-3.5 text-purple-300" /> },
      { value: 'USER', label: 'USER', icon: <UserIcon className="h-3.5 w-3.5 text-violet-300" /> },
    ],
    [dict],
  );

  const rowRoleOptions = useMemo(
    () => [
      { value: 'USER', label: 'USER', icon: <UserIcon className="h-3 w-3 text-violet-300" /> },
      { value: 'ADMIN', label: 'ADMIN', icon: <Shield className="h-3 w-3 text-purple-300" /> },
    ],
    [],
  );

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
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner with Smooth Expand Transition */}
      {unsavedCount > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-purple-500/15 p-4 text-xs font-medium shadow-lg backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5 text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{dict.users.unsaved_changes.replace('{count}', String(unsavedCount))}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelAll}
              disabled={savingAll}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{dict.users.cancel}</span>
            </button>
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingAll ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>{savingAll ? dict.users.saving : dict.users.save_all}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notice Banner with Smooth Transition */}
      {notice && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-2xl border p-4 text-xs font-medium shadow-lg backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2 duration-300 ${
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
              className="w-full rounded-full border border-white/20 bg-white/[0.08] py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:border-purple-400 focus:bg-white/[0.14] focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Custom Glass Select for Role Filter */}
            <GlassSelect
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
              options={roleFilterOptions}
              className="w-40"
            />

            <button
              type="submit"
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-[#230b42] shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all hover:bg-white/90 active:scale-[0.98] cursor-pointer"
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
                <th className="px-6 py-4 text-center">{dict.users.actions}</th>
                <th className="px-6 py-4 text-right">{dict.users.created_at}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 transition-opacity duration-300">
              {showLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-violet-300/60 animate-in fade-in-0 duration-200"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin text-purple-300" />
                      <span>{dict.common.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center animate-in fade-in-0 duration-200">
                    <Users className="mx-auto h-10 w-10 text-violet-400/30" />
                    <p className="mt-3 text-sm font-semibold text-white">{dict.users.no_users}</p>
                    <p className="mt-1 text-xs text-violet-200/50">{dict.users.no_users_desc}</p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrent = currentAdmin && item.id === currentAdmin.id;
                  const draft = drafts[item.id];
                  const effectiveRole = draft?.role ?? item.role;
                  const effectiveStatus = draft?.isActive ?? item.isActive;
                  const isDirty = Boolean(draft);
                  const isRowSaving = savingUserIds.has(item.id) || savingAll;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-200 hover:bg-white/[0.03] ${
                        isDirty ? 'bg-purple-500/[0.07]' : ''
                      }`}
                    >
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
                              {isDirty && (
                                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 font-mono text-[9px] text-amber-300 animate-pulse">
                                  chưa lưu
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

                      {/* Role Custom Glass Dropdown */}
                      <td className="px-6 py-4">
                        <GlassSelect
                          size="sm"
                          value={effectiveRole}
                          disabled={Boolean(isCurrent || isRowSaving)}
                          onChange={(val) => handleDraftRoleChange(item, val as 'ADMIN' | 'USER')}
                          options={rowRoleOptions}
                          className="w-28"
                        />
                      </td>

                      {/* Status Switch Toggle (NO text label per request) */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={effectiveStatus}
                            disabled={Boolean(isCurrent || isRowSaving)}
                            onClick={() => handleDraftStatusChange(item)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              effectiveStatus ? 'bg-emerald-500' : 'bg-slate-700'
                            } ${isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title={
                              isCurrent
                                ? dict.users.self_warning
                                : effectiveStatus
                                  ? dict.users.inactive
                                  : dict.users.active
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                effectiveStatus ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions Column (Save / Revert Button) */}
                      <td className="px-6 py-4 text-center">
                        {isDirty ? (
                          <div className="inline-flex items-center gap-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => handleSaveUser(item)}
                              disabled={isRowSaving}
                              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 text-xs font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isRowSaving ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 stroke-[3]" />
                              )}
                              <span>{isRowSaving ? dict.users.saving : dict.users.save}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelRowEdit(item.id)}
                              disabled={isRowSaving}
                              title={dict.users.cancel}
                              className="rounded-full p-1 text-violet-300/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-violet-300/30 select-none">
                            —
                          </span>
                        )}
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
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
