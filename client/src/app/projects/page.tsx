'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, Plus, X, RefreshCw, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { GlassCard } from '../../components/ui/glass-card';
import { GlassButton } from '../../components/ui/glass-button';
import { useDelayedLoading } from '../../lib/hooks/use-delayed-loading';
import { api, Project } from '../../lib/api';
import { useTranslation } from '../../i18n';

export default function ProjectsPage() {
  const { dict } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const showLoading = useDelayedLoading(loading, { delay: 180, minDuration: 250 });

  // New Project Modal State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectSlug, setNewProjectSlug] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{dict.projects.badge}</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {dict.projects.title}
          </h1>
          <p className="mt-1 text-sm text-violet-200/70">{dict.projects.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>

          <GlassButton
            onClick={() => setIsNewProjectOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{dict.projects.register_btn}</span>
          </GlassButton>
        </div>
      </div>

      {/* Projects Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs min-w-[760px]">
            <thead className="border-b border-white/10 bg-white/[0.04] font-mono uppercase tracking-wider text-violet-300/80 whitespace-nowrap">
              <tr>
                <th className="w-[26%] px-6 py-4">{dict.projects.field_name}</th>
                <th className="w-[18%] px-6 py-4">{dict.projects.field_slug}</th>
                <th className="w-[30%] px-6 py-4">{dict.projects.field_desc}</th>
                <th className="w-[14%] px-6 py-4 text-center">{dict.users.status}</th>
                <th className="w-[12%] px-6 py-4 text-right">{dict.users.created_at}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 transition-opacity duration-300">
              {loading ? (
                showLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-violet-300/60 animate-in fade-in-0 duration-200"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-purple-300" />
                        <span>{dict.projects.loading}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  [1, 2, 3].map((idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-white/10" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-4 w-32 rounded bg-white/10" />
                            <div className="h-3 w-24 rounded bg-white/5" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 rounded bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-48 rounded bg-white/10" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="mx-auto h-5 w-16 rounded-full bg-white/10" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="ml-auto h-4 w-20 rounded bg-white/10" />
                      </td>
                    </tr>
                  ))
                )
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center animate-in fade-in-0 duration-200">
                    <FolderGit2 className="mx-auto h-10 w-10 text-violet-400/30" />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {dict.projects.no_projects}
                    </p>
                    <p className="mt-1 text-xs text-violet-200/50">
                      {dict.projects.no_projects_desc}
                    </p>
                    <GlassButton
                      onClick={() => setIsNewProjectOpen(true)}
                      variant="primary"
                      className="mt-5 inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{dict.projects.register_btn}</span>
                    </GlassButton>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="transition-colors duration-200 hover:bg-white/[0.03]"
                  >
                    {/* Application Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-purple-500/20 to-indigo-500/10 font-mono text-sm font-bold text-white shadow-inner">
                          {project.slug.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-white text-xs">
                            {project.name}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px] text-violet-300/60">
                            <Shield className="h-3 w-3 text-purple-400 shrink-0" />
                            IAM Connected
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4">
                      <code className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-xs text-purple-300">
                        {project.slug}
                      </code>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <p
                        className="truncate text-xs text-violet-200/80"
                        title={project.description || undefined}
                      >
                        {project.description || (
                          <span className="text-violet-400/40 italic">
                            Hệ sinh thái Prism Platform service
                          </span>
                        )}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                          project.isActive
                            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border border-rose-500/30 bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            project.isActive
                              ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                              : 'bg-rose-400'
                          }`}
                        />
                        {project.isActive ? dict.common.active : dict.common.disabled}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 text-right font-mono text-violet-300/60">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal: Register Project */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d021b]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#1a0833]/90 p-6 shadow-[0_16px_50px_rgba(107,36,155,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="font-bold text-white">{dict.projects.modal_register_title}</h3>
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
                  {dict.projects.field_slug}
                </label>
                <input
                  type="text"
                  required
                  placeholder={dict.projects.field_slug_placeholder}
                  value={newProjectSlug}
                  onChange={(e) => setNewProjectSlug(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  {dict.projects.field_name}
                </label>
                <input
                  type="text"
                  required
                  placeholder={dict.projects.field_name_placeholder}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block font-mono text-xs uppercase tracking-wider text-violet-300">
                  {dict.projects.field_desc}
                </label>
                <textarea
                  rows={3}
                  placeholder={dict.projects.field_desc_placeholder}
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
                  {dict.common.cancel}
                </button>
                <GlassButton
                  type="submit"
                  variant="primary"
                  isLoading={creatingProject}
                  className="py-2.5"
                >
                  {dict.projects.register_btn}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
