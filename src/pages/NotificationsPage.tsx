import { useCallback, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationCategory } from '../types/notification.types';
import SwipeableNotification from '../components/notifications/SwipeableNotification';
import NotificationTabs, { type NotificationFilter } from '../components/notifications/NotificationTabs';
import NotificationEmptyState from '../components/notifications/NotificationEmptyState';
import NotificationCardSkeleton from '../components/notifications/NotificationCardSkeleton';
import PushPromptCard from '../components/notifications/PushPromptCard';
import Skeleton from '../components/ui/Skeleton';
import { groupNotificationsByDay } from '../components/notifications/groupNotificationsByDay';

// localStorage keys — keep the prompt out of the user's face once they
// have made a choice. Two separate flags so we can distinguish "enabled"
// from "dismissed without enabling" if we ever want to re-prompt later.
const PUSH_ENABLED_KEY = 'nexus_push_enabled';
const PUSH_DISMISSED_KEY = 'nexus_push_dismissed';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { data: notifications = [], isLoading } = useNotifications();
  const [selectedTab, setSelectedTab] = useState<NotificationFilter>('all');

  // Only show the push prompt to users who haven't already enabled push
  // and haven't dismissed the card.
  const [showPushPrompt, setShowPushPrompt] = useState(
    () => !localStorage.getItem(PUSH_ENABLED_KEY) && !localStorage.getItem(PUSH_DISMISSED_KEY),
  );

  const handleEnablePush = () => {
    localStorage.setItem(PUSH_ENABLED_KEY, '1');
    setShowPushPrompt(false);
  };
  const handleDismissPush = () => {
    localStorage.setItem(PUSH_DISMISSED_KEY, '1');
    setShowPushPrompt(false);
  };

  // Locally archived notifications. Real backend would POST to an
  // archive endpoint and invalidate the query; for the mock we just
  // filter them out of the displayed list. Stored as a Set for O(1)
  // lookup during render.
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => new Set());
  const handleArchive = useCallback((id: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const visible = useMemo(
    () => notifications.filter(n => !archivedIds.has(n.id)),
    [notifications, archivedIds],
  );

  // Per-filter unread counts feed the small badges on each pill so the
  // user can see at a glance how many items are waiting in each category.
  const counts = useMemo(() => {
    const acc: Record<NotificationFilter, number> = {
      all: 0,
      transaction: 0, order: 0, refund: 0, transfer: 0,
      'gift-card': 0, 'voucher-expiry': 0, security: 0, loyalty: 0,
      'new-offer': 0, marketing: 0, social: 0, system: 0,
    };
    for (const n of visible) {
      if (n.isRead) continue;
      acc.all += 1;
      acc[n.category] += 1;
    }
    return acc;
  }, [visible]);

  const filtered = useMemo(() => {
    if (selectedTab === 'all') return visible;
    return visible.filter(n => n.category === (selectedTab as NotificationCategory));
  }, [visible, selectedTab]);

  const grouped = useMemo(() => groupNotificationsByDay(filtered), [filtered]);

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

      <NotificationTabs selected={selectedTab} onChange={setSelectedTab} counts={counts} />

      {showPushPrompt && (
        <PushPromptCard onEnable={handleEnablePush} onDismiss={handleDismissPush} />
      )}

      {isLoading ? (
        // Mirror the loaded layout — section header + a few card rows —
        // so revealing the real notifications causes no layout shift.
        <div className="px-4 pt-2 pb-4" aria-busy="true" aria-live="polite">
          <section className="mb-2">
            <Skeleton className="h-4 w-16 rounded mb-3 mx-2" />
            {[0, 1, 2, 3].map(i => (
              <NotificationCardSkeleton key={i} index={i} />
            ))}
          </section>
        </div>
      ) : filtered.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="px-4 pt-2 pb-4">
          {grouped.today.length > 0 && (
            <section className="mb-2">
              <h2 className="text-sm font-semibold text-text-muted mb-3 px-2">
                {t.notifications.sectionToday}
              </h2>
              {grouped.today.map(n => <SwipeableNotification key={n.id} notification={n} onArchive={handleArchive} />)}
            </section>
          )}
          {grouped.yesterday.length > 0 && (
            <section className="mb-2">
              <h2 className="text-sm font-semibold text-text-muted mb-3 px-2">
                {t.notifications.sectionYesterday}
              </h2>
              {grouped.yesterday.map(n => <SwipeableNotification key={n.id} notification={n} onArchive={handleArchive} />)}
            </section>
          )}
          {grouped.previously.length > 0 && (
            <section className="mb-2">
              <h2 className="text-sm font-semibold text-text-muted mb-3 px-2">
                {t.notifications.sectionPreviously}
              </h2>
              {grouped.previously.map(n => <SwipeableNotification key={n.id} notification={n} onArchive={handleArchive} />)}
            </section>
          )}

          <footer className="py-10 text-center">
            <p className="text-[13px] text-text-secondary">{t.notifications.historicalPrompt}</p>
            <button type="button" className="text-[13px] text-primary font-semibold hover:underline">
              {t.notifications.historicalCta}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
