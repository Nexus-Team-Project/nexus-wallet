import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCardImageStore } from '../../stores/cardImageStore';

interface BalanceCardProps {
  balance: number;
  /** Extra classes for the outer card (sizing — e.g. w-full h-full). */
  className?: string;
  style?: CSSProperties;
  /** Content rendered below the amount inside the card's clipped, rounded
   *  box — the action buttons + cashback line in the deck, the tap ripple,
   *  etc. Omitted on the balance detail page for a clean hero. */
  children?: ReactNode;
  /**
   * Detail-page variant: drop the inline Nexus pill from the label and
   * place the Nexus wordmark in the bottom-right corner (like a card brand
   * mark), and vertically centre the balance. Used by the flip card on the
   * balance-detail page.
   */
  logoCorner?: boolean;
  /** When set, animate from this value up to balance (post-transaction reveal). */
  countFrom?: number;
  /** Called once the count-up animation completes. */
  onCountComplete?: () => void;
}

/**
 * The navy "Nexus balance" square. Extracted from the wallet deck so the
 * balance-detail page can render the exact same card large at the top —
 * the tap ripple lands on a card that matches the one on the wallet.
 */
export default function BalanceCard({
  balance,
  className = '',
  style,
  children,
  logoCorner = false,
  countFrom,
  onCountComplete,
}: BalanceCardProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  // User-chosen card artwork (set from balance settings); null → default art.
  const cardImage = useCardImageStore((s) => s.cardImage);

  const target = balance || 0;
  const from = countFrom ?? 0;
  const [display, setDisplay] = useState(from);
  const onCompleteRef = useRef(onCountComplete);
  useEffect(() => { onCompleteRef.current = onCountComplete; });

  useEffect(() => {
    if (target <= 0) { setDisplay(0); return; }
    let raf = 0;
    let startTs = 0;
    const duration = 1100;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const p = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <div
      className={
        logoCorner
          ? `relative isolate p-6 text-right flex flex-col justify-end items-start ${className}`
          : `relative rounded-[22px] p-8 text-center overflow-hidden shadow-lg shadow-[#0a2540]/30 ${className}`
      }
      style={
        logoCorner
          ? { ...style }
          : {
              background:
                'radial-gradient(120% 120% at 30% 20%, rgba(125,211,252,0.18), transparent 55%), linear-gradient(135deg, #0a2540 0%, #0a2540 55%, #06182b 100%)',
              border: '1px solid rgba(125,211,252,0.25)',
              ...style,
            }
      }
    >
      {/* Deck front: the card artwork floating behind the labels. The default
          Nexus art has transparent rounded corners (object-contain + shape
          shadow). A user-chosen image fills the card (object-cover, rounded)
          with a dark scrim so the white labels stay legible over any photo. */}
      {logoCorner && (cardImage ? (
        <>
          <img
            src={cardImage}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 -z-10 w-full h-full object-cover rounded-[18px] pointer-events-none"
            style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[18px] pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(10,21,63,0.7) 0%, rgba(10,21,63,0.2) 55%, rgba(10,21,63,0.35) 100%)',
            }}
          />
          {/* The default art has the Nexus mark baked in; a custom image doesn't,
              so re-add the white Nexus logo (top-left) to keep the card branded. */}
          <img
            src="/nexus-white-wide-logo.png"
            alt="Nexus"
            className="absolute top-4 left-4 h-8 w-auto object-contain pointer-events-none"
            draggable={false}
          />
        </>
      ) : (
        <img
          src="/cards/nexus-balance-card.png"
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 -z-10 w-full h-full object-contain pointer-events-none"
          style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}
        />
      ))}

      {/* New badge — top-start corner (detail-page variant only; the deck
          front shows it paired with cashback at the bottom-left). */}
      {!logoCorner && (
        <span className="absolute top-4 start-4 bg-[#7dd3fc]/20 text-[#7dd3fc] text-xs font-bold px-2.5 py-0.5 rounded-full">
          {t.wallet.newBadge}
        </span>
      )}

      {/* Label */}
      {logoCorner ? (
        <span className="text-white/70 font-medium text-sm relative">
          {language === 'he' ? 'היתרה שלי' : 'My balance'}
        </span>
      ) : (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-white/80 font-medium">
            <span>יתרת</span>
            <span
              className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden"
              style={{ transform: 'scale(0.873)' }}
            >
              <img
                src="/nexus-logo-black.png"
                alt="Nexus"
                className="h-7 w-auto object-contain"
                style={{ transform: 'scale(1.373)' }}
              />
            </span>
          </span>
          <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>
            chevron_right
          </span>
        </div>
      )}

      {/* Balance Amount — the ₪ sign rendered a touch smaller than the digits */}
      <h1
        className={`font-bold text-white tracking-tight relative ${
          logoCorner ? 'text-5xl' : 'text-6xl mb-1'
        }`}
      >
        {formatCurrency(display, 'ILS', locale)
          .split(/(₪)/)
          .map((part, i) =>
            part === '₪' ? (
              <span key={i} className="text-[0.6em] font-semibold">
                ₪
              </span>
            ) : (
              <span key={i} className="tabular-nums">
                {part}
              </span>
            ),
          )}
      </h1>

      {children}

      {/* Deck front: "New" + cashback pills, paired at the bottom-left,
          both in the translucent-pill style of the New badge. */}
      {logoCorner && (
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
          <span className="bg-[#7dd3fc]/20 text-[#7dd3fc] text-xs font-bold px-2.5 py-0.5 rounded-full">
            {t.wallet.newBadge}
          </span>
          <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {language === 'he' ? 'עד 60% CashBack' : 'Up to 60% CashBack'}
          </span>
        </div>
      )}
    </div>
  );
}
