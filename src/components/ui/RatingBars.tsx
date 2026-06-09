import { useEffect, useRef, useState } from 'react';

export interface RatingBar {
  label: string;
  /** Fill percentage 0–100. */
  pct: number;
}

interface RatingBarsProps {
  bars: RatingBar[];
}

/**
 * Rating-distribution bar chart (5★ … 1★). The bars start empty and fill
 * up to their target width the first time the chart scrolls into view —
 * staggered top-to-bottom so they "rise" one after another, mirroring the
 * free-shipping progress slider's animated fill.
 */
export default function RatingBars({ bars }: RatingBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex-1 space-y-1.5 mt-2">
      {bars.map(({ label, pct }, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-muted w-2">{label}</span>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="bg-black h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: inView ? `${pct}%` : '0%',
                transitionDelay: `${i * 90}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
