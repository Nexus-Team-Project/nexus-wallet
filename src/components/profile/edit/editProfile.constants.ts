/**
 * Shared constants, types, and small helpers for the Edit Profile screen.
 * Kept out of EditProfilePage.tsx so that file stays focused on state + layout.
 */

/** Backend gender enum value. The slides expose a legacy 'prefer-not' id. */
export type GenderValue = 'male' | 'female' | 'prefer_not_to_say';

/** One selectable purpose chip (id + icon + translation key). */
export interface ChipOption {
  id: string;
  icon: string;
  labelKey:
    | 'purposeSaveMoney' | 'purposeDiscover' | 'purposeGiftCards' | 'purposeCompareDeals'
    | 'purposeOrgBenefits' | 'purposeMemberPrices' | 'purposeExclusiveOffers'
    | 'purposeSendGifts' | 'purposeBirthdaySurprises' | 'purposeExploring';
}

/** A titled group of purpose chips. */
export interface ChipCategory {
  titleKey: 'purposeCatShopping' | 'purposeCatBenefits' | 'purposeCatGifting';
  chips: ChipOption[];
}

/**
 * Purpose chip categories - copied verbatim from PurposeSlide.tsx so the chip
 * ids, icons, and category labels stay identical to what onboarding saved.
 */
export const PURPOSE_CATEGORIES: ChipCategory[] = [
  {
    titleKey: 'purposeCatShopping',
    chips: [
      { id: 'save-money', icon: 'savings', labelKey: 'purposeSaveMoney' },
      { id: 'discover', icon: 'location_on', labelKey: 'purposeDiscover' },
      { id: 'gift-cards', icon: 'redeem', labelKey: 'purposeGiftCards' },
      { id: 'compare-deals', icon: 'swap_horiz', labelKey: 'purposeCompareDeals' },
    ],
  },
  {
    titleKey: 'purposeCatBenefits',
    chips: [
      { id: 'org-benefits', icon: 'corporate_fare', labelKey: 'purposeOrgBenefits' },
      { id: 'member-prices', icon: 'loyalty', labelKey: 'purposeMemberPrices' },
      { id: 'exclusive-offers', icon: 'stars', labelKey: 'purposeExclusiveOffers' },
    ],
  },
  {
    titleKey: 'purposeCatGifting',
    chips: [
      { id: 'send-gifts', icon: 'card_giftcard', labelKey: 'purposeSendGifts' },
      { id: 'birthday-surprises', icon: 'cake', labelKey: 'purposeBirthdaySurprises' },
      { id: 'exploring', icon: 'explore', labelKey: 'purposeExploring' },
    ],
  },
];

/**
 * Normalises a stored gender value into the backend enum. Treats the legacy
 * slide id 'prefer-not' as 'prefer_not_to_say'. Anything unrecognised (or the
 * generic 'other') becomes null so no stale value is shown selected.
 * @param raw the stored gender string from /api/me, if any.
 * @returns a backend GenderValue or null.
 */
export function normaliseGender(raw: string | undefined): GenderValue | null {
  if (raw === 'male' || raw === 'female' || raw === 'prefer_not_to_say') return raw;
  if (raw === 'prefer-not') return 'prefer_not_to_say';
  return null;
}

/**
 * Max selectable birthday: today minus 13 years, as YYYY-MM-DD.
 * @returns the latest allowed birth date string.
 */
export function maxBirthday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split('T')[0]!;
}

/** Shared Tailwind class strings for the edit-profile field UIs. */
export const INPUT_CLASS =
  'w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors border-border focus:border-primary';
export const CARD_CLASS = 'rounded-2xl border border-border bg-white p-4';
export const SECTION_LABEL_CLASS = 'text-sm font-semibold text-text-primary mb-3';
