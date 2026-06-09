import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';

/**
 * SlideToConfirm — a swipe-to-commit pay control that mirrors the business
 * page's "Create a deal on your terms" StickyCTA: a dark pill whose sky-blue
 * fill tracks the finger across the FULL width of the button, the pay label
 * fading out while a confirm label crossfades in. Releasing past
 * COMMIT_FRACTION commits (onConfirm); a shorter drag recedes back.
 *
 * RTL-aware: in RTL the gesture travels leftwards and the fill anchors to the
 * right edge; in LTR it is mirrored.
 */

// Fraction of the button width the finger must travel for the swipe to commit.
const COMMIT_FRACTION = 0.7;

interface SlideToConfirmProps {
  /** Pay label shown before the swipe (e.g. "Pay now"). */
  label: string;
  /** Trailing accent shown after the label (e.g. the total amount). */
  amount?: string;
  /** Label that crossfades in as the button is slid (e.g. "Confirm payment"). */
  confirmLabel: string;
  /** Label shown while loading. */
  loadingLabel: string;
  /** Hint shown beneath the track inviting the gesture. */
  hint?: string;
  /** Fires once the button is slid past the commit threshold. */
  onConfirm: () => void;
  /** Renders the processing state and freezes the gesture. */
  loading?: boolean;
  /** Right-to-left layout. */
  rtl?: boolean;
}

export default function SlideToConfirm({
  label,
  amount,
  confirmLabel,
  loadingLabel,
  hint,
  onConfirm,
  loading = false,
  rtl = false,
}: SlideToConfirmProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [trackW, setTrackW] = useState(320);
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const update = () => setTrackW(el.offsetWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const offsetX = useMotionValue(0);
  // Map the pan distance (over the full button width) → 0…1 fill progress.
  // In RTL the gesture goes leftwards (negative offset), so the input range
  // is flipped.
  const progress = useTransform(
    offsetX,
    rtl ? [-trackW, 0] : [0, trackW],
    rtl ? [1, 0] : [0, 1],
    { clamp: true },
  );
  const payOpacity = useTransform(progress, [0, 0.9], [1, 0]);

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    const dist = rtl ? -info.offset.x : info.offset.x;
    if (dist > trackW * COMMIT_FRACTION) {
      // Snap the fill to full, then commit.
      animate(offsetX, rtl ? -trackW : trackW, { type: 'spring', stiffness: 500, damping: 40 });
      onConfirm();
      return;
    }
    animate(offsetX, 0, { type: 'spring', stiffness: 500, damping: 40 });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        ref={btnRef}
        type="button"
        disabled={loading}
        onPan={loading ? undefined : (_, info) => { offsetX.set(info.offset.x); }}
        onPanEnd={loading ? undefined : handlePanEnd}
        className="relative w-full overflow-hidden bg-bg-dark text-white py-4 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 flex items-center justify-center touch-pan-y disabled:opacity-90"
      >
        {loading ? (
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
            <span>{loadingLabel}</span>
          </span>
        ) : (
          <>
            {/* Sky-blue fill — grows horizontally, tracking the finger along
                the button. Anchored to the swipe-start edge (right in RTL,
                left in LTR) so it sweeps across the full track. */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 bg-sky-300 pointer-events-none"
              style={{ scaleX: progress, transformOrigin: rtl ? 'right' : 'left' }}
            />

            {/* Pay label — fades out as the button is slid. */}
            <motion.span
              className="relative z-10 inline-flex items-center gap-3 leading-none pointer-events-none"
              style={{ opacity: payOpacity }}
            >
              <span>{label}</span>
              {amount && (
                <>
                  <span className="w-px h-5 bg-white/25" />
                  <span>{amount}</span>
                </>
              )}
            </motion.span>

            {/* Confirm label — crossfades in over the same space, navy on sky. */}
            <motion.span
              className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              style={{ opacity: progress, color: '#0a153f' }}
            >
              {confirmLabel}
            </motion.span>
          </>
        )}
      </motion.button>

      {/* Hint — the drag affordance. Pulses to invite the gesture. */}
      {hint && !loading && (
        <p className="flex items-center gap-1 text-xs font-medium text-text-secondary animate-pulse">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
            {rtl ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
          </span>
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}
