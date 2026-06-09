import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, type PanInfo } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';
import { CATEGORY_ICON, PRIORITY_DOT } from './notificationMeta';
import { useNotificationToastStore, type Toast } from '../../stores/notificationToastStore';

interface NotificationToastProps {
  toast: Toast;
  // Stack index — 0 is on top (most prominent), 1 is behind, etc.
  // Lower toasts are scaled down and translated up slightly so they
  // peek out from behind the active one.
  index: number;
  onDismiss: (toastId: string) => void;
}

// Swipe-up distance / velocity to dismiss. Tuned to feel responsive but
// not flick away on accidental scrolls.
const DISMISS_DISTANCE = 40;
const DISMISS_VELOCITY = 400;

export default function NotificationToast({ toast, index, onDismiss }: NotificationToastProps) {
  const { language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const pulseBell = useNotificationToastStore((s) => s.pulseBell);
  const [imgError, setImgError] = useState(false);
  // When set, the toast is in its "fly to bell" exit animation —
  // a delta-from-current-position vector + scale-down to zero. Until
  // this fires, the toast lives on the screen normally.
  const [exitTarget, setExitTarget] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  const title = language === 'he' ? toast.titleHe : toast.title;
  const body = language === 'he' ? toast.bodyHe : toast.body;
  const { icon: catIcon, color: catColor } = CATEGORY_ICON[toast.category];
  const dotColor = PRIORITY_DOT[toast.priority];

  const hasSubject = !!toast.subject;
  const isNexusAvatar = !hasSubject && toast.sender.id === 'nexus';
  const displayName = hasSubject
    ? (language === 'he' ? toast.subject!.nameHe : toast.subject!.name)
    : (language === 'he' ? toast.sender.nameHe : toast.sender.name);
  const avatarImage = hasSubject ? toast.subject!.imageUrl : toast.sender.logo;
  const avatarFallback = hasSubject
    ? (toast.subject!.fallback ?? toast.subject!.nameHe.charAt(0))
    : toast.sender.initial;
  const avatarColor = hasSubject
    ? 'bg-surface text-text-primary'
    : (toast.sender.brandColor ?? 'bg-surface text-text-primary');

  // Compute the vector from the toast's current screen position to the
  // notification bell in the TopBar. The toast then animates to that
  // delta + scale ~0, looking like it gets sucked into the bell.
  const flyToBell = () => {
    const cardEl = cardRef.current;
    const bellEl = document.querySelector('[data-notif-bell]') as HTMLElement | null;
    if (!cardEl || !bellEl) {
      // Graceful fallback if the bell isn't on screen (shouldn't happen
      // since AppLayout always renders TopBar, but defensive): just
      // collapse the toast in place.
      onDismiss(toast.toastId);
      return;
    }
    const cardRect = cardEl.getBoundingClientRect();
    const bellRect = bellEl.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const bellCenterX = bellRect.left + bellRect.width / 2;
    const bellCenterY = bellRect.top + bellRect.height / 2;
    setExitTarget({
      x: bellCenterX - cardCenterX,
      y: bellCenterY - cardCenterY,
    });
  };

  // Auto-dismiss timer. We track `expiresAt` (absolute time) rather than
  // a duration so that re-renders don't reset the timer. When the timer
  // fires we trigger the fly-to-bell instead of a hard removal.
  useEffect(() => {
    if (!toast.expiresAt) return;
    const remaining = toast.expiresAt - Date.now();
    if (remaining <= 0) {
      flyToBell();
      return;
    }
    const handle = setTimeout(() => flyToBell(), remaining);
    return () => clearTimeout(handle);
    // flyToBell deliberately omitted from deps — it reads refs lazily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.expiresAt, toast.toastId]);

  // Tap → navigate to the deep link immediately. We don't fly to the
  // bell here: the user is *opening* the notification, not dismissing
  // it, so the toast just clears straight away.
  const handleClick = () => {
    if (exitTarget) return; // already exiting
    if (toast.deepLink) navigate(`/${lang}${toast.deepLink}`);
    onDismiss(toast.toastId);
  };

  // Dismiss on any meaningful swipe — left, right, or up. Down is
  // ignored on purpose (feels accidental during a scroll). Mouse drags
  // count too, so on desktop you can swipe the toast off with the cursor.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipedHorizontally =
      Math.abs(offset.x) > DISMISS_DISTANCE ||
      Math.abs(velocity.x) > DISMISS_VELOCITY;
    const swipedUp = offset.y < -DISMISS_DISTANCE || velocity.y < -DISMISS_VELOCITY;
    if (swipedHorizontally || swipedUp) flyToBell();
  };

  // Stack effect — toasts behind the active one peek out smaller.
  const scale = 1 - index * 0.04;
  const yOffset = -index * 6;

  return (
    <motion.button
      ref={cardRef}
      type="button"
      layout
      initial={{ y: -120, opacity: 0, scale: 0.95 }}
      animate={
        exitTarget
          ? {
              x: exitTarget.x,
              y: exitTarget.y,
              // Scale stays large for most of the flight so the toast
              // is clearly visible traveling toward the bell; it only
              // collapses to ~0 in the last 25% of the animation.
              scale: [1, 0.9, 0.05],
              opacity: [1, 1, 0],
              rotate: [0, -2, -6],
            }
          : { x: 0, y: yOffset, opacity: 1 - index * 0.15, scale, rotate: 0 }
      }
      transition={
        exitTarget
          ? {
              duration: 0.6,
              ease: [0.55, 0, 0.4, 1],
              // Keyframe offsets — 0% / 75% / 100%. Toast holds size
              // through 75%, then implodes into the bell over the last
              // quarter. Reads unmistakably as "absorbed by the bell."
              times: [0, 0.75, 1],
            }
          : { type: 'spring', stiffness: 380, damping: 32 }
      }
      drag={exitTarget ? false : true}
      // Bottom is clamped because dragging down feels like an accidental
      // scroll; the other axes can stretch freely (with elastic resistance)
      // and any swipe past the threshold flies to the bell.
      dragConstraints={{ top: -120, bottom: 0, left: -200, right: 200 }}
      dragElastic={{ top: 0.4, bottom: 0, left: 0.6, right: 0.6 }}
      onDragEnd={handleDragEnd}
      onAnimationComplete={() => {
        // Only the fly-to-bell animation triggers parent dismissal —
        // the enter / open animations finish before any exit can start.
        // Pulse the bell first so the shake plays the instant the
        // toast lands inside it, then remove from the store.
        if (exitTarget) {
          pulseBell();
          onDismiss(toast.toastId);
        }
      }}
      onClick={handleClick}
      // The "behind" toasts shouldn't be interactive — they're just peeking
      // to communicate that more are queued. While exiting, nothing
      // should respond either (no more drags / clicks).
      style={{
        pointerEvents: exitTarget || index !== 0 ? 'none' : 'auto',
        zIndex: 100 - index,
        transformOrigin: 'center',
      }}
      className={cn(
        'w-[calc(100%-1.5rem)] max-w-[360px] text-start',
        'bg-white/95 backdrop-blur-md rounded-2xl p-3 flex gap-3',
        'shadow-[0_10px_30px_rgba(10,37,64,0.15)] ring-1 ring-black/5',
        'active:scale-[0.99] transition-transform',
      )}
    >
      {/* Subject / sender avatar with category badge tucked into corner —
          same recipe as the in-list NotificationCard but tighter. */}
      <div className="flex-shrink-0 relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold text-base',
            isNexusAvatar ? 'w-10 h-10' : 'w-11 h-11',
            !isNexusAvatar && 'overflow-hidden',
            avatarColor,
            isNexusAvatar && 'shadow-md border-2 border-white',
          )}
        >
          {avatarImage && !imgError ? (
            <img
              src={avatarImage}
              alt={displayName}
              className={cn(
                'rounded-full',
                isNexusAvatar ? 'w-9 h-9 object-cover' : 'w-full h-full object-cover',
              )}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-lg leading-none">{avatarFallback}</span>
          )}
        </div>
        <div
          className={cn(
            'absolute -bottom-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white',
            catColor,
            isRTL ? '-start-0.5' : '-end-0.5',
          )}
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
          >
            {catIcon}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="text-[13px] font-bold text-text-primary leading-tight truncate">
            {displayName}
          </h3>
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', dotColor)} />
        </div>
        <p className="text-[13px] font-semibold text-text-primary leading-tight mb-0.5 truncate">
          {title}
        </p>
        <p className="text-[12px] text-text-secondary leading-snug line-clamp-2">{body}</p>
      </div>
    </motion.button>
  );
}
