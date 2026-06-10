import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PremiumRevealContent } from './PremiumRevealPage';
import VoucherCard from '../components/wallet/VoucherCard';
import { mockUserVouchers } from '../mock/data/vouchers.mock';
import { useAuthStore } from '../stores/authStore';

/**
 * GiftSamplePage — a standalone, ready-made gift page (no form / no checkout).
 *
 * It reuses the recipient *preview* structure from GiftDetailsPage (the flip
 * card → reveal → gift), but rebuilt as a self-contained, shareable page for a
 * specific occasion: a Passover ("פסח") gift from בני עקיבא.
 *
 * Flow: open the greeting (flip card → the מזכ"ל's full letter, dark preview
 * design) → below it a Bnei Akiva gift card (wallet voucher style) → "למימוש
 * המתנה" plays a balloon/confetti celebration while the card lifts away, then
 * lands the user on the wallet with that card centred in the deck.
 *
 * The route is registered as a `isFullScreenForm` page in AppLayout, so it
 * inherits the app's phone-width frame (max-w-md, centred) with no bottom nav.
 */

// The app's signature home-page gradient — the same wash used behind the home
// screen and the original gift preview. Used here for the page glow + cover.
const HOME_GRADIENT =
  'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)';

const BNEI_AKIVA_LOGO = '/bnei-akiva-logo.png';
const PESACH_GIFT = '/gift-cards/pesach.png';
const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

const SENDER = 'בני עקיבא';
const RECIPIENT = 'רז';
const SIGNATURE = 'יגאל קליין, מזכ"ל';
// The user-voucher this gift redeems into (added to the wallet mock data); the
// wallet centres its deck on it via `?focus=`. The gift card shown on this page
// is the *exact* wallet voucher card (same component, same data).
const REDEEM_VOUCHER_ID = 'uv_bnei_pesach';
const BNEI_USER_VOUCHER = mockUserVouchers.find((v) => v.id === REDEEM_VOUCHER_ID)!;

// The מזכ"ל's Passover letter — the opener is the bold heading, the rest is the
// message body (matching the preview's back-of-card design).
const LETTER_HEADING = 'פעילים יקרים,\nה\' עמכם!';
const LETTER_BODY: string[] = [
  'במשך דורות רבים כאשר נפגשים מחדש בכל שנה עם נס יציאת מצרים, קשה לדמיין מי היו האנשים, מה הם חשו ואילו נשמות היו באותם רגעים גדולים.',
  'בשנים האחרונות וביתר שאת בתקופה האחרונה, אותם אנשים גדולים שחווים את סיפור תקומת עם ישראל הם אתם, אנחנו, כל עם ישראל...',
  'סיפור של תקופה וגאולה מלווה בתפילה, מלווה בקשיים, אבל כמו שלמדנו ביציאת מצרים ורואים כיום - מלווה גם בעז"ה בניסים גדולים.',
  'ערב היציאה לחירות הלב מתפלל מעומק הנשמה שנזכה להודות על הניסים של אז וכימי צאתנו מארץ מצרים, נראה גם אנחנו בהמשך הנפלאות, התשועה והגאולה.',
  'תודה על העשייה שלכם ובפרט על זו שבתקופה האחרונה,',
  'בהערכה גדולה,',
];

export default function GiftSamplePage() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

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
    navigate(`/he/wallet?focus=${REDEEM_VOUCHER_ID}`);
  };

  return (
    <div className="relative min-h-dvh bg-white flex flex-col overflow-hidden" dir="rtl">
      {/* Decorative gradient glow — the app's home-page wash. */}
      <div className="absolute top-0 inset-x-0 h-[300px] pointer-events-none z-0">
        <div className="w-full h-full opacity-[0.18]" style={{ background: HOME_GRADIENT }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm active:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-rounded text-text-secondary" style={{ fontSize: 24 }}>
            arrow_forward
          </span>
        </button>
        <h1 className="text-lg font-bold text-text-primary flex-grow text-center pe-10">
          מתנת חג הפסח
        </h1>
      </header>

      {/* Scrollable body */}
      <main
        className={`relative z-10 flex-1 overflow-y-auto scrollbar-hide px-5 ${
          revealed ? 'pt-4 pb-12' : 'flex items-start justify-center pt-3 pb-4'
        }`}
      >
        <div className="w-full max-w-[400px] mx-auto">
          {/* ── Greeting (top): the flip card. Front = cover, Back = full letter. ── */}
          <div className="flip-perspective w-full">
            <div className={`flip-inner ${revealed ? 'is-flipped' : ''}`}>
              {/* FRONT — the Bnei Akiva Passover cover */}
              <div
                className="flip-face relative w-full aspect-[10/16] rounded-2xl flex flex-col items-center justify-between p-7 overflow-hidden"
                style={{
                  background: HOME_GRADIENT,
                  color: '#ffffff',
                  boxShadow: '0 26px 40px -18px rgba(14, 44, 84, 0.45)',
                }}
              >
                {/* Soft scrim — keeps the white logo/title legible over the
                    lighter (cyan) end of the home gradient. */}
                <div
                  className="absolute inset-0 z-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(10,37,64,0.28) 0%, rgba(10,37,64,0.05) 35%, rgba(10,37,64,0.18) 75%, rgba(10,37,64,0.4) 100%)',
                  }}
                />

                {/* Bnei Akiva logo — transparent, rendered white over the wash. */}
                <img
                  src={BNEI_AKIVA_LOGO}
                  alt="בני עקיבא"
                  className="relative z-10 h-16 w-auto object-contain drop-shadow-lg"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />

                {/* The Passover gift illustration — matzah + wine (transparent). */}
                <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
                  <img
                    src={PESACH_GIFT}
                    alt=""
                    aria-hidden
                    className="max-w-[80%] max-h-full object-contain drop-shadow-xl"
                  />
                </div>

                <div className="relative z-10 w-full space-y-4">
                  <h2
                    className="text-2xl font-extrabold text-center leading-tight"
                    style={{ textShadow: '0 1px 14px rgba(10,37,64,0.5)' }}
                  >
                    {RECIPIENT}, קיבלת מתנה מ{SENDER}!
                  </h2>
                  <p
                    className="text-center text-sm font-semibold leading-relaxed text-white/90"
                    style={{ textShadow: '0 1px 10px rgba(10,37,64,0.45)' }}
                  >
                    לרגל חג הפסח — חג החירות
                  </p>
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
              </div>

              {/* BACK — the מזכ"ל's letter, in the preview's dark design
                  (#0a2540 face, bold white heading, white/80 body, cyan sender). */}
              <div
                className="flip-face flip-face-back w-full aspect-[10/16] rounded-2xl p-8 flex flex-col text-start overflow-hidden"
                style={{ background: '#0a2540', boxShadow: '0 26px 40px -18px rgba(0, 0, 0, 0.45)' }}
              >
                <h2 className="mt-4 text-3xl font-black text-white leading-tight whitespace-pre-line">
                  {LETTER_HEADING}
                </h2>

                {/* Body — scrolls within the card (min-h-0 lets the flex child
                    shrink so overflow-y actually kicks in). */}
                <div className="mt-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                  {LETTER_BODY.map((para, i) => (
                    <p
                      key={i}
                      className={`text-[15px] font-medium text-white/80 leading-relaxed ${i > 0 ? 'mt-3' : ''}`}
                    >
                      {para}
                    </p>
                  ))}
                  <p className="mt-5 text-xl font-extrabold text-[#7dd3fc]">פסח כשר ושמח</p>
                  <p className="mt-1.5 text-[15px] font-semibold text-white/80">
                    ובברכת חברים לתורה ועבודה
                  </p>
                  <p className="mt-3 text-base font-bold text-white">{SIGNATURE}</p>
                  <p className="mt-5 text-2xl font-bold text-[#7dd3fc]">{SENDER}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Gift (below): a Bnei Akiva gift card, in the wallet's voucher style. ── */}
          {revealed && (
            <section className="mt-8 animate-fade-in">
              <h3 className="text-xl font-bold text-text-primary mb-4 text-start">המתנה שלך</h3>
              {/* The exact wallet voucher card — same component + data, so the
                  balance position and everything match the card in the wallet. */}
              <button
                onClick={startRedeem}
                className="w-full block transition-transform active:scale-[0.97]"
              >
                <VoucherCard userVoucher={BNEI_USER_VOUCHER} flipped={false} onExpire={() => {}} />
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
        ) : (
          <div className="h-8 flex justify-center items-end pb-2">
            <div className="w-32 h-1 bg-border rounded-full" />
          </div>
        )}
      </footer>

      {/* ── Redeem celebration ── the same reveal experience as the "הכל מוכן"
          onboarding finale: animated gradient + flash/ripple/particles + brand
          logos rising as bubbles (literally "ממשו בעשרות בתי עסק"). On reveal it
          hands off to the wallet with the gift card centred in the deck. */}
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
              <VoucherCard userVoucher={BNEI_USER_VOUCHER} flipped={false} onExpire={() => {}} />
            </div>
            <p
              className="mt-8 text-2xl font-extrabold text-white text-center animate-fade-in"
              style={{ animationDelay: '0.7s', animationFillMode: 'both', textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
            >
              ממשו בעשרות בתי עסק
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
