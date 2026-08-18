import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumRevealContent } from './PremiumRevealPage';
import VoucherCard from '../components/wallet/VoucherCard';
import BalanceCard from '../components/wallet/BalanceCard';
import GiftCoverCard from '../components/wallet/GiftCoverCard';
import { useWallet } from '../hooks/useWallet';
import { mockUserVouchers } from '../mock/data/vouchers.mock';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useNotificationToastStore } from '../stores/notificationToastStore';
import { formatCurrency } from '../utils/formatCurrency';
import type { Notification } from '../types/notification.types';

/**
 * GiftSamplePage — a standalone, ready-made gift page (no form / no checkout).
 *
 * It reuses the recipient *preview* structure from GiftDetailsPage (the flip
 * card → reveal → gift), rebuilt as a self-contained, shareable page. The
 * concrete gift is chosen by the active tenant (`?tenant=`):
 *   • default          → a Passover ("פסח") gift from בני עקיבא
 *   • ?tenant=spar     → a SPAR supermarket gift card
 *   • ?tenant=isrotel  → the Isrotel employee-wallet launch gift
 *
 * Flow: open the greeting (flip card → the sender's full letter, dark preview
 * design) → below it a gift card (wallet voucher style) → "למימוש המתנה" plays
 * a balloon/confetti celebration while the card lifts away, then lands the user
 * on the wallet with that card centred in the deck.
 *
 * The route is registered as a `isFullScreenForm` page in AppLayout, so it
 * inherits the app's phone-width frame (max-w-md, centred) with no bottom nav.
 */

// The app's signature home-page gradient — the same wash used behind the home
// screen and the original gift preview.
const HOME_GRADIENT =
  'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)';

export interface GiftVariant {
  /** The user-voucher this gift redeems into (wallet centres its deck on it). */
  redeemVoucherId: string;
  gradient: string;
  /** Top logo on the cover. Rendered white over the wash when `logoWhite`. */
  logo: string;
  logoWhite: boolean;
  /** Height class for the cover logo (e.g. 'h-16'). */
  logoClass: string;
  /** Hero illustration on the cover. */
  heroImage: string;
  heroMaxW: string;
  sender: string;
  /** Cover title + subtitle (already localised Hebrew strings). */
  coverTitle: string;
  coverSubtitle: string;
  /** The dark "letter" revealed by the flip. */
  letterBg: string;
  letterAccent: string;
  letterHeading: string;
  letterBody: string[];
  letterClosingBig: string;
  letterClosingSmall: string;
  signature: string;
  senderBig: string;
  /** Line printed beneath the card during the redeem celebration. */
  redeemLine: string;
  /**
   * Employer-wallet gifts (SPAR / Isrotel): the celebration holds a beat on a
   * "we're loading your gift" caption before handing off to the wallet.
   */
  loadsToBalance?: boolean;
  /**
   * During that beat the gift card swaps for the Nexus balance card, counting
   * up by the gift's value. Off for tenants whose wallet is presented as their
   * own (Isrotel) — the Nexus balance is never shown or named there.
   */
  loadShowsBalance?: boolean;
  /** Caption printed during that beat. */
  loadCaption?: string;
  /**
   * Suppress the "gift card loaded" toast fired on landing in the wallet.
   * On for SPAR — the recipient just watched the load animation, so the toast
   * only repeats what the celebration already said.
   */
  skipLoadToast?: boolean;
  /** Cover button label (defaults to "גלה את המתנה"). */
  coverCta?: string;
  /** Footer CTA once revealed (defaults to "למימוש המתנה"). */
  revealCta?: string;
  /** Section header above the card once revealed (defaults to "המתנה שלך"). */
  cardSectionTitle?: string;
  /**
   * Insurance "claim" mode — when present, the flip reveals a claim-details
   * panel (amount + rows + document buttons) instead of a greeting letter, and
   * the cover shows an approval badge instead of a hero illustration.
   */
  claim?: {
    heading: string;
    intro: string;
    amountLabel: string;
    amount: string;
    rows: { label: string; value: string }[];
    docsLabel: string;
    documents: { label: string; icon: string }[];
  };
}

const RECIPIENT = 'רז';

/** Set once a recipient completes the redeem step for a tenant's gift — the
 * wallet-home teaser (GiftClaimTeaser) checks this so a claimed gift never
 * resurfaces for that tenant. */
export const giftClaimedKey = (tenantId: string) => `nexus_gift_claimed_${tenantId}`;

export const GIFT_VARIANTS: Record<string, GiftVariant> = {
  default: {
    redeemVoucherId: 'uv_bnei_pesach',
    gradient: HOME_GRADIENT,
    logo: '/bnei-akiva-logo.png',
    logoWhite: true,
    logoClass: 'h-16 w-auto',
    heroImage: '/gift-cards/pesach.png',
    heroMaxW: 'max-w-[80%]',
    sender: 'בני עקיבא',
    coverTitle: `${RECIPIENT}, קיבלת מתנה מבני עקיבא!`,
    coverSubtitle: 'לרגל חג הפסח — חג החירות',
    letterBg: '#0a2540',
    letterAccent: '#7dd3fc',
    letterHeading: 'פעילים יקרים,\nה\' עמכם!',
    letterBody: [
      'במשך דורות רבים כאשר נפגשים מחדש בכל שנה עם נס יציאת מצרים, קשה לדמיין מי היו האנשים, מה הם חשו ואילו נשמות היו באותם רגעים גדולים.',
      'בשנים האחרונות וביתר שאת בתקופה האחרונה, אותם אנשים גדולים שחווים את סיפור תקומת עם ישראל הם אתם, אנחנו, כל עם ישראל...',
      'סיפור של תקופה וגאולה מלווה בתפילה, מלווה בקשיים, אבל כמו שלמדנו ביציאת מצרים ורואים כיום - מלווה גם בעז"ה בניסים גדולים.',
      'ערב היציאה לחירות הלב מתפלל מעומק הנשמה שנזכה להודות על הניסים של אז וכימי צאתנו מארץ מצרים, נראה גם אנחנו בהמשך הנפלאות, התשועה והגאולה.',
      'תודה על העשייה שלכם ובפרט על זו שבתקופה האחרונה,',
      'בהערכה גדולה,',
    ],
    letterClosingBig: 'פסח כשר ושמח',
    letterClosingSmall: 'ובברכת חברים לתורה ועבודה',
    signature: 'יגאל קליין, מזכ"ל',
    senderBig: 'בני עקיבא',
    redeemLine: 'ממשו בעשרות בתי עסק',
  },
  spar: {
    redeemVoucherId: 'uv_spar_gift',
    // The original Bnei Akiva palette — the signature home-page wash on the
    // cover + glow, and the dark-navy letter.
    gradient: HOME_GRADIENT,
    logo: '/tenants/spar-official.svg',
    logoWhite: true,
    logoClass: 'w-[80%] h-auto',
    heroImage: '/gift-cards/rosh-hashana.png',
    heroMaxW: 'max-w-[80%]',
    sender: 'SPAR',
    coverTitle: `${RECIPIENT}, קיבלת מתנה מ-SPAR!`,
    coverSubtitle: '',
    letterBg: '#0a2540',
    letterAccent: '#7dd3fc',
    letterHeading: 'לכל צוות העובדים\nוהעובדות שלנו,',
    letterBody: [
      'עם בואה של השנה החדשה, אני רוצה לעצור לרגע ולהודות לכל אחת ואחד מכם.',
      'SPAR היא הרבה יותר מסניפים ומדפים — היא האנשים. אתם אלה שמקבלים את הלקוחות בכניסה, שדואגים שכל מוצר יהיה במקומו, שנותנים שירות בחיוך גם בימים העמוסים. המסירות, המקצועיות והלב שאתם מביאים מדי יום הם הלב הפועם של הרשת, ואני אסיר תודה על כך.',
      'שתהיה לכולנו שנה של צמיחה, של הצלחות משותפות ושל סיפוק — בעבודה ובבית כאחד.',
      'שנה טובה, מתוקה ובריאה לכם ולכל בני משפחותיכם — שתתמלא בשמחה, בבריאות ובהגשמה.',
    ],
    letterClosingBig: '',
    letterClosingSmall: 'בברכה,',
    signature: 'עמית זאב',
    senderBig: 'SPAR ישראל',
    redeemLine: 'לשימוש במאות מקומות',
    loadsToBalance: true,
    // Keep the SPAR gift card on screen through the celebration — the Nexus
    // balance card never replaces it.
    loadShowsBalance: false,
    loadCaption: 'אנחנו טוענים את כרטיס המתנה ליתרה שלך',
    skipLoadToast: true,
  },
  isrotel: {
    redeemVoucherId: 'uv_isrotel_gift',
    // The app's signature home-page wash on the cover + glow (same as the
    // default and SPAR gifts); the letter below stays Isrotel navy.
    gradient: HOME_GRADIENT,
    logo: '/tenants/isrotel-logo.png',
    // The wordmark asset is navy on transparent — inverted to white so it
    // sits on the blue wash the way it does on the card artwork.
    logoWhite: true,
    logoClass: 'w-[62%] h-auto',
    heroImage: '/gift-cards/birthday-3d.png',
    heroMaxW: 'max-w-[60%]',
    sender: 'ישרוטל',
    coverTitle: `${RECIPIENT}, יום הולדת שמח!`,
    coverSubtitle: 'מתנה קטנה מישרוטל מחכה לך בפנים',
    letterBg: '#0c2b49',
    letterAccent: '#8ec5ea',
    letterHeading: `${RECIPIENT},
יום הולדת שמח!`,
    letterBody: [
      'יום ההולדת שלך הוא הזדמנות בשבילנו לעצור לרגע ולהגיד תודה. אתם אלה שמארחים את ישראל — דואגים שכל אורח יקבל את החופשה שהוא יזכור, גם בימים העמוסים ביותר. היום התור שלך לקבל.',
      'המתנה מחכה לך בארנק העובדים של ישרוטל: ארנק דיגיטלי אישי, בשפה ובמיתוג שלנו, שנשאר איתך כל השנה. בכל חג, יום הולדת ורגע של הוקרה הוא יתמלא מחדש — בלי שוברים שהולכים לאיבוד ובלי קודים שפג תוקפם.',
      'והכי חשוב: המתנה לא נגמרת בקופה. כל תשלום שתבצע דרך הארנק מחזיר לך קאשבק שנשאר שם לפעם הבאה — במאות בתי עסק, ברשתות האופנה, בסופרמרקטים, במסעדות ובפנאי.',
      'שתהיה לך שנה טובה, בריאה ומלאה בחוויות. תיהנה — מגיע לך.',
    ],
    letterClosingBig: 'יום הולדת שמח!',
    letterClosingSmall: 'בברכה,',
    signature: 'ליאור רביב, מנכ"ל',
    senderBig: 'ישרוטל',
    redeemLine: 'מאות בתי עסק, קאשבק על כל תשלום',
    loadsToBalance: true,
    // The Isrotel wallet is presented as the employees' own — the Nexus
    // balance card is neither shown nor named during the load.
    loadShowsBalance: false,
    loadCaption: 'טוענים את המתנה לארנק שלך',
  },
  menora: {
    redeemVoucherId: 'uv_menora_claim',
    // Menora's deep-navy brand wash on the cover + glow.
    gradient: 'linear-gradient(150deg, #16306e 0%, #0e2152 55%, #081634 100%)',
    logo: '/tenants/menora-logo.svg',
    // The logo SVG is already white, so it sits on the navy wash as-is.
    logoWhite: false,
    logoClass: 'w-[62%] h-auto',
    // Claim mode renders an approval badge instead of a hero illustration.
    heroImage: '',
    heroMaxW: 'max-w-[80%]',
    sender: 'מנורה מבטחים',
    coverTitle: `${RECIPIENT}, התביעה שלך אושרה`,
    coverSubtitle: 'כספי הביטוח מחכים לך בכרטיס וירטואלי',
    coverCta: 'גלה את הפיצוי שלך',
    // Letter fields are unused in claim mode (kept to satisfy the interface).
    letterBg: '#0e2152',
    letterAccent: '#7dd3fc',
    letterHeading: '',
    letterBody: [],
    letterClosingBig: '',
    letterClosingSmall: '',
    signature: '',
    senderBig: '',
    redeemLine: 'מוכן לתשלום מיידי אצל ספקים מאושרים',
    revealCta: 'קבלת הכספים לארנק',
    cardSectionTitle: 'הכרטיס שלך',
    claim: {
      heading: 'התביעה שלך אושרה',
      intro: 'שמחים שאנחנו כאן בשבילך ברגע האמת. כספי התביעה נטענו לכרטיס וירטואלי ומוכנים לשימוש מיידי.',
      amountLabel: 'סכום שאושר',
      amount: '₪2,500',
      rows: [
        { label: 'מספר תביעה', value: '2026-48217' },
        { label: 'תאריך אישור', value: '30.06.2026' },
        { label: 'אמצעי תשלום', value: 'כרטיס וירטואלי' },
      ],
      docsLabel: 'מסמכים',
      documents: [
        { label: 'אישור התביעה', icon: 'task_alt' },
        { label: 'פירוט התשלום', icon: 'receipt_long' },
        { label: 'הפוליסה שלי', icon: 'shield' },
      ],
    },
  },
};

export default function GiftSamplePage() {
  const navigate = useNavigate();
  const tenantId = useTenantStore((s) => s.tenantId);
  const { data: wallet } = useWallet();
  const [revealed, setRevealed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  // Employer-wallet gifts only — swaps the redeem-line caption to the gift's
  // "loading" caption for a beat before handing off, instead of navigating
  // away immediately.
  const [loadingGift, setLoadingGift] = useState(false);

  const variant = (tenantId && GIFT_VARIANTS[tenantId]) || GIFT_VARIANTS.default;
  const userVoucher = mockUserVouchers.find((v) => v.id === variant.redeemVoucherId)!;

  // "למימוש המתנה" — play the same reveal celebration as the "הכל מוכן"
  // onboarding finale (PremiumRevealContent); its onReveal hands off to the
  // wallet with the gift card centred in the deck.
  const startRedeem = () => setRedeeming(true);

  // When the celebration ends, land on the WALLET (not home). The wallet is a
  // protected route, so claiming the gift signs the recipient in first —
  // otherwise ProtectedRoute would bounce them to the home page.
  const finishRedeem = () => {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated) {
      auth.login({ token: 'gift-demo', userId: 'gift-demo', method: 'phone', isOrgMember: false });
    }
    // Marks the gift as claimed so the wallet-home teaser (entered from the
    // "landed already signed-in" path) never resurfaces for this recipient.
    if (tenantId && variant.loadsToBalance) {
      try { localStorage.setItem(giftClaimedKey(tenantId), '1'); } catch { /* private mode */ }
    }
    if (tenantId && variant.loadsToBalance && !variant.skipLoadToast) {
      // Standard-design toast, fired as the recipient lands in the wallet —
      // taps through to the sub-balances tab where the loaded card now lives.
      const amount = formatCurrency(userVoucher.voucher.originalPrice, userVoucher.voucher.currency);
      const notification: Notification = {
        id: `n_${tenantId}_load_${Date.now()}`,
        category: 'gift-card',
        priority: 'transactional',
        sender: { id: 'nexus', name: 'Nexus', nameHe: 'נקסוס', initial: 'N', logo: '/nexus-icon.png', brandColor: 'bg-white' },
        title: `Gift card loaded: ${amount}`,
        titleHe: `כרטיס המתנה נטען: ${amount}`,
        body: variant.loadShowsBalance
          ? `We loaded the gift card worth ${amount} to your Nexus balance. Tap to track.`
          : `We loaded your ${amount} gift to your wallet. Tap to track.`,
        bodyHe: variant.loadShowsBalance
          ? `טענו את כרטיס המתנה בסך ${amount} ליתרת נקסוס שלך. למעקב לחצו.`
          : `טענו את המתנה בסך ${amount} לארנק שלך. למעקב לחצו.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        deepLink: '/wallet/balance?tab=subBalances',
      };
      useNotificationToastStore.getState().showToast(notification);
    }
    navigate(`/he/wallet?focus=${variant.redeemVoucherId}`);
  };

  return (
    <div className="relative min-h-dvh bg-white flex flex-col overflow-hidden" dir="rtl">
      {/* Decorative gradient glow — the variant's wash. */}
      <div className="absolute top-0 inset-x-0 h-[300px] pointer-events-none z-0">
        <div className="w-full h-full opacity-[0.18]" style={{ background: variant.gradient }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Scrollable body — no header (no title / back arrow on the cover). */}
      <main
        className={`relative z-10 flex-1 overflow-y-auto scrollbar-hide px-5 ${
          revealed ? 'pt-10 pb-12' : 'flex items-start justify-center pt-12 pb-4'
        }`}
      >
        <div className="w-full max-w-[400px] mx-auto">
          {/* ── Greeting (top): a 3D flip from the cover to the FULL letter.
              Two independently-sized motion elements (NOT two faces of one box,
              which caused backface bleed-through) cross-flipped via
              AnimatePresence — so the cover can stay short and the letter tall. ── */}
          <div className="flip-perspective w-full">
            <AnimatePresence mode="wait" initial={false}>
              {!revealed ? (
                <motion.div
                  key="cover"
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeIn' }}
                  className="relative w-full aspect-[10/16] rounded-2xl flex flex-col items-center justify-between p-7 overflow-hidden"
                  style={{
                    background: variant.gradient,
                    color: '#ffffff',
                    boxShadow: '0 26px 40px -18px rgba(14, 44, 84, 0.45)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <GiftCoverCard variant={variant} onOpen={() => setRevealed(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="letter"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="w-full rounded-2xl p-8 text-start"
                  style={{
                    background: variant.letterBg,
                    boxShadow: '0 26px 40px -18px rgba(0, 0, 0, 0.45)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {variant.claim ? (
                    /* ── Claim-details panel (insurance) ── */
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: 30, color: variant.letterAccent, fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        <h2 className="text-2xl font-black text-white leading-tight">
                          {variant.claim.heading}
                        </h2>
                      </div>
                      <p className="mt-3 text-[15px] font-medium text-white/80 leading-relaxed">
                        {variant.claim.intro}
                      </p>

                      {/* Approved amount — the headline figure. */}
                      <div className="mt-5 rounded-2xl bg-white/10 border border-white/15 px-5 py-4">
                        <p className="text-xs font-semibold text-white/70">{variant.claim.amountLabel}</p>
                        <p className="mt-1 text-4xl font-black text-white tracking-tight" dir="ltr">
                          {variant.claim.amount}
                        </p>
                      </div>

                      {/* Claim metadata rows. */}
                      <div className="mt-4 rounded-2xl bg-white/5 divide-y divide-white/10 overflow-hidden">
                        {variant.claim.rows.map((r) => (
                          <div key={r.label} className="flex items-center justify-between px-4 py-3">
                            <span className="text-[13px] text-white/60">{r.label}</span>
                            <span className="text-[14px] font-semibold text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Document buttons — visual only (demo). */}
                      <p className="mt-6 mb-2 text-sm font-bold text-white/70">{variant.claim.docsLabel}</p>
                      <div className="flex flex-col gap-2">
                        {variant.claim.documents.map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            className="w-full flex items-center gap-3 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-start active:bg-white/15 transition-colors"
                          >
                            <span className="material-symbols-rounded text-white/90" style={{ fontSize: 22 }}>
                              {d.icon}
                            </span>
                            <span className="flex-1 text-[15px] font-semibold text-white">{d.label}</span>
                            <span className="material-symbols-rounded text-white/50" style={{ fontSize: 20 }}>
                              chevron_left
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-white leading-tight whitespace-pre-line">
                        {variant.letterHeading}
                      </h2>
                      {/* Full letter — flows naturally (the card is as tall as it). */}
                      <div className="mt-4">
                        {variant.letterBody.map((para, i) => (
                          <p
                            key={i}
                            className={`text-[15px] font-medium text-white/80 leading-relaxed ${i > 0 ? 'mt-3' : ''}`}
                          >
                            {para}
                          </p>
                        ))}
                        {variant.letterClosingBig && (
                          <p className="mt-5 text-xl font-extrabold" style={{ color: variant.letterAccent }}>
                            {variant.letterClosingBig}
                          </p>
                        )}
                        <p className="mt-1.5 text-[15px] font-semibold text-white/80">
                          {variant.letterClosingSmall}
                        </p>
                        <p className="mt-3 text-base font-bold text-white">{variant.signature}</p>
                        <p className="mt-5 text-2xl font-bold" style={{ color: variant.letterAccent }}>
                          {variant.senderBig}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Gift (below): the gift card, in the wallet's voucher style. ── */}
          {revealed && (
            <section className="mt-8 animate-fade-in">
              <h3 className="text-xl font-bold text-text-primary mb-4 text-start">{variant.cardSectionTitle ?? 'המתנה שלך'}</h3>
              {/* The exact wallet voucher card — same component + data, so the
                  balance position and everything match the card in the wallet. */}
              <button
                onClick={startRedeem}
                className="w-full block transition-transform active:scale-[0.97]"
              >
                <VoucherCard userVoucher={userVoucher} flipped={false} onExpire={() => {}} />
              </button>
            </section>
          )}
        </div>
      </main>

      {/* Sticky footer — slim indicator pre-reveal; redeem CTA once opened. */}
      <footer className="relative z-10 shrink-0 px-6 pt-2 pb-7">
        {revealed ? (
          <button
            type="button"
            onClick={startRedeem}
            className="w-full bg-bg-dark text-white py-4 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
          >
            {variant.revealCta ?? 'למימוש המתנה'}
          </button>
        ) : null}
      </footer>

      {/* ── Redeem celebration ── the same reveal experience as the "הכל מוכן"
          onboarding finale: animated gradient + flash/ripple/particles + brand
          logos rising as bubbles. On reveal it hands off to the wallet with the
          gift card centred in the deck. */}
      {redeeming && (
        <div
          className="fixed inset-0 z-[140] mx-auto max-w-md overflow-hidden"
          style={{ background: '#f6f9fc' }}
          dir="rtl"
        >
          <PremiumRevealContent
            autoReveal
            revealHoldMs={4200}
            onReveal={() => {
              // Employer wallets — hold a beat on the "loading your gift"
              // caption, then hand off; other tenants hand off immediately.
              if (variant.loadsToBalance) {
                setLoadingGift(true);
                setTimeout(finishRedeem, 1600);
              } else {
                finishRedeem();
              }
            }}
          />
          {/* The gift card rises into the centre of the screen, with the line
              printed beneath it, over the celebration. */}
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center px-8 pointer-events-none">
            <div className="w-[300px] animate-gift-rise-center">
              {loadingGift && variant.loadShowsBalance ? (
                // The gift card's job is done — show the Nexus balance
                // instead, counting up by exactly the card's value, so the
                // "loading to your balance" line has something to point at.
                <BalanceCard
                  logoCorner
                  className="w-full"
                  style={{ aspectRatio: '1510 / 952' }}
                  balance={(wallet?.balance ?? 0) + userVoucher.voucher.originalPrice}
                  countFrom={wallet?.balance ?? 0}
                />
              ) : (
                <VoucherCard userVoucher={userVoucher} flipped={false} onExpire={() => {}} />
              )}
            </div>
            <p
              key={loadingGift ? 'loading' : 'redeem'}
              className="mt-8 flex items-center justify-center gap-2 text-2xl font-extrabold text-white text-center animate-fade-in"
              style={{ animationDelay: loadingGift ? '0s' : '0.7s', animationFillMode: 'both', textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
            >
              {loadingGift && (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '22px', fontVariationSettings: "'wght' 300" }}>
                  progress_activity
                </span>
              )}
              {loadingGift ? (variant.loadCaption ?? 'טוענים את המתנה לארנק שלך') : variant.redeemLine}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
