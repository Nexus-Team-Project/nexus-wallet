export type SortOption = 'popular' | 'best_deals' | 'highest_discount' | 'price_asc' | 'price_desc' | 'newest';

export type DealType = 'voucher' | 'coupon' | 'cashback' | 'insurance' | 'service';

export type MemberBenefit = 'club_exclusive' | 'bonus_points' | 'special_price';

export interface CategoryFilters {
  searchQuery: string;
  priceRange: [number, number];
  selectedBrands: string[];
  discountTiers: number[];
  minRating: number | null;
  dealTypes: DealType[];
  memberBenefits: MemberBenefit[];
}

export const DEFAULT_CATEGORY_FILTERS: CategoryFilters = {
  searchQuery: '',
  priceRange: [20, 2000],
  selectedBrands: [],
  discountTiers: [],
  minRating: null,
  dealTypes: [],
  memberBenefits: [],
};
