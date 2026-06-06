import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { usePaySession } from '../hooks/usePaySession';
import { formatCurrency } from '../utils/formatCurrency';
import BalanceCard from '../components/wallet/BalanceCard';
import BalanceActions from '../components/wallet/BalanceActions';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import PayExtrasPanel from '../components/wallet/PayExtrasPanel';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';

/**
 * Balance-detail page — the balance counterpart of the card-detail page.
 * Reached by tapping the balance card on the wallet: after the tap
 * ripple, the page opens on a clean white surface with the balance card
 * sitting large at the top — carrying the same Add money / Payment / More
 * controls (and the rising pay panel) as on the wallet — with the balance
 * breakdown below.
 */
export default function BalanceDetailPage() {
  const { language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { data: wallet } = useWallet();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n || 0, 'ILS', locale);

  const pay = usePaySession();
  const { showPaySheet, closePay } = pay;
  const [showMoreSheet, setShowMoreSheet] = useState(false);

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

      {/* ── CARD — sits large at the top of the white page, with the same
          pay panel rising above / below it as on the wallet. ── */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20"
      >
        {/* CODES — rises up from behind the card */}
        <div
          className="relative z-10 overflow-hidden transition-all duration-500"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: showPaySheet ? 900 : 0,
            marginBottom: showPaySheet ? 12 : 0,
          }}
        >
          <div
            className="transition-transform duration-500"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transform: showPaySheet ? 'translateY(0)' : 'translateY(90px)',
            }}
          >
            <PayCodesPanel />
          </div>
        </div>

        <BalanceCard balance={wallet?.balance ?? 0} className="w-full">
          <BalanceActions
            onAddMoney={() => navigate(`/${lang}/wallet/add-money`)}
            onMore={() => setShowMoreSheet(true)}
            pay={pay}
          />
        </BalanceCard>

        {/* EXTRAS — slides down into place below the card */}
        <div
          className="relative z-10 overflow-hidden transition-all duration-500"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: showPaySheet ? 700 : 0,
            marginTop: showPaySheet ? 12 : 0,
          }}
        >
          <div
            className="transition-transform duration-500"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transform: showPaySheet ? 'translateY(0)' : 'translateY(-60px)',
            }}
          >
            <PayExtrasPanel onClose={closePay} />
          </div>
        </div>
      </motion.div>

      {/* ── DETAILS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pt-6 pb-10"
      >
        <h1 className="text-xl font-bold text-text-primary mb-4">
          {isRTL ? 'היתרה שלי' : 'My balance'}
        </h1>

        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
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
      </motion.div>

      {/* More-actions bottom sheet — opened by the card's "More" button. */}
      {showMoreSheet && <MoreActionsSheet onClose={() => setShowMoreSheet(false)} />}
    </div>
  );
}
