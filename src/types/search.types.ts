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
  phone?: string;
  whatsapp?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroImages?: string[];
  products?: Product[];
  services?: Service[];
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
