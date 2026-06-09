import type { Notification, NotificationSender, NotificationSubject } from '../../types/notification.types';

const NEXUS: NotificationSender = {
  id: 'nexus',
  name: 'Nexus',
  nameHe: 'נקסוס',
  initial: 'N',
  // The Nexus glyph (the swirly mark, not the wordmark) — same asset
  // shown in the center of the wallet QR card and on the voucher detail
  // page. Pairs with a white circle + border-2 white + shadow in the
  // card's avatar slot.
  logo: '/nexus-icon.png',
  brandColor: 'bg-white',
};

const ACME: NotificationSender = {
  id: 'acme-corp',
  name: 'Acme Rewards',
  nameHe: 'הטבות אקמה',
  initial: 'A',
  brandColor: 'bg-blue-100 text-blue-700',
};

const HEALTH: NotificationSender = {
  id: 'health-plus',
  name: 'Health Plus',
  nameHe: 'הלת\' פלוס',
  initial: 'H',
  brandColor: 'bg-red-100 text-red-700',
};

const STARTUP: NotificationSender = {
  id: 'startup-il',
  name: 'Startup Hub',
  nameHe: 'סטארטאפ האב',
  initial: 'S',
  brandColor: 'bg-emerald-100 text-emerald-700',
};

// Subject helpers — reused across multiple notifications. Keeps the seed
// data DRY and ensures the same business is shown identically every time.
const MCDONALDS: NotificationSubject = {
  type: 'business',
  name: "McDonald's",
  nameHe: 'מקדונלדס',
  imageUrl: '/brands/mcdonalds.png',
  fallback: '🍔',
};
const CASTRO: NotificationSubject = {
  type: 'business',
  name: 'Castro',
  nameHe: 'קסטרו',
  imageUrl: '/castro-logo.png',
  fallback: '👕',
};
const AROMA: NotificationSubject = {
  type: 'business',
  name: 'Aroma',
  nameHe: 'ארומה',
  imageUrl: '/brands/aroma.png',
  fallback: '☕',
};
const SUPERPHARM: NotificationSubject = {
  type: 'business',
  name: 'Superpharm',
  nameHe: 'סופרפארם',
  imageUrl: '/brands/superpharm.png',
  fallback: '💊',
};
const SHUFERSAL: NotificationSubject = {
  type: 'business',
  name: 'Shufersal',
  nameHe: 'שופרסל',
  imageUrl: '/brands/shufersal.png',
  fallback: '🛒',
};
const BIG_MAC: NotificationSubject = {
  type: 'product',
  name: 'Big Mac voucher',
  nameHe: 'שובר ביג מק',
  imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80',
  fallback: '🍔',
};

// Dates are anchored to the project's "today" (2026-05-27) so the
// Today / Yesterday / Previously grouping is meaningful in the UI.
export const mockNotifications: Notification[] = [
  // ── Today ──
  {
    id: 'n_001',
    category: 'transaction',
    priority: 'transactional',
    sender: NEXUS,
    subject: MCDONALDS,
    title: 'Payment confirmed',
    titleHe: 'התשלום אושר',
    body: 'Your ₪45 payment to McDonald\'s was successful.',
    bodyHe: 'התשלום שלך ע"ס ₪45 למקדונלדס בוצע בהצלחה.',
    createdAt: '2026-05-27T09:12:00Z',
    isRead: false,
    deepLink: '/activity',
  },
  {
    id: 'n_002',
    category: 'voucher-expiry',
    priority: 'transactional',
    sender: NEXUS,
    subject: CASTRO,
    title: 'Voucher expires in 3 days',
    titleHe: 'השובר שלך פג בעוד 3 ימים',
    body: 'Use your Castro ₪80 voucher before it expires.',
    bodyHe: 'נצל את שובר קסטרו ע"ס ₪80 לפני שיפוג.',
    createdAt: '2026-05-27T08:00:00Z',
    isRead: false,
    deepLink: '/wallet',
  },
  {
    id: 'n_003',
    category: 'marketing',
    priority: 'marketing',
    sender: ACME,
    title: 'Summer sale — up to 40% off',
    titleHe: 'סייל קיץ — עד 40% הנחה',
    body: 'Acme partners are running a flash sale until midnight.',
    bodyHe: 'שותפי אקמה במבצע בזק עד חצות.',
    createdAt: '2026-05-27T07:30:00Z',
    isRead: false,
    deepLink: '/store',
  },

  // ── Yesterday ──
  {
    id: 'n_004',
    category: 'transfer',
    priority: 'transactional',
    sender: NEXUS,
    title: 'You received ₪120',
    titleHe: 'קיבלת ₪120',
    body: 'Daniel sent you ₪120 with the note "lunch".',
    bodyHe: 'דניאל שלח לך ₪120 עם ההערה "צהריים".',
    createdAt: '2026-05-26T16:42:00Z',
    isRead: false,
    deepLink: '/wallet',
  },
  {
    id: 'n_005',
    category: 'gift-card',
    priority: 'transactional',
    sender: NEXUS,
    subject: AROMA,
    title: 'A gift card is waiting for you',
    titleHe: 'כרטיס מתנה מחכה לך',
    body: 'Maya sent you a ₪50 Aroma gift card.',
    bodyHe: 'מאיה שלחה לך כרטיס מתנה ע"ס ₪50 לארומה.',
    createdAt: '2026-05-26T14:10:00Z',
    isRead: false,
    deepLink: '/wallet',
  },
  {
    id: 'n_006',
    category: 'security',
    priority: 'critical',
    sender: NEXUS,
    title: 'New device signed in',
    titleHe: 'התחברות ממכשיר חדש',
    body: 'iPhone 15 Pro near Tel Aviv. If this wasn\'t you, tap to review.',
    bodyHe: 'iPhone 15 Pro באזור תל אביב. אם זה לא היית אתה, הקש לבדיקה.',
    createdAt: '2026-05-26T11:05:00Z',
    isRead: false,
    deepLink: '/profile',
  },
  {
    id: 'n_007',
    category: 'new-offer',
    priority: 'marketing',
    sender: HEALTH,
    subject: SUPERPHARM,
    title: 'New benefit: 25% off Superpharm',
    titleHe: 'הטבה חדשה: 25% הנחה בסופרפארם',
    body: 'A new perk just landed for Health Plus members.',
    bodyHe: 'הטבה חדשה לחברי הלת\' פלוס.',
    createdAt: '2026-05-26T09:20:00Z',
    isRead: false,
    deepLink: '/store',
  },

  // ── Previously ──
  {
    id: 'n_008',
    category: 'loyalty',
    priority: 'transactional',
    sender: NEXUS,
    subject: BIG_MAC,
    title: 'Cashback earned: ₪4.50',
    titleHe: 'קאשבק התקבל: ₪4.50',
    body: '10% cashback from your McDonald\'s purchase.',
    bodyHe: '10% החזר על הרכישה במקדונלדס.',
    createdAt: '2026-05-24T10:31:00Z',
    isRead: true,
    deepLink: '/activity',
  },
  {
    id: 'n_009',
    category: 'order',
    priority: 'transactional',
    sender: NEXUS,
    subject: AROMA,
    title: 'Your order is ready for pickup',
    titleHe: 'ההזמנה שלך מוכנה לאיסוף',
    body: 'Aroma Dizengoff has prepared your order.',
    bodyHe: 'ארומה דיזנגוף הכינה את ההזמנה שלך.',
    createdAt: '2026-05-23T13:45:00Z',
    isRead: true,
    deepLink: '/activity',
  },
  {
    id: 'n_010',
    category: 'refund',
    priority: 'transactional',
    sender: NEXUS,
    subject: SHUFERSAL,
    title: 'Refund processed: ₪90',
    titleHe: 'זיכוי בוצע: ₪90',
    body: 'Refund for the expired Shufersal voucher was credited.',
    bodyHe: 'הזיכוי על שובר שופרסל שפג זוכה לחשבונך.',
    createdAt: '2026-05-21T10:00:00Z',
    isRead: true,
    deepLink: '/activity',
  },
  {
    id: 'n_011',
    category: 'social',
    priority: 'marketing',
    sender: NEXUS,
    title: 'Yael joined Nexus through your link',
    titleHe: 'יעל הצטרפה דרך הקישור שלך',
    body: 'You earned a ₪20 referral bonus.',
    bodyHe: 'זיכינו אותך בבונוס הפניה ע"ס ₪20.',
    createdAt: '2026-05-19T18:00:00Z',
    isRead: true,
    deepLink: '/profile',
  },
  {
    id: 'n_012',
    category: 'marketing',
    priority: 'marketing',
    sender: STARTUP,
    title: 'New month, new perks',
    titleHe: 'חודש חדש, הטבות חדשות',
    body: 'Check what Startup Hub members get this month.',
    bodyHe: 'מה חברי סטארטאפ האב מקבלים החודש.',
    createdAt: '2026-05-18T09:00:00Z',
    isRead: true,
    deepLink: '/store',
  },
  {
    id: 'n_013',
    category: 'loyalty',
    priority: 'transactional',
    sender: NEXUS,
    title: 'You reached Silver tier',
    titleHe: 'הגעת לדרגת סילבר',
    body: 'Enjoy 2x cashback on weekends and free voucher delivery.',
    bodyHe: 'נהנה מ-2X קאשבק בסופי שבוע ומשלוח שוברים ללא עלות.',
    createdAt: '2026-05-15T08:00:00Z',
    isRead: true,
    deepLink: '/wallet',
  },
  {
    id: 'n_014',
    category: 'system',
    priority: 'marketing',
    sender: NEXUS,
    title: 'New: Nearby offers on the map',
    titleHe: 'חדש: הטבות קרובות במפה',
    body: 'Open the map to see deals around you in real time.',
    bodyHe: 'פתח את המפה לראות הטבות סביבך בזמן אמת.',
    createdAt: '2026-05-10T08:00:00Z',
    isRead: true,
    deepLink: '/near-you-map',
  },
];
