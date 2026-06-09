// Categories drive the visual icon/color and the filter tabs.
// `activity` group covers things that *happened* on the user's account
// (money, vouchers, orders, security). `offers` group covers things
// pushed by tenants or the platform (marketing, new offers).
export type NotificationCategory =
  // Transactional / account activity
  | 'transaction'        // purchase confirmed, payment in store
  | 'order'              // order placed / ready / shipped / delivered
  | 'refund'             // refund processed
  | 'transfer'           // money sent / received
  | 'gift-card'          // gift card received / sent
  | 'voucher-expiry'     // voucher about to expire
  | 'security'           // new device login, KYC, password change
  | 'loyalty'            // cashback earned, tier upgrade, milestone
  // Inbound / promotional
  | 'new-offer'          // a new offer relevant to the user
  | 'marketing'          // tenant or platform broadcast
  | 'social'             // referral signup, friend activity
  | 'system';            // app updates, terms of service

// Priority drives ordering and the visual treatment (the small colored dot).
//   critical       → red dot   (security, failed payment)
//   transactional  → blue dot  (default unread)
//   marketing      → grey dot  (non-urgent broadcast)
export type NotificationPriority = 'critical' | 'transactional' | 'marketing';

// The two top-level tabs on the page. `system` notifications surface
// under "activity" since they are personal to the user.
export type NotificationGroup = 'activity' | 'offers';

export const CATEGORY_GROUP: Record<NotificationCategory, NotificationGroup> = {
  transaction:    'activity',
  order:          'activity',
  refund:         'activity',
  transfer:       'activity',
  'gift-card':    'activity',
  'voucher-expiry':'activity',
  security:       'activity',
  loyalty:        'activity',
  system:         'activity',
  'new-offer':    'offers',
  marketing:      'offers',
  social:         'offers',
};

// The sender of a notification — either the platform itself or a tenant
// (organization). Tenants can broadcast their own pushes; surfacing the
// sender's branding lets the user trust + filter per-tenant.
export interface NotificationSender {
  // 'nexus' is the platform; otherwise the tenant id from tenants.mock.ts
  id: 'nexus' | string;
  name: string;
  nameHe: string;
  logo?: string;        // url or emoji fallback
  initial: string;      // single letter for the circular avatar
  brandColor?: string;  // tailwind class fragment, e.g. 'bg-pink-200 text-pink-700'
}

// The "subject" of a notification — the business or product the message
// is about. When present, the card prefers showing the subject's image +
// name over the sender's branding (e.g. a payment at McDonald's shows
// the McDonald's logo, not the Nexus 'N').
export interface NotificationSubject {
  type: 'business' | 'product';
  name: string;
  nameHe: string;
  // Image URL (logo for businesses, product photo for products).
  imageUrl?: string;
  // Emoji shown when the image fails to load or is absent.
  fallback?: string;
}

export interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  sender: NotificationSender;
  // Optional — the business/product this notification is about.
  subject?: NotificationSubject;
  title: string;
  titleHe: string;
  body: string;
  bodyHe: string;
  // ISO timestamp. Used for grouping into Today / Yesterday / Previously.
  createdAt: string;
  isRead: boolean;
  // Deep link target inside the app — clicking the card navigates here.
  // The path is relative (no /:lang prefix); the page adds the prefix.
  deepLink?: string;
}
