'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { Navigation } from '../../components/navigation';
import { JsonViewer } from '../../components/json-viewer';
import { GlassCard } from '../../components/ui/glass-card';
import { GlassButton } from '../../components/ui/glass-button';
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
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-white">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-0.5 text-xs font-semibold text-purple-200">
            <FlaskConical className="h-3.5 w-3.5 text-purple-300" />
            <span>Interactive Simulator</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Notification Sandbox & Dispatcher
          </h1>
          <p className="mt-1 text-sm text-violet-200/80">
            Simulate and dispatch live Slack Block Kit cards, verify channel routing, and inspect
            responses.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1 font-mono text-xs text-violet-300">
            <Sparkles className="h-3 w-3 text-purple-300" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('ci_passed')}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs text-emerald-300 transition-colors hover:bg-emerald-500/25"
          >
            CI Passed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('ci_failed')}
            className="rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-xs text-rose-300 transition-colors hover:bg-rose-500/25"
          >
            CI Failed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('deploy_success')}
            className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 font-mono text-xs text-blue-300 transition-colors hover:bg-blue-500/25"
          >
            Deploy Completed
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('feedback')}
            className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 font-mono text-xs text-purple-200 transition-colors hover:bg-purple-500/25"
          >
            Feedback Proposal
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('ping')}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs text-violet-200 transition-colors hover:bg-white/20 hover:text-white"
          >
            Heartbeat Ping
          </button>
        </div>

        {/* 2-Columns Layout: Form & Live Output */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Form */}
          <GlassCard className="p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              <MessageSquare className="h-4 w-4 text-purple-300" />
              <span>Configure Test Dispatch</span>
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                    Target Application
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-full border border-white/25 bg-[#250e42] px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                    Event Scope
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-full border border-white/25 bg-[#250e42] px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:ring-4 focus:ring-violet-400/25"
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
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Channel Override (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use project's mapped channel"
                  value={channelOverride}
                  onChange={(e) => setChannelOverride(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Message Body / Test Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-2xl border border-white/25 bg-white/[0.12] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div className="pt-3">
                <GlassButton
                  type="submit"
                  variant="primary"
                  isLoading={dispatching}
                  className="w-full gap-2 text-base py-3.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Dispatch Alert to Slack</span>
                </GlassButton>
              </div>
            </form>
          </GlassCard>

          {/* Right Column: Live Result & Card Visualizer */}
          <div className="space-y-6">
            {/* Visualizer Card */}
            <GlassCard className="p-6">
              <h2 className="mb-4 text-base font-bold text-white">Card Visualizer Preview</h2>

              <div className="rounded-2xl border border-white/15 bg-[#120422]/90 p-5 font-sans backdrop-blur-md">
                {/* Header outside border */}
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span>🧪</span>
                  <span>[{selectedProject.toUpperCase()}] Central Gateway Test Dispatch</span>
                </h3>

                {/* Card with purple accent border */}
                <div className="space-y-3 rounded-xl border-l-4 border-l-purple-400 bg-white/[0.05] p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block font-semibold text-violet-300/70">Project:</span>
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-purple-200">
                        {selectedProject}
                      </code>
                    </div>
                    <div>
                      <span className="block font-semibold text-violet-300/70">Event Scope:</span>
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-purple-200">
                        {eventType}
                      </code>
                    </div>
                    <div>
                      <span className="block font-semibold text-violet-300/70">Target:</span>
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white">
                        {channelOverride || 'Project Mapping'}
                      </code>
                    </div>
                    <div>
                      <span className="block font-semibold text-violet-300/70">Source:</span>
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white">
                        Gateway Console
                      </code>
                    </div>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold text-violet-300/70">
                      Message Content:
                    </span>
                    <pre className="whitespace-pre-wrap rounded-xl bg-black/40 p-3 font-mono text-xs text-white">
                      {message}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-violet-300/60">
                    <span>⏱ Just now | Gateway System Sandbox</span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-sans text-xs font-semibold text-white">
                      Live Preview
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Dispatch Response */}
            {result && (
              <GlassCard className="border-emerald-500/30 bg-emerald-950/20 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Slack Dispatch Confirmed (HTTP 200)</span>
                </div>
                <p className="mb-3 text-xs text-violet-200">
                  Message successfully delivered to Slack and recorded in the audit trail.
                </p>
                <JsonViewer data={result} maxHeight="max-h-56" />
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
