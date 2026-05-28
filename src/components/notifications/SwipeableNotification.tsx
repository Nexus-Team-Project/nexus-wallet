import { useRef, useState, type MouseEvent } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';
import NotificationCard from './NotificationCard';
import type { Notification } from '../../types/notification.types';

interface SwipeableNotificationProps {
  notification: Notification;
  onArchive: (id: string) => void;
}

// Width of the archive action that sits behind the card. The card snaps
// open to exactly this width so the button sits flush, and the drag is
// clamped so the user can't overshoot.
const ACTION_WIDTH = 88;
// Open if the user dragged past this many pixels OR flicked with this
// much velocity. Velocity catches quick small flicks that don't cover
// much distance but clearly intend to open.
const OPEN_DISTANCE = 40;
const OPEN_VELOCITY = 400;

// Distance the card slides off-screen when archiving. Slightly larger
// than any phone width so the card fully clears the viewport before the
// row collapses.
const EXIT_X = -500;

export default function SwipeableNotification({ notification, onArchive }: SwipeableNotificationProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // Two-step archive: tapping the button first slides the card the rest
  // of the way off-screen in the drag direction (continuing the user's
  // gesture), then once the slide-out finishes, we notify the parent to
  // remove the item — at which point AnimatePresence collapses the row.
  const [isArchiving, setIsArchiving] = useState(false);
  const x = useMotionValue(0);
  // Tracks whether a drag just happened. Framer-motion is supposed to
  // suppress the synthetic click that follows a drag, but on short
  // drags it sometimes lets the click through — which then fires the
  // card's deep-link navigation. We swallow it manually.
  const justDraggedRef = useRef(false);

  const close = () => setIsOpen(false);

  const handleArchive = (e: MouseEvent) => {
    e.stopPropagation();
    setIsArchiving(true);
  };

  // Intercept clicks during/just-after drag, or while the row is open.
  // Tap on open row → close it. Tap right after drag → swallow it so
  // the card doesn't navigate to its deep link.
  const handleCardCapture = (e: MouseEvent) => {
    if (isOpen) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      return;
    }
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
        // Bottom spacing lives on the wrapper (not on the inner card) so
        // the absolutely-positioned action sits flush with the card's
        // height — without the wrapper's bottom gap.
        className="relative mb-3"
      >
        {/* Archive action — a flat gray backplate that the card slides
            over. No ring/border, no separate rounded pill — just a
            muted slab whose right side matches the card's rounded corner. */}
        <button
          type="button"
          onClick={handleArchive}
          aria-label={t.notifications.archive}
          tabIndex={isOpen ? 0 : -1}
          className={cn(
            'absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1',
            'bg-transparent text-gray-500 active:text-gray-700 font-medium text-xs',
          )}
          style={{ width: ACTION_WIDTH }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '22px' }}
          >
            archive
          </span>
          <span>{t.notifications.archive}</span>
        </button>

        {/* `relative z-10` lifts the card into a higher stacking layer
            than the absolutely-positioned archive button, so the card's
            solid white background covers the button until the user
            slides it aside. Without this, the absolute button paints on
            top of the static card and bleeds through. */}
        <motion.div
          drag={isArchiving ? false : 'x'}
          dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
          dragElastic={{ left: 0.05, right: 0.05 }}
          dragMomentum={false}
          style={{ x }}
          // Priority: archiving > open > closed. The spring tuning is
          // softer for the exit so it feels like a smooth glide rather
          // than the snappy open/close.
          animate={{ x: isArchiving ? EXIT_X : isOpen ? -ACTION_WIDTH : 0 }}
          transition={
            isArchiving
              ? { type: 'tween', duration: 0.25, ease: 'easeIn' }
              : { type: 'spring', stiffness: 500, damping: 40 }
          }
          onDragStart={() => {
            justDraggedRef.current = true;
          }}
          onDragEnd={(_, info) => {
            const dragged = info.offset.x < -OPEN_DISTANCE;
            const flicked = info.velocity.x < -OPEN_VELOCITY;
            if (dragged || flicked) setIsOpen(true);
            else setIsOpen(false);
            // Keep the flag up for one tick — the synthetic click that
            // follows a touch-drag fires immediately after dragEnd, so
            // we need handleCardCapture to still see it as 'just
            // dragged' when it runs.
            setTimeout(() => { justDraggedRef.current = false; }, 100);
          }}
          onAnimationComplete={() => {
            // Only the archive slide-out fires while isArchiving is true;
            // open/close animations finish before the user can ever
            // trigger archive, so this guard is safe.
            if (isArchiving) onArchive(notification.id);
          }}
          onClickCapture={handleCardCapture}
          className={cn('relative z-10', isArchiving && 'pointer-events-none')}
        >
          <NotificationCard notification={notification} />
        </motion.div>

        {/* Invisible scrim — when open, a tap anywhere on the card
            surface closes the row. The capture-phase click on the card
            handles the same thing for the inner button, but this is the
            visual indicator we may add later. */}
        {isOpen && (
          <div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-y-0 left-0 right-[88px]"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
