'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  Flame,
  FlaskConical,
  FolderGit2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Navigation } from '../components/navigation';
import { GlassCard } from '../components/ui/glass-card';
import { GlassButton } from '../components/ui/glass-button';
import { api, Project, LogsResponse } from '../lib/api';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [projRes, logsRes] = await Promise.all([api.getProjects(), api.getLogs({ limit: 6 })]);
      setProjects(projRes);
      setLogsData(logsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalChannels = projects.reduce((acc, p) => acc + (p.channels?.length || 0), 0);
  const successRate = logsData?.stats?.successRate ?? 100;
  const totalLogs = logsData?.stats?.total ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-white">
      <Navigation />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/20 bg-white/[0.06] p-8 shadow-[0_12px_45px_rgba(88,28,135,0.35)] backdrop-blur-2xl sm:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/15 px-3.5 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                <span>Central IAM & Cloud Platform Hub</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
                Ecosystem Control Plane
              </h1>
              <p className="text-sm leading-relaxed text-violet-200/80 sm:text-base">
                Unified Single Sign-On (SSO) identity access management, intelligent
                cross-application Slack notification routing, and live telemetry observability for
                Wonderlab and all sub-apps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login">
                <GlassButton
                  variant="primary"
                  className="gap-2 shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>SSO Login Hub</span>
                </GlassButton>
              </Link>
              <Link href="/sandbox">
                <GlassButton variant="glass" className="gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-300" />
                  <span>Open Sandbox</span>
                </GlassButton>
              </Link>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                aria-label="Refresh platform metrics"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-violet-200 transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin text-purple-300' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Connected Projects */}
          <GlassCard variant="interactive" className="p-6">
            <div className="flex items-center justify-between text-violet-200/80">
              <span className="text-xs font-mono uppercase tracking-wider">Registered Apps</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                <FolderGit2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-3xl font-extrabold text-white">
              {loading ? '--' : projects.length}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-violet-200/80">
              <span>Active in ecosystem</span>
              <Link
                href="/projects"
                className="flex items-center gap-1 font-mono text-purple-300 transition-colors hover:text-white"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </GlassCard>

          {/* Card 2: Mapped Channels */}
          <GlassCard variant="interactive" className="p-6">
            <div className="flex items-center justify-between text-violet-200/80">
              <span className="text-xs font-mono uppercase tracking-wider">Slack Channels</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                <Bell className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-3xl font-extrabold text-white">
              {loading ? '--' : totalChannels}
            </p>
            <p className="mt-3 text-xs text-violet-200/80">
              Routed across {projects.length} connected project{projects.length !== 1 ? 's' : ''}
            </p>
          </GlassCard>

          {/* Card 3: Total Dispatches */}
          <GlassCard variant="interactive" className="p-6">
            <div className="flex items-center justify-between text-violet-200/80">
              <span className="text-xs font-mono uppercase tracking-wider">Total Dispatches</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-3xl font-extrabold text-white">
              {loading ? '--' : totalLogs}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-violet-200/80">
              <span className="flex items-center gap-1.5 font-mono text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> {successRate}% success
              </span>
              <Link
                href="/logs"
                className="flex items-center gap-1 font-mono text-purple-300 transition-colors hover:text-white"
              >
                Logs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </GlassCard>

          {/* Card 4: Database Engine */}
          <GlassCard variant="interactive" className="p-6">
            <div className="flex items-center justify-between text-violet-200/80">
              <span className="text-xs font-mono uppercase tracking-wider">Database Engine</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-xl font-bold text-white">Neon PostgreSQL</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Serverless Connection Pool
            </p>
          </GlassCard>
        </div>

        {/* Two Columns Grid: Connected Projects & Live Event Stream */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left Column: Connected Projects (3 Cols) */}
          <div className="space-y-6 lg:col-span-3">
            <GlassCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <FolderGit2 className="h-4 w-4 text-purple-300" />
                  <h2 className="text-base font-semibold text-white">Connected Applications</h2>
                </div>
                <Link
                  href="/projects"
                  className="flex items-center gap-1 font-mono text-xs text-purple-300 transition-colors hover:text-white"
                >
                  View all ({projects.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-white/10 p-3">
                {loading ? (
                  <div className="p-8 text-center font-mono text-xs text-violet-300/60">
                    Loading ecosystem projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-violet-300/60">
                    No applications registered yet.
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.08] sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-tr from-purple-700/50 to-indigo-600/40 font-mono text-lg font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          {proj.slug.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{proj.name}</h3>
                            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[11px] text-violet-200">
                              {proj.slug}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${
                                proj.isActive
                                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                  : 'border-white/15 bg-white/10 text-white/50'
                              }`}
                            >
                              {proj.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-violet-200/70">
                            {proj.description || 'Ecosystem platform service'}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {proj.channels?.map((ch) => (
                              <span
                                key={ch.id}
                                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-violet-200"
                              >
                                <span className="text-purple-300">{ch.eventType}:</span>
                                <span>{ch.channelName}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-1 text-right sm:flex-col sm:justify-center">
                        <span className="font-mono text-xs font-semibold text-white">
                          {proj._count?.logs || 0} events
                        </span>
                        <Link
                          href={`/logs?project=${proj.slug}`}
                          className="font-mono text-[11px] text-purple-300 hover:text-white hover:underline"
                        >
                          View audit logs
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Architecture Overview Card */}
            <GlassCard className="p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Flame className="h-4 w-4 text-amber-300" />
                Infrastructure & SSO Topology
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-violet-200/80">
                Central Gateway acts as the single source of truth for identity authentication and
                notification dispatch across all ThanhBa services. Applications connect via OAuth2
                Authorization Code with PKCE, ensuring users log in once and enjoy frictionless
                access across all sub-apps.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-md">
                  <span className="block text-[10px] text-violet-300/60">SSO PROTOCOL</span>
                  <span className="mt-1 block truncate text-white">OAuth2 + PKCE</span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-md">
                  <span className="block text-[10px] text-violet-300/60">BACKEND API</span>
                  <span className="mt-1 block truncate text-white">NestJS 10 REST</span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-md">
                  <span className="block text-[10px] text-violet-300/60">NOTIFICATION</span>
                  <span className="mt-1 block truncate text-white">Slack Block Kit</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Live Dispatch Stream (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            <GlassCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-300" />
                  <h2 className="text-base font-semibold text-white">Recent Dispatches</h2>
                </div>
                <Link
                  href="/logs"
                  className="flex items-center gap-1 font-mono text-xs text-purple-300 transition-colors hover:text-white"
                >
                  All Logs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-white/10 p-3">
                {loading ? (
                  <div className="p-8 text-center font-mono text-xs text-violet-300/60">
                    Streaming activity...
                  </div>
                ) : !logsData?.items || logsData.items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-violet-300/60">
                    No dispatch events recorded yet.
                  </div>
                ) : (
                  logsData.items.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl p-3.5 transition-colors hover:bg-white/[0.08]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isSuccess
                                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                                  : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold uppercase text-white">
                              {log.eventType}
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-violet-200">
                              {log.project?.slug || 'ecosystem'}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-violet-300/60">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between font-mono text-xs text-violet-200/70">
                          <span className="max-w-[180px] truncate">
                            {log.error ? (
                              <span className="text-rose-300">{log.error}</span>
                            ) : (
                              `Provider: ${log.provider}`
                            )}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              isSuccess
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>

            {/* Quick Sandbox Link Card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                <FlaskConical className="h-4 w-4" />
                Notification Sandbox
              </div>
              <p className="mt-2 text-xs leading-relaxed text-violet-200/80">
                Test your Slack notification Block Kit templates or verify live delivery before
                deploying updates.
              </p>
              <div className="mt-5">
                <Link href="/sandbox">
                  <GlassButton variant="primary" className="w-full text-xs">
                    Launch Simulator <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-[#120524]/60 py-6 text-center font-mono text-xs text-violet-300/60 backdrop-blur-md">
        ThanhBa Ecosystem — Central Gateway SSO & Platform Console
      </footer>
    </div>
  );
}
