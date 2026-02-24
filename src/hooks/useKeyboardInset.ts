import { useEffect, useRef, useState } from 'react';

/**
 * Returns the keyboard height in pixels (0 when closed).
 *
 * Uses visualViewport — fires on every frame of the keyboard animation on
 * both iOS Safari and Android Chrome.
 *
 * Key: we always cancel the pending rAF and re-queue, so the value used
 * is always the LATEST viewport reading — not the first one in a burst.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Always cancel + re-queue so we use the latest value in a burst
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const gap = window.innerHeight - (vv.offsetTop + vv.height);
        setInset(Math.max(0, gap));
      });
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return inset;
}
