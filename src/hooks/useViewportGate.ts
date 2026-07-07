/**
 * useViewportGate
 * -------------------------------------------------------------------------
 * Decides whether the wallet should be blocked behind the "open on your phone"
 * screen. The wallet is a mobile-first app: at desktop / wide widths the
 * phone-column layout reads wrong, so we replace the whole app with a branded
 * gate (see MobileViewportGate).
 *
 * Rules (locked in the design doc 2026-06-14):
 * - blocked when the viewport is >= 768px (Tailwind `md`), AND
 * - never blocked during local dev (`import.meta.env.DEV`) so developers can
 *   work at any window size. Any production build keeps the gate fully active.
 *
 * The hook is the single source of truth for that decision; the component just
 * renders the overlay when `blocked` is true.
 */
import { useEffect, useState } from 'react';

/**
 * The minimum viewport width (in CSS px) that triggers the gate. Kept here so
 * the number lives in exactly one place; matches Tailwind's `md` breakpoint.
 */
export const VIEWPORT_GATE_MIN_WIDTH = 768;

/** Media query string built once from the breakpoint constant. */
const GATE_MEDIA_QUERY = `(min-width: ${VIEWPORT_GATE_MIN_WIDTH}px)`;

/**
 * Compute the current blocked state synchronously. Reading from matchMedia on
 * the first render (instead of defaulting to false + flipping in an effect)
 * means the gate is correct on the very first paint - no flash of the app on a
 * desktop load.
 *
 * @returns true when the gate should cover the app right now.
 */
function computeBlocked(): boolean {
  // Local dev is never gated, regardless of window size.
  if (import.meta.env.DEV) return false;
  // SSR / non-browser safety: the wallet is client-only, but keeping the hook
  // pure means it never throws if evaluated without a window.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(GATE_MEDIA_QUERY).matches;
}

/**
 * React hook exposing whether the mobile viewport gate should be shown.
 *
 * @returns `{ blocked }` - `blocked` flips live as the viewport crosses the
 *          768px threshold (resize, device rotation, devtools device mode).
 */
export function useViewportGate(): { blocked: boolean } {
  const [blocked, setBlocked] = useState<boolean>(computeBlocked);

  useEffect(() => {
    // Dev builds never gate, so there is nothing to listen for.
    if (import.meta.env.DEV) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(GATE_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => setBlocked(event.matches);

    // The initial value is already read synchronously by the useState
    // initializer (computeBlocked), so we only subscribe to later changes
    // here - no synchronous setState in the effect body.
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return { blocked };
}
