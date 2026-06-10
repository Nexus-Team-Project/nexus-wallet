/**
 * BenefitsCarousel - single auto-rotating + manually-navigable
 * carousel that replaces the previous stacked-cards benefit list on
 * the anonymous landing.
 *
 * Built per the ui-ux-pro-max checklist:
 *  - Auto-advance every 5s, pause on hover / focus-within, halt
 *    entirely under prefers-reduced-motion (per the WCAG 2.1 motion
 *    pause requirement).
 *  - Manual controls: arrow buttons (>=44x44 touch target), dot pager,
 *    swipe via framer-motion drag, and keyboard ArrowLeft/Right on the
 *    root region. Arrow direction flips in RTL.
 *  - aria-roledescription="carousel" + per-slide aria-roledescription=
 *    "slide" + aria-live="polite" so screen readers announce title
 *    changes without yanking focus.
 *  - Transforms + opacity only; durations 200-350ms; ease-out enter /
 *    ease-in exit; no continuous animation on decorative bits.
 *  - Palette: slate-900 text on white card with a warm-pastel accent
 *    stripe drawn from the brand gradient (#ffb74d -> #ff91b8 ->
 *    #9c88ff).
 *
 * Bilingual; the parent passes HE / EN copy via the items prop.
 */
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { useCallback, useEffect, useId, useState } from 'react';

export interface BenefitItem {
  title: string;
  body: string;
}

interface BenefitsCarouselProps {
  items: BenefitItem[];
  /** True when the surrounding document is right-to-left. */
  isRtl: boolean;
  /** Auto-advance interval in ms. Defaults to 5000. */
  intervalMs?: number;
  /** Bilingual labels for the control buttons. */
  labels: {
    /** e.g. "Previous benefit" / "ההטבה הקודמת". */
    prev: string;
    /** e.g. "Next benefit" / "ההטבה הבאה". */
    next: string;
    /** e.g. "Benefits" / "הטבות". Used as the region's aria-label. */
    region: string;
    /** Builder for dot aria-labels, e.g. (n,total) => `Benefit ${n} of ${total}`. */
    slide: (current: number, total: number) => string;
  };
}

/**
 * Direction of the most recent transition. Drives the slide enter/exit
 * variants so the new card visually slides in from the right when the
 * user goes forward (RTL flips the visual direction at the variant
 * level - the index math stays direction-agnostic).
 */
type Direction = 1 | -1;

export default function BenefitsCarousel({
  items,
  isRtl,
  intervalMs = 5000,
  labels,
}: BenefitsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [paused, setPaused] = useState(false);
  const regionId = useId();

  // Imperative goTo so arrow keys / drag end / dot click can all flow
  // through one place that knows the previous index and resets the
  // auto-advance timer cleanly.
  const goTo = useCallback(
    (next: number, dir: Direction): void => {
      const wrapped = ((next % items.length) + items.length) % items.length;
      setDirection(dir);
      setIndex(wrapped);
    },
    [items.length],
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  // Auto-advance. Pauses on hover/focus, never runs under reduced
  // motion. Resets the cadence after every manual nav by re-keying on
  // `index`.
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (paused) return;
    if (items.length <= 1) return;
    const id = window.setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => window.clearTimeout(id);
  }, [index, paused, prefersReducedMotion, intervalMs, items.length]);

  // Keyboard nav on the region. Left/Right always move by 1; we flip
  // semantic direction under RTL so the visual slide motion matches
  // the user's mental model.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      isRtl ? goPrev() : goNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      isRtl ? goNext() : goPrev();
    }
  };

  // Swipe via drag. We only care about horizontal velocity + offset;
  // 60px / 300 velocity is the well-worn threshold from Material's
  // swipeable view spec. RTL: a swipe LEFT means "go to next" in
  // RTL reading order, same as Hebrew users naturally expect.
  const SWIPE_OFFSET = 60;
  const SWIPE_VELOCITY = 300;
  const onDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ): void => {
    const power = Math.abs(info.offset.x) * 1 + Math.abs(info.velocity.x);
    if (power < SWIPE_OFFSET * 1 + SWIPE_VELOCITY * 0) return;
    if (Math.abs(info.offset.x) < SWIPE_OFFSET && Math.abs(info.velocity.x) < SWIPE_VELOCITY) return;
    const goingForward = isRtl ? info.offset.x > 0 : info.offset.x < 0;
    goingForward ? goNext() : goPrev();
  };

  // Slide variants. We pass the direction via custom so the same
  // variants describe both forward and backward motion without
  // duplicating definitions.
  const slideVariants = {
    enter: (dir: Direction) => ({
      x: dir > 0 ? (isRtl ? -32 : 32) : (isRtl ? 32 : -32),
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: Direction) => ({
      x: dir > 0 ? (isRtl ? 32 : -32) : (isRtl ? -32 : 32),
      opacity: 0,
    }),
  };

  const current = items[index]!;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      aria-live="polite"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      id={regionId}
      className="relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2 focus-visible:rounded-2xl"
    >
      {/* ── Slide stage ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur-sm">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', damping: 26, stiffness: 260 },
              opacity: { duration: 0.18, ease: 'easeOut' },
            }}
            // Drag for swipe. Constrained to 0 on both sides so the
            // card snaps back; the swipe direction lives in onDragEnd.
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragEnd={onDragEnd}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide(index + 1, items.length)}
            className="cursor-grab active:cursor-grabbing select-none px-5 py-5 sm:px-6 sm:py-6"
          >
            <p className="text-base font-bold text-slate-900 sm:text-lg">
              {current.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-base">
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Controls row: prev / dots / next ── */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label={labels.prev}
          aria-controls={regionId}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
        >
          {/* Inline chevron SVG. Flip horizontally in RTL so the icon
              points the same logical direction as the action. */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ transform: isRtl ? 'scaleX(-1)' : undefined }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Numeric position indicator. Replaces the dot pager - the
            current slide reads as "1 / 3" in the brand's slate-900,
            with a soft slate-400 separator and total. Tabular-nums so
            the width doesn't jitter as the active digit changes.
            aria-live=off on this node because the parent region
            already announces slide changes via aria-live=polite, so
            re-reading the number would double-fire on screen readers. */}
        <div
          className="select-none tabular-nums text-sm font-semibold tracking-tight text-slate-400 sm:text-base"
          aria-live="off"
        >
          <span className="text-slate-900">{index + 1}</span>
          <span className="mx-1.5">/</span>
          <span>{items.length}</span>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label={labels.next}
          aria-controls={regionId}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ transform: isRtl ? 'scaleX(-1)' : undefined }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
