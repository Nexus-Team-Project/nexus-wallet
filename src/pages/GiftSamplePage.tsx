import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumRevealContent } from './PremiumRevealPage';
import VoucherCard from '../components/wallet/VoucherCard';
import { mockUserVouchers } from '../mock/data/vouchers.mock';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

/**
 * GiftSamplePage — a standalone, ready-made gift page (no form / no checkout).
 *
 * It reuses the recipient *preview* structure from GiftDetailsPage (the flip
 * card → reveal → gift), rebuilt as a self-contained, shareable page. The
 * concrete gift is chosen by the active tenant (`?tenant=`):
 *   • default        → a Passover ("פסח") gift from בני עקיבא
 *   • ?tenant=spar   → a SPAR supermarket gift card
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

const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

interface GiftVariant {
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
}

const RECIPIENT = 'רז';

const VARIANTS: Record<string, GiftVariant> = {
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
    redeemLine: 'ממשו בעשרות רשתות',
  },
};

export default function GiftSamplePage() {
  const navigate = useNavigate();
  const tenantId = useTenantStore((s) => s.tenantId);
  const [revealed, setRevealed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const variant = (tenantId && VARIANTS[tenantId]) || VARIANTS.default;
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
                  {/* Soft scrim — keeps the white logo/title legible over the
                      lighter end of the gradient. */}
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

                  {/* The gift illustration (transparent). */}
                  <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
                    <img
                      src={variant.heroImage}
                      alt=""
                      aria-hidden
                      className={`${variant.heroMaxW} max-h-full object-contain drop-shadow-xl rounded-xl`}
                    />
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
                        onClick={() => setRevealed(true)}
                        className="w-full bg-bg-dark text-white py-4 px-6 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
                      >
                        גלה את המתנה
                      </button>
                      {/* Nexus wordmark — the platform mark, below the button. */}
                      <img src={NEXUS_WIDE_WHITE} alt="Nexus" className="h-9 w-auto" />
                    </div>
                  </div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Gift (below): the gift card, in the wallet's voucher style. ── */}
          {revealed && (
            <section className="mt-8 animate-fade-in">
              <h3 className="text-xl font-bold text-text-primary mb-4 text-start">המתנה שלך</h3>
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
            למימוש המתנה
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
            onReveal={finishRedeem}
          />
          {/* The gift card rises into the centre of the screen, with the line
              printed beneath it, over the celebration. */}
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center px-8 pointer-events-none">
            <div className="w-[300px] animate-gift-rise-center">
              <VoucherCard userVoucher={userVoucher} flipped={false} onExpire={() => {}} />
            </div>
            <p
              className="mt-8 text-2xl font-extrabold text-white text-center animate-fade-in"
              style={{ animationDelay: '0.7s', animationFillMode: 'both', textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
            >
              {variant.redeemLine}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
