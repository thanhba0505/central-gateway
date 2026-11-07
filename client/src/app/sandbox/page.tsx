'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { Navigation } from '../../components/navigation';
import { JsonViewer } from '../../components/json-viewer';
import { api, Project } from '../../lib/api';

export default function SandboxPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  // Form State
  const [selectedProject, setSelectedProject] = useState('wonderlab');
  const [eventType, setEventType] = useState('ci');
  const [channelOverride, setChannelOverride] = useState('');
  const [message, setMessage] = useState(
    'Central Gateway Sandbox Test Dispatch — All systems nominal. Verifying Slack Block Kit rendering.',
  );

  // Execution State
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject((curr) =>
            data.some((p) => p.slug === curr) ? curr : data[0]?.slug || 'wonderlab',
          );
        }
      })
      .catch(console.error);
  }, []);

  const handleApplyPreset = (presetType: string) => {
    setError(null);
    setResult(null);
    switch (presetType) {
      case 'ci_passed':
        setEventType('ci');
        setMessage(
          'CI Pipeline Passed: All 124 unit tests and E2E database suites completed in 39s.',
        );
        break;
      case 'ci_failed':
        setEventType('ci');
        setMessage(
          'CI Pipeline Alert: Formatting check failed on src/simulation.ts. Requires prettier format fix.',
        );
        break;
      case 'deploy_success':
        setEventType('deploy');
        setMessage(
          'Production Deployment v0.16.0 completed successfully. Render services verified healthy in 2s.',
        );
        break;
      case 'feedback':
        setEventType('feedback');
        setMessage(
          'Community Proposal: User suggested adding the Birthday Paradox interactive simulation to Wonderlab.',
        );
        break;
      case 'ping':
        setEventType('test');
        setMessage('⚡ Gateway heartbeat verification ping. Channel routing test.');
        break;
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !message) return;
    setDispatching(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.sendTestNotification({
        project: selectedProject,
        eventType,
        channelId: channelOverride.trim() || undefined,
        message: message.trim(),
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FlaskConical className="h-4 w-4" />
            <span>Interactive Simulator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Notification Sandbox & Dispatcher
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Simulate and dispatch live Slack Block Kit cards, verify channel routing, and inspect
            responses.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('ci_passed')}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            CI Passed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('ci_failed')}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-mono text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            CI Failed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('deploy_success')}
            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-mono text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            Deploy Completed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('feedback')}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-mono text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            Feedback Proposal
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('ping')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Heartbeat Ping
          </button>
        </div>

        {/* 2-Columns Layout: Form & Live Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Configure Test Dispatch
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Target Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Event Scope
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="ci">ci (Continuous Integration)</option>
                    <option value="deploy">deploy (Production Deploy)</option>
                    <option value="git">git (Git Activity)</option>
                    <option value="feedback">feedback (Community Idea)</option>
                    <option value="comment">comment (Moderation)</option>
                    <option value="test">test (Sandbox Ping)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Channel Override (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use project's mapped channel"
                  value={channelOverride}
                  onChange={(e) => setChannelOverride(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Message Body / Test Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={dispatching}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {dispatching ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching to Slack...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Dispatch Alert to Slack</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Result & Card Visualizer */}
          <div className="space-y-6">
            {/* Visualizer Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-white mb-4">Card Visualizer Preview</h2>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-sans">
                {/* Header outside border */}
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <span>🧪</span>
                  <span>[{selectedProject.toUpperCase()}] Central Gateway Test Dispatch</span>
                </h3>

                {/* Card with cyan accent border */}
                <div className="rounded border-l-4 border-l-cyan-500 bg-slate-900/90 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400 block">Project:</span>
                      <code className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">
                        {selectedProject}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block">Event Scope:</span>
                      <code className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">
                        {eventType}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block">Target:</span>
                      <code className="text-slate-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">
                        {channelOverride || 'Project Mapping'}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block">Source:</span>
                      <code className="text-slate-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">
                        Gateway Control Plane
                      </code>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 text-xs block mb-1">
                      Message Content:
                    </span>
                    <pre className="rounded bg-slate-950 p-2 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                      {message}
                    </pre>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>⏱ Just now | Gateway System Sandbox</span>
                    <span className="rounded bg-cyan-600 px-2 py-0.5 text-white font-sans text-xs font-medium">
                      Open Control Plane
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatch Response */}
            {result && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Slack Dispatch Confirmed (HTTP 200)</span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Message successfully delivered to Slack and recorded in the audit trail.
                </p>
                <JsonViewer data={result} maxHeight="max-h-56" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
