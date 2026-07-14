import { useEffect } from 'react';
import { useTransitionCurtainStore } from '../../stores/transitionCurtainStore';

// Full-screen white curtain that outlives a route change. A leaving page drops
// it (`cover`) right before navigating; once the new route has mounted beneath
// it, the curtain recedes from the bottom up (clip-path) to *reveal* the new
// page gradually — the incoming screen stays still and is simply uncovered.
export default function TransitionCurtain() {
  const phase = useTransitionCurtainStore((s) => s.phase);
  const setPhase = useTransitionCurtainStore((s) => s.setPhase);

  useEffect(() => {
    if (phase === 'cover') {
      // Give the freshly-navigated route a frame to paint under the curtain,
      // then start the reveal (kept short so the hand-off feels instant).
      const t = window.setTimeout(() => setPhase('reveal'), 20);
      return () => window.clearTimeout(t);
    }
    if (phase === 'reveal') {
      const t = window.setTimeout(() => setPhase('idle'), 280);
      return () => window.clearTimeout(t);
    }
  }, [phase, setPhase]);

  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] bg-white pointer-events-none"
      style={{
        // reveal → clip the white away from the bottom edge upward, so the new
        // route is uncovered starting at the bottom of the screen.
        clipPath: phase === 'reveal' ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)',
        transition: phase === 'reveal' ? 'clip-path 260ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        willChange: 'clip-path',
      }}
    />
  );
}
