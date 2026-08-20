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
  /**
   * Full-bleed card artwork. When set, the wallet card face renders this
   * image edge-to-edge (object-cover) instead of the brandColor + centred
   * brandLogo composition — used for gift cards whose card *is* the artwork.
   */
  cardImage?: string;
  /** object-position for `cardImage` (e.g. 'left center' to keep a corner logo). */
  cardImagePosition?: string;
  /**
   * Payment-network mark shown on the card face. When set, the card renders
   * the network logo where the Nexus mark normally sits and moves the Nexus
   * mark to the top corner (e.g. the Menora claim card on Mastercard).
   */
  paymentNetwork?: 'mastercard' | 'visa';
  /**
   * Fixed denominations held in inventory for this merchant. A custom amount
   * is fulfilled as the smallest combination with sum >= the requested amount.
   * When absent, the UI falls back to the preset tier amounts.
   */
  denominations?: number[];
  /**
   * Some chains cap how many vouchers can be redeemed in a single POS
   * transaction. Purchases are NOT blocked past the cap — the member is
   * reminded that redemption may be split, and the cap is stated in the
   * deal terms.
   */
  maxVouchersPerRedemption?: number;
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
  /**
   * 'refund_requested' — the holder asked to credit the voucher's value back
   * to their Nexus balance (only possible within 14 days of `purchasedAt`).
   * The voucher leaves the active wallet deck immediately; it does not
   * return to 'active' even if the request is later rejected — only a
   * manual admin override would restore it.
   */
  status: 'active' | 'used' | 'expired' | 'refund_requested';
  redemptionCode: string;
  qrCode: string;
  usedAt?: string;
  refundRequestedAt?: string;
}
