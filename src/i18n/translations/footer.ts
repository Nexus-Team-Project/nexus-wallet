/**
 * Footer strings, copied verbatim from the marketing site's translations
 * (nexus-website/src/i18n/translations.ts → `footer` / `navbar` blocks) so the
 * ported Footer component renders identical copy in both projects.
 *
 * The Products column also reads four `navbar.*` keys; those live in
 * ./navbar.ts under the same namespace name the website uses, so the ported
 * component needs no edits.
 */
export const footerTranslations = {
  en: {
    products: 'Products',
    developers: 'Developers',
    company: 'Company',
    resources: 'Resources',
    payments: 'Payments',
    documentation: 'Documentation',
    apiReference: 'API Reference',
    apiChangelog: 'API Changelog',
    blog: 'Blog',
    supportCenter: 'Support center',
    contactSales: 'Contact sales',
    aboutNexus: 'About',
    jobs: 'Jobs',
    newsroom: 'Newsroom',
    addressLine1: 'Rahal Kagan 14',
    addressLine2: 'Haifa, Israel',
    allRightsReserved: '© 2025 Nexus, Inc. All rights reserved.',
    privacyPolicy: 'Privacy & terms',
    termsOfUse: 'Terms of Use',
    accessibility: 'Accessibility',
  },
  he: {
    products: 'מוצרים',
    developers: 'מפתחים',
    company: 'החברה',
    resources: 'משאבים',
    payments: 'תשלומים',
    documentation: 'תיעוד',
    apiReference: 'מדריך API',
    apiChangelog: 'יומן שינויים API',
    blog: 'בלוג',
    supportCenter: 'מרכז תמיכה',
    contactSales: 'צור קשר עם המכירות',
    aboutNexus: 'אודות',
    jobs: 'משרות',
    newsroom: 'חדר חדשות',
    addressLine1: 'רחל קגן 14',
    addressLine2: 'חיפה, ישראל',
    allRightsReserved: '© 2025 Nexus, Inc. כל הזכויות שמורות.',
    privacyPolicy: 'פרטיות ותנאים',
    termsOfUse: 'תנאי שימוש',
    accessibility: 'נגישות',
  },
};
