import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  label?: string;
  error?: string;
}

export function GlassInput({
  icon,
  iconPosition = 'right',
  label,
  error,
  className,
  id,
  ...props
}: GlassInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-violet-200/90 ml-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <span className="pointer-events-none absolute left-4 text-violet-200/70">{icon}</span>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full rounded-full border border-white/25 bg-white/[0.12] py-3.5 text-sm text-white placeholder-white/50 transition-all duration-200 backdrop-blur-md',
              'focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25',
              iconPosition === 'left' ? 'pl-11 pr-5' : 'pl-5 pr-11',
              error && 'border-rose-400/80 focus:border-rose-400 focus:ring-rose-400/20',
              className,
            ),
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span className="pointer-events-none absolute right-4 text-violet-200/70">{icon}</span>
        )}
      </div>
      {error && <p className="ml-4 text-xs font-medium text-rose-300">{error}</p>}
    </div>
  );
}
