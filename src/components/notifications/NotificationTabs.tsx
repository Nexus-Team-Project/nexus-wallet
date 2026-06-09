import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';
import { CATEGORY_ICON } from './notificationMeta';
import type { NotificationCategory } from '../../types/notification.types';

// 'all' is the default; everything else is a NotificationCategory key.
export type NotificationFilter = 'all' | NotificationCategory;

interface NotificationTabsProps {
  selected: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
  // Unread count per filter — drives the badge on each pill.
  counts: Record<NotificationFilter, number>;
}

// Pill order: All first, then the high-priority/activity buckets, then
// promotional ones. The user can scroll horizontally to reach the rest.
const PILLS: { key: NotificationFilter; labelKey: string; icon?: string; color?: string }[] = [
  { key: 'all',             labelKey: 'tabAll' },
  { key: 'transaction',     labelKey: 'catTransaction',    icon: CATEGORY_ICON.transaction.icon,     color: CATEGORY_ICON.transaction.color },
  { key: 'order',           labelKey: 'catOrder',          icon: CATEGORY_ICON.order.icon,           color: CATEGORY_ICON.order.color },
  { key: 'refund',          labelKey: 'catRefund',         icon: CATEGORY_ICON.refund.icon,          color: CATEGORY_ICON.refund.color },
  { key: 'transfer',        labelKey: 'catTransfer',       icon: CATEGORY_ICON.transfer.icon,        color: CATEGORY_ICON.transfer.color },
  { key: 'gift-card',       labelKey: 'catGiftCard',       icon: CATEGORY_ICON['gift-card'].icon,    color: CATEGORY_ICON['gift-card'].color },
  { key: 'voucher-expiry',  labelKey: 'catVoucherExpiry',  icon: CATEGORY_ICON['voucher-expiry'].icon,color: CATEGORY_ICON['voucher-expiry'].color },
  { key: 'loyalty',         labelKey: 'catLoyalty',        icon: CATEGORY_ICON.loyalty.icon,         color: CATEGORY_ICON.loyalty.color },
  { key: 'security',        labelKey: 'catSecurity',       icon: CATEGORY_ICON.security.icon,        color: CATEGORY_ICON.security.color },
  { key: 'new-offer',       labelKey: 'catNewOffer',       icon: CATEGORY_ICON['new-offer'].icon,    color: CATEGORY_ICON['new-offer'].color },
  { key: 'marketing',       labelKey: 'catMarketing',      icon: CATEGORY_ICON.marketing.icon,       color: CATEGORY_ICON.marketing.color },
  { key: 'social',          labelKey: 'catSocial',         icon: CATEGORY_ICON.social.icon,          color: CATEGORY_ICON.social.color },
  { key: 'system',          labelKey: 'catSystem',         icon: CATEGORY_ICON.system.icon,          color: CATEGORY_ICON.system.color },
];

export default function NotificationTabs({ selected, onChange, counts }: NotificationTabsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2">
      {PILLS.map(({ key, labelKey, icon, color }) => {
        const isActive = key === selected;
        const count = counts[key] ?? 0;
        const label = t.notifications[labelKey as keyof typeof t.notifications];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5',
              isActive
                ? 'bg-text-primary text-white'
                : 'bg-white text-text-secondary border border-border hover:bg-border/50',
            )}
          >
            {icon && (
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  isActive ? 'bg-white/20' : color,
                )}
              >
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </span>
            )}
            <span>{label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-surface text-text-muted',
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
