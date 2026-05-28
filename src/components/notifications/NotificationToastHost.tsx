import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useNotificationToastStore } from '../../stores/notificationToastStore';
import NotificationToast from './NotificationToast';

// Mount once in AppLayout. Suppresses itself when the user is already on
// the notifications page (no point shouting about a notification they
// can see in the list right under them — top-tier apps suppress this
// way to avoid duplicate cognitive load).
export default function NotificationToastHost() {
  const { pathname } = useLocation();
  const toasts = useNotificationToastStore(s => s.toasts);
  const dismissToast = useNotificationToastStore(s => s.dismissToast);

  const onNotificationsPage = /^\/[a-z]{2}\/notifications\/?$/.test(pathname);
  // Don't render the wrapper at all when there's nothing to show —
  // otherwise the fixed overlay swallows wheel/touch events in its
  // area even though it's visually empty.
  if (onNotificationsPage || toasts.length === 0) return null;

  return (
    <div
      // `pointer-events-none` on the wrapper lets wheel/click events
      // pass through to the page underneath. Only the individual toast
      // elements opt back in via `pointer-events-auto` so drags + taps
      // on them still work.
      className="fixed top-12 inset-x-0 z-[100] flex justify-center pointer-events-none"
      aria-live="polite"
    >
      <div className="relative w-full max-w-md flex justify-center">
        <AnimatePresence>
          {toasts.map((toast, index) => (
            <div
              key={toast.toastId}
              className="absolute top-0 inset-x-0 flex justify-center pointer-events-auto"
            >
              <NotificationToast toast={toast} index={index} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
