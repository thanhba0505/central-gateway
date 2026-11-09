'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, Plus, Trash2, Edit2, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { GlassCard } from '../../components/ui/glass-card';
import { GlassButton } from '../../components/ui/glass-button';
import { api, Project, ChannelMapping } from '../../lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Project Modal State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectSlug, setNewProjectSlug] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Channel Mapping Modal State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelEventType, setChannelEventType] = useState('ci');
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectSlug || !newProjectName) return;
    setCreatingProject(true);
    setCreateError(null);
    try {
      await api.createProject({
        slug: newProjectSlug.toLowerCase().trim(),
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setIsNewProjectOpen(false);
      setNewProjectSlug('');
      setNewProjectName('');
      setNewProjectDesc('');
      await loadProjects();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingProject(false);
    }
  };

  const handleToggleStatus = async (project: Project) => {
    try {
      await api.updateProjectStatus(project.id, !project.isActive);
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, isActive: !p.isActive } : p)),
      );
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  const openChannelModal = (projectId: string, existing?: ChannelMapping) => {
    setActiveProjectId(projectId);
    if (existing) {
      setChannelEventType(existing.eventType);
      setChannelId(existing.channelId);
      setChannelName(existing.channelName);
    } else {
      setChannelEventType('ci');
      setChannelId('');
      setChannelName('');
    }
    setChannelError(null);
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !channelEventType || !channelId || !channelName) return;
    setSavingChannel(true);
    setChannelError(null);
    try {
      await api.upsertChannel(activeProjectId, {
        eventType: channelEventType.toLowerCase().trim(),
        channelId: channelId.trim(),
        channelName: channelName.trim().startsWith('#')
          ? channelName.trim()
          : `#${channelName.trim()}`,
        provider: 'slack',
      });
      setIsChannelModalOpen(false);
      await loadProjects();
    } catch (err: unknown) {
      setChannelError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingChannel(false);
    }
  };

  const handleDeleteChannel = async (projectId: string, mappingId: string) => {
    if (!confirm('Are you sure you want to remove this channel mapping?')) return;
    try {
      await api.deleteChannel(projectId, mappingId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete channel mapping:', err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-0.5 text-xs font-semibold text-purple-200">
            <Sparkles className="h-3 w-3 text-purple-300" />
            <span>Ecosystem Application Registry</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Projects & Channel Routing
          </h1>
          <p className="mt-1 text-sm text-violet-200/80">
            Register child applications, manage OAuth credentials, and bind event scopes to Slack
            channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh project list"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-violet-200 transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-purple-300' : ''}`} />
          </button>
          <GlassButton
            variant="primary"
            onClick={() => setIsNewProjectOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Register Project</span>
          </GlassButton>
        </div>
      </div>

      {/* Project List */}
      {loading ? (
        <GlassCard className="p-12 text-center font-mono text-sm text-violet-300/60">
          Loading registered applications...
        </GlassCard>
      ) : projects.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FolderGit2 className="mx-auto mb-3 h-10 w-10 text-violet-300/40" />
          <h3 className="text-base font-semibold text-white">No applications found</h3>
          <p className="mt-1 text-sm text-violet-200/70">
            Register your first project to start routing notifications and issuing SSO credentials.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => (
            <GlassCard key={proj.id} className="overflow-hidden p-0">
              {/* Project Header Bar */}
              <div className="flex flex-col justify-between gap-4 border-b border-white/15 bg-white/[0.04] px-6 py-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-tr from-purple-700/60 to-indigo-600/50 font-mono text-lg font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                    {proj.slug.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-white">{proj.name}</h2>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-xs text-violet-200">
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
                      {proj.description || 'Central platform module'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleStatus(proj)}
                    className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                      proj.isActive
                        ? 'border-white/20 bg-white/10 text-violet-200 hover:bg-white/20 hover:text-white'
                        : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    }`}
                  >
                    {proj.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <GlassButton
                    variant="glass"
                    onClick={() => openChannelModal(proj.id)}
                    className="gap-1.5 py-1.5 text-xs text-purple-200"
                  >
                    <Plus className="h-3.5 w-3.5 text-purple-300" />
                    <span>Map Channel</span>
                  </GlassButton>
                </div>
              </div>

              {/* Mapped Channels Table */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-violet-300/60">
                        <th className="pb-3 font-medium">Event Scope</th>
                        <th className="pb-3 font-medium">Slack Channel</th>
                        <th className="pb-3 font-medium">Channel ID</th>
                        <th className="pb-3 font-medium">Provider</th>
                        <th className="pb-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-violet-200">
                      {proj.channels?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-violet-300/50">
                            No channel mappings defined for this project. System defaults will be
                            applied.
                          </td>
                        </tr>
                      ) : (
                        proj.channels?.map((ch) => (
                          <tr key={ch.id} className="transition-colors hover:bg-white/[0.05]">
                            <td className="py-3">
                              <span className="inline-flex items-center rounded-full border border-purple-400/30 bg-purple-500/20 px-2.5 py-0.5 font-bold uppercase text-purple-200">
                                {ch.eventType}
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-white">{ch.channelName}</td>
                            <td className="py-3 text-violet-300/70">{ch.channelId}</td>
                            <td className="py-3">
                              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-violet-200">
                                {ch.provider}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openChannelModal(proj.id, ch)}
                                  title="Edit channel mapping"
                                  className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteChannel(proj.id, ch.id)}
                                  title="Remove channel mapping"
                                  className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal 1: Register New Project */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d021b]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#1a0833]/90 p-6 shadow-[0_16px_50px_rgba(107,36,155,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="font-bold text-white">Register Ecosystem Application</h3>
              <button
                onClick={() => setIsNewProjectOpen(false)}
                className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Project Slug (Unique identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. wonderlab, subapp-two"
                  value={newProjectSlug}
                  onChange={(e) => setNewProjectSlug(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wonderlab Platform"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Interactive science simulations..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full rounded-2xl border border-white/25 bg-white/[0.12] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-violet-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <GlassButton
                  type="submit"
                  variant="primary"
                  isLoading={creatingProject}
                  className="py-2.5"
                >
                  Register Project
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Map Channel */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d021b]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#1a0833]/90 p-6 shadow-[0_16px_50px_rgba(107,36,155,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="font-bold text-white">Configure Channel Mapping</h3>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="mt-5 space-y-4">
              {channelError && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{channelError}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Event Scope
                </label>
                <select
                  value={channelEventType}
                  onChange={(e) => setChannelEventType(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-[#250e42] px-4 py-2.5 font-mono text-sm text-white focus:border-white/50 focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                >
                  <option value="ci">ci (Continuous Integration alerts)</option>
                  <option value="deploy">deploy (Production deployments)</option>
                  <option value="git">git (Push, PR & releases)</option>
                  <option value="feedback">feedback (Community ideas/proposals)</option>
                  <option value="comment">comment (Moderation & comments)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Slack Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #ci-cd, #deployments"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  Slack Channel ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C0CGL8EBFT2"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
                <span className="ml-2 mt-1 block text-[11px] text-violet-300/60">
                  Right click channel in Slack &rarr; View channel details to copy ID.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-violet-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <GlassButton
                  type="submit"
                  variant="primary"
                  isLoading={savingChannel}
                  className="py-2.5"
                >
                  Save Mapping
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
