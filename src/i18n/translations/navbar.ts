/**
 * `navbar` strings copied verbatim from the marketing site's translations
 * (nexus-website/src/i18n/translations.ts → `navbar` block).
 *
 * Only the keys the ported Footer component reads are here — the wallet has
 * no marketing navbar of its own, so the rest of that block isn't needed.
 * Keeping the namespace name identical is what lets Footer.tsx stay a
 * verbatim copy (it references `t.navbar.loyaltyClub` etc.).
 */
export const navbarTranslations = {
  en: {
    loyaltyClub: 'Corporate Benefits Club',
    loyaltyPartnerships: 'Benefits & Partnerships',
    giftsWelfare: 'Gifts & Welfare Budgets',
    paymentLinks: 'Payment Links',
  },
  he: {
    loyaltyClub: 'מועדון הטבות ארגוני',
    loyaltyPartnerships: 'הטבות ושיתופי פעולה',
    giftsWelfare: 'מתנות ותקציבי רווחה',
    paymentLinks: 'קישורי תשלום',
  },
};
