'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
}

export function GlassSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Chọn một mục...',
  size = 'md',
  className,
  dropdownClassName,
  align = 'left',
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/[0.08] font-mono font-semibold text-white backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-white/[0.14] focus:outline-none focus:ring-2 focus:ring-purple-400/40 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none',
          isSmall ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-xs',
          isOpen && 'border-purple-400/60 bg-white/[0.16] shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        )}
      >
        <span className="flex items-center gap-1.5 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-violet-300 transition-transform duration-200',
            isOpen && 'rotate-180 text-purple-300',
          )}
        />
      </button>

      {/* Animated Dropdown Menu with Expanding Effect */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'absolute z-50 mt-1.5 min-w-[140px] max-w-[260px] overflow-hidden rounded-2xl border border-white/20 bg-[#190733]/98 p-1.5 shadow-[0_16px_50px_rgba(10,2,22,0.9)] backdrop-blur-2xl',
            'origin-top transition-all duration-200 ease-out animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0',
            dropdownClassName,
          )}
        >
          <div className="max-h-56 overflow-y-auto space-y-0.5 focus:outline-none">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all duration-150 cursor-pointer select-none text-left',
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/20 text-white font-bold border border-purple-400/40 shadow-xs'
                      : 'text-violet-200/80 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-purple-300 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
