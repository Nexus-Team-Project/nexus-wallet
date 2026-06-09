import type { Notification } from '../../types/notification.types';

export type DaySection = 'today' | 'yesterday' | 'previously';

export interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  previously: Notification[];
}

// Buckets notifications into Today / Yesterday / Previously based on the
// local-time day of `createdAt`. Order within each bucket is preserved
// (the handler already sorts newest-first).
export function groupNotificationsByDay(items: Notification[]): GroupedNotifications {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups: GroupedNotifications = { today: [], yesterday: [], previously: [] };
  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) groups.today.push(n);
    else if (t >= startOfYesterday) groups.yesterday.push(n);
    else groups.previously.push(n);
  }
  return groups;
}
