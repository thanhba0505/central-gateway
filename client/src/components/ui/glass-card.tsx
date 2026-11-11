import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'deep';
  glow?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  glow = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-3xl border transition-all duration-200 backdrop-blur-2xl',
          variant === 'default' &&
            'border-white/20 bg-white/[0.08] shadow-[0_8px_32px_0_rgba(140,56,201,0.25)]',
          variant === 'interactive' &&
            'border-white/18 bg-white/[0.07] hover:border-white/35 hover:bg-white/[0.12] hover:shadow-[0_8px_30px_rgba(140,56,201,0.3)]',
          variant === 'deep' &&
            'border-white/15 bg-[#120524]/60 shadow-[0_12px_40px_rgba(0,0,0,0.4)]',
          glow && 'ring-1 ring-violet-400/30 shadow-[0_0_40px_rgba(168,85,247,0.25)]',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  );
}
