'use client';

import React, { useState, useEffect } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1300; // 1.3 seconds progress duration

    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 100) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Start fade-out when progress bar completes
        setIsFadingOut(true);
        const timer = setTimeout(() => {
          onComplete();
        }, 300);
        return () => clearTimeout(timer);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#130624] via-[#240a42] to-[#3f1365] transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute h-96 w-96 rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Brand Wordmark Logo */}
        <div className="flex items-center gap-3 select-none">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
            Central
          </span>
          <span className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(192,132,252,0.4)]">
            Gateway
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,1)] animate-pulse" />
        </div>

        {/* Subtitle */}
        <p className="mt-3 font-mono text-xs sm:text-sm tracking-widest text-violet-300/80 uppercase">
          SSO IAM &amp; Platform Hub
        </p>

        {/* Sleek Glowing Progress Bar (Strictly no % text or other labels) */}
        <div className="mt-8 h-1.5 w-64 sm:w-80 overflow-hidden rounded-full border border-white/15 bg-white/10 p-[1px] shadow-[0_0_25px_rgba(168,85,247,0.25)] backdrop-blur-md">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 shadow-[0_0_12px_rgba(216,180,254,0.9)] transition-[width] duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
