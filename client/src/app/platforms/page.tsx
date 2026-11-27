'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassSelect } from '@/components/ui/glass-select';
import { api, PlatformLinkCategory, PlatformLinkEnvironment, PlatformLinkItem } from '@/lib/api';
import { useTranslation } from '@/i18n';

const CATEGORY_ORDER: readonly PlatformLinkCategory[] = [
  'apps',
  'infra',
  'source',
  'auth_notify',
  'ai_standup',
  'planned',
] as const;

export default function PlatformsDirectoryPage() {
  const { dict } = useTranslation();
  const [links, setLinks] = useState<PlatformLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PlatformLinkCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal state (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PlatformLinkItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [titleInput, setTitleInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<PlatformLinkCategory>('infra');
  const [environmentInput, setEnvironmentInput] = useState<PlatformLinkEnvironment>('ALL');
  const [urlInput, setUrlInput] = useState('');
  const [secondaryUrlInput, setSecondaryUrlInput] = useState('');
  const [secondaryLabelInput, setSecondaryLabelInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [accountNoteInput, setAccountNoteInput] = useState('');
  const [sortOrderInput, setSortOrderInput] = useState('50');
  const [isActiveInput, setIsActiveInput] = useState(true);

  const loadLinks = useCallback(async () => {
    try {
      const data = await api.getPlatformLinks();
      setLinks(data);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dict.common.error]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return links.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false) ||
        (item.accountNote?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [links, selectedCategory, search]);

  const groupedLinks = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: dict.platforms.categories[category],
      items: filteredLinks.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filteredLinks, dict.platforms.categories]);

  const openCreateModal = () => {
    setEditingLink(null);
    setConfirmDelete(false);
    setTitleInput('');
    setSlugInput('');
    setCategoryInput(selectedCategory === 'all' ? 'infra' : selectedCategory);
    setEnvironmentInput('ALL');
    setUrlInput('https://');
    setSecondaryUrlInput('');
    setSecondaryLabelInput('');
    setDescriptionInput('');
    setAccountNoteInput('');
    setSortOrderInput('50');
    setIsActiveInput(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PlatformLinkItem) => {
    setEditingLink(item);
    setConfirmDelete(false);
    setTitleInput(item.title);
    setSlugInput(item.slug);
    setCategoryInput(item.category);
    setEnvironmentInput(item.environment);
    setUrlInput(item.url);
    setSecondaryUrlInput(item.secondaryUrl ?? '');
    setSecondaryLabelInput(item.secondaryLabel ?? '');
    setDescriptionInput(item.description ?? '');
    setAccountNoteInput(item.accountNote ?? '');
    setSortOrderInput(String(item.sortOrder));
    setIsActiveInput(item.isActive);
    setIsModalOpen(true);
  };

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      setFeedback({ type: 'err', text: 'Clipboard permission denied' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const parsedOrder = Number.parseInt(sortOrderInput, 10);
    const sortOrder = Number.isNaN(parsedOrder) ? 50 : Math.min(Math.max(parsedOrder, 0), 9999);

    try {
      if (editingLink) {
        await api.updatePlatformLink(editingLink.id, {
          title: titleInput.trim(),
          category: categoryInput,
          url: urlInput.trim(),
          secondaryUrl: secondaryUrlInput.trim() || null,
          secondaryLabel: secondaryLabelInput.trim() || null,
          description: descriptionInput.trim() || null,
          accountNote: accountNoteInput.trim() || null,
          environment: environmentInput,
          sortOrder,
          isActive: isActiveInput,
        });
      } else {
        await api.createPlatformLink({
          slug: slugInput.trim() || undefined,
          title: titleInput.trim(),
          category: categoryInput,
          url: urlInput.trim(),
          secondaryUrl: secondaryUrlInput.trim() || undefined,
          secondaryLabel: secondaryLabelInput.trim() || undefined,
          description: descriptionInput.trim() || undefined,
          accountNote: accountNoteInput.trim() || undefined,
          environment: environmentInput,
          sortOrder,
          isActive: isActiveInput,
        });
      }

      setIsModalOpen(false);
      setFeedback({ type: 'ok', text: `${dict.common.success}: ${titleInput.trim()}` });
      await loadLinks();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLink) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.deletePlatformLink(editingLink.id);
      setIsModalOpen(false);
      setFeedback({ type: 'ok', text: `${dict.common.success}: ${editingLink.title}` });
      await loadLinks();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : dict.common.error,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = CATEGORY_ORDER.map((category) => ({
    value: category,
    label: dict.platforms.categories[category],
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" />
            <span>{dict.platforms.badge}</span>
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {dict.platforms.title}
          </h1>
          <p className="mt-1 text-sm text-violet-200/75">{dict.platforms.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadLinks();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>

          <GlassButton
            type="button"
            onClick={openCreateModal}
            className="gap-2 px-5 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{dict.platforms.add_btn}</span>
          </GlassButton>
        </div>
      </div>

      {/* Search & Category Filter */}
      <GlassCard className="mb-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <GlassInput
              icon={<Search className="h-4 w-4" />}
              iconPosition="left"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.platforms.search_placeholder}
              className="py-2.5 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', ...CATEGORY_ORDER] as const).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-400/60 bg-purple-500/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'border-white/15 bg-white/[0.06] text-violet-200/75 hover:bg-white/[0.12] hover:text-white'
                  }`}
                >
                  {dict.platforms.categories[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs backdrop-blur-md ${
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

      {/* Links Directory */}
      {loading ? (
        <GlassCard className="p-8 text-center text-xs text-violet-200/75">
          {dict.common.loading}
        </GlassCard>
      ) : groupedLinks.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Compass className="mx-auto h-10 w-10 text-purple-300/60" />
          <h2 className="mt-3 text-base font-bold text-white">{dict.platforms.no_links}</h2>
          <p className="mt-1 text-xs text-violet-200/70">{dict.platforms.no_links_desc}</p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {groupedLinks.map((group) => (
            <section key={group.category} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-bold tracking-tight text-white">{group.label}</h2>
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-violet-200/80">
                  {group.items.length}
                </span>
              </div>

              <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] table-fixed text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.04] font-mono uppercase tracking-wider text-violet-300/80 whitespace-nowrap">
                      <tr>
                        <th className="w-[27%] px-5 py-3.5">{dict.platforms.field_title}</th>
                        <th className="w-[33%] px-5 py-3.5">{dict.platforms.field_url}</th>
                        <th className="w-[27%] px-5 py-3.5">{dict.platforms.note_label}</th>
                        <th className="w-[13%] px-5 py-3.5 text-right">{dict.common.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {group.items.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-white/[0.04] ${
                            item.isActive ? '' : 'opacity-60'
                          }`}
                        >
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white">{item.title}</span>
                              <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-purple-200">
                                {item.environment}
                              </span>
                              {!item.isActive && (
                                <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
                                  {dict.platforms.inactive_badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="mt-1 truncate text-xs text-violet-200/75">
                                {item.description}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate font-mono text-xs text-purple-200 underline decoration-purple-400/40 underline-offset-2 hover:text-white"
                            >
                              {item.url}
                            </a>
                            {item.secondaryUrl && (
                              <a
                                href={item.secondaryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-violet-300/80 hover:text-white"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span>{item.secondaryLabel || 'Docs'}</span>
                              </a>
                            )}
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            {item.accountNote ? (
                              <div className="flex items-start gap-1.5 text-xs text-violet-100/85">
                                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                                <span className="line-clamp-2 break-words">{item.accountNote}</span>
                              </div>
                            ) : (
                              <span className="text-violet-300/50">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 align-middle text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={dict.platforms.open_primary}
                                aria-label={`${dict.platforms.open_primary} ${item.title}`}
                                className="inline-flex items-center justify-center rounded-full bg-white p-1.5 text-[#250b45] shadow-sm transition hover:bg-white/90"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              <button
                                type="button"
                                onClick={() => void handleCopyUrl(item.id, item.url)}
                                title={
                                  copiedId === item.id
                                    ? dict.platforms.copied
                                    : dict.platforms.copy_url
                                }
                                aria-label={`${dict.platforms.copy_url} ${item.title}`}
                                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] p-1.5 text-violet-200 transition hover:bg-white/15 hover:text-white cursor-pointer"
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title={dict.platforms.edit_btn}
                                aria-label={`${dict.platforms.edit_btn} ${item.title}`}
                                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-1.5 text-white transition hover:bg-white/20 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </section>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
        >
          <GlassCard className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="platform-modal-title" className="text-lg font-black text-white">
                {editingLink ? dict.platforms.modal_edit_title : dict.platforms.modal_create_title}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-violet-200/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GlassInput
                  label={dict.platforms.field_title}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Vercel Dashboard"
                  required
                />

                <GlassInput
                  label={dict.platforms.field_slug}
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="vercel-dashboard"
                  disabled={Boolean(editingLink)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 ml-2 block text-xs font-medium text-violet-200/90">
                    {dict.platforms.field_category}
                  </label>
                  <GlassSelect
                    value={categoryInput}
                    onChange={(val) => setCategoryInput(val as PlatformLinkCategory)}
                    options={categoryOptions}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 ml-2 block text-xs font-medium text-violet-200/90">
                    {dict.platforms.field_environment}
                  </label>
                  <GlassSelect
                    value={environmentInput}
                    onChange={(val) => setEnvironmentInput(val as PlatformLinkEnvironment)}
                    options={[
                      { value: 'ALL', label: 'ALL' },
                      { value: 'PRODUCTION', label: 'PRODUCTION' },
                      { value: 'LOCAL', label: 'LOCAL' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <GlassInput
                label={dict.platforms.field_url}
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://vercel.com/thanhbas-projects"
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <GlassInput
                    label={dict.platforms.field_secondary_url}
                    type="url"
                    value={secondaryUrlInput}
                    onChange={(e) => setSecondaryUrlInput(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <GlassInput
                  label={dict.platforms.field_secondary_label}
                  value={secondaryLabelInput}
                  onChange={(e) => setSecondaryLabelInput(e.target.value)}
                  placeholder="Swagger Docs"
                />
              </div>

              <GlassInput
                label={dict.platforms.field_description}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Mô tả vai trò của nền tảng này..."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <GlassInput
                    label={dict.platforms.field_account_note}
                    value={accountNoteInput}
                    onChange={(e) => setAccountNoteInput(e.target.value)}
                    placeholder="Mail đăng ký / nơi lưu env..."
                  />
                </div>
                <GlassInput
                  label={dict.platforms.field_sort_order}
                  type="number"
                  min={0}
                  max={9999}
                  value={sortOrderInput}
                  onChange={(e) => setSortOrderInput(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2.5 px-2 text-xs text-violet-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActiveInput}
                  onChange={(e) => setIsActiveInput(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-white/10 accent-purple-400"
                />
                <span>{dict.platforms.field_active}</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                {editingLink ? (
                  confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleDelete()}
                        className="rounded-full border border-rose-400/50 bg-rose-500/30 px-4 py-2 text-xs font-bold text-rose-100 hover:bg-rose-500/45 cursor-pointer"
                      >
                        {dict.platforms.confirm_delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20 cursor-pointer"
                      >
                        {dict.common.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{dict.common.delete}</span>
                    </button>
                  )
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-3">
                  <GlassButton
                    type="button"
                    variant="glass"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs"
                  >
                    {dict.common.cancel}
                  </GlassButton>
                  <GlassButton type="submit" isLoading={submitting} className="px-6 py-2.5 text-xs">
                    {dict.common.save}
                  </GlassButton>
                </div>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
