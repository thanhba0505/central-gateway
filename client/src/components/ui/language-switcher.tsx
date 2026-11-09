'use client';

import * as React from 'react';
import { Languages, Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown';
  className?: string;
}

export function LanguageSwitcher({ variant = 'toggle', className }: LanguageSwitcherProps) {
  const { locale, setLocale, dict } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'toggle') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] p-0.5 backdrop-blur-md shadow-sm',
          className,
        )}
        role="group"
        aria-label={dict.common.language}
      >
        <button
          type="button"
          onClick={() => setLocale('vi')}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.98]',
            locale === 'vi'
              ? 'bg-purple-500/30 text-white border border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
              : 'text-violet-200/70 hover:text-white hover:bg-white/10',
          )}
          aria-pressed={locale === 'vi'}
        >
          <span>VI</span>
          <span className="sr-only">{dict.common.vietnamese}</span>
        </button>
        <button
          type="button"
          onClick={() => setLocale('en')}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.98]',
            locale === 'en'
              ? 'bg-purple-500/30 text-white border border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
              : 'text-violet-200/70 hover:text-white hover:bg-white/10',
          )}
          aria-pressed={locale === 'en'}
        >
          <span>EN</span>
          <span className="sr-only">{dict.common.english}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-xs font-mono font-semibold text-violet-200 backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15 hover:text-white active:scale-[0.98]"
        aria-label={dict.common.language}
        aria-expanded={isOpen}
      >
        <Languages className="h-3.5 w-3.5 text-purple-300" />
        <span className="uppercase tracking-wider">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/15 bg-[#180733]/95 p-1.5 shadow-[0_12px_45px_rgba(16,3,32,0.85)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-violet-300/60 border-b border-white/10 mb-1">
            {dict.common.language}
          </div>
          <button
            type="button"
            onClick={() => {
              setLocale('vi');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors',
              locale === 'vi'
                ? 'bg-purple-500/25 text-white font-semibold'
                : 'text-violet-200/80 hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-purple-300">[VI]</span>
              <span>{dict.common.vietnamese}</span>
            </span>
            {locale === 'vi' && <Check className="h-3.5 w-3.5 text-purple-300" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setLocale('en');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors',
              locale === 'en'
                ? 'bg-purple-500/25 text-white font-semibold'
                : 'text-violet-200/80 hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-purple-300">[EN]</span>
              <span>{dict.common.english}</span>
            </span>
            {locale === 'en' && <Check className="h-3.5 w-3.5 text-purple-300" />}
          </button>
        </div>
      )}
    </div>
  );
}
