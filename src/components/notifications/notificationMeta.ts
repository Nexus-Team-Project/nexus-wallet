import type { NotificationCategory, NotificationPriority } from '../../types/notification.types';

// Material Symbol name + tailwind container color per category. The
// container background sits *behind* the sender avatar as a small badge
// in the bottom-right corner — like the iOS Wallet app does.
export const CATEGORY_ICON: Record<NotificationCategory, { icon: string; color: string }> = {
  transaction:     { icon: 'shopping_bag',       color: 'bg-blue-500' },
  order:           { icon: 'inventory_2',        color: 'bg-amber-500' },
  refund:          { icon: 'undo',               color: 'bg-emerald-500' },
  transfer:        { icon: 'swap_horiz',         color: 'bg-indigo-500' },
  'gift-card':     { icon: 'card_giftcard',      color: 'bg-pink-500' },
  'voucher-expiry':{ icon: 'schedule',           color: 'bg-orange-500' },
  security:        { icon: 'shield',             color: 'bg-red-500' },
  loyalty:         { icon: 'star',               color: 'bg-yellow-500' },
  'new-offer':     { icon: 'local_offer',        color: 'bg-purple-500' },
  marketing:       { icon: 'campaign',           color: 'bg-fuchsia-500' },
  social:          { icon: 'group',              color: 'bg-teal-500' },
  system:          { icon: 'info',               color: 'bg-gray-500' },
};

// Unread dot color by priority. Critical pops in red, normal activity is
// the familiar blue, marketing pushes get a soft gray so they don't
// shout for attention.
export const PRIORITY_DOT: Record<NotificationPriority, string> = {
  critical:      'bg-error',
  transactional: 'bg-blue-500',
  marketing:     'bg-gray-400',
};
