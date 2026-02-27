import type { TenantConfig } from '../../types/tenant.types';

export const mockTenants: Record<string, TenantConfig> = {
  'acme-corp': {
    id: 'acme-corp',
    name: 'Acme Corporation',
    nameHe: 'תאגיד אקמה',
    logo: '/tenants/acme-logo.svg',
    backgroundImage: '/tenants/acme-bg.jpg',
    primaryColor: '#1e40af',
    requiresMembershipFee: false,
    flowOverrides: {
      skipQuestionnaire: false,
      customWelcomeMessage: 'Welcome, Acme team member!',
      customWelcomeMessageHe: 'ברוכים הבאים, חברי צוות אקמה!',
    },
  },
  'startup-il': {
    id: 'startup-il',
    name: 'Israeli Startup Hub',
    nameHe: 'סטארטאפ ישראלי',
    logo: '/tenants/startup-logo.svg',
    backgroundImage: '/tenants/startup-bg.jpg',
    primaryColor: '#059669',
    requiresMembershipFee: true,
    membershipFeeAmount: 29.9,
    membershipFeeCurrency: 'ILS',
    membershipFeeLabel: 'Monthly membership',
    membershipFeeLabelHe: 'מנוי חודשי',
    membershipBenefits: [
      'Exclusive deals up to 70% off',
      'Early access to new vouchers',
      'Premium customer support',
    ],
    membershipBenefitsHe: [
      'הנחות בלעדיות עד 70%',
      'גישה מוקדמת לשוברים חדשים',
      'תמיכת לקוחות פרימיום',
    ],
    flowOverrides: {
      skipQuestionnaire: true,
    },
  },
  'health-plus': {
    id: 'health-plus',
    name: 'Health Plus',
    nameHe: 'הלת\' פלוס',
    logo: '/tenants/health-logo.svg',
    primaryColor: '#dc2626',
    requiresMembershipFee: true,
    membershipFeeAmount: 49.9,
    membershipFeeCurrency: 'ILS',
    membershipFeeLabel: 'Annual membership',
    membershipFeeLabelHe: 'מנוי שנתי',
    membershipBenefits: [
      'Health & wellness vouchers at cost',
      'Exclusive pharmacy discounts',
      'Free health consultations',
    ],
    membershipBenefitsHe: [
      'שוברי בריאות ואיכות חיים במחיר עלות',
      'הנחות בלעדיות בבתי מרקחת',
      'ייעוצי בריאות חינם',
    ],
  },
  'hapoel-ta': {
    id: 'hapoel-ta',
    name: 'Hapoel Tel Aviv',
    nameHe: 'הפועל תל אביב',
    logo: '/tenants/hapoel-logo.svg',
    primaryColor: '#dc2626',
    requiresMembershipFee: false,
  },
};
