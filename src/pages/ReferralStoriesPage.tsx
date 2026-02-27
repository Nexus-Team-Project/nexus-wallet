/**
 * ReferralStoriesPage — Fullscreen Instagram-style stories for the referral program.
 *
 * Story 1: Hero invite — tenant name, floating brand logos, tenant colors
 * Story 2: Google Contacts import (incremental auth) + share link + "how it works" accordion
 *
 * Triggered from the compact ReferralBanner on the homepage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useContactsStore } from '../stores/contactsStore';
import {
  fetchGoogleContacts,
  buildReferralUrl,
  shareNative,
  copyToClipboard,
} from '../services/contacts.service';

// ── Floating brand logos ─────────────────────────────────────────────────────
const FLOATING_BRANDS = [
  { src: '/brands/golf.png',           name: 'Golf',           size: 48, top: '12%',    left: '14%',  delay: 0   },
  { src: '/brands/american-eagle.png', name: 'American Eagle', size: 56, top: '24%',    right: '10%', delay: 0.3 },
  { src: '/brands/rami-levy.png',       name: 'Rami Levy',      size: 40, bottom: '28%', left: '10%',  delay: 0.6 },
  { src: '/brands/mango.png',          name: 'Mango',          size: 48, bottom: '14%', right: '18%', delay: 0.9 },
  { src: '/brands/foot-locker.png',    name: 'Foot Locker',    size: 44, top: '45%',    left: '6%',   delay: 0.4 },
];

const STORY_COUNT = 2;
const STORY_DURATION = 8000; // ms — auto-advance on story 1 only

// ── Unique slug for every story slide — used in ?step= URL param ─────────────
const STORY_IDS = ['hero-invite', 'actions'] as const;

// ── Helper: derive a darker shade from a hex color ───────────────────────────
function darkenColor(hex: string, amount = 0.35): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── Google Contacts logo — official Google asset ──────────────────────────────
function GoogleContactsIcon({ size = 26 }: { size?: number }) {
  return (
    <img
      src="/brands/google-contacts.png"
      alt="Google Contacts"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

// ─── "How it works" accordion ────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS_HE = [
  {
    icon: 'contacts',
    title: 'בחר חברים מהאנשי קשר',
    body: 'אנחנו נגשים לאנשי הקשר שלך בגוגל רק כדי לזהות מי כבר בנקסוס ומי לא. המידע לא נשמר אצלנו.',
  },
  {
    icon: 'mark_email_read',
    title: 'הזמנה נשלחת לחברים',
    body: 'החברים שבחרת יקבלו הזמנה אישית ממך להצטרף לנקסוס וליהנות מהטבות.',
  },
  {
    icon: 'redeem',
    title: 'שניכם מקבלים ₪25',
    body: 'ברגע שהחבר נרשם ומשלים הצטרפות — ₪25 נוספים נזקפים לחשבון שלך, ו-₪25 לחשבון שלו.',
  },
];

const HOW_IT_WORKS_STEPS_EN = [
  {
    icon: 'contacts',
    title: 'Pick friends from contacts',
    body: 'We access your Google contacts only to identify who is already on Nexus. We never store this data.',
  },
  {
    icon: 'mark_email_read',
    title: 'Your friends get invited',
    body: 'Selected friends receive a personal invite from you to join Nexus and enjoy exclusive benefits.',
  },
  {
    icon: 'redeem',
    title: 'You both get ₪25',
    body: 'Once your friend signs up and completes onboarding — ₪25 is credited to your account and ₪25 to theirs.',
  },
];

function HowItWorksAccordion({
  primaryColor,
  isHe,
}: {
  primaryColor: string;
  isHe: boolean;
}) {
  const [open, setOpen] = useState(false);
  const steps = isHe ? HOW_IT_WORKS_STEPS_HE : HOW_IT_WORKS_STEPS_EN;
  const label = isHe ? 'איך זה עובד?' : 'How does it work?';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #f0eeee' }}>
      {/* Toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-75 transition-opacity bg-white"
      >
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', color: primaryColor, fontVariationSettings: "'FILL' 1" }}
          >
            help
          </span>
          <span className="text-slate-900 text-sm font-semibold">{label}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="material-symbols-outlined text-slate-300"
          style={{ fontSize: '20px' }}
        >
          expand_more
        </motion.span>
      </button>

      {/* Steps */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pt-1 pb-4 flex flex-col gap-4"
              style={{ borderTop: '1px solid #f0eeee' }}
            >
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 pt-3">
                  {/* Step number circle */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold"
                    style={{ background: primaryColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '15px', color: primaryColor, fontVariationSettings: "'FILL' 1" }}
                      >
                        {step.icon}
                      </span>
                      <p className="text-slate-800 text-sm font-bold">{step.title}</p>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Story 1: Hero Invite ────────────────────────────────────────────────────
function StoryHero({
  primaryColor,
  tenantName,
}: {
  primaryColor: string;
  tenantName: string;
}) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const darkColor = darkenColor(primaryColor, 0.3);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${darkColor} 0%, ${primaryColor} 100%)` }}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-80 h-80 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.18)', top: '-12%', right: '-8%', filter: 'blur(60px)' }}
        />
        <div
          className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.15)', bottom: '10%', left: '-8%', filter: 'blur(50px)' }}
        />
      </div>

      {/* Top bar: logo + tenant name */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 pt-14 pb-2 relative z-10">
        <div
          className="w-7 h-7 flex items-center justify-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <img
            src="/nexus-icon.png"
            alt="Nexus"
            className="w-5 h-5 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">{tenantName}</span>
      </div>

      {/* Main headline */}
      <div className="flex-shrink-0 px-8 pt-6 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white font-extrabold text-[36px] leading-[1.15] tracking-tight mb-4"
        >
          {isHe ? `${tenantName}\nיותר טוב ביחד` : `${tenantName}\nbetter together`}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-white/75 text-lg font-medium leading-relaxed max-w-[280px]"
        >
          {isHe ? 'הזמן חברים ליהנות מהטבות ביחד' : 'Invite friends to enjoy benefits together'}
        </motion.p>
      </div>

      {/* Floating brand logos */}
      <div className="flex-1 relative pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 260, height: 260, background: `${primaryColor}40`, filter: 'blur(80px)' }}
        />
        {FLOATING_BRANDS.map((brand, i) => (
          <motion.div
            key={brand.name}
            className="absolute"
            style={{
              top: brand.top,
              left: brand.left,
              right: (brand as Record<string, unknown>).right as string | undefined,
              bottom: brand.bottom,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.5 + brand.delay },
              scale:   { duration: 0.5, delay: 0.5 + brand.delay },
              y: { repeat: Infinity, duration: 3.5 + i * 0.3, ease: 'easeInOut', delay: brand.delay },
            }}
          >
            <div
              className="rounded-full flex items-center justify-center overflow-hidden"
              style={{ width: brand.size, height: brand.size, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            >
              {!imgErrors.has(i) ? (
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="object-contain"
                  style={{ width: brand.size * 0.6, height: brand.size * 0.6 }}
                  onError={() => setImgErrors((prev) => new Set(prev).add(i))}
                />
              ) : (
                <span className="text-[10px] font-bold text-gray-500">{brand.name.charAt(0)}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA — handshake icon */}
      <div className="flex-shrink-0 px-6 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            className="w-full bg-white font-bold py-4 rounded-full text-lg text-center shadow-xl pointer-events-none flex items-center justify-center gap-2"
            style={{ color: primaryColor }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1", color: primaryColor }}
            >
              diversity_1
            </span>
            {isHe ? 'הזמן חברים' : 'Invite friends'}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Story 2: Actions ─────────────────────────────────────────────────────────
function StoryActions({ primaryColor }: { primaryColor: string }) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const userId   = useAuthStore((s) => s.userId);
  const tenantId = useTenantStore((s) => s.tenantId);

  const contacts         = useContactsStore((s) => s.contacts);
  const contactsImported = useContactsStore((s) => s.contactsImported);
  const friendsOnNexus   = useContactsStore((s) => s.friendsOnNexus);
  const setContacts      = useContactsStore((s) => s.setContacts);

  const [copied,    setCopied]    = useState(false);
  const [importing, setImporting] = useState(false);

  const referralUrl   = buildReferralUrl(userId ?? '', tenantId);
  const shareTitle    = t.registration.inviteShareTitle;
  const shareText     = t.registration.inviteShareText;
  const referralCount = Math.min(friendsOnNexus.length, 2);
  const goalReached   = referralCount >= 2;

  // Share link — native sheet → clipboard fallback
  const handleShareLink = useCallback(async () => {
    const ok = await shareNative(shareTitle, shareText, referralUrl);
    if (!ok) {
      const didCopy = await copyToClipboard(referralUrl);
      if (didCopy) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
    }
  }, [shareTitle, shareText, referralUrl]);

  // Google incremental auth → People API fetch.
  // Always calls fetchGoogleContacts (signInWithPopup) — works for ALL auth
  // methods (phone, apple, google). The popup requests contacts.readonly
  // scope regardless of how the user originally signed in.
  const handleImportContacts = useCallback(async () => {
    setImporting(true);
    const imported = await fetchGoogleContacts();
    setImporting(false);
    if (!imported || imported.length === 0) return;
    setContacts(imported, 'google');
    const mockFriends = imported.filter(() => Math.random() < 0.15).map((c) => c.id);
    useContactsStore.getState().setFriendsOnNexus(mockFriends);
  }, [setContacts]);

  return (
    // ── Light background — #f8f6f6, same as reference HTML ──────────────────
    <div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      style={{ background: '#f8f6f6' }}
    >
      {/* ── Scrollable content ── */}
      <div
        className="relative z-10 flex flex-col flex-1 px-6 pb-10"
        style={{ paddingTop: '56px' }} /* clear the progress bar + close btn */
      >

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1
            className="font-bold leading-tight tracking-tight text-slate-900 mb-2"
            style={{ fontSize: '28px' }}
          >
            {isHe ? 'הזמן חברים, קבל ₪50' : 'Invite friends, get ₪50'}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {t.registration.inviteFriendsSubtitle}
          </p>

          {/* Share-link pill — small, start-aligned */}
          <button
            onClick={(e) => { e.stopPropagation(); handleShareLink(); }}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-bold text-sm transition-all active:scale-[0.96]"
            style={{
              background: `${primaryColor}18`,
              color: primaryColor,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {copied ? 'check' : 'link'}
            </span>
            <span>
              {copied
                ? (isHe ? 'הועתק ✓' : 'Copied ✓')
                : (isHe ? 'שתף לינק' : 'Share link')}
            </span>
          </button>
        </motion.div>

        {/* ── CONTACTS PERMISSION CARD / CONTACTS LIST ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="mt-6"
        >
          {!contactsImported ? (
            /* White card — permission to import */
            <button
              onClick={(e) => { e.stopPropagation(); handleImportContacts(); }}
              disabled={importing}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-start shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ border: '1px solid #f0eeee' }}
            >
              {/* Icon + notification dot */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `${primaryColor}15` }}
                >
                  {importing ? (
                    <span
                      className="material-symbols-outlined animate-spin"
                      style={{ fontSize: '26px', color: primaryColor }}
                    >
                      progress_activity
                    </span>
                  ) : (
                    <GoogleContactsIcon size={26} />
                  )}
                </div>
                {/* Accent dot */}
                {!importing && (
                  <div
                    className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    style={{ background: primaryColor }}
                  />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-bold text-sm leading-tight">
                  {importing
                    ? (isHe ? 'מתחבר לגוגל...' : 'Connecting to Google...')
                    : (isHe ? 'בחר מאנשי קשר של גוגל' : 'Enable contact permission')}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 leading-snug">
                  {isHe
                    ? 'הזמן חברים ישירות מהרשימה שלך'
                    : 'Quickly invite friends from your contacts'}
                </p>
              </div>

              {/* Chevron */}
              {!importing && (
                <span className="material-symbols-outlined text-slate-300 flex-shrink-0" style={{ fontSize: '22px' }}>
                  {isHe ? 'chevron_left' : 'chevron_right'}
                </span>
              )}
            </button>
          ) : contactsImported && contacts.length > 0 ? (
            /* Contacts list after import */
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
              style={{ border: '1px solid #f0eeee' }}
            >
              {friendsOnNexus.length > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: '1px solid #f0eeee' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '15px', color: primaryColor, fontVariationSettings: "'FILL' 1" }}
                  >
                    group
                  </span>
                  <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                    {t.registration.inviteFriendsOnNexus.replace('{count}', String(friendsOnNexus.length))}
                  </span>
                </div>
              )}
              <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-50">
                {contacts.slice(0, 20).map((contact) => {
                  const isOnNexus = friendsOnNexus.includes(contact.id);
                  return (
                    <div key={contact.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: isOnNexus ? primaryColor : '#e2e8f0' }}
                      >
                        {isOnNexus
                          ? <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                          : <span className="text-slate-500">{contact.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-xs font-semibold truncate">{contact.name}</p>
                        <p className="text-slate-400 text-[10px] truncate">
                          {isOnNexus
                            ? (isHe ? 'כבר בנקסוס ✓' : 'Already on Nexus ✓')
                            : (contact.phones[0] || '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* ── ILLUSTRATION area — 4:3, white card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.34 }}
          className="mt-6 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-sm"
          style={{ border: '1px solid #f0eeee', aspectRatio: '4/3' }}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Progress circles — matching the reference HTML */}
            <div className="flex items-center gap-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: referralCount > i
                      ? `${primaryColor}18`
                      : '#f1f5f9',
                    border: referralCount > i
                      ? `2px solid ${primaryColor}40`
                      : '2px solid #e2e8f0',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '28px',
                      color: referralCount > i ? primaryColor : '#cbd5e1',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {referralCount > i ? 'person' : 'person_add'}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: primaryColor }}
                initial={{ width: '4%' }}
                animate={{ width: `${Math.max((referralCount / 2) * 100, 4)}%` }}
                transition={{ duration: 0.9, delay: 0.5 }}
              />
            </div>

            <p className="text-slate-400 text-xs font-medium">
              {goalReached
                ? (isHe ? t.registration.inviteGoalComplete : t.registration.inviteGoalComplete)
                : (isHe ? `${referralCount}/2 חברים הצטרפו` : `${referralCount}/2 friends joined`)}
            </p>
          </div>
        </motion.div>

        {/* ── "How it works" accordion — white card ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.46 }}
          className="mt-4"
        >
          <HowItWorksAccordion primaryColor={primaryColor} isHe={isHe} />
        </motion.div>

        {/* Terms */}
        <p className="text-center text-slate-400 text-[10px] mt-6">
          {isHe ? 'בכפוף לתנאים והגבלות' : 'Terms and conditions apply'}
        </p>
      </div>
    </div>
  );
}

// ─── Stories Shell ────────────────────────────────────────────────────────────
export default function ReferralStoriesPage() {
  const { lang = 'he' } = useParams();
  const navigate        = useNavigate();
  const { language }    = useLanguage();
  const isHe            = language === 'he';

  const tenantConfig  = useTenantStore((s) => s.config);
  const primaryColor  = tenantConfig?.primaryColor ?? '#635bff';
  // Derive display name based on language
  const tenantName    = (isHe ? tenantConfig?.nameHe : tenantConfig?.name) ?? 'נקסוס';

  // Restore from URL slug so every slide is directly shareable (?step=actions etc.)
  const [currentStory, setCurrentStory] = useState(() => {
    const stepParam = new URLSearchParams(window.location.search).get('step');
    if (stepParam) {
      const idx = STORY_IDS.indexOf(stepParam as typeof STORY_IDS[number]);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [progress,     setProgress]     = useState(0);
  const startTimeRef = useRef(0);
  const rafRef       = useRef<number>(0);

  const goToStory = useCallback(
    (index: number) => {
      if (index >= STORY_COUNT) { navigate(`/${lang}`); return; }
      if (index < 0) return;
      setCurrentStory(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [lang, navigate],
  );

  const isInteractive   = currentStory === 1;
  const displayProgress = isInteractive ? 1 : progress;

  // Sync current story → URL ?step=<slug> so every slide has a unique shareable URL
  useEffect(() => {
    const stepId = STORY_IDS[currentStory];
    if (!stepId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', stepId);
    window.history.replaceState(null, '', url.toString());
  }, [currentStory]);

  // Auto-advance timer — story 1 only
  useEffect(() => {
    if (isInteractive) return;
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);
      if (p >= 1) goToStory(currentStory + 1);
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentStory, goToStory, isInteractive]);

  // Tap navigation
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goToStory(currentStory + 1);
    else goToStory(currentStory - 1);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Progress bars — color adapts: white on dark (story 1), slate on light (story 2) */}
      <div className="flex gap-1 px-3 pt-3 pb-2 z-50">
        {Array.from({ length: STORY_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: isInteractive ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.3)' }}
          >
            <div
              className="h-full rounded-full transition-colors"
              style={{
                width: i < currentStory ? '100%' : i === currentStory ? `${displayProgress * 100}%` : '0%',
                background: isInteractive ? primaryColor : 'white',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button — icon color adapts to story */}
      <button
        onClick={() => navigate(`/${lang}`)}
        className="absolute top-3 z-50 w-8 h-8 flex items-center justify-center"
        style={{ [isHe ? 'left' : 'right']: '12px' }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '20px', color: isInteractive ? '#475569' : 'white' }}
        >
          close
        </span>
      </button>

      {/* Story content */}
      <div
        className="flex-1 relative overflow-hidden rounded-t-2xl"
        onClick={isInteractive ? undefined : handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {currentStory === 0 && (
              <StoryHero primaryColor={primaryColor} tenantName={tenantName} />
            )}
            {currentStory === 1 && (
              <StoryActions primaryColor={primaryColor} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
