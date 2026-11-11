import * as React from 'react';

export interface UseDelayedLoadingOptions {
  /**
   * Delay in milliseconds before setting `showLoading` to true.
   * If `isLoading` becomes false before this delay passes, `showLoading` never turns true.
   * Default: 180ms.
   */
  delay?: number;

  /**
   * Minimum duration in milliseconds to keep `showLoading` true once it has been shown.
   * Prevents micro-flashes/jitter when an operation completes shortly after the delay threshold.
   * Default: 250ms.
   */
  minDuration?: number;
}

/**
 * Hook to prevent visual flickering on rapid loading state transitions.
 *
 * 1. Grace Period (delay): Defers showing the loader until `delay` ms has elapsed.
 *    Operations completing before this threshold produce zero flicker.
 * 2. Hold Duration (minDuration): Once displayed, keeps the loader visible for at least
 *    `minDuration` ms to prevent jarring flashes.
 */
export function useDelayedLoading(
  isLoading: boolean,
  { delay = 180, minDuration = 250 }: UseDelayedLoadingOptions = {},
): boolean {
  const [showLoading, setShowLoading] = React.useState<boolean>(() => {
    return delay <= 0 && isLoading;
  });

  const shownAtRef = React.useRef<number | null>(delay <= 0 && isLoading ? Date.now() : null);
  const delayTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const minDurationTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current);
        minDurationTimerRef.current = null;
      }

      if (shownAtRef.current !== null) {
        setShowLoading(true);
        return;
      }

      if (delay <= 0) {
        setShowLoading(true);
        shownAtRef.current = Date.now();
      } else {
        delayTimerRef.current = setTimeout(() => {
          setShowLoading(true);
          shownAtRef.current = Date.now();
          delayTimerRef.current = null;
        }, delay);
      }
    } else {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }

      if (shownAtRef.current === null) {
        setShowLoading(false);
        return;
      }

      const elapsed = Date.now() - shownAtRef.current;
      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        minDurationTimerRef.current = setTimeout(() => {
          setShowLoading(false);
          shownAtRef.current = null;
          minDurationTimerRef.current = null;
        }, remaining);
      } else {
        setShowLoading(false);
        shownAtRef.current = null;
      }
    }

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current);
        minDurationTimerRef.current = null;
      }
    };
  }, [isLoading, delay, minDuration]);

  return showLoading;
}
