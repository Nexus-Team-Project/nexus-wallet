import type { CSSProperties, ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCurrency } from '../../utils/formatCurrency';

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
}: BalanceCardProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';

  return (
    <div
      className={`relative rounded-[22px] p-8 text-center overflow-hidden shadow-lg shadow-[#0a2540]/30 ${
        logoCorner ? 'flex flex-col justify-center pb-14' : ''
      } ${className}`}
      style={{
        background:
          'radial-gradient(120% 120% at 30% 20%, rgba(125,211,252,0.18), transparent 55%), linear-gradient(135deg, #0a2540 0%, #0a2540 55%, #06182b 100%)',
        border: '1px solid rgba(125,211,252,0.25)',
        ...style,
      }}
    >
      {/* New badge — top-start corner */}
      <span className="absolute top-4 start-4 bg-[#7dd3fc]/20 text-[#7dd3fc] text-xs font-bold px-2.5 py-0.5 rounded-full">
        {t.wallet.newBadge}
      </span>

      {/* Label */}
      {logoCorner ? (
        <span className="text-white/80 font-medium mb-2 block">
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

      {/* Balance Amount */}
      <h1 className="text-6xl font-bold text-white mb-1 tracking-tight">
        {formatCurrency(balance || 0, 'ILS', locale)}
      </h1>

      {children}

      {/* Nexus logo in its sky-blue pill — pinned to the top-left
          corner like a card brand mark. */}
      {logoCorner && (
        <span className="absolute top-5 left-5 inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden pointer-events-none">
          <img
            src="/nexus-logo-black.png"
            alt="Nexus"
            className="h-6 w-auto object-contain"
            style={{ transform: 'scale(1.3)' }}
          />
        </span>
      )}

      {/* Cashback label — bottom-right corner of the front face */}
      {logoCorner && (
        <span className="absolute bottom-5 right-5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
          {language === 'he' ? 'עד 60% CashBack' : 'Up to 60% CashBack'}
        </span>
      )}
    </div>
  );
}
