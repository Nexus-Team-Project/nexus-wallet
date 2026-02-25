/**
 * AuthFlowStories — Instagram-style stories for the auth flow.
 * Fullscreen, white background, rich visuals — same style as StoriesPage.
 *
 * /:lang/auth-flow/new-user  → Flow 2 (new user)
 * /:lang/auth-flow/org-user  → Flow 3 (pre-provisioned org)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide, getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { useTenantStore } from '../../stores/tenantStore';
import { useAuthStore } from '../../stores/authStore';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import { mockTenants } from '../../mock/data/tenants.mock';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { SmartInsightsCarousel } from '../InsightsPage';
import GiftCardsPage from '../GiftCardsPage';
import WalletCardsPage from '../WalletCardsPage';
import NearbyMapPage from '../NearbyMapPage';

// ─── All images used in this flow — preloaded upfront ─────────────────────────
const FLOW_IMAGES = [
  '/gemini-hero.png',
  '/man_women_shop.jpg',
  '/nexus-logo-animated.gif',
  '/nexus-logo-animated-white.gif',
  '/brands/golf.png',
  '/brands/american-eagle.png',
  '/brands/rami-levy.png',
  '/brands/mango.png',
];

// ─── Wallet cards for phone mockup ───────────────────────────────────────────
const walletCards = [
  { name: 'Golf & Co',      logo: '/brands/golf.png',           bg: '#FFF59D', logoW: 28, logoMaxH: 22 },
  { name: 'American Eagle', logo: '/brands/american-eagle.png', bg: '#1a3a7a', logoW: 36, logoMaxH: 28 },
  { name: 'Rami Levy',      logo: '/brands/rami-levy.png',      bg: '#B3171D', logoW: 36, logoMaxH: 28 },
  { name: 'Mango',          logo: '/brands/mango.png',          bg: '#FFFFFF', logoW: 44, logoMaxH: 32 },
];

// ─── זוגות תמונה+טלפון לדחיפה ────────────────────────────────────────────────
const PUSH_IMAGES = [
  '/gemini-hero.png',
  '/man_women_shop.jpg',
];

// ─── Skeleton shown while images preload ──────────────────────────────────────
function FlowSkeleton() {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t-2xl"
      style={{ background: 'linear-gradient(135deg, #4c45d4 0%, #635bff 45%, #7c6fff 100%)' }}
    >
      {/* Animated shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
      />
      {/* Logo placeholder */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1">
        <div className="h-16 w-32 rounded-xl bg-white/20 animate-pulse" />
      </div>
      {/* Text placeholder */}
      <div className="flex-shrink-0 pt-3 pb-3 px-6 space-y-2">
        <div className="h-9 w-40 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-9 w-64 rounded-lg bg-white/20 animate-pulse" />
      </div>
      {/* Image strip placeholder */}
      <div className="flex-1 flex items-center justify-center gap-3 px-6">
        <div className="flex-1 h-32 rounded-2xl bg-white/15 animate-pulse" />
        <div className="w-24 h-44 rounded-3xl bg-white/10 animate-pulse" />
      </div>
      {/* CTA placeholder */}
      <div className="flex-shrink-0 px-6 pb-8 pt-2 flex justify-end">
        <div className="h-12 w-36 rounded-2xl bg-white/20 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Slide: Nexus Hero (purple, image + phone) ────────────────────────────────
function SlideNexusHero({
  failedImages,
}: {
  failedImages: Set<string>;
}) {
  const [pushIdx, setPushIdx] = useState(0);
  const authFirstName = useAuthStore((s) => s.firstName);
  const authAvatarUrl = useAuthStore((s) => s.avatarUrl);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  const firstName = authFirstName ?? orgMember?.firstName ?? null;

  // דחיפה פעם אחת — 1.2 שניות אחרי עליית הדף
  useEffect(() => {
    const t = setTimeout(() => {
      setPushIdx(1);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t-2xl"
      style={{ background: 'linear-gradient(135deg, #4c45d4 0%, #635bff 45%, #7c6fff 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-2xl">
        <div className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.25)', top: '-15%', right: '-10%', filter: 'blur(48px)' }} />
        <div className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.2)', bottom: '-5%', left: '-5%', filter: 'blur(40px)' }} />
      </div>

      {/* TOP: Logo + תמונת משתמש — צמוד לשמאל */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1 relative z-10 flex justify-start items-center gap-3">
        {failedImages.has('/nexus-logo-animated.gif') ? (
          <motion.span
            className="text-white font-black text-2xl h-16 flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            Nexus
          </motion.span>
        ) : (
          <motion.img
            src="/nexus-logo-animated.gif"
            alt="Nexus"
            className="h-16"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          />
        )}

        {/* תמונת משתמש — רק אם יש */}
        {authAvatarUrl && (
          <motion.img
            src={authAvatarUrl}
            alt={firstName ?? ''}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            className="rounded-2xl object-cover flex-shrink-0"
            style={{
              width: 52, height: 52,
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          />
        )}
      </div>

      {/* Text — צמוד לשמאל, יישור RTL */}
      <div className="flex-shrink-0 pt-3 pb-3 relative z-10 px-6">
        <div className="w-[60%]">
          <h2 className="text-white font-extrabold text-[34px] leading-tight" dir="rtl">
            {firstName ? `${firstName}, טוב שבאת,` : 'טוב שבאת,'}
          </h2>
          <h2 className="text-white font-extrabold text-[34px] leading-tight" dir="rtl">
            נקסוס עוזרת לך לקנות חכם יותר, נתחיל?
          </h2>
        </div>
      </div>

      {/*
        רצועה של 3 slots: [תמונה1 | טלפון | תמונה2]  — רוחב כל slot = 50% viewport
        → רוחב כולל = 150% viewport
        בהתחלה (pushIdx=0): x=0  → גלויים: [תמונה1 | טלפון]   (slot 1+2)
        אחרי דחיפה (pushIdx=1): x=-50% → גלויים: [טלפון | תמונה2] (slot 2+3)
      */}
      <div className="flex-1 flex items-center relative z-10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 flex flex-row items-center"
          style={{ width: '150%', left: 0 }}
          initial={{ x: '0%' }}
          animate={{ x: pushIdx === 0 ? '0%' : '-33.33%' }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* slot 1: תמונה ראשונה (gemini) */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative" style={{ width: '75%', height: 130 }}>
              {/* glow */}
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              {/* border frame — צבע רקע הטלפון */}
              <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 16 }} />
              {failedImages.has(PUSH_IMAGES[0]) ? (
                <div className="relative z-10 rounded-2xl w-full h-full bg-white/20 flex items-center justify-center">
                  <span style={{ fontSize: 28 }}>🛒</span>
                </div>
              ) : (
                <img src={PUSH_IMAGES[0]} alt="" className="relative z-10 rounded-2xl object-cover shadow-xl w-full h-full" />
              )}
              {/* עיגול ירוק + */}
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </div>
          </div>

          {/* slot 2: טלפון */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-3xl"
                style={{ width: 110, height: 160, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(180,170,255,0.30) 100%)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)', zIndex: 1 }} />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="relative"
                style={{ width: 88, aspectRatio: '9 / 18.8', borderRadius: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a', padding: 3, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', zIndex: 2 }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
                  style={{ width: 32, height: 7, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 5px 5px' }} />
                <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: 11, background: 'linear-gradient(180deg, #0a0b14, #121535)' }}>
                  <div className="absolute top-3.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                    <span className="text-[5px] font-bold text-white/80">Wallet</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-1.5 right-1.5 grid grid-cols-2 z-[2]" style={{ top: 23, gap: '2px', alignContent: 'start' }}>
                    {walletCards.map((card, i) => (
                      <motion.div key={card.name}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="flex items-center justify-center overflow-hidden"
                        style={{ height: 23, borderRadius: 4, background: card.bg, border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {!failedImages.has(card.logo) ? (
                          <img src={card.logo} alt={card.name}
                            style={{ width: card.logoW * 0.6, maxHeight: card.logoMaxH * 0.6, objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: 4, color: 'rgba(0,0,0,0.7)' }}>{card.name}</span>
                        )}
                      </motion.div>
                    ))}
                    <div className="flex items-center justify-center"
                      style={{ height: 23, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>+</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* slot 3: תמונה שנייה (shopping) */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative" style={{ width: '75%', height: 130 }}>
              {/* glow */}
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              {/* border frame — צבע רקע הטלפון */}
              <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 16 }} />
              {failedImages.has(PUSH_IMAGES[1]) ? (
                <div className="relative z-10 rounded-2xl w-full h-full bg-white/20 flex items-center justify-center">
                  <span style={{ fontSize: 28 }}>🛍️</span>
                </div>
              ) : (
                <img src={PUSH_IMAGES[1]} alt="" className="relative z-10 rounded-2xl object-cover shadow-xl w-full h-full" />
              )}
              {/* עיגול ירוק + */}
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// ─── Slide: Welcome New ───────────────────────────────────────────────────────
function SlideWelcomeNew() {
  const { t } = useLanguage();

  const BULLETS = [
    { emoji: '⚡', text: t.authFlow.welcomeNewBullet1 },
    { emoji: '🏢', text: t.authFlow.welcomeNewBullet2 },
    { emoji: '🎁', text: t.authFlow.welcomeNewBullet3 },
  ];

  return (
    <div className="absolute inset-0 bg-white flex flex-col" dir="rtl">
      {/* Visual hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-4">
        {/* Big emoji / visual */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)' }}
        >
          <span style={{ fontSize: '56px' }}>🎉</span>
        </div>

        <h1 className="text-3xl font-extrabold text-text-primary text-center mb-3 leading-tight">
          {t.authFlow.welcomeNewTitle}
        </h1>
        <p className="text-sm text-text-muted text-center leading-relaxed mb-8">
          {t.authFlow.welcomeNewSubtitle}
        </p>

        {/* Bullets */}
        <div className="w-full space-y-3">
          {BULLETS.map(({ emoji, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3"
            >
              <span className="text-xl flex-shrink-0">{emoji}</span>
              <span className="text-text-primary font-medium text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Slide: How Did You Arrive ────────────────────────────────────────────────
function SlideHowDidYouArrive({
  onDirect,
  onOrg,
}: {
  onDirect: () => void;
  onOrg: () => void;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<'direct' | 'org' | null>(null);

  const options = [
    {
      id: 'direct' as const,
      emoji: '🚀',
      title: t.authFlow.howArriveDirectTitle,
      desc: t.authFlow.howArriveDirectDesc,
      color: 'from-orange-400 to-pink-500',
    },
    {
      id: 'org' as const,
      emoji: '🏢',
      title: t.authFlow.howArriveOrgTitle,
      desc: t.authFlow.howArriveOrgDesc,
      color: 'from-primary to-blue-400',
    },
  ];

  const handleSelect = (id: 'direct' | 'org') => {
    setSelected(id);
    setTimeout(() => {
      if (id === 'direct') onDirect();
      else onOrg();
    }, 320);
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-20 pb-6">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
          {t.authFlow.howArriveSubtitle}
        </p>
        <h1 className="text-2xl font-extrabold text-text-primary leading-tight">
          {t.authFlow.howArriveTitle}
        </h1>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col px-5 gap-4 pb-10">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={(e) => { e.stopPropagation(); handleSelect(opt.id); }}
              className="w-full text-right"
            >
              <div
                className={`rounded-3xl p-5 border-2 transition-all duration-200 flex items-center gap-4 ${
                  isSelected
                    ? 'border-primary bg-primary/5 scale-[0.98]'
                    : 'border-border bg-white hover:border-primary/30 hover:bg-surface'
                }`}
              >
                {/* Emoji badge */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span style={{ fontSize: '28px' }}>{opt.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary text-base mb-0.5 leading-snug">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">{opt.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                  {isSelected && (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Org type for SlideWelcomeOrg ─────────────────────────────────────────────
type OrgInfo = { id: string; name: string; initials: string; color: string; available: boolean; tenantId?: string; logo?: string };
const MOCK_ORGS: OrgInfo[] = [
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

const NEXUS_ORG = { id: 'nexus', name: 'Nexus', initials: 'NX', color: '#635bff', available: true, logo: '/nexus-icon.png', tenantId: undefined as string | undefined };

function SlideSelectOrg({
  onSelect,
  onSkip,
}: {
  onSelect: (org: typeof MOCK_ORGS[0]) => void;
  onSkip: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('nexus');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const dragY = useRef(0);

  // ── אלגוריתם חיפוש משופר ──────────────────────────────────────────
  const EN_TO_HE: Record<string, string> = {
    a:'א', b:'ב', v:'ב', g:'ג', d:'ד', h:'ה', w:'ו', z:'ז',
    x:'ח', t:'ט', y:'י', k:'כ', l:'ל', m:'מ', n:'נ', s:'ס',
    e:'ע', p:'פ', f:'פ', c:'צ', q:'ק', r:'ר',
  };
  const transliterate = (str: string) =>
    str.toLowerCase()
      .replace(/sh/g,'ש').replace(/th/g,'ת').replace(/ch/g,'כ').replace(/tz/g,'צ').replace(/ts/g,'צ')
      .replace(/kh/g,'כ').replace(/ph/g,'פ')
      .split('').map(c => EN_TO_HE[c] ?? c).join('');

  const norm = (s: string) =>
    s.toLowerCase().replace(/[\u05b0-\u05c7]/g,'').replace(/['"]/g,'').trim();

  // fuzzy עם ציון — מספר אותיות שהתאימו
  const fuzzyScore = (text: string, q: string): number => {
    if (!q) return 1;
    let ti = 0, matched = 0;
    for (let qi = 0; qi < q.length; qi++) {
      while (ti < text.length && text[ti] !== q[qi]) ti++;
      if (ti >= text.length) break;
      matched++; ti++;
    }
    return matched / q.length;
  };

  const matchOrg = (org: { name: string }, raw: string): boolean => {
    if (!raw) return true;
    const q = norm(raw);
    const qHe = norm(transliterate(raw));
    const name = norm(org.name);
    const nameWords = name.split(/\s+/);
    // exact / contains
    if (name.includes(q) || name.includes(qHe)) return true;
    // word-start match
    if (nameWords.some(w => w.startsWith(q) || w.startsWith(qHe))) return true;
    // fuzzy ≥ 70%
    if (fuzzyScore(name, q) >= 0.7 || fuzzyScore(name, qHe) >= 0.7) return true;
    return false;
  };

  const allOrgs = [NEXUS_ORG, ...MOCK_ORGS];
  const selectedOrg = allOrgs.find(o => o.id === selectedId) ?? NEXUS_ORG;
  const filtered = allOrgs.filter(o => matchOrg(o, search));

  const handlePick = (org: typeof allOrgs[0]) => {
    if (!org.available) return;
    setSelectedId(org.id);
    setSheetOpen(false);
  };

  const handleContinue = () => {
    onSelect(selectedOrg);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-t-2xl overflow-hidden" dir="rtl">

      {/* ── תוכן ראשי ── */}
      <div className="flex-1 flex flex-col px-6 pt-20">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-hebrew)' }}>ארגון</p>
          <h1 className="text-2xl font-semibold leading-relaxed mb-1" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-hebrew)' }}>מצא את הארגון שלך</h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-hebrew)' }}>חפש את מקום העבודה או הארגון שלך</p>
        </motion.div>

        {/* שורת בחירה */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-right transition-all bg-surface"
          style={{ border: '1.5px solid #e0e0eb' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-xs text-white"
            style={{ background: selectedOrg.color }}>
            {'logo' in selectedOrg && selectedOrg.logo
              ? <img src={selectedOrg.logo as string} alt={selectedOrg.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              : selectedOrg.initials}
          </div>
          <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{selectedOrg.name}</span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>expand_more</span>
        </motion.button>
      </div>

      {/* ── כפתור המשך + לא מוצא ── */}
      <div className="flex-shrink-0 px-6 pb-10 pt-4 space-y-3">
        <button
          onClick={(e) => { e.stopPropagation(); handleContinue(); }}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          המשך
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setNotFoundOpen(true); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface border border-border active:scale-[0.98] transition-all"
        >
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>לא מוצא את הארגון שלי</span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>chevron_left</span>
        </button>
      </div>

      {/* ── Sheet: ארגונים ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onPointerDown={(e) => { dragY.current = e.clientY; }}
              onPointerUp={(e) => { if (e.clientY - dragY.current > 40) setSheetOpen(false); }}
              onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-white"
              style={{ maxHeight: '82%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 60) setSheetOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex-shrink-0 px-5 pb-3">
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-hebrew)' }}>בחר ארגון</h2>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ fontSize: '18px', color: 'var(--color-text-muted)', right: '12px' }}>search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="חיפוש ארגון..."
                    className="w-full py-3 rounded-2xl outline-none text-sm border-2 border-border focus:border-primary transition-colors bg-surface"
                    style={{ paddingRight: '40px', paddingLeft: '16px', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 min-h-0">
                <div className="space-y-2 pb-4">
                  {filtered.length === 0 ? (
                    <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>לא נמצאו ארגונים</p>
                  ) : (
                    filtered.map((org, i) => {
                      const isPicked = selectedId === org.id;
                      return (
                        <motion.button key={org.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          onClick={() => handlePick(org)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-right transition-all"
                          style={{
                            background: isPicked ? 'rgba(99,91,255,0.06)' : '#fff',
                            border: isPicked ? '2px solid #635bff' : '2px solid #ebebf0',
                            opacity: org.available ? 1 : 0.5,
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-xs text-white"
                            style={{ background: org.color }}>
                            {'logo' in org && org.logo
                              ? <img src={org.logo as string} alt={org.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                              : org.initials}
                          </div>
                          <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{org.name}</span>
                          {!org.available ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.35)' }}>בקרוב</span>
                          ) : isPicked ? (
                            <span className="material-symbols-outlined flex-shrink-0 text-primary"
                              style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined flex-shrink-0 text-text-muted"
                              style={{ fontSize: '18px' }}>chevron_left</span>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sheet: לא מוצא את הארגון שלי (~20vh) ── */}
      <AnimatePresence>
        {notFoundOpen && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-white px-5 pb-10 pt-3"
              style={{ height: '22%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 40) setNotFoundOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-3 cursor-grab">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {/* צרף ארגון — סגול */}
                <button
                  onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); onSkip(); }}
                  className="w-full py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center text-xs font-semibold text-white shadow-md shadow-primary/20"
                  style={{ background: 'var(--color-primary)' }}
                >
                  צרף את הארגון שלי
                </button>
                {/* המשך עם Nexus — לבן עם לוגו שחור */}
                <button
                  onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); setSelectedId('nexus'); }}
                  className="w-full py-3 rounded-xl border border-border active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>המשך עם</span>
                  <img src="/nexus-logo-black.png" alt="Nexus" className="object-contain" style={{ height: '18px', maxWidth: '90px', objectPosition: 'center' }} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Slide: Welcome Org ───────────────────────────────────────────────────────
function SlideWelcomeOrg({
  org,
}: {
  org: typeof MOCK_ORGS[0] | null;
}) {
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [logoError, setLogoError] = useState(false);
  const [pushIdx, setPushIdx] = useState(0);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const tenantConfig = useTenantStore((s) => s.config);
  const authFirstName = useAuthStore((s) => s.firstName);
  const authAvatarUrl = useAuthStore((s) => s.avatarUrl);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // שם פרטי: מגוגל/אפל → authFirstName, מטלפון+pre-provisioned → orgMember.firstName
  const firstName = authFirstName ?? orgMember?.firstName ?? null;

  useEffect(() => {
    // שלב 1: דחיפה — טלפון נכנס מימין, תמונה נשארת משמאל
    const t1 = setTimeout(() => setPushIdx(1), 1200);
    // שלב 2: אחרי הדחיפה — התמונה מתרחבת ומפעילה וידאו
    const t2 = setTimeout(() => setVideoExpanded(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // צבע רקע לפי ארגון — lighten+gradient
  // fallback: tenantStore (כשמגיעים דרך customerId ולא דרך select-org)
  const orgColor = org?.color ?? tenantConfig?.primaryColor ?? '#635bff';
  // יוצרים gradient מהצבע
  const bg = `linear-gradient(135deg, ${orgColor}cc 0%, ${orgColor} 45%, ${orgColor}dd 100%)`;

  const orgName = org?.name ?? tenantConfig?.nameHe ?? 'הארגון שלך';

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t-2xl"
      style={{ background: bg }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-2xl">
        <div className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.25)', top: '-15%', right: '-10%', filter: 'blur(48px)' }} />
        <div className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.2)', bottom: '-5%', left: '-5%', filter: 'blur(40px)' }} />
      </div>

      {/* לוגו ארגון + תמונת משתמש — מעל הטקסט, צד שמאל */}
      <div className="flex-shrink-0 pt-10 pb-2 relative z-10 px-6 flex justify-start items-center gap-3">
        {/* לוגו ארגון — תמונה עם fallback לראשי תיבות */}
        {(() => {
          const logoSrc = org?.logo ?? tenantConfig?.logo;
          const initials = orgName
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join('');

          if (logoSrc && !logoError) {
            return (
              <motion.img
                src={logoSrc as string}
                alt={orgName}
                onError={() => setLogoError(true)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                className="rounded-2xl object-contain flex-shrink-0"
                style={{
                  width: 52, height: 52,
                  background: 'rgba(255,255,255,0.25)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(8px)',
                  padding: 6,
                }}
              />
            );
          }
          // Fallback: ראשי תיבות
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                width: 52, height: 52,
                background: 'rgba(255,255,255,0.25)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-white font-bold text-lg leading-none">{initials}</span>
            </motion.div>
          );
        })()}

        {/* תמונת משתמש — רק אם יש */}
        {authAvatarUrl && (
          <motion.img
            src={authAvatarUrl}
            alt={firstName ?? ''}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            className="rounded-2xl object-cover flex-shrink-0"
            style={{
              width: 52, height: 52,
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          />
        )}
      </div>

      {/* Text — מוגבל ל-55% מוצמד לשמאל */}
      <div className="flex-shrink-0 pb-3 relative z-10 px-6 flex justify-start">
        <div style={{ maxWidth: '55%' }}>
          <h2 className="text-white font-extrabold text-[32px] leading-tight" dir="rtl">
            {firstName ? `${firstName}, ברוכים הבאים,` : 'ברוכים הבאים,'}
          </h2>
          <h2 className="text-white font-extrabold text-[32px] leading-tight" dir="rtl">
            {orgName} עובדת עם נקסוס 🎉
          </h2>
        </div>
      </div>

      {/*
        Strip הפוך: [תמונה_וידאו | טלפון | תמונה]
        התחלה: x='-33.33%' → גלויים: [טלפון | תמונה] (טלפון מימין)
        אחרי דחיפה: x='0%'  → גלויים: [תמונה_וידאו | טלפון] (טלפון עבר שמאלה)
      */}
      <div className="flex-1 flex items-center relative z-10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 flex flex-row items-center"
          style={{ width: '150%', left: 0 }}
          initial={{ x: '-33.33%' }}
          animate={{ x: pushIdx === 0 ? '-33.33%' : '0%' }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* slot 1: תמונה שמתרחבת לוידאו */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <motion.div
              className="relative overflow-hidden"
              animate={videoExpanded
                ? { width: '92%', height: 190, borderRadius: 18 }
                : { width: '75%', height: 130, borderRadius: 16 }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* glow */}
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              {/* border */}
              <div className="absolute inset-0 z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 'inherit' }} />
              {/* תמונה — נסתרת אחרי הרחבה */}
              <img
                src={PUSH_IMAGES[0]} alt=""
                className="absolute inset-0 object-cover w-full h-full"
                style={{ borderRadius: 'inherit', zIndex: videoExpanded ? 10 : 12, opacity: videoExpanded ? 0 : 1, transition: 'opacity 0.3s' }}
              />
              {/* וידאו — תמיד מוטען, מוצג כשמורחב */}
              <video
                src="/tap-pay.mp4"
                autoPlay muted loop playsInline
                className="absolute inset-0 object-cover w-full h-full"
                style={{ borderRadius: 'inherit', zIndex: videoExpanded ? 12 : 10, opacity: videoExpanded ? 1 : 0, transition: 'opacity 0.3s 0.2s' }}
              />
              {/* עיגול ירוק */}
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </motion.div>
          </div>

          {/* slot 2: טלפון */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-3xl"
                style={{ width: 110, height: 160, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(180,170,255,0.30) 100%)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)', zIndex: 1 }} />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="relative"
                style={{ width: 88, aspectRatio: '9 / 18.8', borderRadius: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a', padding: 3, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', zIndex: 2 }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
                  style={{ width: 32, height: 7, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 5px 5px' }} />
                <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: 11, background: 'linear-gradient(180deg, #0a0b14, #121535)' }}>
                  <div className="absolute top-3.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                    <span className="text-[5px] font-bold text-white/80">Wallet</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-1.5 right-1.5 grid grid-cols-2 z-[2]" style={{ top: 23, gap: '2px', alignContent: 'start' }}>
                    {walletCards.map((card, i) => (
                      <motion.div key={card.name}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="flex items-center justify-center overflow-hidden"
                        style={{ height: 23, borderRadius: 4, background: card.bg, border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {!imgErrors.has(i) ? (
                          <img src={card.logo} alt={card.name}
                            style={{ width: card.logoW * 0.6, maxHeight: card.logoMaxH * 0.6, objectFit: 'contain' }}
                            onError={() => setImgErrors(prev => new Set(prev).add(i))} />
                        ) : (
                          <span style={{ fontSize: 4, color: 'rgba(0,0,0,0.7)' }}>{card.name}</span>
                        )}
                      </motion.div>
                    ))}
                    <div className="flex items-center justify-center"
                      style={{ height: 23, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>+</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* slot 3: תמונה שנייה */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative" style={{ width: '75%', height: 130 }}>
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 16 }} />
              <img src={PUSH_IMAGES[1]} alt="" className="relative z-10 rounded-2xl object-cover shadow-xl w-full h-full" />
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// ─── Slide: Match Screen ("מצאנו התאמה") ─────────────────────────────────────
function SlideMatchScreen() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const authMethod        = useAuthStore((s) => s.authMethod);
  const authFirstName     = useAuthStore((s) => s.firstName);
  const logout            = useAuthStore((s) => s.logout);

  const orgMember         = useRegistrationStore((s) => s.orgMember);
  const phone             = useRegistrationStore((s) => s.phone);
  const missingFields     = useRegistrationStore((s) => s.missingFields);
  const profileData       = useRegistrationStore((s) => s.profileData);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const resetRegistration = useRegistrationStore((s) => s.resetRegistration);

  const tenantConfig  = useTenantStore((s) => s.config);
  const clearTenant   = useTenantStore((s) => s.clearTenant);

  const openLoginSheet = useLoginSheetStore((s) => s.open);

  const orgName  = isHe
    ? (tenantConfig?.nameHe ?? orgMember?.organizationName ?? '')
    : (tenantConfig?.name   ?? orgMember?.organizationName ?? '');
  const orgColor = tenantConfig?.primaryColor ?? '#635bff';
  const orgLogo  = tenantConfig?.logo;

  const userIdentifier =
    (authMethod === 'google' || authMethod === 'apple') && profileData.email
      ? profileData.email
      : authFirstName ?? phone ?? null;

  const handleContinueWithOrg = () => {
    if (tenantConfig?.requiresMembershipFee) {
      navigate(`/${lang}/register/membership`);
    } else {
      navigate(
        `/${lang}/register/onboarding/${getFirstOnboardingSlide(
          useRegistrationStore.getState()
        )}`
      );
    }
  };

  const handleContinueNoOrg = () => {
    clearTenant(); // remove org branding — user registers as plain Nexus user
    startRegistration({
      path:         'new-user',
      phone:        phone ?? '',
      orgMember:    null,
      missingFields,
    });
    navigate(
      `/${lang}/register/onboarding/${getFirstOnboardingSlide(
        useRegistrationStore.getState()
      )}`
    );
  };

  const handleSwitchAccount = () => {
    logout();
    resetRegistration();
    clearTenant();
    navigate(`/${lang}`, { replace: true });
    // Open the LoginSheet after navigation (root portal — survives page change)
    Promise.resolve().then(() => openLoginSheet().catch(() => {}));
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      style={{ background: 'var(--color-surface)' }}
      dir={isHe ? 'rtl' : 'ltr'}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex flex-col px-5 pb-8 pt-8">

        {/* Header */}
        <div className="mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${orgColor}1a` }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: orgColor, fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-primary mb-1">
            {t.authFlow.matchTitle}
          </h1>
          <p className="text-sm text-text-muted leading-snug">
            {t.authFlow.matchSubtitleSingle.replace('{{orgName}}', orgName)}
          </p>

          {userIdentifier && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
              {authMethod === 'google' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              ) : authMethod === 'apple' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '12px' }}>phone</span>
              )}
              <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                {t.authFlow.matchConnectedAs.replace('{{identifier}}', userIdentifier)}
              </span>
            </div>
          )}
        </div>

        {/* Org card */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="h-7 w-7 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span className="material-symbols-outlined text-white"
                  style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                  business
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">{orgName}</p>
              <p className="text-white/70 text-xs mt-0.5">{isHe ? 'חבר ארגון' : 'Organization member'}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white"
                style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinueWithOrg}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ background: orgColor }}
          >
            {t.authFlow.matchContinueWithOrg.replace('{{orgName}}', orgName)}
          </button>
          <button
            onClick={handleContinueNoOrg}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-border text-text-primary bg-white active:scale-[0.98] transition-all hover:bg-surface"
          >
            {t.authFlow.matchContinueNoOrg}
          </button>
          <button
            onClick={handleSwitchAccount}
            className="w-full py-2.5 text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            {t.authFlow.matchSwitchAccount}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stories Shell ────────────────────────────────────────────────────────────
type FlowType = 'new-user' | 'org-user';

interface StoryStep {
  id: string;
  interactive?: boolean;
  duration?: number; // ms override for auto-advance (default STORY_DURATION)
}

export default function AuthFlowStories({ flowType }: { flowType: FlowType }) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  // const startRegistration = useRegistrationStore((s) => s.startRegistration);
  // const registrationPath = useRegistrationStore((s) => s.registrationPath);
  // const phone = useRegistrationStore((s) => s.phone);
  const setTenant = useTenantStore((s) => s.setTenant);
  const tenantConfig = useTenantStore((s) => s.config);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // ── Preload all flow images before showing any slide ──
  const { loaded: imagesLoaded, failed: failedImages } = useImagePreloader(FLOW_IMAGES);

  // Smart stories — הצגת תכונות האפליקציה (אחרי הדף הראשון)
  const smartStorySteps: StoryStep[] = [
    { id: 'story-insights', duration: 10000 },
    { id: 'story-gift-cards' },
    { id: 'story-wallet' },
    { id: 'story-nearby' },
  ];

  const newUserSteps: StoryStep[] = [
    { id: 'nexus-hero' },
    ...smartStorySteps,
  ];

  const orgUserSteps: StoryStep[] = [
    { id: 'welcome-org' },
    ...smartStorySteps,
  ];

  // For org/tenant users: append match-screen as the final story step (after
  // the intro stories) so the user sees the org intro before confirming.
  const isOrgFlow = Boolean(orgMember || tenantConfig);

  const [steps, setSteps] = useState<StoryStep[]>(() => {
    const base = flowType === 'new-user' ? newUserSteps : orgUserSteps;
    return isOrgFlow ? [...base, { id: 'match-screen', interactive: true }] : base;
  });
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedOrg, setSelectedOrg] = useState<typeof MOCK_ORGS[0] | null>(null);

  // ── Auto-advance timer ──────────────────────────────────────────────
  const STORY_DURATION = 6000; // ms per auto-advance story
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  const goTo = useCallback(
    (index: number, forceDirection?: 1 | -1) => {
      if (index < 0 || index >= steps.length) return;
      setDirection(forceDirection ?? (index > current ? 1 : -1));
      setCurrent(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [current, steps.length]
  );

  const goNext = useCallback(() => {
    if (current + 1 >= steps.length) {
      // מעגלי — חוזר להתחלה
      goTo(0, 1);
    } else {
      goTo(current + 1);
    }
  }, [current, steps.length, goTo]);

  const goPrev = useCallback(() => {
    if (current === 0) {
      // מעגלי — חוזר לאחרון
      goTo(steps.length - 1, -1);
    } else {
      goTo(current - 1);
    }
  }, [current, steps.length, goTo]);

  // Auto-advance: רץ על כל step שאינו interactive
  const isInteractive = steps[current]?.interactive ?? false;
  const currentDuration = steps[current]?.duration ?? STORY_DURATION;
  useEffect(() => {
    if (isInteractive || !imagesLoaded) {
      // Interactive slides (match-screen): mark segment as filled (1) — user is here.
      // Loading skeleton: keep at 0 until images are ready.
      setProgress(isInteractive ? 1 : 0);
      return;
    }

    startTimeRef.current = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / currentDuration, 1);
      setProgress(p);

      if (p >= 1) {
        goNext();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, isInteractive, imagesLoaded, goNext, currentDuration]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (steps[current]?.interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  // Slide callbacks
  const handleHowArriveDirect = () => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  const handleHowArriveOrg = () => {
    setSteps(newUserSteps);
    setDirection(1);
    setCurrent(3);
  };

  const handleSelectOrg = (org: typeof MOCK_ORGS[0]) => {
    setSelectedOrg(org);
    // אם nexus — דלג ישירות לרישום
    if (org.id === 'nexus') {
      const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
      navigate(`/${lang}/register/onboarding/${firstSlide}`);
      return;
    }
    // ארגון עם tenant מוגדר → הגדר tenant ועבור ל-welcome-org בתוך הflow
    const tenantId = (org as Record<string, unknown>)['tenantId'] as string | undefined;
    if (tenantId && mockTenants[tenantId]) {
      setTenant(tenantId, mockTenants[tenantId]);
      const welcomeIdx = steps.findIndex(s => s.id === 'welcome-org');
      if (welcomeIdx !== -1) {
        setDirection(1); setCurrent(welcomeIdx);
      } else {
        setSteps(prev => [...prev, { id: 'welcome-org' }]);
        setDirection(1); setCurrent(steps.length);
      }
      return;
    }
    // ארגון רגיל — עבור ל-welcome-org בתוך ה-stories
    const welcomeIdx = steps.findIndex(s => s.id === 'welcome-org');
    if (welcomeIdx !== -1) {
      setDirection(1); setCurrent(welcomeIdx);
    } else {
      setSteps(prev => [...prev, { id: 'welcome-org' }]);
      setDirection(1); setCurrent(steps.length);
    }
  };

  const handleSelectOrgSkip = () => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  // Reserved for future use when org stories have inline continue/skip actions
  // const handleOrgContinue = () => { goNext(); };
  // const handleOrgSkip = () => {
  //   startRegistration({ path: registrationPath ?? 'new-user', phone: phone ?? '', orgMember: null });
  //   const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
  //   navigate(`/${lang}/register/onboarding/${firstSlide}`);
  // };

  const handleOrgSwitchUser = () => {
    // OrgUserFlow is superseded by WelcomeOrgPage (Match Screen); navigate home as fallback.
    navigate(`/${lang}`, { replace: true });
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
  };

  // ── Progress bar segments ────────────────────────────────────────────────
  // Org/tenant stories: classic story progress (1 segment per story, excl. match-screen).
  //   on stories:      [░▓░░░]  (current story segment fills)
  //   on match-screen: switch to onboarding bar count → [█░░░░░]
  // New users: classic one-segment-per-story bar (all steps incl. any final).
  const isMatchScreenActive = steps[current]?.id === 'match-screen';

  let barSegments: Array<{ key: string; isDone: boolean; isActive: boolean }>;
  if (isOrgFlow && isMatchScreenActive) {
    // On match-screen: mirror the onboarding bar (segment 0 active = first onboarding step)
    const onboardingTotal = getOnboardingTotalWithComplete(useRegistrationStore.getState()) + 1;
    barSegments = Array.from({ length: onboardingTotal }, (_, i) => ({
      key: `bar-${i}`,
      isDone:   false,
      isActive: i === 0,
    }));
  } else if (isOrgFlow) {
    // During org stories: exclude match-screen from the bar so counts stay consistent
    const barSteps = steps.filter(s => s.id !== 'match-screen');
    const barCurrent = barSteps.findIndex(s => s.id === steps[current]?.id);
    barSegments = barSteps.map((step, i) => ({
      key: step.id,
      isDone:   i < barCurrent,
      isActive: i === barCurrent,
    }));
  } else {
    barSegments = steps.map((step, i) => ({
      key: step.id,
      isDone:   i < current,
      isActive: i === current,
    }));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* ── Progress bar — same segment count as onboarding bar ── */}
      <div className="px-3 pt-3 pb-2 z-50">
        <div className="flex gap-1">
          {barSegments.map(({ key, isDone, isActive }) => {
            return (
              <div
                key={key}
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              >
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: isDone ? '100%' : isActive ? `${progress * 100}%` : '0%',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Close button — identical to StoriesPage ── */}
      <button
        onClick={() => navigate(`/${lang}`)}
        className="absolute top-3 left-3 z-50 w-8 h-8 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          close
        </span>
      </button>

      {/* ── Story content ── */}
      <div className="flex-1 relative overflow-hidden rounded-t-2xl" onClick={handleTap}>
        <AnimatePresence mode="wait">
          {!imagesLoaded && (
            <motion.div
              key="skeleton"
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FlowSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {imagesLoaded && (
          <motion.div
            key={steps[current]?.id ?? current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {steps[current]?.id === 'nexus-hero' && (
              <SlideNexusHero failedImages={failedImages} />
            )}
            {steps[current]?.id === 'welcome-new' && (
              <SlideWelcomeNew />
            )}
            {steps[current]?.id === 'how-did-you-arrive' && (
              <SlideHowDidYouArrive onDirect={handleHowArriveDirect} onOrg={handleHowArriveOrg} />
            )}
            {steps[current]?.id === 'select-org' && (
              <SlideSelectOrg onSelect={handleSelectOrg} onSkip={handleSelectOrgSkip} />
            )}
            {steps[current]?.id === 'welcome-org' && (
              <SlideWelcomeOrg org={selectedOrg} />
            )}
            {/* ── Smart Stories ── */}
            {steps[current]?.id === 'story-insights' && (
              <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }} dir="rtl">
                <SmartInsightsCarousel />
              </div>
            )}
            {steps[current]?.id === 'story-gift-cards' && (
              <GiftCardsPage />
            )}
            {steps[current]?.id === 'story-wallet' && (
              <WalletCardsPage />
            )}
            {steps[current]?.id === 'story-nearby' && (
              <NearbyMapPage />
            )}
            {steps[current]?.id === 'match-screen' && (
              <SlideMatchScreen />
            )}
          </motion.div>
          )}
        </AnimatePresence>

        {/* ── Persistent bottom CTA — stays across all stories ── */}
        {!['how-did-you-arrive', 'select-org', 'match-screen'].includes(steps[current]?.id ?? '') && (
          <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
            {/* Gradient fade — so content beneath blends naturally */}
            <div className="h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="bg-black/70 backdrop-blur-sm px-6 pb-6 pt-1 pointer-events-auto" dir="rtl">
              <div className="flex items-center gap-4">
                {/* Secondary text — differs by flow */}
                {flowType === 'new-user' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const orgIdx = steps.findIndex(s => s.id === 'select-org');
                      if (orgIdx !== -1) {
                        setDirection(1);
                        setCurrent(orgIdx);
                      } else {
                        setSteps(prev => [...prev, { id: 'select-org', interactive: true }]);
                        setDirection(1);
                        setCurrent(steps.length);
                      }
                    }}
                    className="flex-1 text-right active:opacity-70 transition-opacity"
                  >
                    <p className="text-white/75 text-xs leading-snug">שייך לארגון שעובד עם נקסוס?</p>
                    <span className="text-white text-xs font-bold border-b border-white/60 pb-px">הכניסה מכאן</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOrgSwitchUser(); }}
                    className="flex-1 text-right active:opacity-70 transition-opacity"
                  >
                    <p className="text-white/75 text-xs leading-snug">רוצה להתחבר עם משתמש אחר?</p>
                    <span className="text-white text-xs font-bold border-b border-white/60 pb-px">הכניסה מכאן</span>
                  </button>
                )}

                {/* Continue button — advance one story at a time (match-screen reached naturally);
                    new-user flow skips directly to onboarding */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOrgFlow) {
                      goNext(); // advance normally; match-screen is the final story step
                    } else {
                      const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
                      navigate(`/${lang}/register/onboarding/${firstSlide}`);
                    }
                  }}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: flowType === 'org-user'
                      ? (selectedOrg?.color ?? tenantConfig?.primaryColor ?? '#635bff')
                      : '#635bff',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'wght' 700" }}>chevron_left</span>
                  קליק להמשך
                </button>
              </div>

              {/* Powered by Nexus — org flow only */}
              {flowType === 'org-user' && (
                <div className="flex items-center justify-center mt-3 opacity-70">
                  <img src="/nexus-logo-animated-white.gif" alt="Nexus" style={{ height: 22, width: 'auto', marginRight: 3 }} />
                  <span className="text-white text-[11px] font-medium">powered by</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewUserFlow() {
  return <AuthFlowStories flowType="new-user" />;
}

export function OrgUserFlow() {
  return <AuthFlowStories flowType="org-user" />;
}
