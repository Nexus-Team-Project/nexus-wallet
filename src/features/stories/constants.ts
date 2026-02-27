// ─── All images used in the auth flow — preloaded upfront ─────────────────────
export const FLOW_IMAGES = [
  '/gemini-hero.png',
  '/man_women_shop.jpg',
  '/nexus-logo-animated.gif',
  '/nexus-logo-animated-white.gif',
  '/brands/golf.png',
  '/brands/american-eagle.png',
  '/brands/rami-levy.png',
  '/brands/mango.png',
];

// ─── Wallet cards shown in the phone mockup ───────────────────────────────────
export const walletCards = [
  { name: 'Golf & Co',      logo: '/brands/golf.png',           bg: '#FFF59D', logoW: 28, logoMaxH: 22 },
  { name: 'American Eagle', logo: '/brands/american-eagle.png', bg: '#1a3a7a', logoW: 36, logoMaxH: 28 },
  { name: 'Rami Levy',      logo: '/brands/rami-levy.png',      bg: '#B3171D', logoW: 36, logoMaxH: 28 },
  { name: 'Mango',          logo: '/brands/mango.png',          bg: '#FFFFFF', logoW: 44, logoMaxH: 32 },
];

// ─── Image pairs used in push animation strip ─────────────────────────────────
export const PUSH_IMAGES = [
  '/gemini-hero.png',
  '/man_women_shop.jpg',
];

// ─── Organisation list (mock data) ────────────────────────────────────────────
import type { OrgInfo } from './types';

export const MOCK_ORGS: OrgInfo[] = [
  { id: 'acme-corp',   name: 'תאגיד אקמה',           initials: 'אק',  color: '#1e40af', available: true,  tenantId: 'acme-corp'   },
  { id: 'startup-il',  name: 'סטארטאפ ישראלי',        initials: 'סט',  color: '#059669', available: true,  tenantId: 'startup-il'  },
  { id: '1',           name: 'סלקום',                  initials: 'סל',  color: '#F97316', available: true  },
  { id: '2',           name: 'הפועל תל אביב',          initials: 'הפ',  color: '#DC2626', available: false },
  { id: '3',           name: 'אוניברסיטת תל אביב',    initials: 'אתא', color: '#2563EB', available: true  },
  { id: '4',           name: 'מכבי שירותי בריאות',    initials: 'מכ',  color: '#16A34A', available: true  },
  { id: '5',           name: 'עיריית ירושלים',         initials: 'עיר', color: '#CA8A04', available: false },
  { id: '6',           name: 'בנק לאומי',              initials: 'בל',  color: '#0D9488', available: true  },
  { id: '7',           name: 'שירביט ביטוח',           initials: 'שב',  color: '#7C3AED', available: false },
  { id: '8',           name: 'כללית שירותי בריאות',   initials: 'כל',  color: '#0284C7', available: true  },
];

export const NEXUS_ORG: OrgInfo = {
  id: 'nexus',
  name: 'Nexus',
  initials: 'NX',
  color: '#635bff',
  available: true,
  logo: '/nexus-icon.png',
  tenantId: undefined,
};

