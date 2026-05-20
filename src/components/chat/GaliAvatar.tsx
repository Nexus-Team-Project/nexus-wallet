import { useEffect, useRef, useState } from 'react';

/**
 * Gali avatar -- black orb with two white eyes that follow the cursor.
 * When `pending` is true a conic-gradient ring spins around the socket.
 */
export default function GaliAvatar({
  pending,
  size = 32,
  track = true,
}: {
  pending?: boolean;
  size?: number;
  track?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!track) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      const max = Math.max(1, Math.round(size * 0.08));
      const k = dist === 0 ? 0 : Math.min(max, dist / 24) / dist;
      setPupil({ x: dx * k, y: dy * k });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, [track, size]);

  const orbSize = Math.max(10, size - 4);
  const eyeSize = Math.max(2, Math.round(orbSize * 0.18));
  const eyeOffset = Math.round(orbSize * 0.16);

  return (
    <div
      ref={ref}
      className={`gali-orb-socket grid place-items-center shrink-0 ${
        pending ? 'gali-spin-ring' : ''
      }`}
      style={{ width: size, height: size, borderRadius: 9999 }}
    >
      <div
        className="relative rounded-full bg-slate-900"
        style={{ width: orbSize, height: orbSize }}
      >
        <span
          className="absolute rounded-full bg-white transition-transform duration-75"
          style={{
            width: eyeSize,
            height: eyeSize,
            left: `calc(50% - ${eyeOffset + eyeSize / 2}px)`,
            top: `calc(50% - ${eyeSize / 2}px)`,
            transform: `translate(${pupil.x}px, ${pupil.y}px)`,
          }}
        />
        <span
          className="absolute rounded-full bg-white transition-transform duration-75"
          style={{
            width: eyeSize,
            height: eyeSize,
            left: `calc(50% + ${eyeOffset - eyeSize / 2}px)`,
            top: `calc(50% - ${eyeSize / 2}px)`,
            transform: `translate(${pupil.x}px, ${pupil.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
