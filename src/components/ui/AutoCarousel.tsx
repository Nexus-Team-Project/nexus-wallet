import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * AutoCarousel — a horizontal, swipeable gallery that also auto-advances.
 *
 * • Each child becomes one full-width slide (scroll-snap).
 * • Auto-rotates every `interval` ms; pauses briefly after the user interacts
 *   (scroll / touch / wheel) and resumes on its own.
 * • Dot indicators reflect the active slide and stay in sync with manual swipes.
 * • RTL-safe: advancing uses scrollIntoView (direction-agnostic) and the active
 *   slide is tracked with an IntersectionObserver rather than scrollLeft math.
 *
 * Falsy children (e.g. `{cond && <Slide/>}`) are dropped, so callers can gate
 * individual slides. Renders nothing when no slides remain.
 */
interface AutoCarouselProps {
  children: ReactNode;
  /** Auto-advance period in ms. */
  interval?: number;
  /** How long to pause auto-rotation after a user interaction, in ms. */
  pauseAfterInteraction?: number;
  className?: string;
}

export default function AutoCarousel({
  children,
  interval = 5000,
  pauseAfterInteraction = 6000,
  className = '',
}: AutoCarouselProps) {
  const slides = (Array.isArray(children) ? children : [children]).filter(Boolean);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);

  // Keep the active dot in sync with whatever slide is centred (manual or auto).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { root: track, threshold: 0.6 },
    );
    Array.from(track.children).forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [slides.length]);

  // Auto-advance. Resets whenever `active` changes, so each slide gets a full
  // dwell time even right after a manual swipe.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const track = trackRef.current;
      if (!track) return;
      const next = (active + 1) % slides.length;
      const child = track.children[next] as HTMLElement | undefined;
      if (!child) return;
      // Scroll only the track (not the page). Using a physical-pixel delta makes
      // this work in both LTR and RTL — unlike scrollIntoView, which also scrolls
      // ancestor containers and would yank the whole page to the carousel.
      const delta = child.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollBy({ left: delta, behavior: 'smooth' });
    }, interval);
    return () => window.clearInterval(id);
  }, [slides.length, interval, active]);

  if (slides.length === 0) return null;

  const pause = () => {
    pausedUntil.current = Date.now() + pauseAfterInteraction;
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        className="flex items-stretch overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      >
        {slides.map((slide, i) => (
          <div key={i} data-idx={i} className="w-full shrink-0 snap-center flex">
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-4 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
