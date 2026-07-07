import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import NotificationTabs, { type NotificationFilter } from '../components/notifications/NotificationTabs';
import NotificationEmptyState from '../components/notifications/NotificationEmptyState';
import PushPromptCard from '../components/notifications/PushPromptCard';

// localStorage key — once the user dismisses the push card we keep it out of
// their face. (Push is not live yet; the card's buttons read "Coming soon".)
const PUSH_DISMISSED_KEY = 'nexus_push_dismissed';

// Notifications are not backed by a real feed yet. The page keeps its full
// design (header + filter tabs + push card) but shows a "coming soon" state
// instead of the old mock notifications, so no fake data is ever shown.
const ZERO_COUNTS: Record<NotificationFilter, number> = {
  all: 0,
  transaction: 0,
  order: 0,
  refund: 0,
  transfer: 0,
  'gift-card': 0,
  'voucher-expiry': 0,
  security: 0,
  loyalty: 0,
  'new-offer': 0,
  marketing: 0,
  social: 0,
  system: 0,
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<NotificationFilter>('all');

  // Show the push card until the user dismisses it.
  const [showPushPrompt, setShowPushPrompt] = useState(
    () => !localStorage.getItem(PUSH_DISMISSED_KEY),
  );
  const handleDismissPush = () => {
    localStorage.setItem(PUSH_DISMISSED_KEY, '1');
    setShowPushPrompt(false);
  };

  return (
    // Drop the previous `-mx-4` so the page respects the max-w-md
    // container instead of bleeding to its edges; this leaves a
    // consistent gutter on both sides of every element below.
    <div className="animate-fade-in px-2">
      {/* Header — title centered, settings gear on the trailing edge.
          AppLayout overlays its own TopBar (avatar + chat + bell) above
          the page with h-0 + z-50, so we push this header down to clear it. */}
      <header className="relative px-4 pt-20 pb-3 flex items-center justify-center">
        <h1 className="text-xl font-bold text-text-primary">{t.notifications.title}</h1>
        <button
          type="button"
          aria-label="Notification settings"
          className="absolute end-2 top-20 p-2 text-text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
        </button>
      </header>

      <NotificationTabs selected={selectedTab} onChange={setSelectedTab} counts={ZERO_COUNTS} />

      {showPushPrompt && <PushPromptCard onDismiss={handleDismissPush} />}

      {/* Coming-soon state — reuses the mailbox empty-state visual with
          coming-soon copy. No notifications (mock or otherwise) are rendered. */}
      <NotificationEmptyState
        title={t.notifications.comingSoonTitle}
        body={t.notifications.comingSoonBody}
      />
    </div>
  );
}
