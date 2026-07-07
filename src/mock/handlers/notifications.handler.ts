import { mockNotifications } from '../data/notifications.mock';
import { CATEGORY_GROUP } from '../../types/notification.types';
import type { Notification, NotificationGroup } from '../../types/notification.types';

// Tiny artificial latency so the loading skeleton is actually visible —
// without it the mock resolves on the same tick and isLoading flashes
// for a single frame, defeating the purpose of the skeleton.
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockGetNotifications(group?: NotificationGroup): Promise<Notification[]> {
  await delay(700);
  let items = [...mockNotifications];
  if (group) items = items.filter(n => CATEGORY_GROUP[n.category] === group);
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function mockGetUnreadCount(): Promise<number> {
  // The TopBar bell badge must reflect the REAL signed-in user's unread
  // notifications. There is no notifications backend yet, so a real user has
  // none — return 0 rather than counting the demo fixtures (which would show a
  // fake "7" in the store after a real login). The mock list on the
  // /notifications page is still served by mockGetNotifications for demo only.
  // Swap this for the real unread-count endpoint when the backend lands.
  return 0;
}
