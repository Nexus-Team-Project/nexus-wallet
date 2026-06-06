import { useLanguage } from '../../i18n/LanguageContext';
import { PAY_SESSION_SECONDS, type PaySession } from '../../hooks/usePaySession';

interface BalanceActionsProps {
  onAddMoney: () => void;
  onMore: () => void;
  pay: PaySession;
}

/**
 * The action row that sits inside the balance card — Add money / Payment
 * (with its live countdown) / More. Shared between the wallet deck and the
 * balance-detail page so both show the exact same controls and behaviour.
 *
 * Pointer-down is stopped on the wrapper so pressing a button never starts
 * the deck's card drag; on the detail page (no drag) that's a harmless
 * no-op.
 */
export default function BalanceActions({ onAddMoney, onMore, pay }: BalanceActionsProps) {
  const { t } = useLanguage();
  const {
    showPaySheet,
    paySecondsLeft,
    payPaused,
    handlePayPointerDown,
    handlePayPointerUp,
    handlePayPointerLeave,
  } = pay;

  return (
    <>
      <div
        className="flex items-center justify-center gap-3 mt-6"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onAddMoney}
          className="bg-white/10 text-white border border-white/25 px-8 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform"
        >
          {t.wallet.addMoney}
        </button>
        <button
          onPointerDown={handlePayPointerDown}
          onPointerUp={handlePayPointerUp}
          onPointerLeave={handlePayPointerLeave}
          className="relative overflow-hidden bg-[#7dd3fc] text-[#0a2540] px-6 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Depleting countdown pie behind the label */}
          {showPaySheet && (
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none transition-opacity"
              style={{
                background: `conic-gradient(var(--color-primary) ${(paySecondsLeft / PAY_SESSION_SECONDS) * 360}deg, transparent 0deg)`,
                opacity: 0.18,
              }}
            />
          )}
          <span className="relative flex items-center justify-center gap-1.5">
            {showPaySheet ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {payPaused ? 'lock' : 'timer'}
                </span>
                <span className="tabular-nums" dir="ltr">{paySecondsLeft}</span>
              </>
            ) : (
              t.wallet.payment
            )}
          </span>
        </button>
        <button
          onClick={onMore}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/25 active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-white/80 rotate-90" style={{ fontSize: '20px' }}>
            more_horiz
          </span>
        </button>
      </div>

      {/* Cashback Text — attached to buttons */}
      <p className="text-emerald-300 font-semibold text-sm mt-2">{t.wallet.earnCashback}</p>
    </>
  );
}
