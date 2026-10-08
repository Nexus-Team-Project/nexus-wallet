import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, CreditCard } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { useTenantStore } from '../stores/tenantStore';
import { mockTenants } from '../mock/data/tenants.mock';
import { useNotificationToastStore } from '../stores/notificationToastStore';
import { useAuthStore } from '../stores/authStore';
import type { Notification } from '../types/notification.types';
import AnimatedGradient, { type GradientPalette } from '../components/AnimatedGradient';
import ExpenseCashbackGallery from '../components/ExpenseCashbackGallery';
import LovedBrandsGrid from '../components/LovedBrandsGrid';
import AllBenefitsPhonePeek from '../components/AllBenefitsPhonePeek';
import Reveal from '../components/Reveal';
import GiftCardsCarousel from '../components/onboarding/GiftCardsCarousel';
import PeopleWall from '../components/PeopleWall';
import { mockSubBalances } from '../mock/data/subBalances.mock';
import { daysLeftLabel, daysUntil } from '../utils/daysLeft';
import DarkPitchCard from '../components/DarkPitchCard';
import { PremiumRevealContent } from './PremiumRevealPage';
import RisingBubbles from '../components/RisingBubbles';
import AboutFaq, { type FaqItem } from '../components/AboutFaq';

/**
 * TenantAboutPage — the About page (`AboutWalletPage`), white-labelled for
 * the client (`/tenant-about?tenant=isrotel`). Same structure — aurora hero
 * with the hand/phone art and the expense → cashback gallery, "how it works",
 * loved brands, the wallet phone peek, the gift-cards carousel and a fixed
 * CTA — but the brand signals are the client's: their logo (with the Nexus
 * mark beside it in the top corner), their colours (the hero gradient is
 * built from them) and their wallet's name.
 *
 * Branding resolves from `?tenant=` → the active tenant → Isrotel. A tenant
 * without a hand-tuned entry below gets a palette derived from its
 * `primaryColor`, so any tenant renders.
 *
 * It's the single landing page for everyone joining the client's wallet:
 * - with a joining gift: the gift card section (amount + threshold) is shown,
 *   a notification announces it on landing, and the CTA claims it into the
 *   wallet;
 * - without one (`?gift=0` to preview): no gift section, CTA opens the wallet.
 */

interface TenantBrand {
  /** "ארנק העובדים של ישרוטל" — what the wallet is called for this client. */
  walletNameHe: string;
  walletName: string;
  /** Dark logo for the white strip above the hero. */
  logoDark: string;
  /**
   * Joining gift waiting for the visitor — announced as a notification on
   * landing. Earn `threshold` cashback within `days` of claiming → `amount`.
   */
  joinGift?: { amount: number; threshold: number; days: number };
  /** The client's wallet-card artwork (shown when the gift is claimed). */
  cardArt?: { src: string; position?: string };
  primary: string;
  palette: GradientPalette;
}

/** Palette from a single brand colour: deep → mid → light, via color-mix. */
function paletteFrom(primary: string): GradientPalette {
  const mix = (pct: number, to: string) => `color-mix(in srgb, ${primary} ${pct}%, ${to})`;
  return {
    base: `linear-gradient(to right, ${primary}, ${mix(70, 'white')}, ${mix(35, 'white')})`,
    blobs: [
      [primary, mix(80, 'black')],
      [mix(70, 'white'), primary],
      [mix(40, 'white'), mix(70, 'white')],
      [mix(55, '#0ea5e9'), primary],
      [mix(85, 'white'), mix(60, 'white')],
    ],
  };
}

/** Hand-tuned brands; anything else falls back to `paletteFrom(primaryColor)`. */
const BRANDS: Record<string, Partial<TenantBrand>> = {
  isrotel: {
    walletNameHe: 'ארנק העובדים של ישרוטל',
    walletName: 'The Isrotel employee wallet',
    logoDark: '/tenants/isrotel-logo-black.png',
    primary: '#193576',
    // Accumulation framing: earn `threshold` in cashback → the gift opens.
    joinGift: { amount: 50, threshold: 100, days: 30 },
    cardArt: { src: '/gift-cards/isrotel.png', position: 'left center' },
    // Navy, sea blue, sky and a touch of sand — Isrotel's resort palette.
    palette: {
      base: 'linear-gradient(to right, #193576, #2b6cb0, #8ec5ea)',
      blobs: [
        ['#193576', '#122a5e'],
        ['#2b6cb0', '#1f5596'],
        ['#e8c48f', '#d9a865'],
        ['#5fb3d9', '#3c95c4'],
        ['#8ec5ea', '#5fb3d9'],
      ],
    },
  },
};

function useTenantBrand(): TenantBrand & { id: string; nameHe: string; name: string } {
  const [params] = useSearchParams();
  const activeTenant = useTenantStore((s) => s.tenantId);
  const id = params.get('tenant') || activeTenant || 'isrotel';
  const config = mockTenants[id] ?? mockTenants.isrotel;
  const tuned = BRANDS[config.id] ?? {};
  // `?gift=0` previews the no-gift landing (e.g. the campaign's cap is used up).
  const giftOff = params.get('gift') === '0';
  const primary = tuned.primary ?? config.primaryColor;
  return {
    id: config.id,
    name: config.name,
    nameHe: config.nameHe,
    walletNameHe: tuned.walletNameHe ?? `הארנק של ${config.nameHe}`,
    walletName: tuned.walletName ?? `The ${config.name} wallet`,
    logoDark: tuned.logoDark ?? config.logo,
    joinGift: giftOff ? undefined : tuned.joinGift,
    cardArt: tuned.cardArt,
    primary,
    palette: tuned.palette ?? paletteFrom(primary),
  };
}

/** The About page's FAQ, reworded around the client's wallet (no Nexus). */
function tenantFaq(b: { nameHe: string; name: string; walletNameHe: string; walletName: string }): FaqItem[] {
  return [
    {
      q: `מה זה ${b.walletNameHe}?`,
      qEn: `What is ${b.walletName}?`,
      a: `ארנק דיגיטלי אישי לעובדי ${b.nameHe}. מתנות מ${b.nameHe} נכנסות אליו, וכל תשלום דרכו מחזיר לך קאשבק שנשאר בארנק לפעם הבאה.`,
      aEn: `A personal digital wallet for ${b.name} employees. Gifts from ${b.name} land in it, and every payment through it pays you cashback that stays in the wallet for next time.`,
    },
    {
      q: 'כמה זה עולה?',
      qEn: 'What does it cost?',
      a: `כלום. הארנק ניתן לעובדי ${b.nameHe} בלי עלות, בלי דמי מנוי ובלי עמלות.`,
      aEn: `Nothing. The wallet is free for ${b.name} employees — no subscription, no fees.`,
    },
    {
      q: 'איך מקבלים קאשבק?',
      qEn: 'How do I earn cashback?',
      a: 'מצמידים את כרטיס האשראי הקיים ומשלמים בקופה כרגיל. הקאשבק מחושב אוטומטית בכל תשלום דרך הארנק, בלי קודים ובלי טפסים, ונכנס ליתרה שלך.',
      aEn: 'Link your existing card and pay at the register as usual. Cashback is calculated automatically on every payment through the wallet — no codes, no forms — and lands in your balance.',
    },
    {
      q: 'איפה אפשר להשתמש?',
      qEn: 'Where can I use it?',
      a: 'במאות בתי עסק: רשתות אופנה, סופרמרקטים, מסעדות, פנאי ועוד. ליד כל עסק מופיע כמה קאשבק מקבלים.',
      aEn: 'At hundreds of businesses — fashion chains, supermarkets, restaurants, leisure and more. Each shows the cashback you get.',
    },
    {
      q: `איך מקבלים מתנות מ${b.nameHe}?`,
      qEn: `How do gifts from ${b.name} arrive?`,
      a: 'בחגים, בימי הולדת וברגעי הוקרה המתנה נכנסת לארנק אוטומטית. לכל מתנה מופיעים התנאים שלה: תוקף, איפה אפשר להשתמש בה ועוד.',
      aEn: 'On holidays, birthdays and moments of thanks, the gift lands in your wallet automatically, with its own terms shown — expiry, where it can be used and more.',
    },
    {
      q: 'מה קורה לקאשבק שצברתי?',
      qEn: 'What happens to the cashback I earn?',
      a: 'הוא שלך. הקאשבק נשאר ביתרה ואפשר לשלם בו בכל העסקים שמשתתפים בקאשבק.',
      aEn: "It's yours. Cashback stays in your balance and can be spent at every business that offers cashback.",
    },
  ];
}

/**
 * Client footer — the About page footer's look (white, slate-100 diagonal
 * rising 100px above it), with the client's logo and the Nexus mark beside
 * it, and the client's links.
 */
function TenantFooter({ logo, nameHe, name, isRTL }: { logo: string; nameHe: string; name: string; isRTL: boolean }) {
  const links = isRTL
    ? ['תנאי שימוש', 'מדיניות פרטיות', 'הצהרת נגישות', 'צור קשר']
    : ['Terms of use', 'Privacy policy', 'Accessibility', 'Contact'];
  return (
    <footer className="relative pt-24 bg-white">
      <div
        className="absolute bg-slate-100"
        style={{
          top: '-100px',
          left: 0,
          right: 0,
          bottom: 0,
          clipPath: isRTL ? 'polygon(0 100px, 100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 100px, 100% 100%, 0 100%)',
        }}
      />
      <div className="relative px-6 pb-36">
        <div className="flex items-center gap-3" dir="ltr">
          <img src={logo} alt={isRTL ? nameHe : name} className="h-12 w-auto max-w-[140px] object-contain" draggable={false} />
          <span className="w-px h-8 bg-slate-300" aria-hidden />
          <img src="/nexus-logo-black-trim.png" alt="Nexus" className="h-5 w-auto object-contain" draggable={false} />
        </div>
        <nav className="mt-6 grid grid-cols-2 gap-y-3 gap-x-6">
          {links.map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className="text-sm text-slate-600 hover:text-slate-900">
              {l}
            </a>
          ))}
        </nav>
        <p className="mt-8 text-[11px] text-slate-500">
          © {new Date().getFullYear()} {isRTL ? nameHe : name}. {isRTL ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}

export default function TenantAboutPage() {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const brand = useTenantBrand();

  // Landing: a notification from the client rises in a beat after the page
  // settles, so it reads as "something's waiting for you" rather than as part
  // of the page.
  // - with a gift: the gift is waiting; tap → the gift section;
  // - without: the joining gifts are gone, but the wallet still pays back;
  //   tap → the brands and their cashback.
  const { id: tenantId, nameHe, name, logoDark, joinGift } = brand;
  const [landingParams] = useSearchParams();
  const previewMode = landingParams.get('preview');
  useEffect(() => {
    // No landing notification over a preview screen, or for someone who
    // already claimed the gift (it isn't "waiting" for them any more).
    if (previewMode) return;
    try { if (joinGift && localStorage.getItem(`nexus_join_gift_claimed_${tenantId}`) === '1') return; } catch { /* private mode */ }
    const sender = { id: tenantId, name, nameHe, initial: name.charAt(0), logo: logoDark, brandColor: 'bg-white' };
    const notification: Notification = joinGift
      ? {
          id: `n_${tenantId}_join_gift`,
          category: 'gift-card',
          priority: 'transactional',
          sender,
          title: 'A joining gift is waiting for you',
          titleHe: 'מתנת הצטרפות מחכה לך',
          body: `Earn ₪${joinGift.threshold} cashback within ${joinGift.days} days and we'll add a ₪${joinGift.amount} gift. Tap to see it.`,
          bodyHe: `צברו ₪${joinGift.threshold} קאשבק תוך ${joinGift.days} יום, ונוסיף לכם ₪${joinGift.amount} מתנה. לחצו לפרטים.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          deepLink: `/tenant-about?tenant=${tenantId}&focus=gift`,
        }
      : {
          id: `n_${tenantId}_join_no_gift`,
          category: 'gift-card',
          priority: 'transactional',
          sender,
          title: 'The joining gifts are all taken',
          titleHe: 'מתנות ההצטרפות כבר חולקו',
          body: `But the ${name} wallet still pays you back up to 60% on every payment. Tap to see where.`,
          bodyHe: `אבל הארנק של ${nameHe} עדיין מחזיר לך עד 60% על כל תשלום. לחצו לראות איפה.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          deepLink: `/tenant-about?tenant=${tenantId}&gift=0&focus=brands`,
        };
    const timer = window.setTimeout(
      () => useNotificationToastStore.getState().showToast(notification, { duration: 9000 }),
      1200,
    );
    return () => window.clearTimeout(timer);
  }, [tenantId, name, nameHe, logoDark, joinGift, previewMode]);

  // Notification tap (`?focus=gift` / `?focus=brands`) brings that section into view.
  const giftRef = useRef<HTMLDivElement>(null);
  const brandsRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const focus = searchParams.get('focus');
  useEffect(() => {
    const target = focus === 'gift' ? giftRef.current : focus === 'brands' ? brandsRef.current : null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focus]);

  // With a gift, the CTA claims it: sign in, play the gift-flow celebration
  // (balloons + confetti), then return to the wallet's home with a confirmation
  // toast that taps through to the (locked) gift in the sub-balances.
  // Without one it simply opens the wallet.
  // Design preview without signing in: `?preview=claim` / `?preview=claimed`.
  const preview = searchParams.get('preview');
  const [claiming, setClaiming] = useState(() => preview === 'claim' && !!joinGift);
  const [loadingGift, setLoadingGift] = useState(false);
  // One claim per user: a second "claim" gets a gentle "already claimed"
  // screen instead of the celebration.
  const claimedKey = `nexus_join_gift_claimed_${tenantId}`;
  const [alreadyClaimed, setAlreadyClaimed] = useState(() => preview === 'claimed' && !!joinGift);
  const hasClaimed = () => {
    try { return localStorage.getItem(claimedKey) === '1'; } catch { return false; }
  };
  // Where the member stands on the gift (demo: the wallet's locked joining gift).
  const giftLock = mockSubBalances.find((sb) => sb.source === 'nexus_gift')?.lock;
  const finishClaim = () => {
    if (!joinGift) return;
    try { localStorage.setItem(claimedKey, '1'); } catch { /* private mode */ }
    const loaded: Notification = {
      id: `n_${tenantId}_join_gift_loaded_${Date.now()}`,
      category: 'gift-card',
      priority: 'transactional',
      sender: { id: tenantId, name, nameHe, initial: name.charAt(0), logo: logoDark, brandColor: 'bg-white' },
      title: `Your ₪${joinGift.amount} joining gift is in your wallet`,
      titleHe: `מתנת ההצטרפות בסך ₪${joinGift.amount} בארנק שלך`,
      body: `It opens once you earn ₪${joinGift.threshold} cashback within ${joinGift.days} days. Tap to track.`,
      bodyHe: `היא נפתחת כשתצברו ₪${joinGift.threshold} קאשבק תוך ${joinGift.days} יום. למעקב לחצו.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      deepLink: '/wallet/balance?tab=subBalances',
    };
    // The wallet is a protected route — sign the demo/preview visitor in
    // first (as the gift-sample flow does), or it would bounce them home.
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated) {
      auth.login({ token: 'gift-demo', userId: 'gift-demo', method: 'phone', isOrgMember: true });
    }
    // Back to the wallet's home (the card deck); the toast taps through to
    // the gift in the sub-balances.
    navigate(`/${lang}/wallet`);
    useNotificationToastStore.getState().showToast(loaded);
  };
  const handleCta = async () => {
    const authed =
      isAuthenticated ||
      (await requireAuth({
        promptMessage: isRTL ? 'התחברו כדי לפתוח את הארנק שלכם' : 'Sign in to open your wallet',
      }));
    if (!authed) return;
    if (!joinGift) navigate(`/${lang}/wallet`);
    else if (hasClaimed()) setAlreadyClaimed(true);
    else setClaiming(true);
  };

  // The client's gift card, locked — shared by the celebration and the
  // "already claimed" screen.
  const giftCardFace = joinGift ? (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: '1.586 / 1', backgroundColor: brand.primary }}
    >
      {brand.cardArt ? (
        <img
          src={brand.cardArt.src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: brand.cardArt.position || 'center' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={logoDark} alt="" className="h-12 w-auto brightness-0 invert" draggable={false} />
        </div>
      )}
      <img
        src="/nexus-white-wide-logo.png"
        alt="Nexus"
        draggable={false}
        className="absolute left-4 bottom-4 h-7 w-auto opacity-95"
      />
      <span className="absolute right-4 bottom-3.5 inline-flex items-center gap-1.5 text-white" dir="ltr">
        <span className="material-symbols-rounded opacity-90" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>lock</span>
        <span className="text-[32px] leading-none font-extrabold tabular-nums">₪{joinGift.amount}</span>
      </span>
    </div>
  ) : null;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="relative min-h-screen bg-white">
      {/* Floating back — pinned to the app frame like the About page's */}
      <div className="fixed top-5 inset-x-0 max-w-md mx-auto w-full px-4 z-40 flex items-center gap-2 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          aria-label={isRTL ? 'חזרה' : 'Back'}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>
            {isRTL ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      <main>
        {/* ── Hero — client gradient, hand/phone art, client logo ── */}
        <section className="px-4 pb-16 relative flex flex-col">
          <div className="rounded-3xl overflow-hidden relative mt-[108px] pb-28 px-6 flex flex-col items-center">
            <AnimatedGradient clipPath="none" palette={brand.palette} />
            <div className="relative z-10 w-full text-right pt-[276px] px-2">
              <h1 className="text-white text-[28px] font-extrabold leading-tight text-right">
                {isRTL ? <>עד 60% בחזרה<br />על הכסף שלך</> : <>Up to 60% back<br />on your money</>}
              </h1>
              <p className="text-white/85 text-sm font-medium mt-2 text-right">
                {isRTL ? (
                  <>{brand.walletNameHe} משלם לך<br />בחזרה במותגים שכולנו אוהבים.</>
                ) : (
                  <>{brand.walletName} pays you back<br />at the brands we all love.</>
                )}
              </p>
            </div>
          </div>

          <img
            src="/wallet-in-hand.png"
            alt=""
            aria-hidden
            className="absolute -top-1 z-30 h-[420px] w-auto object-contain pointer-events-none"
            style={{ left: 140 }}
            draggable={false}
          />

          {/* Client logo with the Nexus mark beside it — top corner, where
              the About page has the Nexus wordmark alone. */}
          <div className="absolute z-40 flex items-center gap-3" style={{ top: 30, left: 20 }} dir="ltr">
            <img
              src={brand.logoDark}
              alt={isRTL ? brand.nameHe : brand.name}
              className="h-11 w-auto max-w-[130px] object-contain"
              draggable={false}
            />
            <span className="w-px h-7 bg-border" aria-hidden />
            <img src="/nexus-logo-black-trim.png" alt="Nexus" className="h-[18px] w-auto object-contain" draggable={false} />
          </div>

          <div className="absolute inset-x-0 mx-auto z-10" style={{ top: 556, width: 300 }}>
            <ExpenseCashbackGallery />
          </div>
        </section>

        {/* ── How it works — underline in the client's colour ── */}
        <Reveal>
          <section className="text-center px-6 mt-16 flex flex-col items-center">
            <h1 className="text-4xl font-extrabold mb-1 text-text-primary">
              {isRTL ? 'איך זה ' : 'How does it '}
              <span className="relative inline-block text-text-primary">
                {isRTL ? 'עובד?' : 'work?'}
                <div className="absolute bottom-1 inset-x-0 h-[3px] rounded-full" style={{ backgroundColor: brand.primary }} />
              </span>
            </h1>
            <p className="text-xl font-bold mb-2 text-text-primary">
              {isRTL ? 'הנה כמה מהדברים' : "Here's a taste of what"}
            </p>
            <p className="text-text-muted text-sm">
              {isRTL ? `שעובדי ${brand.nameHe} עושים עם הארנק` : `${brand.name} employees do with the wallet`}
            </p>
            <div className="my-8 text-text-muted/70">
              <ArrowDown size={22} strokeWidth={1.5} />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div ref={brandsRef} className="scroll-mt-24">
            <LovedBrandsGrid />
          </div>
        </Reveal>

        <Reveal>
          <AllBenefitsPhonePeek onCtaClick={handleCta} />
        </Reveal>

        {/* ── Joining gift — the About page's dark "free, and ₪150 waiting"
            card, with the real gift amount and threshold. Only with a gift. ── */}
        {joinGift && (
          <Reveal className="mt-10 relative">
            <div ref={giftRef} className="relative z-10 scroll-mt-24">
              <DarkPitchCard
                moreContent={
                  isRTL
                    ? `הארנק לא עולה לך שקל: אין דמי מנוי ואין עמלות. וכדי שתתחיל עם רוח גבית, ${nameHe} מעניקה לך ₪${joinGift.amount} מתנה כשתצבור ₪${joinGift.threshold} קאשבק בארנק תוך ${joinGift.days} יום.`
                    : `The wallet costs you nothing — no subscription, no fees. And to get you started, ${name} gives you a ₪${joinGift.amount} gift once you earn ₪${joinGift.threshold} cashback within ${joinGift.days} days.`
                }
              >
                <div className="relative h-[306px]">
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <img
                      src="/reward-coins.png"
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute object-contain"
                      style={{ width: 350, height: 350, right: -109, top: -18 }}
                      draggable={false}
                    />
                  </div>
                  <div className="absolute inset-y-0 end-0 max-w-[56%] flex items-center">
                    <h2 className="text-[32px] font-semibold leading-[1.12] tracking-tight text-end">
                      {isRTL ? (
                        <>
                          בחינם.
                          <br />
                          וגם ₪{joinGift.amount}
                          <br />
                          שמחכים לך
                        </>
                      ) : (
                        <>
                          Free.
                          <br />
                          Plus ₪{joinGift.amount}
                          <br />
                          already waiting
                        </>
                      )}
                    </h2>
                  </div>
                </div>
              </DarkPitchCard>
            </div>
            {/* Promo strip under the card — gift pill in the client's colour */}
            <div className="relative z-0 mx-5 -mt-8 pt-6 pb-3.5 px-6 bg-white rounded-b-3xl border border-t-0 border-border/60 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.28)] text-center text-sm font-medium text-text-primary">
              <span
                className="text-white px-2 py-0.5 rounded text-[11px] font-bold"
                style={{ marginInlineEnd: 6, backgroundColor: brand.primary }}
              >
                {isRTL ? `₪${joinGift.amount} מתנה` : `₪${joinGift.amount} gift`}
              </span>
              {isRTL ? `כשתצברו ₪${joinGift.threshold} קאשבק תוך ${joinGift.days} יום` : `once you earn ₪${joinGift.threshold} cashback within ${joinGift.days} days`}
            </div>
          </Reveal>
        )}

        {/* ── Gift cards — same card as the About page, client-tinted glow ── */}
        <Reveal>
          <section className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5">
            <header className="flex items-start gap-3">
              <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface shrink-0">
                <CreditCard size={24} strokeWidth={1.8} className="text-text-primary" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-text-primary leading-tight">
                  {isRTL ? 'מתנות מ' + brand.nameHe + ', ישר לארנק' : `Gifts from ${brand.name}, straight to your wallet`}
                </span>
                <span className="text-xs font-medium text-text-muted mt-1 leading-snug">
                  {isRTL
                    ? 'חגים, ימי הולדת ורגעי הוקרה — בלי שוברים שהולכים לאיבוד.'
                    : 'Holidays, birthdays and thank-yous — no lost vouchers.'}
                </span>
              </span>
            </header>
            <div className="relative overflow-hidden -mx-5 mt-3 mb-6">
              <div
                className="absolute inset-0 z-0"
                style={{
                  background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${brand.primary} 18%, transparent) 0%, rgba(255,255,255,0) 75%)`,
                }}
              />
              <div className="relative z-[1]">
                <GiftCardsCarousel height={340} showNotifications={false} />
              </div>
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
            </div>
          </section>
        </Reveal>

        {/* ── People wall — "everyone's already in, what about you?" ── */}
        <Reveal className="mt-10">
          <PeopleWall
            onCtaClick={handleCta}
            headline={
              isRTL ? (
                <>
                  עובדי {brand.nameHe} כבר בפנים.
                  <br />
                  מה איתך?
                </>
              ) : (
                <>
                  {brand.name} employees are already in.
                  <br />
                  What about you?
                </>
              )
            }
          />
        </Reveal>

        {/* ── Closing region — FAQ + footer over one rising-bubble field ── */}
        <div className="relative">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <RisingBubbles travel={1400} />
          </div>
          <Reveal className="relative z-10">
            <section className="px-6 pt-12">
              <AboutFaq items={tenantFaq(brand)} />
            </section>
          </Reveal>
          <div className="relative z-10 mt-48">
            <TenantFooter logo={brand.logoDark} nameHe={brand.nameHe} name={brand.name} isRTL={isRTL} />
          </div>
        </div>
      </main>

      {/* ── Claim celebration — the gift flow's reveal (balloons + confetti),
          then on to the balance ── */}
      {claiming && joinGift && (
        <div className="fixed inset-0 z-[140] mx-auto max-w-md overflow-hidden" style={{ background: '#f6f9fc' }} dir="rtl">
          <PremiumRevealContent
            autoReveal
            revealHoldMs={4200}
            title={isRTL ? `₪${joinGift.amount} מחכים לך` : `₪${joinGift.amount} waiting for you`}
            subtitle={isRTL ? `מתנת ההצטרפות מ${nameHe} נכנסה לארנק` : `Your joining gift from ${name} is in your wallet`}
            onReveal={() => {
              // Hold a beat on "loading to your wallet", then hand off.
              setLoadingGift(true);
              setTimeout(finishClaim, 1600);
            }}
          />
          {/* The gift card rises into the centre over the celebration —
              locked, with the amount where the wallet card shows it. */}
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center px-8 pointer-events-none">
            <div className="w-[300px] animate-gift-rise-center">
              {giftCardFace}
            </div>
            <p
              key={loadingGift ? 'loading' : 'claim'}
              className="mt-8 flex items-center justify-center gap-2 text-2xl font-extrabold text-white text-center animate-fade-in"
              style={{ animationDelay: loadingGift ? '0s' : '0.7s', animationFillMode: 'both', textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
            >
              {loadingGift && (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '22px', fontVariationSettings: "'wght' 300" }}>
                  progress_activity
                </span>
              )}
              {loadingGift
                ? isRTL ? 'טוענים את המתנה לארנק שלך' : 'Loading the gift to your wallet'
                : isRTL ? `נפתחת כשתצברו ₪${joinGift.threshold} קאשבק תוך ${joinGift.days} יום` : `Opens once you earn ₪${joinGift.threshold} cashback within ${joinGift.days} days`}
            </p>
          </div>
        </div>
      )}

      {/* ── Already claimed — honest and calm: no celebration, straight to
          the gift that's already waiting in the wallet ── */}
      {alreadyClaimed && joinGift && (
        <div className="fixed inset-0 z-[140] mx-auto max-w-md overflow-y-auto bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-center gap-3 pt-10" dir="ltr">
            <img src={logoDark} alt={isRTL ? nameHe : name} className="h-10 w-auto max-w-[120px] object-contain" draggable={false} />
            <span className="w-px h-6 bg-border" aria-hidden />
            <img src="/nexus-logo-black-trim.png" alt="Nexus" className="h-4 w-auto object-contain" draggable={false} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center">
            <div className="w-[260px]">{giftCardFace}</div>
            <h2 className="mt-8 text-2xl font-extrabold text-text-primary">
              {isRTL ? 'כבר משכת את מתנת ההצטרפות' : "You've already claimed your joining gift"}
            </h2>
            <p className="mt-2 text-[15px] text-text-secondary leading-relaxed max-w-[300px]">
              {isRTL
                ? 'מצטערים, אפשר למשוך את המתנה פעם אחת בלבד. אבל היא כבר מחכה לך בארנק.'
                : "Sorry, the gift can be claimed only once. But it's already waiting in your wallet."}
            </p>
            {giftLock && (
              <div className="mt-6 w-full max-w-[300px] text-start">
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-text-primary">
                    {isRTL
                      ? `צברת ₪${giftLock.progress} מתוך ₪${giftLock.threshold} קאשבק`
                      : `₪${giftLock.progress} of ₪${giftLock.threshold} cashback earned`}
                  </span>
                  <span className="font-semibold text-primary flex-shrink-0">{daysLeftLabel(daysUntil(giftLock.unlockBy), isRTL)}</span>
                </div>
                <div className="mt-2 h-2 rounded-[4px] bg-border/70 overflow-hidden">
                  <div className="h-full rounded-[4px] bg-primary" style={{ width: `${Math.min(100, (giftLock.progress / giftLock.threshold) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="px-6 pb-8 space-y-3">
            <button
              onClick={() => navigate(`/${lang}/wallet/balance?tab=subBalances`)}
              className="w-full bg-bg-dark text-white font-bold text-lg py-4 rounded-full shadow-lg active:scale-[0.98] transition-transform"
            >
              {isRTL ? 'למתנה שלי בארנק' : 'Go to my gift'}
            </button>
            <button
              onClick={() => setAlreadyClaimed(false)}
              className="w-full py-2 text-sm font-semibold text-text-secondary"
            >
              {isRTL ? 'חזרה' : 'Back'}
            </button>
          </div>
        </div>
      )}

      {/* ── Fixed bottom CTA — the About page's dark button ── */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto w-full bg-white/30 backdrop-blur-sm px-4 pt-4 pb-6 z-50">
        <button
          onClick={handleCta}
          className="w-full bg-bg-dark text-white font-bold text-lg py-4 rounded-full shadow-lg active:scale-[0.98] transition-transform"
        >
          {joinGift
            ? isRTL ? 'למשיכת המתנה לארנק' : 'Claim the gift to your wallet'
            : isRTL ? 'כניסה לארנק' : 'Open the wallet'}
        </button>
        <div className="text-center mt-2 text-[11px] text-text-muted flex justify-center items-center gap-1">
          <span>{isRTL ? 'ללא עלות' : 'No cost'}</span>
          <span className="text-border">•</span>
          <span>{isRTL ? 'התקנה מיידית' : 'Instant setup'}</span>
        </div>
      </div>
    </div>
  );
}
