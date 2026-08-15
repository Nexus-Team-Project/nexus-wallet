import { Wallet } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * AllBenefitsPhonePeek — About-page section in the home feed's white
 * product-catalog card container (same structure as CardLinkPerksCard:
 * header row with icon chip + dark tag, content, big footer CTA + circular
 * arrow). The content is the wallet phone mockup from the home HeroBanner's
 * "הארנק שלך — כל ההטבות במקום אחד" slide: only the top of the phone shows,
 * and a white fade dissolves its cut edge into the card.
 *
 * Centered on the phone screen: a white payment card (marketing rendition of
 * the add-payment-method page's CardPreview) — straight, no colored halo,
 * only a soft fade behind it, type at real-card proportions.
 */

interface AllBenefitsPhonePeekProps {
  /** Footer CTA tap — the About page passes its auth-gated wallet opener. */
  onCtaClick?: () => void;
}

/** Contactless wave glyph, like real payment cards. */
function ContactlessIcon({ className = '' }: { className?: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M7 8.5c2.2 1.8 2.2 5.2 0 7" />
        <path d="M10.5 6c3.5 2.8 3.5 9.2 0 12" />
        <path d="M14 3.5c4.7 3.8 4.7 13.2 0 17" />
      </g>
    </svg>
  );
}

/**
 * White marketing card — same layout as the payment page's CardPreview
 * (contactless glyph, number, holder + expiry), but on a clean white face
 * with dark type at real-card proportions: on a physical card the embossed
 * digits are ~4-5% of the card's width, so at this 300px design width the
 * number sits at 13px, labels at 7px.
 */
function WhiteCard() {
  return (
    <div
      className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: '0 20px 44px rgba(5,7,20,0.45)' }}
      dir="ltr"
    >
      {/* Faint plastic sheen — barely-there diagonal light across the face */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(15,23,42,0.05) 0%, rgba(255,255,255,0) 38%, rgba(15,23,42,0.03) 100%)',
        }}
      />

      {/* Content — minimalist: contactless glyph + number + name/expiry,
          number and text blocks pinned to the left edge. */}
      <div className="relative h-full p-5 flex flex-col justify-between text-slate-700">
        <div className="flex justify-end items-start">
          <ContactlessIcon className="text-slate-400" />
        </div>

        <div className="space-y-2.5 text-left">
          <div className="text-[13px] tracking-[0.16em] font-mono font-medium text-slate-800">
            4580  2601  4477  9010
          </div>
          <div className="flex justify-start items-end uppercase gap-5">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[7px] tracking-wider text-slate-400">Card holder</div>
              <div className="text-[9px] font-semibold tracking-wider truncate text-slate-700">
                Israel Israeli
              </div>
            </div>
            <div className="space-y-0.5 flex-shrink-0">
              <div className="text-[7px] tracking-wider text-slate-400">Expires</div>
              <div className="text-[9px] font-semibold tracking-wider font-mono text-slate-700">12/28</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllBenefitsPhonePeek({ onCtaClick }: AllBenefitsPhonePeekProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5"
    >
      {/* Header — icon chip + title/sub. Top-aligned rather than centered:
          the sub runs to two lines, so centering would float the icon
          mid-paragraph. */}
      <header className="flex items-start gap-3 mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface shrink-0">
            <Wallet size={24} strokeWidth={1.8} className="text-text-primary" />
          </span>
          <span className="flex flex-col min-w-0">
            {/* The "not issuing a card" line lives in the big footer label
                now, so the header carries the short card name again. */}
            <span className="text-lg font-bold text-text-primary leading-tight">
              {isHe ? 'הארנק שלך' : 'Your wallet'}
            </span>
            {/* Careful claim: only the issuer benefits that accrue on spend
                volume (points, miles, volume cashback) — not merchant-specific
                issuer discounts. */}
            <span className="text-xs font-medium text-text-muted mt-1 leading-snug">
              {isHe
                ? 'נקודות, טיסות, וקאשבק מכרטיס האשראי שלכם ממשיכים גם שאתם צוברים איתנו.'
                : 'Points, miles and cashback from your credit card keep accruing while you earn with us.'}
            </span>
          </span>
        </div>
      </header>

      {/* Phone peek — clipping window shorter than the phone, so only its
          top shows; the bottom fade melts the cut edge into the card. */}
      <div className="relative h-[360px] overflow-hidden mb-8">
        <div
          className="absolute top-0 left-1/2 pointer-events-none"
          style={{
            width: 200,
            aspectRatio: '9 / 18.8',
            transform: 'translateX(-50%) scale(1.5)',
            transformOrigin: 'top center',
            borderRadius: 28,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a',
            padding: 6,
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 24px 60px rgba(99,91,255,0.30)',
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute pointer-events-none"
            style={{ inset: 5, borderRadius: 23, border: '1px solid rgba(255,255,255,0.08)' }}
          />

          {/* Screen */}
          <div
            className="w-full h-full relative overflow-hidden"
            style={{
              borderRadius: 22,
              background: 'radial-gradient(120% 120% at 40% 20%, rgba(99,91,255,0.18), transparent 55%), linear-gradient(180deg, #0a0b14, #121535)',
            }}
          >
            {/* Notch */}
            <div
              className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10"
              style={{
                width: 72, height: 16,
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0 0 10px 10px',
              }}
            />

            {/* Top bar */}
            <div
              className="absolute top-6 left-2.5 right-2.5 flex items-center justify-between z-10"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              {/* In the RTL page this cluster sits top-RIGHT: avatar circle,
                  then the share circle beside it, then the label. */}
              <div className="flex items-center gap-1.5">
                <div
                  className="grid place-items-center"
                  style={{
                    width: 15, height: 15, borderRadius: 999,
                    background: 'rgba(255,255,255,0.12)',
                    fontSize: 7,
                  }}
                >
                  👤
                </div>
                {/* Share circle — extra top-right action */}
                <div
                  className="grid place-items-center"
                  style={{
                    width: 15, height: 15, borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                  </svg>
                </div>
                <span className="text-[8px] font-semibold">Wallet</span>
              </div>
              <div className="flex gap-1">
                {["⋯", "⤴"].map((icon, i) => (
                  <div
                    key={i}
                    className="grid place-items-center"
                    style={{
                      width: 18, height: 18, borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: 8, color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Dot grid overlay — under the card so its face stays clean */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                maskImage: 'radial-gradient(70% 55% at 50% 25%, black 25%, transparent 70%)',
                opacity: 0.5,
              }}
            />

            {/* Soft fade behind the card — no colored halo, just a gentle
                light bloom so the white card lifts off the dark screen. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: 58,
                width: 190,
                height: 130,
                background: 'radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.14), transparent 70%)',
                filter: 'blur(14px)',
              }}
            />

            {/* White payment card — straight, centered in the phone's
                visible (peeking) area, with clear breathing room to the
                screen edges on both sides. Rendered at its 300px design
                width and scaled down to leave that side margin. */}
            <div
              className="absolute left-1/2"
              style={{
                top: 66,
                width: 300,
                transform: 'translateX(-50%) scale(0.54)',
                transformOrigin: 'top center',
              }}
            >
              <WhiteCard />
            </div>
          </div>
        </div>

        {/* Bottom fade — dissolves the clipped phone into the white card */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Footer CTA — big label + circular arrow. 28px rather than the
          siblings' text-4xl: this label is a full sentence, not two words,
          so 36px pushed it to three ragged lines beside the arrow. */}
      <button onClick={onCtaClick} className="flex items-center justify-between gap-3 w-full pt-2 active:opacity-70">
        <span className="text-[28px] font-semibold tracking-tight leading-[1.05] text-start text-text-primary">
          {isHe ? 'לא מנפיקים כרטיס, פשוט משדרגים' : "We don't issue a card — we upgrade yours"}
        </span>
        <span className="w-12 h-12 bg-[#b1b1b1] rounded-full flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>{arrow}</span>
        </span>
      </button>
    </section>
  );
}
