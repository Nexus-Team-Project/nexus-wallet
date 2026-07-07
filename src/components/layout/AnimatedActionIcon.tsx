import { useEffect, useRef, useState } from 'react';
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import wasmUrl from '@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm?url';

// Serve the player's wasm from our own origin instead of the default CDN, so
// the icons still render if that CDN is blocked/unreachable. Runs once on import.
setWasmUrl(wasmUrl);

interface AnimatedActionIconProps {
  /** URL to the wired Lottie icon. */
  src: string;
  /** Rendered icon size in px. */
  size?: number;
  /**
   * Change this value to replay the animation programmatically — e.g. bump it
   * when a new notification arrives so the bell re-animates on its own.
   */
  playKey?: unknown;
  /**
   * Defer the first play until the icon scrolls into view. Use for icons below
   * the fold — otherwise the mount autoplay finishes long before the user
   * scrolls down to them, so they never see the motion.
   */
  playOnView?: boolean;
}

/**
 * A small wired Lordicon used for action buttons (chat, bell, link, …). It
 * plays its draw-in once, then replays on press and whenever `playKey` changes.
 * With `playOnView` the player is mounted only once the icon scrolls into view,
 * so the draw-in is seen even for icons far below the fold.
 *
 * Each play is a fresh mount (the `key` changes), so `autoplay` runs the draw
 * from frame 0 every time — far more reliable than a `setFrame(0); play()`
 * seek, which won't restart a finished non-looping Lottie and would leave the
 * icon stuck on a blank frame.
 */
export default function AnimatedActionIcon({ src, size = 22, playKey, playOnView = false }: AnimatedActionIconProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  // Whether the player has been mounted yet. Without playOnView it mounts
  // immediately; with it, it waits for the first scroll-into-view.
  const [mounted, setMounted] = useState(!playOnView);
  // Bumping this remounts the player, so its `autoplay` replays from frame 0.
  const [token, setToken] = useState(0);
  const replay = () => setToken((t) => t + 1);

  // Replay on every `playKey` change (skip the initial mount).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (mounted) replay();
  }, [playKey, mounted]);

  // Mount the player the first time the icon scrolls into view. Fires once,
  // then disconnects — so it can't thrash the mount on tiny visibility changes.
  useEffect(() => {
    if (!playOnView || mounted) return;
    const el = spanRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setMounted(true); obs.disconnect(); } }),
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [playOnView, mounted]);

  return (
    <span
      ref={spanRef}
      onPointerDown={() => { if (mounted) replay(); }}
      className="grid place-items-center"
      style={{ width: size, height: size }}
    >
      {mounted && (
        <DotLottieReact
          key={token}
          src={src}
          autoplay
          loop={false}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </span>
  );
}
