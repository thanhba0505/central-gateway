'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Code,
  Filter,
  RefreshCw,
  Sparkles,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import { Navigation } from '../../components/navigation';
import { JsonViewer } from '../../components/json-viewer';
import { GlassCard } from '../../components/ui/glass-card';
import { GlassButton } from '../../components/ui/glass-button';
import { api, DispatchLog, LogsResponse, Project } from '../../lib/api';

function LogsContent() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';

  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Inspect Modal
  const [inspectedLog, setInspectedLog] = useState<DispatchLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getLogs({
        page,
        limit: 50,
        project: selectedProject || undefined,
        eventType: selectedEventType || undefined,
        status: selectedStatus || undefined,
      });
      setLogsData(data);
    } catch (err) {
      console.error('Failed to load dispatch logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, selectedProject, selectedEventType, selectedStatus]);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const stats = logsData?.stats;

  return (
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-white">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Header & Stats Banner */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-0.5 text-xs font-semibold text-purple-200">
              <Sparkles className="h-3 w-3 text-purple-300" />
              <span>Real-Time Audit Observability</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Dispatch Logs & Audit Trail
            </h1>
            <p className="mt-1 text-sm text-violet-200/80">
              Inspect historical notification dispatches, verify Slack Block Kit payloads, and
              monitor latency.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-violet-200 transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-purple-300' : ''}`}
            />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <GlassCard className="p-4">
            <span className="block font-mono text-[11px] uppercase text-violet-300/70">
              Total Logs
            </span>
            <span className="mt-1 block font-mono text-2xl font-extrabold text-white">
              {stats?.total ?? '--'}
            </span>
          </GlassCard>
          <GlassCard className="p-4">
            <span className="block font-mono text-[11px] uppercase text-emerald-300">
              Successful
            </span>
            <span className="mt-1 block font-mono text-2xl font-extrabold text-emerald-300">
              {stats?.successCount ?? '--'}
            </span>
          </GlassCard>
          <GlassCard className="p-4">
            <span className="block font-mono text-[11px] uppercase text-rose-300">Failures</span>
            <span className="mt-1 block font-mono text-2xl font-extrabold text-rose-300">
              {stats?.failCount ?? '--'}
            </span>
          </GlassCard>
          <GlassCard className="p-4">
            <span className="block font-mono text-[11px] uppercase text-purple-300">
              Success Rate
            </span>
            <span className="mt-1 block font-mono text-2xl font-extrabold text-purple-300">
              {stats?.successRate !== undefined ? `${stats.successRate}%` : '--'}
            </span>
          </GlassCard>
        </div>

        {/* Filters Bar */}
        <GlassCard className="mb-6 flex flex-wrap items-center gap-3 p-4">
          <div className="mr-2 flex items-center gap-2 font-mono text-xs text-violet-300">
            <Filter className="h-4 w-4 text-purple-300" />
            <span>Filters:</span>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setPage(1);
            }}
            className="rounded-full border border-white/25 bg-[#250e42] px-4 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name} ({p.slug})
              </option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => {
              setSelectedEventType(e.target.value);
              setPage(1);
            }}
            className="rounded-full border border-white/25 bg-[#250e42] px-4 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">All Event Scopes</option>
            <option value="ci">ci</option>
            <option value="deploy">deploy</option>
            <option value="git">git</option>
            <option value="feedback">feedback</option>
            <option value="comment">comment</option>
            <option value="test">test</option>
          </select>

          {/* Status Filter */}
          <div className="flex rounded-full border border-white/20 bg-white/10 p-1 font-mono text-xs">
            <button
              onClick={() => {
                setSelectedStatus('');
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${
                selectedStatus === ''
                  ? 'bg-white/25 text-white font-bold'
                  : 'text-violet-300/70 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setSelectedStatus('SUCCESS');
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${
                selectedStatus === 'SUCCESS'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                  : 'text-violet-300/70 hover:text-emerald-300'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => {
                setSelectedStatus('FAIL');
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${
                selectedStatus === 'FAIL'
                  ? 'bg-rose-500/30 text-rose-300 font-bold'
                  : 'text-violet-300/70 hover:text-rose-300'
              }`}
            >
              Failed
            </button>
          </div>

          {(selectedProject || selectedEventType || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedProject('');
                setSelectedEventType('');
                setSelectedStatus('');
                setPage(1);
              }}
              className="ml-auto flex items-center gap-1 font-mono text-xs text-violet-300 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </GlassCard>

        {/* Logs Table */}
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/15 bg-white/[0.04] text-[11px] uppercase tracking-wider text-violet-300/60">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Event Scope</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Channel / Summary</th>
                  <th className="px-4 py-3 text-right font-medium">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-violet-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-violet-300/60">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : !logsData?.items || logsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-violet-300/60">
                      No logs matched the selected criteria.
                    </td>
                  </tr>
                ) : (
                  logsData.items.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const payloadChannel = (log.payload as { channel?: string })?.channel || '--';
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-white/[0.05]">
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                              isSuccess
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-violet-300/70">
                          {new Date(log.createdAt).toLocaleString([], {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-semibold text-white">
                            {log.project?.slug || 'ecosystem'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="font-bold uppercase text-purple-300">
                            {log.eventType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-violet-300/70">
                          {log.provider}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-violet-200">
                          {log.error ? (
                            <span className="text-rose-300">{log.error}</span>
                          ) : (
                            <span>Channel: {payloadChannel}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            onClick={() => setInspectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] text-purple-200 transition-colors hover:border-white/40 hover:bg-white/20 hover:text-white"
                          >
                            <Code className="h-3 w-3 text-purple-300" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>

      {/* Inspect Log Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d021b]/80 p-4 backdrop-blur-md">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/20 bg-[#1a0833]/90 p-6 shadow-[0_16px_50px_rgba(107,36,155,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-5 w-5 text-purple-300" />
                <h3 className="font-bold text-white">Dispatch Log Inspector</h3>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold ${
                    inspectedLog.status === 'SUCCESS'
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {inspectedLog.status}
                </span>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <span className="block text-[10px] text-violet-300/60">PROJECT</span>
                  <span className="font-bold text-white truncate block">
                    {inspectedLog.project?.name || inspectedLog.project?.slug || 'Ecosystem'}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <span className="block text-[10px] text-violet-300/60">EVENT SCOPE</span>
                  <span className="font-bold uppercase text-purple-300 block">
                    {inspectedLog.eventType}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <span className="block text-[10px] text-violet-300/60">PROVIDER</span>
                  <span className="text-white block">{inspectedLog.provider}</span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <span className="block text-[10px] text-violet-300/60">DISPATCHED AT</span>
                  <span className="text-violet-200 block">
                    {new Date(inspectedLog.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Error Notice */}
              {inspectedLog.error && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Error: {inspectedLog.error}</span>
                </div>
              )}

              {/* Payload Section */}
              <div>
                <h4 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-violet-300">
                  Slack Block Kit Request Payload
                </h4>
                <JsonViewer data={inspectedLog.payload} maxHeight="max-h-60" />
              </div>

              {/* Response Section */}
              {inspectedLog.response && (
                <div>
                  <h4 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-violet-300">
                    Slack API Response
                  </h4>
                  <JsonViewer data={inspectedLog.response} maxHeight="max-h-48" />
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-white/15 pt-3">
              <GlassButton
                variant="glass"
                onClick={() => setInspectedLog(null)}
                className="py-2 text-xs"
              >
                Close Inspector
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-mono text-xs text-violet-300/60">
          Loading audit trail...
        </div>
      }
    >
      <LogsContent />
    </Suspense>
  );
}
