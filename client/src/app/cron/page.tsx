'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Folder,
  History,
  KeyRound,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassSelect } from '@/components/ui/glass-select';
import {
  api,
  CronBrokerStatus,
  CronFolderItem,
  CronHistoryEntry,
  CronHttpMethod,
  CronJobItem,
  CronSchedule,
  CronTriggerResult,
} from '@/lib/api';
import { useTranslation } from '@/i18n';

type SchedulePreset = 'every_10m' | 'every_15m' | 'daily_20h' | 'custom';

function formatScheduleSummary(schedule: CronSchedule): string {
  const { hours, minutes, timezone } = schedule;
  const h0 = hours[0];
  const m0 = minutes[0];
  const m1 = minutes[1];

  if (hours.length === 1 && h0 === -1 && m0 !== undefined && m1 !== undefined) {
    const step = m1 - m0;
    if (step > 0) {
      return `Every ${step}m (${timezone})`;
    }
  }
  if (
    hours.length === 1 &&
    h0 !== undefined &&
    h0 >= 0 &&
    minutes.length === 1 &&
    m0 !== undefined &&
    m0 >= 0
  ) {
    const hh = String(h0).padStart(2, '0');
    const mm = String(m0).padStart(2, '0');
    return `${hh}:${mm} daily (${timezone})`;
  }
  return `h:[${hours.join(',')}] m:[${minutes.join(',')}] (${timezone})`;
}

function parseNumberList(raw: string, fallback: number[]): number[] {
  const parsed = raw
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((num) => !Number.isNaN(num));
  return parsed.length > 0 ? parsed : fallback;
}

export default function CronJobsPage() {
  const { dict } = useTranslation();
  const [status, setStatus] = useState<CronBrokerStatus | null>(null);
  const [folders, setFolders] = useState<CronFolderItem[]>([]);
  const [jobs, setJobs] = useState<CronJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingFolders, setSyncingFolders] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Create / Sync Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceSlug, setServiceSlug] = useState('central-gateway');
  const [jobKey, setJobKey] = useState('health-check');
  const [title, setTitle] = useState('Central Gateway Health Check');
  const [endpointPath, setEndpointPath] = useState('/health');
  const [httpMethod, setHttpMethod] = useState<CronHttpMethod>('GET');
  const [preset, setPreset] = useState<SchedulePreset>('every_10m');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [hoursInput, setHoursInput] = useState('-1');
  const [minutesInput, setMinutesInput] = useState('0,10,20,30,40,50');
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [enabledInput, setEnabledInput] = useState(false);

  // Per-row action state
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{
    jobTitle: string;
    result: CronTriggerResult;
  } | null>(null);

  // History modal
  const [historyJob, setHistoryJob] = useState<CronJobItem | null>(null);
  const [historyItems, setHistoryItems] = useState<CronHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [nextStatus, nextFolders, nextJobs] = await Promise.all([
        api.getCronStatus(),
        api.getCronFolders(),
        api.getCronJobs(),
      ]);
      setStatus(nextStatus);
      setFolders(nextFolders);
      setJobs(nextJobs);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to load cron broker state',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setHistoryJob(null);
      }
    }
    if (isModalOpen || historyJob) {
      document.addEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, historyJob]);

  const groupedByFolder = useMemo(() => {
    const groups = new Map<
      string,
      { folderTitle: string; externalId: number | null; jobs: CronJobItem[] }
    >();
    for (const folder of folders) {
      groups.set(folder.folderTitle, {
        folderTitle: folder.folderTitle,
        externalId: folder.externalFolderId,
        jobs: [],
      });
    }
    for (const job of jobs) {
      const key =
        job.folderTitle ||
        `${status?.folderPrefix || 'prism-hub'}-${job.serviceSlug}${status?.folderSuffix || ''}`;
      const existing = groups.get(key) ?? {
        folderTitle: key,
        externalId: job.externalFolderId,
        jobs: [],
      };
      existing.jobs.push(job);
      groups.set(key, existing);
    }
    return Array.from(groups.values());
  }, [folders, jobs, status]);

  const handlePresetChange = (next: SchedulePreset) => {
    setPreset(next);
    if (next === 'every_10m') {
      setHoursInput('-1');
      setMinutesInput('0,10,20,30,40,50');
    } else if (next === 'every_15m') {
      setHoursInput('-1');
      setMinutesInput('0,15,30,45');
    } else if (next === 'daily_20h') {
      setHoursInput('20');
      setMinutesInput('0');
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const headers =
        headerKey.trim() && headerValue.trim()
          ? { [headerKey.trim()]: headerValue.trim() }
          : undefined;

      await api.upsertCronJob({
        serviceSlug,
        jobKey: jobKey.trim(),
        title: title.trim(),
        endpointPath: endpointPath.trim(),
        httpMethod,
        enabled: enabledInput,
        headers,
        schedule: {
          timezone: timezone.trim() || 'Asia/Ho_Chi_Minh',
          hours: parseNumberList(hoursInput, [-1]),
          minutes: parseNumberList(minutesInput, [0]),
          mdays: [-1],
          months: [-1],
          wdays: [-1],
          expiresAt: 0,
        },
      });

      setIsModalOpen(false);
      setHeaderKey('');
      setHeaderValue('');
      setFeedback({ type: 'ok', text: `${dict.common.success}: ${jobKey}` });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (job: CronJobItem) => {
    setBusyId(job.id);
    setFeedback(null);
    try {
      await api.updateCronJob(job.id, { enabled: !job.enabled });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSyncFolders = async () => {
    setSyncingFolders(true);
    setFeedback(null);
    try {
      const synced = await api.syncCronFolders();
      setFeedback({
        type: 'ok',
        text: `${dict.common.success}: ${synced.map((item) => item.folderTitle).join(', ')}`,
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setSyncingFolders(false);
    }
  };

  const handleTriggerNow = async (job: CronJobItem) => {
    setBusyId(job.id);
    setFeedback(null);
    try {
      const result = await api.triggerCronJob(job.id);
      setTriggerResult({ jobTitle: job.title, result });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenHistory = async (job: CronJobItem) => {
    setHistoryJob(job);
    setHistoryLoading(true);
    setHistoryItems([]);
    try {
      const res = await api.getCronJobHistory(job.id);
      setHistoryItems(res.history);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setFeedback(null);
    try {
      await api.deleteCronJob(id);
      setConfirmDeleteId(null);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setBusyId(null);
    }
  };

  const serviceOptions = useMemo(
    () =>
      (status?.availableServices ?? ['central-gateway']).map((slug) => ({
        value: slug,
        label: slug,
      })),
    [status],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{dict.cron.badge}</span>
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {dict.cron.title}
          </h1>
          <p className="mt-1 text-sm text-violet-200/75">{dict.cron.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadData();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSyncFolders()}
            disabled={syncingFolders}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Folder className="h-3.5 w-3.5 text-purple-300" />
            <span>{syncingFolders ? dict.cron.syncing_folders : dict.cron.sync_folders_btn}</span>
          </button>

          <GlassButton
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 px-5 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{dict.cron.create_btn}</span>
          </GlassButton>
        </div>
      </div>

      {/* Status & KPI Strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-violet-300/75">
            cron-job.org API
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status?.configured
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-rose-400 shadow-[0_0_8px_#fb7185]'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {status?.configured ? dict.cron.configured_ok : dict.cron.configured_missing}
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-violet-300/75">
            {dict.cron.folder_pattern} ({status?.environment || 'development'})
          </p>
          <p className="mt-2 font-mono text-sm font-bold text-purple-200">
            {status
              ? `${status.folderPrefix}-<service>${status.folderSuffix}`
              : 'prism-hub-<service>-test'}
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-violet-300/75">
            {dict.cron.total_folders} / {dict.cron.total_jobs}
          </p>
          <p className="mt-2 font-mono text-2xl font-black text-white">
            {folders.length} <span className="text-sm font-medium text-violet-300/70">/</span>{' '}
            {jobs.length}
          </p>
        </GlassCard>
      </div>

      {/* Feedback & Manual Trigger Result */}
      {feedback && (
        <div
          className={`mb-5 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs backdrop-blur-md ${
            feedback.type === 'ok'
              ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-400/35 bg-rose-500/15 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {triggerResult && (
        <GlassCard className="mb-6 border-purple-400/35 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Zap className="h-4 w-4 text-amber-300" />
                <span>
                  {triggerResult.jobTitle} — HTTP {triggerResult.result.httpStatus} (
                  {triggerResult.result.latencyMs}ms)
                </span>
              </div>
              <p className="font-mono text-xs text-violet-200/70">
                {triggerResult.result.targetUrl}
              </p>
              {triggerResult.result.bodyPreview && (
                <pre className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-[#130624]/80 p-3 font-mono text-xs text-violet-100">
                  {triggerResult.result.bodyPreview}
                </pre>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTriggerResult(null)}
              className="text-violet-200/70 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Folder & Jobs List */}
      {loading ? (
        <GlassCard className="p-8 text-center text-xs text-violet-200/75">
          {dict.common.loading}
        </GlassCard>
      ) : groupedByFolder.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-purple-300/60" />
          <h2 className="mt-3 text-base font-bold text-white">{dict.cron.no_jobs}</h2>
          <p className="mt-1 text-xs text-violet-200/70">{dict.cron.no_jobs_desc}</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {groupedByFolder.map((group) => (
            <GlassCard key={group.folderTitle} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Folder className="h-4 w-4 text-purple-300" />
                  <span className="font-mono text-sm font-bold text-white">
                    {group.folderTitle}
                  </span>
                  {group.externalId !== null && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-xs text-violet-200/80">
                      #{group.externalId}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-violet-300/80">
                  {group.jobs.length} jobs
                </span>
              </div>

              <div className="divide-y divide-white/10">
                {group.jobs.map((job) => {
                  const isBusy = busyId === job.id;
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col justify-between gap-4 px-6 py-4 lg:flex-row lg:items-center"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              job.enabled
                                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                : 'border-white/20 bg-white/10 text-violet-200/75'
                            }`}
                          >
                            {job.enabled ? dict.common.active : dict.common.disabled}
                          </span>
                          <span className="rounded-md border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 font-mono text-xs font-bold text-purple-200">
                            {job.httpMethod}
                          </span>
                          <span className="text-sm font-bold text-white">{job.title}</span>
                          <span className="font-mono text-xs text-violet-300/70">
                            ({job.jobKey})
                          </span>
                        </div>

                        <p className="truncate font-mono text-xs text-violet-200/80">
                          {job.targetUrl}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-violet-200/70">
                          <span className="font-mono">{formatScheduleSummary(job.schedule)}</span>
                          {job.headerKeys.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-violet-200">
                              <KeyRound className="h-3 w-3" />
                              {job.headerKeys.join(', ')}
                            </span>
                          )}
                          {job.lastTriggerStatus !== null && (
                            <span className="font-mono text-xs text-violet-200/80">
                              {dict.cron.last_trigger}: HTTP {job.lastTriggerStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleToggleEnabled(job)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 cursor-pointer"
                        >
                          {job.enabled ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              <span>{dict.cron.pause}</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              <span>{dict.cron.enable}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleTriggerNow(job)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50 cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>{isBusy ? dict.cron.triggering : dict.cron.trigger_now}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleOpenHistory(job)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-white/20 disabled:opacity-50 cursor-pointer"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>{dict.cron.history}</span>
                        </button>

                        {confirmDeleteId === job.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDelete(job.id)}
                              className="rounded-full border border-rose-400/50 bg-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-100 hover:bg-rose-500/45 cursor-pointer"
                            >
                              {dict.cron.confirm_delete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/20 cursor-pointer"
                            >
                              {dict.common.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmDeleteId(job.id)}
                            aria-label={dict.common.delete}
                            className="inline-flex items-center rounded-full border border-rose-400/25 bg-rose-500/10 p-1.5 text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create / Upsert Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cron-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
        >
          <GlassCard className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="cron-modal-title" className="text-lg font-black text-white">
                {dict.cron.modal_title}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-violet-200/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status?.environment !== 'production' && (
              <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                {dict.cron.localhost_notice}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmitCreate(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 ml-2 block text-xs font-medium text-violet-200/90">
                    {dict.cron.field_service}
                  </label>
                  <GlassSelect
                    value={serviceSlug}
                    onChange={setServiceSlug}
                    options={serviceOptions}
                    className="w-full"
                  />
                </div>

                <GlassInput
                  label={dict.cron.field_job_key}
                  value={jobKey}
                  onChange={(e) => setJobKey(e.target.value)}
                  placeholder="daily-standup-tick"
                  required
                />
              </div>

              <GlassInput
                label={dict.cron.field_title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Git Pulse Daily Standup Tick"
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <GlassInput
                    label={dict.cron.field_path}
                    value={endpointPath}
                    onChange={(e) => setEndpointPath(e.target.value)}
                    placeholder="/health"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 ml-2 block text-xs font-medium text-violet-200/90">
                    {dict.cron.field_method}
                  </label>
                  <GlassSelect
                    value={httpMethod}
                    onChange={(val) => setHttpMethod(val as CronHttpMethod)}
                    options={[
                      { value: 'GET', label: 'GET' },
                      { value: 'POST', label: 'POST' },
                      { value: 'PUT', label: 'PUT' },
                      { value: 'PATCH', label: 'PATCH' },
                      { value: 'DELETE', label: 'DELETE' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 ml-2 block text-xs font-medium text-violet-200/90">
                    {dict.cron.field_preset}
                  </label>
                  <GlassSelect
                    value={preset}
                    onChange={(val) => handlePresetChange(val as SchedulePreset)}
                    options={[
                      { value: 'every_10m', label: dict.cron.preset_every_10m },
                      { value: 'every_15m', label: dict.cron.preset_every_15m },
                      { value: 'daily_20h', label: dict.cron.preset_daily_20h },
                      { value: 'custom', label: dict.cron.preset_custom },
                    ]}
                    className="w-full"
                  />
                </div>

                <GlassInput
                  label={dict.cron.field_timezone}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Ho_Chi_Minh"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GlassInput
                  label={dict.cron.field_hours}
                  value={hoursInput}
                  onChange={(e) => {
                    setPreset('custom');
                    setHoursInput(e.target.value);
                  }}
                />
                <GlassInput
                  label={dict.cron.field_minutes}
                  value={minutesInput}
                  onChange={(e) => {
                    setPreset('custom');
                    setMinutesInput(e.target.value);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GlassInput
                  label={dict.cron.field_header_key}
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="X-Cron-Secret"
                />
                <GlassInput
                  label={dict.cron.field_header_value}
                  type="password"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <label className="flex items-center gap-2.5 px-2 text-xs text-violet-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledInput}
                  onChange={(e) => setEnabledInput(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-white/10 accent-purple-400"
                />
                <span>{dict.cron.field_enabled}</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <GlassButton
                  type="button"
                  variant="glass"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs"
                >
                  {dict.common.cancel}
                </GlassButton>
                <GlassButton type="submit" isLoading={submitting} className="px-6 py-2.5 text-xs">
                  {dict.cron.submit_create}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* History Modal */}
      {historyJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cron-history-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
        >
          <GlassCard className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="cron-history-title" className="text-base font-black text-white">
                  {dict.cron.history_title}
                </h2>
                <p className="font-mono text-xs text-violet-200/75">{historyJob.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryJob(null)}
                className="rounded-full p-1.5 text-violet-200/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {historyLoading ? (
              <p className="py-6 text-center text-xs text-violet-200/75">{dict.common.loading}</p>
            ) : historyItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-violet-200/75">{dict.cron.no_history}</p>
            ) : (
              <div className="divide-y divide-white/10">
                {historyItems.map((entry, idx) => (
                  <div
                    key={entry.jobLogId ?? `${entry.date}-${idx}`}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <span className="font-mono text-violet-200">
                      {new Date(entry.date * 1000).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-violet-300/80">{entry.duration}ms</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          entry.status === 1
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/20 text-rose-200'
                        }`}
                      >
                        HTTP {entry.httpStatus ?? entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
