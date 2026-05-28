import { create } from 'zustand';
import type { Notification } from '../types/notification.types';

// A toast is a `Notification` with a transient runtime id (separate from
// the persistent notification id, so the same notification can be re-fired
// multiple times in dev/playground without React key collisions).
export interface Toast extends Notification {
  // Unique per appearance — `notification.id` may repeat across firings.
  toastId: string;
  // When the toast should auto-dismiss. `null` means manual-only.
  expiresAt: number | null;
}

// Auto-dismiss in ms. Critical toasts get a longer window so the user has
// time to read security alerts before they fade.
const DEFAULT_DURATION = 5000;
const CRITICAL_DURATION = 8000;
// Max simultaneously visible. Older toasts shift up & fade as new ones arrive.
const MAX_VISIBLE = 3;
// Two toasts of the same sender+category arriving within this window are
// merged into a single "N new notifications" toast. Matches what
// WhatsApp / Slack do for short bursts.
const BATCH_WINDOW_MS = 30_000;

interface NotificationToastState {
  toasts: Toast[];
  // Monotonic counter incremented every time a toast gets absorbed into
  // the bell icon. The TopBar bell subscribes to it and runs a brief
  // shake animation on each tick — the visual "ack" that the
  // notification landed somewhere reachable.
  bellPulseCount: number;
  showToast: (notification: Notification, options?: { duration?: number | null }) => void;
  dismissToast: (toastId: string) => void;
  pulseBell: () => void;
  dismissAll: () => void;
}

export const useNotificationToastStore = create<NotificationToastState>((set, get) => ({
  toasts: [],
  bellPulseCount: 0,

  showToast: (notification, options) => {
    const now = Date.now();
    const duration =
      options?.duration === null
        ? null
        : options?.duration
          ?? (notification.priority === 'critical' ? CRITICAL_DURATION : DEFAULT_DURATION);

    // Smart batching — if the most recent toast is from the same sender +
    // category and is still on screen, bump its count instead of stacking
    // another card on top. Avoids the "10 toasts in a row" stampede.
    const existing = get().toasts.find(
      t =>
        t.sender.id === notification.sender.id &&
        t.category === notification.category &&
        now - new Date(t.createdAt).getTime() < BATCH_WINDOW_MS,
    );

    if (existing) {
      set(state => ({
        toasts: state.toasts.map(t =>
          t.toastId === existing.toastId
            ? {
                ...t,
                title: notification.title,
                titleHe: notification.titleHe,
                body: notification.body,
                bodyHe: notification.bodyHe,
                createdAt: notification.createdAt,
                expiresAt: duration === null ? null : now + duration,
              }
            : t,
        ),
      }));
      return;
    }

    const toast: Toast = {
      ...notification,
      toastId: `${notification.id}_${now}_${Math.random().toString(36).slice(2, 8)}`,
      expiresAt: duration === null ? null : now + duration,
    };

    set(state => {
      const next = [toast, ...state.toasts].slice(0, MAX_VISIBLE);
      return { toasts: next };
    });
  },

  dismissToast: (toastId) => {
    set(state => ({ toasts: state.toasts.filter(t => t.toastId !== toastId) }));
  },

  pulseBell: () => set(state => ({ bellPulseCount: state.bellPulseCount + 1 })),

  dismissAll: () => set({ toasts: [] }),
}));
