import { useNotificationToastStore } from '../../stores/notificationToastStore';
import { CATEGORY_ICON } from '../notifications/notificationMeta';
import type { Notification, NotificationCategory, NotificationPriority, NotificationSender, NotificationSubject } from '../../types/notification.types';
import { cn } from '../../utils/cn';

// Mini library of senders + subjects so each fixture stays succinct.
const NEXUS: NotificationSender = {
  id: 'nexus', name: 'Nexus', nameHe: 'נקסוס', initial: 'N',
  logo: '/nexus-icon.png', brandColor: 'bg-white',
};
const ACME: NotificationSender = {
  id: 'acme-corp', name: 'Acme Rewards', nameHe: 'הטבות אקמה', initial: 'A',
  brandColor: 'bg-blue-100 text-blue-700',
};
const HEALTH: NotificationSender = {
  id: 'health-plus', name: 'Health Plus', nameHe: 'הלת\' פלוס', initial: 'H',
  brandColor: 'bg-red-100 text-red-700',
};
const MCDONALDS: NotificationSubject = { type: 'business', name: "McDonald's", nameHe: 'מקדונלדס', imageUrl: '/brands/mcdonalds.png', fallback: '🍔' };
const CASTRO: NotificationSubject = { type: 'business', name: 'Castro', nameHe: 'קסטרו', imageUrl: '/castro-logo.png', fallback: '👕' };
const AROMA: NotificationSubject = { type: 'business', name: 'Aroma', nameHe: 'ארומה', imageUrl: '/brands/aroma.png', fallback: '☕' };
const SUPERPHARM: NotificationSubject = { type: 'business', name: 'Superpharm', nameHe: 'סופרפארם', imageUrl: '/brands/superpharm.png', fallback: '💊' };

// Each fixture is a templated notification — the test panel stamps a
// fresh id + timestamp at fire time so re-clicks produce visibly new
// toasts (and exercise the batching path when clicked rapidly).
interface Fixture {
  key: string;
  labelHe: string;
  labelEn: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  sender: NotificationSender;
  subject?: NotificationSubject;
  titleHe: string;
  title: string;
  bodyHe: string;
  body: string;
  deepLink?: string;
}

const FIXTURES: Fixture[] = [
  {
    key: 'transaction',
    labelHe: 'תשלום אושר',
    labelEn: 'Payment confirmed',
    category: 'transaction', priority: 'transactional',
    sender: NEXUS, subject: MCDONALDS,
    title: 'Payment confirmed', titleHe: 'התשלום אושר',
    body: 'Your ₪45 payment to McDonald\'s was successful.',
    bodyHe: 'התשלום שלך ע"ס ₪45 למקדונלדס בוצע בהצלחה.',
    deepLink: '/activity',
  },
  {
    key: 'voucher-expiry',
    labelHe: 'שובר עומד לפוג',
    labelEn: 'Voucher expiring',
    category: 'voucher-expiry', priority: 'transactional',
    sender: NEXUS, subject: CASTRO,
    title: 'Voucher expires in 3 days', titleHe: 'השובר שלך פג בעוד 3 ימים',
    body: 'Use your Castro ₪80 voucher before it expires.',
    bodyHe: 'נצל את שובר קסטרו ע"ס ₪80 לפני שיפוג.',
    deepLink: '/wallet',
  },
  {
    key: 'transfer',
    labelHe: 'קיבלת כסף',
    labelEn: 'Money received',
    category: 'transfer', priority: 'transactional',
    sender: NEXUS,
    title: 'You received ₪120', titleHe: 'קיבלת ₪120',
    body: 'Daniel sent you ₪120 with the note "lunch".',
    bodyHe: 'דניאל שלח לך ₪120 עם ההערה "צהריים".',
    deepLink: '/wallet',
  },
  {
    key: 'gift-card',
    labelHe: 'כרטיס מתנה התקבל',
    labelEn: 'Gift card received',
    category: 'gift-card', priority: 'transactional',
    sender: NEXUS, subject: AROMA,
    title: 'A gift card is waiting for you', titleHe: 'כרטיס מתנה מחכה לך',
    body: 'Maya sent you a ₪50 Aroma gift card.',
    bodyHe: 'מאיה שלחה לך כרטיס מתנה ע"ס ₪50 לארומה.',
    deepLink: '/wallet',
  },
  {
    key: 'security',
    labelHe: 'התראת אבטחה',
    labelEn: 'Security alert',
    category: 'security', priority: 'critical',
    sender: NEXUS,
    title: 'New device signed in', titleHe: 'התחברות ממכשיר חדש',
    body: 'iPhone 15 Pro near Tel Aviv. If this wasn\'t you, tap to review.',
    bodyHe: 'iPhone 15 Pro באזור תל אביב. אם זה לא היית אתה, הקש לבדיקה.',
    deepLink: '/profile',
  },
  {
    key: 'new-offer',
    labelHe: 'הטבה חדשה',
    labelEn: 'New offer',
    category: 'new-offer', priority: 'marketing',
    sender: HEALTH, subject: SUPERPHARM,
    title: 'New benefit: 25% off Superpharm', titleHe: 'הטבה חדשה: 25% הנחה בסופרפארם',
    body: 'A new perk just landed for Health Plus members.',
    bodyHe: 'הטבה חדשה לחברי הלת\' פלוס.',
    deepLink: '/store',
  },
  {
    key: 'marketing',
    labelHe: 'קמפיין מהארגון',
    labelEn: 'Tenant promo',
    category: 'marketing', priority: 'marketing',
    sender: ACME,
    title: 'Summer sale — up to 40% off', titleHe: 'סייל קיץ — עד 40% הנחה',
    body: 'Acme partners are running a flash sale until midnight.',
    bodyHe: 'שותפי אקמה במבצע בזק עד חצות.',
    deepLink: '/store',
  },
  {
    key: 'order',
    labelHe: 'הזמנה מוכנה',
    labelEn: 'Order ready',
    category: 'order', priority: 'transactional',
    sender: NEXUS, subject: AROMA,
    title: 'Your order is ready for pickup', titleHe: 'ההזמנה שלך מוכנה לאיסוף',
    body: 'Aroma Dizengoff has prepared your order.',
    bodyHe: 'ארומה דיזנגוף הכינה את ההזמנה שלך.',
    deepLink: '/activity',
  },
  {
    key: 'loyalty',
    labelHe: 'קאשבק התקבל',
    labelEn: 'Cashback earned',
    category: 'loyalty', priority: 'transactional',
    sender: NEXUS, subject: MCDONALDS,
    title: 'Cashback earned: ₪4.50', titleHe: 'קאשבק התקבל: ₪4.50',
    body: '10% cashback from your McDonald\'s purchase.',
    bodyHe: '10% החזר על הרכישה במקדונלדס.',
    deepLink: '/activity',
  },
];

interface NotificationTestPanelProps {
  language: 'he' | 'en';
}

export default function NotificationTestPanel({ language }: NotificationTestPanelProps) {
  const showToast = useNotificationToastStore(s => s.showToast);
  const dismissAll = useNotificationToastStore(s => s.dismissAll);

  // Mint a fresh notification each click — unique id + current timestamp.
  // The store's batching logic still groups rapid repeats of the same
  // sender+category, which is exactly the behaviour we want to verify here.
  const fire = (f: Fixture) => {
    const now = new Date().toISOString();
    const notif: Notification = {
      id: `test_${f.key}_${Date.now()}`,
      category: f.category,
      priority: f.priority,
      sender: f.sender,
      subject: f.subject,
      title: f.title, titleHe: f.titleHe,
      body: f.body, bodyHe: f.bodyHe,
      createdAt: now,
      isRead: false,
      deepLink: f.deepLink,
    };
    showToast(notif);
  };

  // Burst test — exercises both stacking (different categories) and
  // batching (same sender+category arriving close together).
  const fireBurst = () => {
    fire(FIXTURES[0]);
    setTimeout(() => fire(FIXTURES[3]), 600);
    setTimeout(() => fire(FIXTURES[4]), 1200);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={fireBurst}
          className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          {language === 'he' ? 'ירייה רצופה (3 התראות)' : 'Burst (3 toasts)'}
        </button>
        <button
          type="button"
          onClick={dismissAll}
          className="flex-1 py-3 rounded-2xl bg-surface text-text-secondary font-semibold text-sm border border-border active:scale-[0.98] transition-transform"
        >
          {language === 'he' ? 'נקה הכל' : 'Clear all'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {FIXTURES.map(f => {
          const { icon, color } = CATEGORY_ICON[f.category];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => fire(f)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-border hover:bg-surface active:scale-[0.98] transition-all text-start"
            >
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', color)}>
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {language === 'he' ? f.labelHe : f.labelEn}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {f.category} · {f.priority}
                </p>
              </div>
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>
                play_arrow
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
