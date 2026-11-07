'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Code,
  Filter,
  RefreshCw,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import { Navigation } from '../../components/navigation';
import { JsonViewer } from '../../components/json-viewer';
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
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {/* Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Dispatch Logs & Audit Trail
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Inspect historical notification dispatches, debug Slack payloads, and verify delivery
              latency.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`}
            />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Logs</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {stats?.total ?? '--'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <span className="text-[11px] font-mono uppercase text-emerald-400 block">
              Successful
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {stats?.successCount ?? '--'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <span className="text-[11px] font-mono uppercase text-rose-400 block">Failures</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">
              {stats?.failCount ?? '--'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <span className="text-[11px] font-mono uppercase text-cyan-400 block">
              Success Rate
            </span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
              {stats?.successRate !== undefined ? `${stats.successRate}%` : '--'}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mr-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            <span>Filters:</span>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
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
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Event Types</option>
            <option value="ci">ci</option>
            <option value="deploy">deploy</option>
            <option value="git">git</option>
            <option value="feedback">feedback</option>
            <option value="comment">comment</option>
            <option value="test">test</option>
          </select>

          {/* Status Filter */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 font-mono text-xs">
            <button
              onClick={() => {
                setSelectedStatus('');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded ${
                selectedStatus === ''
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setSelectedStatus('SUCCESS');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded ${
                selectedStatus === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => {
                setSelectedStatus('FAIL');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded ${
                selectedStatus === 'FAIL'
                  ? 'bg-rose-500/20 text-rose-400 font-medium'
                  : 'text-slate-400 hover:text-rose-400'
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
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono ml-auto"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Project</th>
                  <th className="py-3 px-4 font-medium">Event Type</th>
                  <th className="py-3 px-4 font-medium">Provider</th>
                  <th className="py-3 px-4 font-medium">Channel / Summary</th>
                  <th className="py-3 px-4 font-medium text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : !logsData?.items || logsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No logs matched the selected criteria.
                    </td>
                  </tr>
                ) : (
                  logsData.items.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const payloadChannel = (log.payload as { channel?: string })?.channel || '--';
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                          {new Date(log.createdAt).toLocaleString([], {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 font-semibold">
                            {log.project?.slug || 'ecosystem'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-cyan-300 uppercase">{log.eventType}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-400">{log.provider}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                          {log.error ? (
                            <span className="text-rose-400">{log.error}</span>
                          ) : (
                            <span className="text-slate-300">Channel: {payloadChannel}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setInspectedLog(log)}
                            className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-cyan-300 border border-slate-700 transition-colors"
                          >
                            <Code className="h-3 w-3" />
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
        </div>
      </main>

      {/* Inspect Log Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Dispatch Log Inspector</h3>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                    inspectedLog.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {inspectedLog.status}
                </span>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PROJECT</span>
                  <span className="text-white font-bold">
                    {inspectedLog.project?.name || inspectedLog.project?.slug || 'Ecosystem'}
                  </span>
                </div>
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">EVENT TYPE</span>
                  <span className="text-cyan-400 font-bold uppercase">
                    {inspectedLog.eventType}
                  </span>
                </div>
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PROVIDER</span>
                  <span className="text-white">{inspectedLog.provider}</span>
                </div>
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">DISPATCHED AT</span>
                  <span className="text-slate-300">
                    {new Date(inspectedLog.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Error Notice if any */}
              {inspectedLog.error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Error: {inspectedLog.error}</span>
                </div>
              )}

              {/* Payload Section */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Slack Block Kit Request Payload
                </h4>
                <JsonViewer data={inspectedLog.payload} maxHeight="max-h-60" />
              </div>

              {/* Response Section */}
              {inspectedLog.response && (
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Slack API Response
                  </h4>
                  <JsonViewer data={inspectedLog.response} maxHeight="max-h-48" />
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-white transition-colors"
              >
                Close Inspector
              </button>
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
        <div className="flex min-h-screen items-center justify-center bg-slate-950 font-mono text-xs text-slate-500">
          Loading audit trail...
        </div>
      }
    >
      <LogsContent />
    </Suspense>
  );
}
