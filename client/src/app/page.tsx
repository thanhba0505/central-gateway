'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Database,
  FolderGit2,
  RefreshCw,
  ShieldCheck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import { api, Project, UserItem } from '../lib/api';
import { useTranslation } from '../i18n';

export default function HomePage() {
  const { dict } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.getProjects(),
        api.getUsers({ limit: 5 }),
      ]);
      setProjects(projRes);
      setUsers(usersRes.data);
      setTotalUsers(usersRes.total);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeProjectsCount = projects.filter((p) => p.isActive).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header & Refresh Action */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
            {dict.dashboard.title}
          </h1>
          <p className="mt-1 text-xs text-violet-200/70 sm:text-sm">{dict.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            aria-label="Refresh platform metrics"
            className="flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-violet-200 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-purple-300' : ''}`}
            />
            <span>{refreshing ? dict.common.refreshing : dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Connected Projects */}
        <GlassCard variant="interactive" className="p-6">
          <div className="flex items-center justify-between text-violet-200/80">
            <span className="text-xs font-mono uppercase tracking-wider">
              {dict.dashboard.registered_apps}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <FolderGit2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              projects.length
            )}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-violet-200/80">
            <span>{activeProjectsCount} đang kích hoạt</span>
            <Link
              href="/projects"
              className="flex items-center gap-1 font-mono text-purple-300 transition-colors hover:text-white"
            >
              {dict.dashboard.manage} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </GlassCard>

        {/* Card 2: Total Users */}
        <GlassCard variant="interactive" className="p-6">
          <div className="flex items-center justify-between text-violet-200/80">
            <span className="text-xs font-mono uppercase tracking-wider">{dict.users.title}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              totalUsers
            )}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-violet-200/80">
            <span>Tài khoản Prism Hub</span>
            <Link
              href="/users"
              className="flex items-center gap-1 font-mono text-blue-300 transition-colors hover:text-white"
            >
              {dict.dashboard.manage} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </GlassCard>

        {/* Card 3: IAM & S2S Status */}
        <GlassCard variant="interactive" className="p-6">
          <div className="flex items-center justify-between text-violet-200/80">
            <span className="text-xs font-mono uppercase tracking-wider">BFF & S2S Master</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <p className="font-mono text-2xl font-bold text-white">HOẠT ĐỘNG</p>
          </div>
          <p className="mt-3 text-xs text-violet-200/80">Đồng bộ Master - Shadow qua S2S</p>
        </GlassCard>

        {/* Card 4: Database Health */}
        <GlassCard variant="interactive" className="p-6">
          <div className="flex items-center justify-between text-violet-200/80">
            <span className="text-xs font-mono uppercase tracking-wider">
              {dict.dashboard.database_engine}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-white">PostgreSQL 16</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>6 Bảng Nghiệp vụ Sạch</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Grid: Projects & Users */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Registered Projects */}
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-purple-300" />
              <h2 className="text-base font-semibold text-white">
                {dict.dashboard.connected_apps}
              </h2>
            </div>
            <Link
              href="/projects"
              className="flex items-center gap-1 font-mono text-xs text-purple-300 transition-colors hover:text-white"
            >
              {dict.dashboard.view_all.replace('{count}', String(projects.length))}{' '}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/10 p-3">
            {loading ? (
              <div className="space-y-3 p-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3.5 rounded-2xl p-4 bg-white/[0.02] animate-pulse"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-white/10" />
                        <div className="h-3 w-48 rounded bg-white/5" />
                      </div>
                    </div>
                    <div className="h-5 w-16 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-violet-300/60">
                {dict.dashboard.no_projects}
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between gap-3.5 rounded-2xl p-4 transition-colors hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-tr from-purple-700/50 to-indigo-600/40 font-mono text-lg font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      {proj.slug.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {proj.name}
                        <span className="font-mono text-[10px] text-violet-300/60">
                          ({proj.slug})
                        </span>
                      </h3>
                      <p className="mt-0.5 text-xs text-violet-200/70 truncate">
                        {proj.description || dict.dashboard.ecosystem_service}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                      proj.isActive
                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : 'border border-rose-500/30 bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {proj.isActive ? dict.common.active : dict.common.disabled}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Right Column: Recent Users */}
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-300" />
              <h2 className="text-base font-semibold text-white">Tài khoản Nền tảng Gần đây</h2>
            </div>
            <Link
              href="/users"
              className="flex items-center gap-1 font-mono text-xs text-blue-300 transition-colors hover:text-white"
            >
              Xem toàn bộ ({totalUsers}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/10 p-3">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-2xl p-3.5 bg-white/[0.02] animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/10" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-24 rounded bg-white/10" />
                        <div className="h-3 w-36 rounded bg-white/5" />
                      </div>
                    </div>
                    <div className="h-5 w-14 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-violet-300/60">
                {dict.users.no_users}
              </div>
            ) : (
              users.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl p-3.5 transition-colors hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-500/10 font-bold text-blue-200">
                      {item.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">@{item.username}</p>
                      <p className="font-mono text-[11px] text-violet-300/60 truncate">
                        {item.email || 'Chưa liên kết email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        item.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                          : 'bg-white/10 text-violet-300'
                      }`}
                    >
                      {item.role}
                    </span>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        item.isActive ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'
                      }`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
