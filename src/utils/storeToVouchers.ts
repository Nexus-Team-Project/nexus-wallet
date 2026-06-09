import type { Business, Product } from '../types/search.types';
import type { Voucher, VoucherCategory } from '../types/voucher.types';

// Maps a business's free-text category (e.g. "Fashion", "Cafe") onto the
// 7-bucket VoucherCategory model the recommendations view filters on. Keeps
// the store-scoped results consistent with the rest of the search surface.
const BUSINESS_CATEGORY_TO_VOUCHER: Record<string, VoucherCategory> = {
  'Fast Food': 'food',
  Cafe: 'food',
  Restaurant: 'food',
  Fashion: 'shopping',
  Supermarket: 'shopping',
  Retail: 'shopping',
  Entertainment: 'entertainment',
  Hotels: 'travel',
  Travel: 'travel',
  'Health & Beauty': 'health',
  Fitness: 'health',
  Electronics: 'tech',
};

function resolveCategory(business: Business): VoucherCategory {
  return BUSINESS_CATEGORY_TO_VOUCHER[business.category] ?? 'shopping';
}

/**
 * Adapt a single store product into the Voucher shape the
 * RecommendationsContent ("ההמלצות של Nexus") view renders. The store page's
 * product photo becomes the card's atmosphere image; the store's logo/brand
 * carries through so every result reads as "from this store".
 */
function productToVoucher(product: Product, business: Business): Voucher {
  const category = resolveCategory(business);
  const originalPrice = product.originalPrice ?? product.price;
  const discountedPrice = product.price;
  const discountPercent =
    originalPrice > discountedPrice
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0;

  return {
    id: `store_${business.id}_${product.id}`,
    title: product.name,
    titleHe: product.nameHe,
    description: product.description,
    descriptionHe: product.descriptionHe,
    merchantName: business.name,
    merchantLogo: business.logo,
    category,
    originalPrice,
    discountedPrice,
    discountPercent,
    currency: 'ILS',
    image: business.logo,
    imageUrl: product.image,
    validUntil: '',
    termsAndConditions: '',
    termsAndConditionsHe: '',
    brandColor: '#FFFFFF',
    brandLogo: business.logoUrl,
    inStock: product.inStock,
    popular: false,
  };
}

/**
 * Build the Voucher[] that backs a store-scoped search. Returns the store's
 * own products mapped into Voucher cards so the existing /search
 * recommendations view can present them unchanged.
 */
export function storeProductsToVouchers(business: Business): Voucher[] {
  return (business.products ?? []).map((p) => productToVoucher(p, business));
}
