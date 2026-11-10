'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, Plus, X, RefreshCw, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { GlassCard } from '../../components/ui/glass-card';
import { GlassButton } from '../../components/ui/glass-button';
import { api, Project } from '../../lib/api';
import { useTranslation } from '../../i18n';

export default function ProjectsPage() {
  const { dict } = useTranslation();
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

      {/* Projects List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-violet-300">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>{dict.projects.loading}</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
          <FolderGit2 className="h-12 w-12 text-violet-400/40" />
          <h3 className="mt-4 text-base font-bold text-white">{dict.projects.no_projects}</h3>
          <p className="mt-1 max-w-sm text-xs text-violet-200/60">
            {dict.projects.no_projects_desc}
          </p>
          <GlassButton
            onClick={() => setIsNewProjectOpen(true)}
            variant="primary"
            className="mt-6 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{dict.projects.register_btn}</span>
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <GlassCard
              key={project.id}
              className="relative overflow-hidden p-6 transition-all hover:border-white/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-violet-500/20 to-purple-500/10 text-violet-300 shadow-inner">
                    <FolderGit2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {project.name}
                    </h3>
                    <p className="font-mono text-xs text-violet-300/80">slug: {project.slug}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-violet-200/70 leading-relaxed min-h-[36px]">
                {project.description || 'Hệ sinh thái Prism Platform service.'}
              </p>

              {/* Metadata Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-violet-300/60 font-mono">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-purple-400" />
                  IAM Connected Service
                </span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

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
