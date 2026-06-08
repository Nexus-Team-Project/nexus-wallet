/**
 * Generic 1-second countdown used for OTP validity timers so the UI mirrors the
 * backend code expiry (10 minutes). Counts from `seconds` down to 0; `reset()`
 * restarts it (call on every (re)send of a code).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Formats a duration in seconds as `m:ss` (e.g. 9:05). */
export function formatMmSs(total: number): string {
  const safe = Math.max(0, total);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * @param seconds the starting duration.
 * @returns the remaining seconds (0 when elapsed) and a reset() to restart.
 */
export function useCountdown(seconds: number): { remaining: number; reset: () => void } {
  const [remaining, setRemaining] = useState(seconds);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Starts (or restarts) the per-second ticker. No synchronous setState here -
  // the decrement runs inside the interval callback, not in the render/effect.
  const startTicking = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  /** Restart the countdown from the top. Safe to call from event handlers. */
  const reset = useCallback(() => {
    setRemaining(seconds);
    startTicking();
  }, [seconds, startTicking]);

  // `remaining` already starts at `seconds` (useState init), so the mount effect
  // only needs to start the ticker - it does not setState synchronously.
  useEffect(() => {
    startTicking();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startTicking]);

  return { remaining, reset };
}
