import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GiftSamplePage — a standalone, ready-made gift page (no form / no checkout).
 *
 * It reuses the recipient *preview* structure from GiftDetailsPage (the flip
 * card → reveal → gift item), but rebuilt as a self-contained, shareable page
 * for a specific occasion: a Passover ("פסח") gift from בני עקיבא.
 *
 * Branding is Bnei Akiva's: their royal-blue palette and their movement logo.
 * The greeting is the מזכ"ל's holiday letter, shown in full once the gift is
 * "discovered". Content is Hebrew / RTL throughout.
 */

// Bnei Akiva brand blues (taken from their movement logo).
const BA_BLUE = '#1b4f91';
const BA_BLUE_DARK = '#0e2c54';
const BA_GRADIENT = `linear-gradient(155deg, #2a6cb8 0%, ${BA_BLUE} 55%, ${BA_BLUE_DARK} 100%)`;

const BNEI_AKIVA_LOGO = '/bnei-akiva-logo.png';
const PESACH_GIFT = '/gift-cards/pesach.png';
const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

const SENDER = 'בני עקיבא';
const SIGNATURE = 'יגאל קליין, מזכ"ל';

// The מזכ"ל's Passover letter, paragraph by paragraph.
const LETTER: string[] = [
  'פעילים יקרים,',
  'ה\' עמכם!',
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

  return (
    <div className="relative min-h-dvh bg-white flex flex-col overflow-hidden" dir="rtl">
      {/* Decorative gradient glow — Bnei Akiva blues washing down from the top. */}
      <div className="absolute top-0 inset-x-0 h-[300px] pointer-events-none z-0">
        <div
          className="w-full h-full opacity-[0.16]"
          style={{ background: 'linear-gradient(135deg, #2a6cb8 0%, #4f8fd6 45%, #80c0ea 100%)' }}
        />
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
        className={`relative z-10 flex-1 overflow-y-auto scrollbar-hide px-6 ${
          revealed ? 'pt-4 pb-12' : 'flex items-start justify-center pt-3 pb-4'
        }`}
      >
        <div className="w-full max-w-[360px] mx-auto">
          {/* Flip card */}
          <div className="flip-perspective w-full">
            <div className={`flip-inner ${revealed ? 'is-flipped' : ''}`}>
              {/* FRONT — the Bnei Akiva Passover card */}
              <div
                className="flip-face relative w-full aspect-[10/15] rounded-2xl flex flex-col items-center justify-between p-7 overflow-hidden"
                style={{
                  background: BA_GRADIENT,
                  color: '#ffffff',
                  boxShadow: '0 26px 40px -18px rgba(14, 44, 84, 0.55)',
                }}
              >
                {/* Bnei Akiva logo — on a white plate so the blue lockup stays legible. */}
                <div className="rounded-2xl bg-white px-5 py-3 shadow-md">
                  <img src={BNEI_AKIVA_LOGO} alt="בני עקיבא" className="h-12 w-auto object-contain" />
                </div>

                {/* The Passover gift illustration — matzah + wine. */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
                  <img
                    src={PESACH_GIFT}
                    alt=""
                    aria-hidden
                    className="max-w-[80%] max-h-full object-contain drop-shadow-xl"
                  />
                </div>

                <div className="w-full space-y-4">
                  <h2 className="text-2xl font-extrabold text-center leading-tight">
                    קיבלתם מתנה מ{SENDER}!
                  </h2>
                  <p className="text-center text-sm font-semibold leading-relaxed text-white/85">
                    לרגל חג הפסח — חג החירות
                  </p>
                  <div className="flex flex-col items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="w-full bg-white py-4 px-6 rounded-full font-bold text-base shadow-lg transition-all active:scale-[0.98]"
                      style={{ color: BA_BLUE }}
                    >
                      גלו את המתנה
                    </button>
                  </div>
                </div>
              </div>

              {/* BACK — festive opener in Bnei Akiva blue. */}
              <div
                className="flip-face flip-face-back w-full aspect-[10/15] rounded-2xl p-8 flex flex-col text-start overflow-hidden"
                style={{ background: BA_BLUE_DARK, boxShadow: '0 26px 40px -18px rgba(14, 44, 84, 0.55)' }}
              >
                <div className="rounded-2xl bg-white px-4 py-2.5 shadow-md self-start">
                  <img src={BNEI_AKIVA_LOGO} alt="בני עקיבא" className="h-10 w-auto object-contain" />
                </div>
                <h2 className="mt-12 text-3xl font-black text-white leading-tight">
                  חג חירות שמח,
                  <br />
                  פעילים יקרים!
                </h2>
                <p className="mt-5 text-base font-semibold text-white/80 leading-relaxed">
                  קיבלתם ברכה ומתנה אישית לכבוד חג הפסח.
                </p>
                <p className="mt-auto text-2xl font-bold" style={{ color: '#7db8ec' }}>
                  {SENDER}
                </p>
              </div>
            </div>
          </div>

          {/* Revealed content — the letter + the gift item. */}
          {revealed && (
            <>
              {/* The מזכ"ל's holiday letter */}
              <section className="mt-8 animate-fade-in">
                <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                  {/* Letter header band */}
                  <div className="px-6 py-5 text-center" style={{ background: BA_GRADIENT }}>
                    <div className="inline-flex rounded-xl bg-white px-4 py-2 shadow-sm">
                      <img src={BNEI_AKIVA_LOGO} alt="בני עקיבא" className="h-9 w-auto object-contain" />
                    </div>
                    <p className="mt-3 text-sm font-bold tracking-wide text-white/90">
                      ברכת חג הפסח
                    </p>
                  </div>

                  {/* Letter body */}
                  <div className="px-6 py-6 text-start">
                    {LETTER.map((para, i) => (
                      <p
                        key={i}
                        className={`leading-relaxed text-text-secondary ${
                          i === 0 ? 'text-base font-bold text-text-primary' : 'text-[15px]'
                        } ${i > 0 ? 'mt-3' : ''}`}
                      >
                        {para}
                      </p>
                    ))}

                    {/* Greeting highlight */}
                    <p
                      className="mt-6 text-xl font-extrabold"
                      style={{ color: BA_BLUE }}
                    >
                      פסח כשר ושמח
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-text-secondary">
                      ובברכת חברים לתורה ועבודה
                    </p>

                    {/* Signature */}
                    <div className="mt-5 pt-4 border-t border-border">
                      <p className="text-base font-bold text-text-primary">{SIGNATURE}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Gift item — the Passover gift itself */}
              <section className="mt-8 animate-fade-in">
                <h3 className="text-xl font-bold text-text-primary mb-4 text-start">המתנה שלכם</h3>
                <div className="rounded-2xl overflow-hidden shadow-lg border border-border flex flex-col">
                  <div
                    className="h-52 w-full overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #eaf2fb 0%, #d6e6f7 100%)' }}
                  >
                    <img
                      src={PESACH_GIFT}
                      alt="מתנת חג הפסח"
                      className="h-full w-auto object-contain p-6 drop-shadow-xl"
                    />
                  </div>
                  <div className="p-4 flex justify-between items-center" style={{ background: BA_BLUE_DARK }}>
                    <span className="text-white text-lg font-medium">מארז לחג הפסח</span>
                    <span className="w-2 h-2 rounded-full" style={{ background: '#7db8ec' }} />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Sticky footer — a Nexus "powered by" mark; becomes a redeem CTA once opened. */}
      <footer className="relative z-10 shrink-0 px-6 pt-2 pb-7">
        {revealed ? (
          <button
            type="button"
            onClick={() => navigate(`/he`)}
            className="w-full text-white py-4 rounded-full font-bold text-base shadow-lg transition-all active:scale-[0.98]"
            style={{ background: BA_BLUE }}
          >
            למימוש המתנה
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 pb-1">
            <span className="text-xs font-medium text-text-muted">מופעל על ידי</span>
            <img src={NEXUS_WIDE_WHITE} alt="Nexus" className="h-6 w-auto" style={{ filter: 'brightness(0)', opacity: 0.8 }} />
          </div>
        )}
      </footer>
    </div>
  );
}
