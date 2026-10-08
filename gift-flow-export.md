# תהליך קבלת מתנה — Nexus Wallet
### כל הקוד של הפלואו, כולל הכרטיסייה שמציצה מתחתית המסך

נוצר: 2026-08-17 · ענף: `raz` · commit בסיס: `b40dfa5`

---

## 0. הוכחה שהדברים באמת קיימים

**א. הכרטיסייה שמציצה מתחתית המסך** — `src/components/wallet/GiftClaimTeaser.tsx`
מיוצרת ב-`document.body` דרך `createPortal`, ממוקמת `fixed` עם `bottom` שלילי כך
שרק 250px מתוך כרטיס בגובה 480px נראים, ב-`z-[60]` (מעל ה-pill nav ב-z-50):

```
GiftClaimTeaser.tsx:52   const CARD_HEIGHT = 480;
GiftClaimTeaser.tsx:53   const PEEK_HEIGHT = 250;
GiftClaimTeaser.tsx:54   const REST_BOTTOM = -(CARD_HEIGHT - PEEK_HEIGHT);   // -230px
GiftClaimTeaser.tsx:96   return createPortal(
GiftClaimTeaser.tsx:109  className="fixed inset-x-0 z-[60] ... px-5"
GiftClaimTeaser.tsx:110  style={{ bottom: REST_BOTTOM }}
GiftClaimTeaser.tsx:118  drag="y"
```

**ב. היא באמת מורנדרת במסך הארנק** — `src/pages/WalletPage.tsx:2222`

```
WalletPage.tsx:18     import GiftClaimTeaser from '../components/wallet/GiftClaimTeaser';
WalletPage.tsx:2222   {!cameFromGift && <GiftClaimTeaser />}
```

**ג. הפלואו המלא רשום כ-route** — `src/router/index.tsx:196`

```
router/index.tsx:45    const GiftSamplePage = lazy(() => import('../pages/GiftSamplePage'));
router/index.tsx:196   { path: 'gift-sample', element: <S><GiftSamplePage /></S> },
```

**ד. בדיקה חיה על dev server (vite 7.3.1, port 8081)** — כל המסלולים והמודולים
נטענים ומתקמפלים:

```
/he/gift-sample?tenant=isrotel                       200
/he/gift-sample?tenant=spar                          200
/he/wallet                                           200
/he/auth-flow?goto=isrotel-wallet-teaser             200
/src/components/wallet/GiftClaimTeaser.tsx           200
/src/pages/GiftSamplePage.tsx                        200
/src/components/wallet/GiftCoverCard.tsx             200
```

וה-`grep` על המודול **אחרי הטרנספורם של vite** מוכיח שהקבועים באמת מגיעים לדפדפן:

```
11:  const CARD_HEIGHT = 480;
12:  const PEEK_HEIGHT = 250;
13:  const REST_BOTTOM = -(CARD_HEIGHT - PEEK_HEIGHT);
51:  return createPortal(
66:  className: `fixed inset-x-0 z-[60] flex justify-center pointer-events-none px-5 ...`
67:  style: { bottom: REST_BOTTOM },
74:  drag: "y",
```

**ה. `npx tsc --noEmit` עובר ללא שגיאות.**

---

## 1. מפת הפלואו

```
שתי נקודות כניסה
├── (א) לינק ב-SMS/מייל  →  /he/gift-sample?tenant=<spar|isrotel|menora>
└── (ב) המשתמש כבר מחובר בארנק  →  GiftClaimTeaser
        כרטיסייה מציצה מתחתית המסך (250 מתוך 480 px, מעל ה-nav)
        גרירה למעלה / הקשה  →  transitionCurtainStore.cover()  →  אותו route
                                    ↓
GiftSamplePage — כיסוי המתנה (GiftCoverCard: לוגו + איור + כותרת + CTA)
                                    ↓  setRevealed(true)  ·  flip 3D ב-rotateY
המכתב מהשולח (letter, רקע כהה)  |  או פאנל תביעה (claim mode — מנורה)
                                    ↓
כרטיס המתנה מתחתיו (VoucherCard — בדיוק אותו קומפוננטה כמו בארנק)
                                    ↓  startRedeem()  ·  "למימוש המתנה"
חגיגת מימוש (PremiumRevealContent, autoReveal, revealHoldMs=4200)
   הכרטיס עולה למרכז המסך  +  שורת טקסט תחתיו
                                    ↓  loadsToBalance? המתנה של 1.6 שניות
   swap ל-BalanceCard שסופר מעלה לפי שווי המתנה (loadShowsBalance)
                                    ↓  finishRedeem()
login() אם צריך  ·  localStorage[giftClaimedKey(tenant)] = '1'  ·  toast התראה
                                    ↓
navigate(`/he/wallet?focus=<redeemVoucherId>`)
   → הארנק במצב gift נעול: רק כרטיס המתנה בחפיסה, ווידג'טים מכווצים,
     סרגלים לא-אינטראקטיביים  (cameFromGift ב-WalletPage)
```

### קבצים לפי תפקיד

| קובץ | תפקיד |
|---|---|
| `src/components/wallet/GiftClaimTeaser.tsx` | **הכרטיסייה בתחתית המסך** — portal, drag, dismiss, פתיחה |
| `src/pages/GiftSamplePage.tsx` | הדף המלא: `GIFT_VARIANTS`, flip, מכתב, כרטיס, חגיגת מימוש |
| `src/components/wallet/GiftCoverCard.tsx` | תוכן הכיסוי — משותף לדף ולכרטיסייה (אותו כרטיס בדיוק) |
| `src/stores/transitionCurtainStore.ts` | וילון לבן שמחזיק מעבר בין routes |
| `src/pages/PremiumRevealPage.tsx` | `PremiumRevealContent` — חגיגת המימוש |
| `src/pages/WalletPage.tsx` | רנדור הכרטיסייה + מצב `?focus=` הנעול + `GIFT_DEMOS` |
| `src/mock/data/vouchers.mock.ts` | כרטיסי המתנה שהפלואו ממש לתוכם |
| `src/router/index.tsx` | רישום ה-route |
| `src/pages/auth-flow/FlowTestPage.tsx` | לינק בדיקה שמעמיד את המצב שבו הכרטיסייה מופיעה |

---

---

## 2. הכרטיסייה שמציצה מתחתית המסך (המלאה)

`src/components/wallet/GiftClaimTeaser.tsx`

```tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, animate, AnimatePresence, useMotionValue, type PanInfo } from 'framer-motion';
import { GIFT_VARIANTS, giftClaimedKey } from '../../pages/GiftSamplePage';
import { useTransitionCurtainStore } from '../../stores/transitionCurtainStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * GiftClaimTeaser — the "already signed in, haven't claimed the gift yet"
 * entry point into the SPAR gift-sample flow (GiftSamplePage.tsx).
 *
 * The email/SMS entry point drops a recipient straight onto /gift-sample;
 * this one is for a recipient who is already living inside the wallet. A
 * card peeks up from the bottom of the screen, in front of the floating
 * pill nav — logo on top, the headline snug beneath it, the hero
 * illustration floating in below that, cut off by the fold. It reuses the
 * same `variant` data (gradient, logo, title, image, fonts) GiftSamplePage's
 * own cover uses — same ingredients, same classes copied verbatim per piece
 * — just arranged for a short peek instead of the full-page layout, where
 * the headline sits near the BOTTOM of a much taller card and would be
 * off-screen here.
 *
 * Dragging up past the threshold (or tapping) opens the exact same route —
 * `useTransitionCurtainStore.cover()` drops a white curtain first so the
 * hand-off reads as a transition rather than an instant cut, then the new
 * route reveals under it (TransitionCurtain, already mounted globally in
 * AppLayout — the same mechanism reserved for other cross-route reveals).
 * Everything past that point (flip → letter → card → redeem) is identical
 * to the SMS flow.
 *
 * Portaled to <body>: WalletPage renders inside AppLayout's
 * `<main className="relative z-10">`, which caps this whole subtree at that
 * stacking level in the outer layout — no z-index in here could ever beat
 * the floating pill nav (a `<main>` sibling at z-50) without first escaping
 * that containing stacking context.
 *
 * The rest position is plain CSS (the outer wrapper sits with a negative
 * `bottom`); a `useMotionValue` `y` layers ONLY the drag offset on top of
 * it — mixing `drag` with a declarative `animate` target on the same value
 * fights the gesture, so springing back to rest is done imperatively.
 * Dismissing flips React state immediately and lets AnimatePresence's
 * `exit` play the slide-away cosmetically, rather than waiting on that
 * animation's completion to actually remove the card.
 *
 * Dismissing (drag down / the corner ✕) only hides it for this mount — it
 * comes back next visit. Only completing the claim (GiftSamplePage's
 * finishRedeem, via giftClaimedKey(tenant)) makes it gone for good.
 */

const CARD_HEIGHT = 480;
const PEEK_HEIGHT = 250;
const REST_BOTTOM = -(CARD_HEIGHT - PEEK_HEIGHT);
const OPEN_OFFSET = -60;
const OPEN_VELOCITY = -500;
const DISMISS_OFFSET = 70;
const DISMISS_VELOCITY = 500;
const SPRING = { type: 'spring' as const, damping: 26, stiffness: 300 };

export default function GiftClaimTeaser() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { direction, isRTL } = useLanguage();
  const tenantId = useTenantStore((s) => s.tenantId);
  const [dismissed, setDismissed] = useState(false);
  const y = useMotionValue(0);

  // Any tenant whose gift is an employer-wallet load (SPAR / Isrotel) gets the
  // teaser. Claim-mode variants (e.g. Menora) are excluded — they have no hero
  // illustration and their entry point isn't the wallet.
  const variant = (tenantId && GIFT_VARIANTS[tenantId]?.loadsToBalance) ? GIFT_VARIANTS[tenantId] : null;
  const claimed = (() => {
    try { return !!tenantId && localStorage.getItem(giftClaimedKey(tenantId)) === '1'; } catch { return false; }
  })();

  if (!variant || claimed) return null;

  const open = () => {
    useTransitionCurtainStore.getState().cover();
    navigate(`/${lang}/gift-sample?tenant=${tenantId}`);
  };
  const dismiss = () => setDismissed(true);
  const springHome = () => animate(y, 0, SPRING);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y < OPEN_OFFSET || info.velocity.y < OPEN_VELOCITY) {
      open();
    } else if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      dismiss();
    } else {
      springHome();
    }
  };

  return createPortal(
    // Same page gutter as GiftSamplePage's own `px-5` — clear of the screen
    // edges, not flush against them. z-[60]: above the pill nav (z-50) and
    // its white fade backdrop (z-40).
    //
    // dir + font-hebrew are set explicitly here because a portal only
    // carries React context out to <body> — it does NOT carry the DOM
    // attributes from LanguageProvider's own wrapping
    // `<div dir={direction} className="font-hebrew">`. Without this, the
    // teaser silently fell back to the browser's default direction and
    // font-sans instead of Rubik, which is what actually looked "off" here.
    <div
      dir={direction}
      className={`fixed inset-x-0 z-[60] flex justify-center pointer-events-none px-5 ${isRTL ? 'font-hebrew' : 'font-sans'}`}
      style={{ bottom: REST_BOTTOM }}
    >
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            className="w-full max-w-[400px] pointer-events-auto"
            style={{ height: CARD_HEIGHT, y }}
            exit={{ y: CARD_HEIGHT + 80, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }}
            drag="y"
            dragConstraints={{ top: REST_BOTTOM, bottom: DISMISS_OFFSET + 40 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={open}
              className="relative w-full h-full rounded-2xl flex flex-col items-center pt-5 px-7 pb-7 overflow-hidden text-start"
              style={{
                background: variant.gradient,
                color: '#ffffff',
                boxShadow: '0 -16px 32px -14px rgba(14,44,84,0.4)',
              }}
            >
              {/* Scrim — mirrors the full cover, keeps the white logo/title legible. */}
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(10,37,64,0.3) 0%, rgba(10,37,64,0.08) 55%, rgba(10,37,64,0.05) 100%)',
                }}
              />

              {/* Dismiss — literal top-left corner (not RTL-flipped). */}
              <span
                role="button"
                aria-label={lang === 'he' ? 'סגור' : 'Dismiss'}
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-rounded text-white" style={{ fontSize: 18 }}>
                  close
                </span>
              </span>

              {/* Logo — same asset + sizing class as the real cover. */}
              <img
                src={variant.logo}
                alt={variant.sender}
                className={`relative z-10 ${variant.logoClass} object-contain drop-shadow-lg`}
                style={variant.logoWhite ? { filter: 'brightness(0) invert(1)' } : undefined}
              />

              {/* Headline — same title text + styling as the real cover
                  (text-2xl font-extrabold), snug beneath the logo here
                  instead of near the card's bottom. */}
              <h2
                className="relative z-10 mt-2 w-full text-2xl font-extrabold text-center leading-tight"
                style={{ textShadow: '0 1px 14px rgba(10,37,64,0.5)' }}
              >
                {variant.coverTitle}
              </h2>

              {/* Hero illustration — same asset + sizing class as the real
                  cover, floats in below the headline and is cut off by the
                  fold partway down. Minimal top margin — pulled up snug
                  against the headline rather than pushed down the card. */}
              <div className="relative z-10 flex-1 min-h-0 w-full flex items-start justify-center animate-gift-float mt-1">
                <img
                  src={variant.heroImage}
                  alt=""
                  aria-hidden
                  className={`${variant.heroMaxW} max-h-full object-contain drop-shadow-xl rounded-xl`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
```

---

## 3. דף המתנה — כל הפלואו

`src/pages/GiftSamplePage.tsx`

```tsx
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
    loadShowsBalance: true,
    loadCaption: 'אנחנו טוענים את כרטיס המתנה ליתרה שלך',
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
```

---

## 4. תוכן הכיסוי המשותף

`src/components/wallet/GiftCoverCard.tsx`

```tsx
import type { GiftVariant } from '../../pages/GiftSamplePage';

const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

/**
 * GiftCoverCard — the sender logo / hero illustration / headline / CTA
 * content of the gift cover, extracted out of GiftSamplePage so the
 * wallet-home teaser (GiftClaimTeaser) can peek the EXACT same card rather
 * than a redesigned lookalike. Callers own the outer sizing, background,
 * shadow and (in GiftSamplePage's case) the flip animation — this component
 * is just what sits inside that box.
 */
export default function GiftCoverCard({
  variant,
  onOpen,
}: {
  variant: GiftVariant;
  onOpen: () => void;
}) {
  return (
    <>
      {/* Soft scrim — keeps the white logo/title legible over the lighter
          end of the gradient. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,37,64,0.28) 0%, rgba(10,37,64,0.05) 35%, rgba(10,37,64,0.18) 75%, rgba(10,37,64,0.4) 100%)',
        }}
      />

      {/* Sender logo — rendered white over the wash. */}
      <img
        src={variant.logo}
        alt={variant.sender}
        className={`relative z-10 ${variant.logoClass} object-contain drop-shadow-lg`}
        style={variant.logoWhite ? { filter: 'brightness(0) invert(1)' } : undefined}
      />

      {/* Hero — a claim variant shows an approval badge; a gift variant
          shows its transparent illustration. */}
      <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
        {variant.claim ? (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 132,
              height: 132,
              background: 'rgba(255,255,255,0.14)',
              boxShadow: '0 0 0 14px rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="material-symbols-rounded text-white"
              style={{ fontSize: 76, fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>
        ) : (
          <img
            src={variant.heroImage}
            alt=""
            aria-hidden
            className={`${variant.heroMaxW} max-h-full object-contain drop-shadow-xl rounded-xl`}
          />
        )}
      </div>

      <div className="relative z-10 w-full space-y-4">
        <h2
          className="text-2xl font-extrabold text-center leading-tight"
          style={{ textShadow: '0 1px 14px rgba(10,37,64,0.5)' }}
        >
          {variant.coverTitle}
        </h2>
        {variant.coverSubtitle && (
          <p
            className="text-center text-sm font-semibold leading-relaxed text-white/90"
            style={{ textShadow: '0 1px 10px rgba(10,37,64,0.45)' }}
          >
            {variant.coverSubtitle}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpen}
            className="w-full bg-bg-dark text-white py-4 px-6 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
          >
            {variant.coverCta ?? 'גלה את המתנה'}
          </button>
          {/* Nexus wordmark — the platform mark, below the button. */}
          <img src={NEXUS_WIDE_WHITE} alt="Nexus" className="h-9 w-auto" />
        </div>
      </div>
    </>
  );
}
```

---

## 5. וילון המעבר בין ה-routes

`src/stores/transitionCurtainStore.ts`

```tsx
import { create } from 'zustand';

// Drives a full-screen white "curtain" that survives a route change so a page
// can hand off a leaving animation to the incoming page. Phases:
//   idle   — not shown
//   cover  — solid white over everything (hand-off point between routes)
//   reveal — white recedes from the bottom up, uncovering the new route
export type CurtainPhase = 'idle' | 'cover' | 'reveal';

interface TransitionCurtainState {
  phase: CurtainPhase;
  /** Drop the white curtain over the whole screen (call right before navigating). */
  cover: () => void;
  setPhase: (phase: CurtainPhase) => void;
}

export const useTransitionCurtainStore = create<TransitionCurtainState>((set) => ({
  phase: 'idle',
  cover: () => set({ phase: 'cover' }),
  setPhase: (phase) => set({ phase }),
}));
```

---

## 6. חגיגת המימוש — חתימת PremiumRevealContent

`src/pages/PremiumRevealPage.tsx` — שורות 55,120

```tsx
  drift: number
}

/**
 * Premium Reveal content — embeddable in StoriesPage or standalone.
 */
export function PremiumRevealContent({
  onReveal,
  autoReveal = false,
  revealHoldMs = 7000,
  title,
  subtitle,
}: {
  onReveal?: () => void
  /** Skip the drag interaction and fire the reveal celebration on mount. */
  autoReveal?: boolean
  /** How long to hold the celebration before calling onReveal / navigating. */
  revealHoldMs?: number
  /** Override the headline — used to reveal a launch gift instead of "all set". */
  title?: string
  /** Override the sub-headline. */
  subtitle?: string
}) {
  const { lang = "he" } = useParams()
  const navigate = useNavigate()

  const [pillHeight, setPillHeight] = useState(PILL_MIN)
  const [isDragging, setIsDragging] = useState(false)
  // In autoReveal mode start already-revealed, so the dark drag track/cap never
  // flashes (the black bar) before the mount effect fires.
  const [revealed, setRevealed] = useState(autoReveal)
  const [showFlash, setShowFlash] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [viewH, setViewH] = useState(800)

  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const bubbleIdRef = useRef(0)

  useEffect(() => {
    const updateH = () => {
      if (containerRef.current) {
        setViewH(containerRef.current.clientHeight)
      } else {
        setViewH(window.innerHeight)
      }
    }
    updateH()
    window.addEventListener("resize", updateH)
    return () => window.removeEventListener("resize", updateH)
  }, [])

  // Spawn rising bubbles after reveal
  useEffect(() => {
    if (!revealed) return

    // Initial batch with staggered delays
    const initial: Bubble[] = BRANDS.map((brand, i) => ({
      id: bubbleIdRef.current++,
      brand,
      left: Math.random() * 70 + 15,
      size: Math.random() * 30 + 65,
      duration: Math.random() * 3 + 5,
      delay: i * 0.25,
```

---

## 6ב. autoReveal + revealHoldMs → onReveal

`src/pages/PremiumRevealPage.tsx` — שורות 215,250

```tsx
          id: i,
          vx: (Math.random() - 0.5) * 14,
          vy: -(Math.random() * 10 + 4),
          size: 3 + Math.random() * 5,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        })),
      )
    }, 150)

    if (navigator.vibrate) navigator.vibrate([20, 40, 20])

    setTimeout(() => {
      if (onReveal) {
        onReveal()
      } else {
        navigate(`/${lang}`)
      }
    }, revealHoldMs)
  }, [lang, navigate, onReveal, revealHoldMs])

  // Opt-in: fire the reveal celebration automatically on mount (no drag).
  const didAutoReveal = useRef(false)
  useEffect(() => {
    if (autoReveal && !didAutoReveal.current) {
      didAutoReveal.current = true
      triggerReveal()
    }
  }, [autoReveal, triggerReveal])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      dir="rtl"
      style={{
        touchAction: "none",
```

---

## 7. WalletPage — מזהי כרטיסי המתנה ו-GIFT_DEMOS

`src/pages/WalletPage.tsx` — שורות 40,90

```tsx
// The Bnei Akiva gift voucher (added to the wallet mock); arriving from the
// gift-sample redeem deep-links here with `?focus=` set to this id.
const BNEI_VOUCHER_ID = 'uv_bnei_pesach';
// The SPAR gift voucher — its redeemed wallet view also shows the Isracard
// digital card beside the gift card in the deck.
const SPAR_VOUCHER_ID = 'uv_spar_gift';
// The Isrotel employee-wallet gift voucher — same treatment as SPAR.
const ISROTEL_VOUCHER_ID = 'uv_isrotel_gift';
// Employer-wallet gift cards drive the full wallet demo: flipping the card
// offers "המחשת תשלום" (simulate payment) → the card reads as spent → archiving
// it slides the deck to the Nexus balance card, counting up the cashback that
// payment earned. Keyed by the user-voucher the gift redeems into.
const GIFT_DEMOS: Record<
  string,
  {
    amount: number;
    cashback: number;
    /** Merchant printed on the payment confirmation. */
    merchant: string;
    merchantHe: string;
    /** Merchant logo on the confirmation screen. */
    icon: string;
    /** Co-brand logo carried by the Isracard digital card in the deck. */
    cardLogo: string;
    /** Where that co-brand logo sits on the card artwork. */
    cardLogoPlacement?: 'corner' | 'center';
    /** Keep the "+" (create a deal) stop in the focused gift deck, so the
     *  recipient can walk straight into the normal card-creation flow. */
    showAddStop?: boolean;
  }
> = {
  [SPAR_VOUCHER_ID]: {
    amount: 150, cashback: 15,
    merchant: 'SPAR', merchantHe: 'SPAR',
    icon: '/tenants/spar-official.svg', cardLogo: '/tenants/spar-logo-black.png',
  },
  [ISROTEL_VOUCHER_ID]: {
    amount: 250, cashback: 25,
    merchant: 'Isrotel', merchantHe: 'ישרוטל',
    icon: '/brands/isrotel.png',
    // Isrotel's wordmark sits black, centred on the card — the way it does on
    // their own card artwork.
    cardLogo: '/tenants/isrotel-logo-black.png', cardLogoPlacement: 'center',
    showAddStop: true,
  },
};
// The Menora claim voucher — an insurance payout on a virtual card. Its
// redeemed wallet view flips to a "simulate payment" button (immediate use at
// an approved provider); after paying, the card shows the remaining balance.
const MENORA_VOUCHER_ID = 'uv_menora_claim';

```

---

## 7ב. WalletPage — פענוח ה-deep-link ?focus=

`src/pages/WalletPage.tsx` — שורות 122,140

```tsx
  const widgetsDragControls = useDragControls();

  // Deep-link: arriving with `?focus=<userVoucherId>` (from redeeming a gift)
  // puts the wallet into a focused, LOCKED "gift" view — only the gift card in
  // the deck, widgets collapsed, and toolbars / cashback non-interactive.
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const focusVoucherId = searchParams.get('focus');
  const cameFromGift = !!focusVoucherId;
  // The employer-wallet gift demo (SPAR / Isrotel) this focused view plays, if
  // the focused card is one of them.
  const giftDemo = cameFromGift ? GIFT_DEMOS[focusVoucherId!] : undefined;
  // Menora claim flow — drives the rebranded "balance intro" (Menora balance,
  // not Nexus balance) opened from the card's "?" → "Learn more".
  const isMenoraFlow = cameFromGift && focusVoucherId === MENORA_VOUCHER_ID;
  // Content for the balance-intro overlay. Same layout + images everywhere;
  // only the copy differs — Menora-branded in the Menora flow, the standard
  // Nexus-balance strings otherwise.
  const balanceIntro = isMenoraFlow
```

---

## 7ג. WalletPage — חפיסת הכרטיסים במצב מתנה

`src/pages/WalletPage.tsx` — שורות 286,300

```tsx
  // it — same position as in the normal wallet, so it peeks in beside the gift
  // card instead of hiding two swipes away.
  const giftAddStop = giftDemo?.showAddStop ? ['plus'] : [];
  const deckCards: string[] = cameFromGift
    ? giftDemo
      ? // Once the gift card is "used", the Nexus balance card joins the deck so
        // the deck can slide across to it (counting up the cashback). Archiving
        // then drops the spent gift card out of the deck entirely.
        giftArchived
        ? [...giftAddStop, 'balance', 'card']
        : giftUsed
          ? [...giftAddStop, `voucher:${focusVoucherId}`, 'balance', 'card']
          : [...giftAddStop, `voucher:${focusVoucherId}`, 'card']
      : [`voucher:${focusVoucherId}`]
    : [
```

---

## 7ד. WalletPage — רנדור הכרטיסייה

`src/pages/WalletPage.tsx` — שורות 2216,2224

```tsx
          </footer>
        </div>
      )}

      {/* "Landed already signed-in, haven't claimed the gift yet" entry point
          into the SPAR gift-sample flow — suppressed once inside that flow. */}
      {!cameFromGift && <GiftClaimTeaser />}
    </div>
  );
```

---

## 8. כרטיסי המתנה (mock) שהפלואו ממש לתוכם

`src/mock/data/vouchers.mock.ts` — שורות 356,392

```tsx
  },
  {
    // Bnei Akiva Passover gift — the card the gift-sample page redeems into.
    // Purchased "today", so it sorts last among the active vouchers (it sits
    // right beside the balance card in the deck).
    id: 'uv_bnei_pesach', voucherId: 'v_bnei_pesach',
    voucher: mockVouchers.find((v) => v.id === 'v_bnei_pesach')!,
    purchasedAt: '2026-06-10T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z',
    status: 'active', redemptionCode: 'NXS-BNA-2649',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-BNA-2649',
  },
  {
    // SPAR gift — the card the gift-sample page redeems into for ?tenant=spar.
    id: 'uv_spar_gift', voucherId: 'v_spar_gift',
    voucher: mockVouchers.find((v) => v.id === 'v_spar_gift')!,
    purchasedAt: '2026-06-12T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z',
    status: 'active', redemptionCode: 'NXS-SPR-7140',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-SPR-7140',
  },
  {
    // Isrotel employee-wallet gift — the card the gift-sample page redeems
    // into for ?tenant=isrotel.
    id: 'uv_isrotel_gift', voucherId: 'v_isrotel_gift',
    voucher: mockVouchers.find((v) => v.id === 'v_isrotel_gift')!,
    purchasedAt: '2026-06-20T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z',
    status: 'active', redemptionCode: 'NXS-ISR-3082',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-ISR-3082',
  },
  {
    // Menora claim payout — the card the gift-sample page redeems into for
    // ?tenant=menora.
    id: 'uv_menora_claim', voucherId: 'v_menora_claim',
    voucher: mockVouchers.find((v) => v.id === 'v_menora_claim')!,
    purchasedAt: '2026-06-30T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z',
    status: 'active', redemptionCode: 'NXS-MNR-4821',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-MNR-4821',
  },
```

---

## 9. רישום ה-route

`src/router/index.tsx` — שורות 190,200

```tsx
          { path: 'wallet/voucher/:voucherId', element: <S><VoucherDetailPage /></S> },
          { path: 'notifications',             element: <S><NotificationsPage /></S> },
          { path: 'orders',                    element: <S><OrdersPage /></S> },
          { path: 'orders/track',              element: <S><OrderTrackingPage /></S> },
          { path: 'orders/track/live',         element: <S><OrderTrackingLivePage /></S> },
          // Standalone ready-made gift page (Bnei Akiva — Passover)
          { path: 'gift-sample',               element: <S><GiftSamplePage /></S> },
          { path: 'about',                     element: <S><AboutWalletPage /></S> },

          // === PROTECTED routes ===
          {
```

---

## 10. לינק בדיקה — מעמיד את המצב שבו הכרטיסייה מופיעה

`src/pages/auth-flow/FlowTestPage.tsx` — שורות 276,298

```tsx

  // ─── One-link deep test: ?goto=<tenant>-wallet-teaser ─────────────────
  // Lands an authenticated, no-org, un-claimed-gift user straight on the
  // wallet with that tenant active — exactly the state GiftClaimTeaser needs
  // to render. Skips the manual "click a button, then navigate" dance.
  useEffect(() => {
    const goto = searchParams.get('goto');
    const tenantId = goto?.endsWith('-wallet-teaser') ? goto.slice(0, -'-wallet-teaser'.length) : null;
    const tenant = tenantId ? mockTenants[tenantId] : undefined;
    if (!tenantId || !tenant) return;
    reset();
    setTenant(tenant.id, tenant);
    login({
      token: `mock-token-${tenantId}-teaser`,
      userId: `user-${tenantId}-teaser`,
      method: 'phone',
      isOrgMember: false,
    });
    useAuthStore.getState().setProfileCompleted(true);
    try { localStorage.removeItem(giftClaimedKey(tenantId)); } catch { /* private mode */ }
    setTimeout(() => navigate(`/${lang}/wallet?tenant=${tenantId}`), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
```

---

## 11. נכסים גרפיים שהפלואו צורך

```
public/tenants/spar-official.svg          לוגו SPAR (הופך ללבן ב-filter)
public/tenants/isrotel-logo.png           wordmark ישרוטל (הופך ללבן)
public/tenants/isrotel-logo-black.png     wordmark שחור על הכרטיס בחפיסה
public/tenants/menora-logo.svg            לוגו מנורה (כבר לבן)
public/bnei-akiva-logo.png                לוגו בני עקיבא
public/gift-cards/rosh-hashana.png        איור המתנה של SPAR
public/gift-cards/birthday-3d.png         איור יום ההולדת של ישרוטל
public/gift-cards/pesach.png              איור פסח (ברירת מחדל)
public/nexus-white-wide-logo.png          wordmark נקסוס מתחת ל-CTA
public/nexus-icon.png                     אייקון השולח ב-toast
```

## 12. איך מריצים

```bash
npm run dev
```

- **פלואו מלא מהלינק:** `http://localhost:8080/he/gift-sample?tenant=isrotel`
  (או `spar` / `menora` / בלי פרמטר לברירת המחדל)
- **הכרטיסייה מתחתית המסך:** `http://localhost:8080/he/auth-flow?goto=isrotel-wallet-teaser`
  — מחבר משתמש, מפעיל את הטננט, מנקה את דגל ה-claimed ומנחית ישר על הארנק.
- **איפוס** אחרי שהמתנה נתבעה: `localStorage.removeItem('nexus_gift_claimed_isrotel')`

## 13. שני דגלים שקובעים התנהגות

| דגל ב-`GIFT_VARIANTS` | מה הוא עושה |
|---|---|
| `loadsToBalance` | המתנה נטענת לארנק העובדים → הכרטיסייה בתחתית המסך מופיעה **רק** לטננטים כאלה (`GiftClaimTeaser.tsx:72`), והחגיגה עוצרת ביט על כיתוב טעינה |
| `loadShowsBalance` | במהלך אותו ביט הכרטיס מתחלף ב-`BalanceCard` שסופר מעלה. כבוי אצל ישרוטל — שם יתרת נקסוס לא מוצגת ולא נקראת בשמה |
| `claim` | מצב תביעת ביטוח (מנורה): ה-flip חושף פאנל פרטי תביעה במקום מכתב, והכיסוי מציג תג אישור במקום איור |
