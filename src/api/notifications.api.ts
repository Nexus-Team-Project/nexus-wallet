import { mockGetNotifications, mockGetUnreadCount } from '../mock/handlers/notifications.handler';
import type { NotificationGroup } from '../types/notification.types';

export const notificationsApi = {
  getAll: (group?: NotificationGroup) => mockGetNotifications(group),
  getUnreadCount: () => mockGetUnreadCount(),
};
