/**
 * appToast — the app's single in-app toast helper, rendered through the
 * notification-toast system (NotificationToastHost) so every transient message
 * shares the in-app notification design (avatar + title + body + category
 * badge). This replaces the old plain green/red sonner toasts.
 *
 * Call sites pass an ALREADY-LOCALIZED message string (the call site knows the
 * active language). The notification renderer reads `title`/`titleHe` by
 * language, so we store the same localized string in both fields — the right
 * text shows regardless of which one the renderer picks.
 *
 * For join / approval outcomes, pass `sender` set to the tenant (with its real
 * `logoUrl`) so the toast avatar shows the organization's logo, exactly like
 * the branded notifications.
 */
import { useNotificationToastStore } from '../stores/notificationToastStore';
import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationSender,
  NotificationSubject,
} from '../types/notification.types';

/** Default sender for platform-level app feedback (save, error, info). */
const NEXUS_SENDER: NotificationSender = {
  id: 'nexus',
  name: 'Nexus',
  nameHe: 'נקסוס',
  initial: 'N',
  logo: '/nexus-icon.png',
  brandColor: 'bg-white',
};

/**
 * Build a notification sender from a tenant so the toast avatar shows the
 * organization's real logo (falls back to its initial when no logo is known).
 * @param tenantId the tenant id (used as the sender id).
 * @param orgName  the tenant display name (used for both EN + HE).
 * @param logoUrl  the tenant's real logo URL, if available.
 * @returns a NotificationSender carrying the tenant branding.
 */
export function tenantSender(
  tenantId: string,
  orgName: string,
  logoUrl?: string | null,
): NotificationSender {
  return {
    id: tenantId,
    name: orgName,
    nameHe: orgName,
    initial: (orgName.trim().charAt(0) || '?').toUpperCase(),
    logo: logoUrl ?? undefined,
  };
}

/** Options for a toast beyond the headline message. */
export interface AppToastOptions {
  /** Secondary line (already localized). */
  body?: string;
  /** Override the sender — e.g. a tenant with its real logo. */
  sender?: NotificationSender;
  /** Optional business/product subject (prefers its image over the sender). */
  subject?: NotificationSubject;
  /** Category drives the small corner icon. Defaults to 'system'. */
  category?: NotificationCategory;
  /** In-app deep link opened when the toast is tapped (no /:lang prefix). */
  deepLink?: string;
  /** Auto-dismiss ms, or null for manual-only. Defaults to the store's value. */
  duration?: number | null;
}

// Monotonic counter for unique transient toast ids. Avoids relying on a
// timestamp/random for identity; the toast store still stamps its own
// per-appearance toastId on top of this.
let seq = 0;
function nextId(): string {
  seq += 1;
  return `apptoast_${seq}`;
}

/**
 * Build a Notification from a localized message + options and push it to the
 * notification-toast store.
 * @param message  already-localized headline text.
 * @param priority drives the colored priority dot (critical = red, else blue).
 * @param options  body / sender / subject / category / deepLink / duration.
 */
function push(
  message: string,
  priority: NotificationPriority,
  options: AppToastOptions = {},
): void {
  const notification: Notification = {
    id: nextId(),
    category: options.category ?? 'system',
    priority,
    sender: options.sender ?? NEXUS_SENDER,
    subject: options.subject,
    title: message,
    titleHe: message,
    body: options.body ?? '',
    bodyHe: options.body ?? '',
    createdAt: new Date().toISOString(),
    isRead: false,
    deepLink: options.deepLink,
  };
  useNotificationToastStore
    .getState()
    .showToast(notification, { duration: options.duration });
}

/**
 * In-app toast API. `success` / `info` render a blue priority dot, `error`
 * renders a red one — the notification design replaces sonner's colored bars.
 */
export const appToast = {
  success: (message: string, options?: AppToastOptions) =>
    push(message, 'transactional', options),
  info: (message: string, options?: AppToastOptions) =>
    push(message, 'transactional', options),
  error: (message: string, options?: AppToastOptions) =>
    push(message, 'critical', options),
};
