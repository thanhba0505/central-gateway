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
  RefreshCw,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Navigation } from '../components/navigation';
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
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navigation />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ecosystem Control Plane
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Centralized API routing, multi-project Slack orchestration, and live dispatch
              observability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`}
              />
              <span>Refresh</span>
            </button>
            <Link
              href="/sandbox"
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Open Sandbox</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Connected Projects */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">
                Registered Projects
              </span>
              <FolderGit2 className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {loading ? '--' : projects.length}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Active in ecosystem</span>
              <Link
                href="/projects"
                className="text-cyan-400 hover:underline flex items-center gap-0.5 font-mono text-[11px]"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Mapped Channels */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">Slack Channels</span>
              <Bell className="h-4 w-4 text-blue-400" />
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {loading ? '--' : totalChannels}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Routed across {projects.length} project{projects.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Card 3: Total Dispatches */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">Total Dispatches</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {loading ? '--' : totalLogs}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {successRate}% success rate
              </span>
              <Link
                href="/logs"
                className="text-purple-400 hover:underline flex items-center gap-0.5 font-mono text-[11px]"
              >
                Logs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Database Engine */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">Storage Engine</span>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-3 font-mono text-xl font-bold text-white">Neon PostgreSQL</p>
            <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Serverless Connection Pool
            </p>
          </div>
        </div>

        {/* Two Columns Grid: Connected Projects & Live Event Stream */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left Column: Connected Projects (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-cyan-400" />
                  <h2 className="font-semibold text-white text-base">Connected Projects</h2>
                </div>
                <Link
                  href="/projects"
                  className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1"
                >
                  View all ({projects.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800/60 p-2">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono">
                    Loading ecosystem projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No projects registered yet.
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 font-mono text-base font-bold text-cyan-400">
                          {proj.slug.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white text-sm">{proj.name}</h3>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {proj.slug}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono border ${
                                proj.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {proj.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {proj.description || 'Ecosystem platform service'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {proj.channels?.map((ch) => (
                              <span
                                key={ch.id}
                                className="inline-flex items-center gap-1 rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-800"
                              >
                                <span className="text-cyan-400">{ch.eventType}:</span>
                                <span>{ch.channelName}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 text-right">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {proj._count?.logs || 0} events
                        </span>
                        <Link
                          href={`/logs?project=${proj.slug}`}
                          className="text-[11px] font-mono text-cyan-400 hover:underline"
                        >
                          View audit logs
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Architecture Overview Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                Infrastructure Architecture
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Central Gateway acts as the single ingestion and dispatch hub for the ThanhBa
                ecosystem. Incoming events from GitHub CI/CD, production deployments, and user
                community actions are authenticated via Bearer secrets, enriched with Slack Block
                Kit visual layouts, and delivered with zero secret leaks.
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="text-slate-500 text-[10px] block">SERVER INSTANCE</span>
                  <span className="text-slate-200 mt-0.5 block truncate">NestJS 10 REST</span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="text-slate-500 text-[10px] block">CONSOLE CLIENT</span>
                  <span className="text-slate-200 mt-0.5 block truncate">Next.js 15 App</span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="text-slate-500 text-[10px] block">SLACK BOT</span>
                  <span className="text-slate-200 mt-0.5 block truncate">Block Kit Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Dispatch Stream (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  <h2 className="font-semibold text-white text-base">Recent Dispatches</h2>
                </div>
                <Link
                  href="/logs"
                  className="text-xs text-purple-400 hover:underline font-mono flex items-center gap-1"
                >
                  All Logs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800/60 p-2">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono">
                    Streaming activity...
                  </div>
                ) : !logsData?.items || logsData.items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No dispatch events recorded yet.
                  </div>
                ) : (
                  logsData.items.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-2 w-2 rounded-full ${
                                isSuccess ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-white uppercase">
                              {log.eventType}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              {log.project?.slug || 'ecosystem'}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="truncate max-w-[200px]">
                            {log.error ? (
                              <span className="text-rose-400">{log.error}</span>
                            ) : (
                              `Provider: ${log.provider}`
                            )}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
            </div>

            {/* Quick Link Card */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 p-5 border-dashed">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <FlaskConical className="h-4 w-4" />
                Notification Sandbox
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Want to test your Slack layout or verify delivery before deploying? Use the built-in
                sandbox simulator.
              </p>
              <div className="mt-4">
                <Link
                  href="/sandbox"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-mono text-cyan-300 transition-colors"
                >
                  Launch Sandbox <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        ThanhBa Ecosystem — Central Gateway Control Plane
      </footer>
    </div>
  );
}
