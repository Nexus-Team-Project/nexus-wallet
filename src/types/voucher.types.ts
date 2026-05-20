export type VoucherCategory = 'food' | 'shopping' | 'entertainment' | 'travel' | 'health' | 'education' | 'tech';

export type SpecialFilter = 'coming-soon' | 'expiring' | 'online' | 'new' | 'popular' | 'recommended';

export type StoreFilter = VoucherCategory | SpecialFilter;

export interface Voucher {
  id: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  merchantName: string;
  merchantLogo: string;
  category: VoucherCategory;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  currency: string;
  image: string;
  imageUrl?: string;
  validUntil: string;
  termsAndConditions: string;
  termsAndConditionsHe: string;
  brandColor?: string;
  brandLogo?: string;
  inStock: boolean;
  popular: boolean;
  isOnline?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
}

export interface VoucherConditions {
  usableInStore: boolean;
  usableOnline: boolean;
  usableAtOutlets: boolean;
  stackable: boolean;          // כפל מבצעים
  minPurchase?: number;
  maxPerTransaction?: number;
  notes?: string;
  notesHe?: string;
}

export interface VoucherVariant {
  id: string;
  name: string;
  nameHe: string;
  icon: string;                // material symbol icon name
  conditions: VoucherConditions;
  discountPercent?: number;    // override per variant
}

export interface UserVoucher {
  id: string;
  voucherId: string;
  voucher: Voucher;
  purchasedAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  redemptionCode: string;
  qrCode: string;
  usedAt?: string;
}
