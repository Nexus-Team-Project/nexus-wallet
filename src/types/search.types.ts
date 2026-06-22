export interface Business {
  id: string;
  name: string;
  nameHe: string;
  category: string;
  categoryHe: string;
  logo: string;
  rating: number;
  reviewCount: number;
  location: string;
  locationHe: string;
  hasVouchers: boolean;
  description?: string;
  descriptionHe?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  phone?: string;
  whatsapp?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroImages?: string[];
  products?: Product[];
  services?: Service[];
  /** Supplier coupon codes — surfaced on the store page "coupon codes" sheet. */
  couponCodes?: CouponCode[];
}

export interface CouponCode {
  /** The code the user copies and pastes at the supplier's checkout. */
  code: string;
  title: string;
  titleHe: string;
  /** Optional short discount label, e.g. "15%" or "₪20". */
  discount?: string;
}

export interface Product {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  merchantName: string;
  image: string;
  price: number;
  originalPrice?: number;
  currency: string;
  inStock: boolean;
}

export interface Service {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  providerName: string;
  icon: string;
  priceRange: string;
  priceRangeHe: string;
  rating: number;
}
