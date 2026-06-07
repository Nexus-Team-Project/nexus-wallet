import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatCurrency';
import BalanceCard from '../components/wallet/BalanceCard';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';

/**
 * Balance-detail page — mirrors the card / voucher detail layout: the Nexus
 * balance card sits large at the top (the same gallery card as on the
 * wallet deck), followed by the Add / Pay / Points action tiles, then the
 * in-store pay barcode (like the vouchers, adapted to the balance code),
 * and finally the balance breakdown.
 */
export default function BalanceDetailPage() {
  const { language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { data: wallet } = useWallet();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n || 0, 'ILS', locale);

  // The barcode panel — the "Pay" tile scrolls down to it.
  const codesRef = useRef<HTMLDivElement>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const actions: { icon: string; label: string; onClick: () => void }[] = [
    {
      icon: 'add',
      label: isRTL ? 'הוספה' : 'Add',
      onClick: () => navigate(`/${lang}/wallet/add-money`),
    },
    {
      icon: 'qr_code_2',
      label: isRTL ? 'תשלום' : 'Pay',
      onClick: () => codesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    },
    {
      icon: 'more_horiz',
      label: isRTL ? 'עוד' : 'More',
      onClick: () => setShowMoreSheet(true),
    },
  ];

  const rows: { icon: string; label: string; value: string }[] = [
    {
      icon: 'account_balance_wallet',
      label: isRTL ? 'יתרה זמינה' : 'Available',
      value: money(wallet?.balance ?? 0),
    },
    {
      icon: 'savings',
      label: isRTL ? 'סך קאשבק שנצבר' : 'Total cashback earned',
      value: money(wallet?.totalEarned ?? 0),
    },
    {
      icon: 'trending_down',
      label: isRTL ? 'סך הוצאות' : 'Total spent',
      value: money(wallet?.totalSpent ?? 0),
    },
  ];

  return (
    <div className="relative min-h-dvh bg-white px-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button — dark on the white surface */}
      <button
        onClick={() => navigate(`/${lang}/wallet`)}
        aria-label={isRTL ? 'חזרה' : 'Back'}
        className="absolute top-5 start-4 z-10 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
          {isRTL ? 'arrow_forward' : 'arrow_back'}
        </span>
      </button>

      {/* ── CARD — the gallery balance card, large at the top ── */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20"
      >
        <div className="w-full flex items-center justify-center">
          <BalanceCard
            balance={wallet?.balance ?? 0}
            logoCorner
            className="w-full"
            style={{ aspectRatio: '1510 / 952' }}
          />
        </div>
      </motion.div>

      {/* ── ACTIONS + CODES + DETAILS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pt-6 pb-10"
      >
        {/* Balance breakdown — directly under the card */}
        <h1 className="text-xl font-bold text-text-primary mb-4">
          {isRTL ? 'היתרה שלי' : 'My balance'}
        </h1>
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden mb-6">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '22px' }}>
                {row.icon}
              </span>
              <span className="text-sm text-text-secondary flex-1">{row.label}</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums" dir="ltr">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action tiles — Add / Pay / More */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface border border-border py-4 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '24px' }}>
                {action.icon}
              </span>
              <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* In-store codes — the balance pay barcode, like the vouchers but
            adapted to the balance (its own code, with the stacking toggle). */}
        <div ref={codesRef}>
          <PayCodesPanel hideTitle surface />
        </div>
      </motion.div>

      {/* More-actions bottom sheet — opened by the ⋯ action tile. */}
      {showMoreSheet && <MoreActionsSheet onClose={() => setShowMoreSheet(false)} />}
    </div>
  );
}
