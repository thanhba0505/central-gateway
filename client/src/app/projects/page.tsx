'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, RefreshCw, Shield } from 'lucide-react';
import { GlassCard } from '../../components/ui/glass-card';
import { api, Project } from '../../lib/api';
import { useTranslation } from '../../i18n';

export default function ProjectsPage() {
  const { dict } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {dict.projects.title}
          </h1>
          <p className="mt-1 text-sm text-violet-200/70">{dict.projects.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
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
                          <span className="text-violet-400/40 italic">Dịch vụ nền tảng Prism</span>
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
    </div>
  );
}
