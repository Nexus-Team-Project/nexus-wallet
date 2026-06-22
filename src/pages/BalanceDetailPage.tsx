import { useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useCardImageStore } from '../stores/cardImageStore';
import { ShoppingBag, Banknote, Gift, Undo2, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatCurrency';
import BalanceCard from '../components/wallet/BalanceCard';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';
import ArchiveCardButton from '../components/wallet/ArchiveCardButton';
import { mockTransactions } from '../mock/data/transactions.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import type { Transaction } from '../types/transaction.types';

const MERCHANT_LOGO_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const b of mockBusinesses) {
    if (!b.logoUrl) continue;
    const en = b.name?.toLowerCase().trim();
    const he = b.nameHe?.toLowerCase().trim();
    if (en) map[en] = b.logoUrl;
    if (he) map[he] = b.logoUrl;
  }
  return map;
})();

function txFallbackIcon(tx: Transaction): LucideIcon {
  if (tx.type === 'cashback') return Banknote;
  if (tx.type === 'bonus') return Gift;
  if (tx.type === 'refund') return Undo2;
  if (tx.type === 'redemption') return CheckCircle2;
  return ShoppingBag;
}

function CompactTxRow({ tx, isRTL }: { tx: Transaction; isRTL: boolean }) {
  const logoUrl = MERCHANT_LOGO_MAP[tx.merchantName?.toLowerCase().trim() ?? ''];
  const FallbackIcon = txFallbackIcon(tx);
  const name = tx.merchantName ?? (isRTL ? tx.titleHe : tx.title);
  const dateLabel = new Date(tx.createdAt).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' });
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface border border-border/60 flex items-center justify-center overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <FallbackIcon size={18} strokeWidth={1.6} className="text-text-secondary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary truncate">{name}</p>
        <p className="text-[11px] text-text-muted">{dateLabel}</p>
      </div>
      <span
        className={`text-[13px] font-bold flex-shrink-0 ${tx.amount < 0 ? 'text-text-primary' : 'text-green-600'}`}
        dir="ltr"
      >
        {tx.amount < 0 ? '−' : '+'}₪{Math.abs(tx.amount).toFixed(0)}
      </span>
    </div>
  );
}

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

  const codesRef = useRef<HTMLDivElement>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // ── Settings: set/reset the balance card's image ──
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardImage = useCardImageStore((s) => s.cardImage);
  const setCardImage = useCardImageStore((s) => s.setCardImage);
  const handlePickImage = () => fileInputRef.current?.click();
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-picked later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCardImage(reader.result);
        setShowSettings(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const actions: { icon: string; label: string; onClick: () => void }[] = [
    {
      icon: 'add',
      label: isRTL ? 'הוספה' : 'Add',
      onClick: () => navigate(`/${lang}/wallet/add-money`),
    },
    {
      icon: 'qr_code_2',
      label: isRTL ? 'תשלום' : 'Pay',
      onClick: () => setCardFlipped((f) => !f),
    },
    {
      icon: 'more_horiz',
      label: isRTL ? 'עוד' : 'More',
      onClick: () => setShowMoreSheet(true),
    },
  ];

  return (
    <div className="relative min-h-dvh bg-white px-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button — dark on the white surface */}
      <button
        onClick={() => navigate(-1)}
        aria-label={isRTL ? 'חזרה' : 'Back'}
        className="absolute top-5 start-4 z-10 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
          {isRTL ? 'arrow_forward' : 'arrow_back'}
        </span>
      </button>

      {/* Settings — opposite corner from Back; opens the card-settings sheet */}
      <button
        onClick={() => setShowSettings(true)}
        aria-label={isRTL ? 'הגדרות' : 'Settings'}
        className="absolute top-5 end-4 z-10 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
          settings
        </span>
      </button>

      {/* ── CARD (flip) + ACTIONS ── */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20"
      >
        {/* Flip card — front: balance card, back: pay codes */}
        <div className="flip-perspective w-full">
          <div className={`flip-inner ${cardFlipped ? 'is-flipped' : ''}`}>
            <div className="flip-face w-full flex items-center justify-center" onClick={() => cardFlipped && setCardFlipped(false)}>
              <BalanceCard
                balance={wallet?.balance ?? 0}
                logoCorner
                className="w-full"
                style={{ aspectRatio: '1510 / 952' }}
              />
            </div>
            <div className="flip-face flip-face-back" ref={codesRef}>
              <PayCodesPanel compact roundedClass="rounded-xl" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── ACTIONS + DETAILS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pt-6 pb-10"
      >
        {/* Action tiles */}
        <p className="text-[13px] font-bold text-text-primary mb-3">{isRTL ? 'פעולות' : 'Actions'}</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
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

        {/* Stats collage */}
        <p className="text-[13px] font-bold text-text-primary mb-3">{isRTL ? 'סקירה' : 'Overview'}</p>
        <div className="grid grid-cols-2 gap-3 mb-6" style={{ gridTemplateRows: 'auto auto' }}>
          {/* Available balance */}
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between h-32">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                {isRTL ? 'יתרה זמינה' : 'Available'}
              </p>
              <p className="text-xl font-bold text-text-primary mt-1 tabular-nums" dir="ltr">
                {money(wallet?.balance ?? 0)}
              </p>
            </div>
            <p className="text-[10px] text-text-muted">
              {isRTL ? 'בארנק נקסוס' : 'Nexus wallet'}
            </p>
          </div>

          {/* Cashback earned — tall, spans 2 rows */}
          <div
            className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between row-span-2"
            style={{ minHeight: 176 }}
          >
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                {isRTL ? 'קאשבק שנצבר' : 'Cashback earned'}
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1 tabular-nums" dir="ltr">
                {money(wallet?.totalEarned ?? 0)}
              </p>
            </div>
            <button
              onClick={() => navigate(`/${lang}/wallet/add-money`)}
              className="w-full bg-bg-dark text-white py-2.5 rounded-full text-[13px] font-semibold active:opacity-80 transition-opacity"
            >
              {isRTL ? 'טעינה' : 'Add money'}
            </button>
          </div>

          {/* Monthly activity bars */}
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between h-32">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                {isRTL ? 'פעילות שנתית' : 'Yearly activity'}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {isRTL ? `סה"כ הוצאות ${money(wallet?.totalSpent ?? 0)}` : `${money(wallet?.totalSpent ?? 0)} spent`}
              </p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[0.4, 0.6, 0.3, 0.9, 0.5, 0.7, 1, 0.6].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${Math.round(h * 28)}px`,
                    background: h === 1
                      ? 'linear-gradient(to bottom, #16a34a, #4ade80)'
                      : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        {(() => {
          const recent = [...mockTransactions]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
          return (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-text-primary">
                  {isRTL ? 'עסקאות אחרונות' : 'Recent transactions'}
                </p>
                <button
                  onClick={() => navigate(`/${lang}/wallet/history`)}
                  className="text-[12px] font-semibold text-primary"
                >
                  {isRTL ? 'הכל' : 'See all'}
                </button>
              </div>
              <div className="bg-surface border border-border rounded-2xl divide-y divide-border/60 overflow-hidden">
                {recent.map((tx) => (
                  <div key={tx.id} className="px-4 py-3">
                    <CompactTxRow tx={tx} isRTL={isRTL} />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Move the balance card to the archive (hides it from the wallet deck) */}
        <ArchiveCardButton cardId="balance" />
      </motion.div>

      {/* More-actions bottom sheet — opened by the ⋯ action tile. */}
      {showMoreSheet && <MoreActionsSheet onClose={() => setShowMoreSheet(false)} />}

      {/* Hidden picker — opened by "Set card image" in the settings sheet. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Settings sheet — set / reset the balance card's image ── */}
      {showSettings &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[150] bg-black/40 animate-fade-in"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-[150] max-w-md mx-auto px-4 pb-6 pointer-events-none">
              <div
                dir={isRTL ? 'rtl' : 'ltr'}
                className="pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up"
              >
                <div className="px-6 pt-3 pb-4">
                  <div className="flex justify-center pb-4">
                    <div className="w-10 h-1.5 bg-border rounded-full" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-text-primary">{isRTL ? 'הגדרות' : 'Settings'}</h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      aria-label={isRTL ? 'סגירה' : 'Close'}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors"
                    >
                      <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>close</span>
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-8 space-y-3">
                  <button
                    onClick={handlePickImage}
                    className="w-full flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 active:scale-[0.98] transition-transform"
                  >
                    <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>image</span>
                    <span className="flex-1 text-start">
                      <span className="block text-sm font-bold text-text-primary">
                        {isRTL ? 'הגדרת תמונת הכרטיס' : 'Set card image'}
                      </span>
                      <span className="block text-xs text-text-muted mt-0.5">
                        {isRTL ? 'בחרו תמונה מהמכשיר' : 'Choose an image from your device'}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>
                      {isRTL ? 'chevron_left' : 'chevron_right'}
                    </span>
                  </button>
                  {cardImage && (
                    <button
                      onClick={() => {
                        setCardImage(null);
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 active:scale-[0.98] transition-transform"
                    >
                      <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>restart_alt</span>
                      <span className="flex-1 text-start text-sm font-bold text-text-primary">
                        {isRTL ? 'חזרה לתמונת ברירת המחדל' : 'Reset to default image'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
