import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost';
  isLoading?: boolean;
}

export function GlassButton({
  children,
  variant = 'primary',
  isLoading = false,
  className,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
          variant === 'primary' &&
            'bg-white text-[#250b45] shadow-[0_0_24px_rgba(255,255,255,0.45)] hover:bg-[#f8f6fc] hover:shadow-[0_0_32px_rgba(255,255,255,0.65)] hover:-translate-y-0.5',
          variant === 'glass' &&
            'border border-white/25 bg-white/[0.12] text-white backdrop-blur-md hover:border-white/45 hover:bg-white/[0.2] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
          variant === 'ghost' && 'text-violet-200 hover:bg-white/10 hover:text-white',
          className,
        ),
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
