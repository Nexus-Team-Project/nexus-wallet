import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

const R = 52;
const CX = 66;
const CY = 66;
const CIRC = 2 * Math.PI * R;
const GREEN_BG = '#DCFCE7';
const GREEN_STROKE = '#16A34A';

type Phase = 'spinning' | 'completing' | 'check' | 'reveal';

export interface TransactionSuccessShellProps {
  cashback?: number;
  isHe: boolean;
  onClose: () => void;
  onShare?: () => Promise<void> | void;
  /** ms after reveal before auto-navigating. 0 = disabled. Default 5500. */
  autoMs?: number;
  /** Optional logo shown inside the circle once the checkmark draws. */
  iconUrl?: string;
  /** Rendered between the cashback counter and the receipt card (e.g. a purchased voucher preview). */
  previewSlot?: ReactNode;
  children: ReactNode;
}

export default function TransactionSuccessShell({
  cashback = 0,
  isHe,
  onClose,
  onShare,
  autoMs = 5500,
  iconUrl,
  previewSlot,
  children,
}: TransactionSuccessShellProps) {
  const [phase, setPhase] = useState<Phase>('spinning');
  const [cashbackCount, setCashbackCount] = useState(0);
  const spinCtrl = useAnimation();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Kick off the rotation immediately
  useEffect(() => {
    spinCtrl.start({ rotate: 360 * 100, transition: { duration: 110, ease: 'linear' } });
    const t = setTimeout(() => setPhase('completing'), 1800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'completing') {
      spinCtrl.stop();
      const t = setTimeout(() => setPhase('check'), 300);
      return () => clearTimeout(t);
    }
    if (phase === 'check') {
      const t = setTimeout(() => setPhase('reveal'), 1100);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal') {
      if (cashback > 0) {
        const steps = Math.min(Math.max(Math.round(cashback * 10), 20), 60);
        const interval = 1200 / steps;
        let step = 0;
        const id = setInterval(() => {
          step++;
          const eased = 1 - Math.pow(1 - step / steps, 3);
          setCashbackCount(Math.round(eased * cashback * 100) / 100);
          if (step >= steps) clearInterval(id);
        }, interval);
      }
      if (autoMs > 0) {
        const t = setTimeout(() => onCloseRef.current(), autoMs);
        return () => clearTimeout(t);
      }
    }
  }, [phase, cashback, autoMs]);

  const arcDashOffset = phase === 'spinning' ? CIRC * 0.3 : 0;
  const arcOpacity    = phase === 'check' || phase === 'reveal' ? 0 : 1;

  return (
    <div
      className="min-h-dvh bg-white flex flex-col items-center max-w-md mx-auto overflow-hidden px-5"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* ── Animated circle ───────────────────────────── */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ marginTop: 220 }}
        animate={phase === 'reveal' ? { y: -44, scale: 0.5 } : { y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="w-[120px] h-[120px] rounded-full" style={{ background: GREEN_BG }} />

        <motion.svg
          className="absolute"
          style={{ top: -6, left: -6, width: 132, height: 132 }}
          viewBox="0 0 132 132"
          animate={spinCtrl}
        >
          <motion.circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={GREEN_STROKE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            animate={{
              strokeDashoffset: arcDashOffset,
              opacity: arcOpacity,
            }}
            transition={{
              strokeDashoffset: { duration: phase === 'completing' ? 0.28 : 0, ease: 'easeOut' },
              opacity: { duration: 0.2 },
            }}
          />
        </motion.svg>

        <svg
          className="absolute inset-0"
          width={120} height={120}
          viewBox="0 0 120 120"
          style={{ overflow: 'visible' }}
        >
          <motion.path
            d="M 28 62 L 50 82 L 92 36"
            fill="none"
            stroke={GREEN_STROKE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: phase === 'check' || phase === 'reveal' ? 1 : 0,
              opacity:    phase === 'check' || phase === 'reveal' ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 0.58, ease: [0.16, 1, 0.3, 1], delay: 0.05 },
              opacity:    { duration: 0.05 },
            }}
          />
        </svg>

        {/* Optional merchant / business logo inside the circle */}
        {iconUrl && (
          <AnimatePresence>
            {(phase === 'check' || phase === 'reveal') && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <img src={iconUrl} alt="" draggable={false} className="w-10 h-10 object-contain rounded-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Cashback counter ─────────────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && cashback > 0 && (
          <motion.div
            className="flex flex-col items-center gap-1 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          >
            <span
              className="text-[34px] font-bold leading-none tabular-nums"
              style={{ color: GREEN_STROKE }}
              dir="ltr"
            >
              +₪{Number.isInteger(cashbackCount) ? cashbackCount : cashbackCount.toFixed(2)}
            </span>
            <span className="text-[13px] font-medium text-green-700">
              {isHe ? 'קאשבק נצבר' : 'cashback earned'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview slot (e.g. voucher card) ────────── */}
      <AnimatePresence>
        {phase === 'reveal' && previewSlot && (
          <motion.div
            className="w-full mt-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            {previewSlot}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Receipt card ─────────────────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            className="w-full mt-5 bg-white border border-border rounded-2xl overflow-hidden mb-8"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {children}

            <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
              {onShare && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.35 }}
                  onClick={onShare}
                  className="w-full bg-bg-dark text-white font-semibold py-3.5 rounded-xl text-[15px] active:opacity-80 transition-opacity"
                >
                  {isHe ? 'שיתוף' : 'Share'}
                </motion.button>
              )}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: onShare ? 0.7 : 0.55, duration: 0.35 }}
                onClick={onClose}
                className="w-full text-text-secondary text-sm font-medium py-2 active:opacity-60 transition-opacity"
              >
                {isHe ? 'סגירה' : 'Close'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
