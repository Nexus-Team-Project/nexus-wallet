import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import type { NotificationGroup } from '../types/notification.types';

export function useNotifications(group?: NotificationGroup) {
  return useQuery({
    queryKey: ['notifications', group],
    queryFn: () => notificationsApi.getAll(group),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
  });
}
