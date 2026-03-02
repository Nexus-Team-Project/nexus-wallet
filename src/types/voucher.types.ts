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
  validUntil: string;
  termsAndConditions: string;
  termsAndConditionsHe: string;
  inStock: boolean;
  popular: boolean;
  isOnline?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
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
