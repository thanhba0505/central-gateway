'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, Plus, Trash2, Edit2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Navigation } from '../../components/navigation';
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
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Projects & Channel Routing
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Configure destination Slack channels for each event type across your ecosystem
              services.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register Project</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-sm font-mono text-slate-500">
            Loading registered projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400">
            <FolderGit2 className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No projects found</h3>
            <p className="mt-1 text-sm">
              Register your first project to start routing notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden"
              >
                {/* Project Header Bar */}
                <div className="border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 font-mono text-lg font-bold text-cyan-400">
                      {proj.slug.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-white text-base">{proj.name}</h2>
                        <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
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
                      <p className="text-xs text-slate-400 mt-0.5">
                        {proj.description || 'Central platform module'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(proj)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                        proj.isActive
                          ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {proj.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openChannelModal(proj.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Map Channel</span>
                    </button>
                  </div>
                </div>

                {/* Mapped Channels Table */}
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                          <th className="pb-3 font-medium">Event Type</th>
                          <th className="pb-3 font-medium">Slack Channel Name</th>
                          <th className="pb-3 font-medium">Channel ID</th>
                          <th className="pb-3 font-medium">Provider</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {proj.channels?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">
                              No channel mappings defined for this project. Fallback routes will be
                              used.
                            </td>
                          </tr>
                        ) : (
                          proj.channels?.map((ch) => (
                            <tr key={ch.id} className="hover:bg-slate-800/20">
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1.5 font-bold text-white uppercase rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/60">
                                  {ch.eventType}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-cyan-300">{ch.channelName}</td>
                              <td className="py-3 text-slate-400">{ch.channelId}</td>
                              <td className="py-3">
                                <span className="rounded bg-slate-950 px-2 py-0.5 text-slate-400 border border-slate-800">
                                  {ch.provider}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => openChannelModal(proj.id, ch)}
                                    title="Edit channel mapping"
                                    className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChannel(proj.id, ch.id)}
                                    title="Remove channel mapping"
                                    className="p-1 rounded text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
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
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal 1: Register New Project */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-semibold text-white">Register Ecosystem Project</h3>
              <button
                onClick={() => setIsNewProjectOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              {createError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Project Slug (Unique identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. wonderlab, mobile-app"
                  value={newProjectSlug}
                  onChange={(e) => setNewProjectSlug(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wonderlab Platform"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Interactive science simulations..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {creatingProject ? 'Registering...' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Map Channel */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-semibold text-white">Configure Channel Mapping</h3>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="mt-4 space-y-4">
              {channelError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{channelError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Event Scope
                </label>
                <select
                  value={channelEventType}
                  onChange={(e) => setChannelEventType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="ci">ci (Continuous Integration alerts)</option>
                  <option value="deploy">deploy (Production deployments)</option>
                  <option value="git">git (Push, PR & releases)</option>
                  <option value="feedback">feedback (Community ideas/proposals)</option>
                  <option value="comment">comment (Moderation & comments)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #ci-cd, #deployments"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Slack Channel ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C0CGL8EBFT2"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Find Channel ID in Slack by right clicking channel &rarr; Copy link / View channel
                  details.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChannel}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {savingChannel ? 'Saving...' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
