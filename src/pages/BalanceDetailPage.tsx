import { useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCardImageStore } from '../stores/cardImageStore';
import { ShoppingBag, Banknote, Gift, Undo2, CheckCircle2, CreditCard, GripVertical, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { cn } from '../utils/cn';
import BalanceCard from '../components/wallet/BalanceCard';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import ArchiveCardButton from '../components/wallet/ArchiveCardButton';
import VoucherTermsSheet from '../components/wallet/VoucherTermsSheet';
import InfoSheet from '../components/wallet/InfoSheet';
import { mockTransactions } from '../mock/data/transactions.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockSubBalances } from '../mock/data/subBalances.mock';
import { mockVouchers } from '../mock/data/vouchers.mock';
import type { Transaction } from '../types/transaction.types';
import type { Voucher } from '../types/voucher.types';
import type { SubBalance } from '../types/wallet.types';

type BalanceTab = 'overview' | 'subBalances' | 'transactions' | 'more';

// One reorderable row in the "sub-balances" tab — cashback and credits are
// fixed rows, the rest come from mockSubBalances. Kept as a single list so
// the user can drag any of them into any order, same as the payment-methods
// reorder on PaymentMethodsPage.
type BalanceRow =
  | { kind: 'cashback'; id: 'cashback' }
  | { kind: 'credits'; id: 'credits' }
  | { kind: 'subBalance'; id: string; data: SubBalance };

const BALANCE_TABS: { key: BalanceTab; labelHe: string; labelEn: string }[] = [
  { key: 'overview', labelHe: 'סקירה', labelEn: 'Overview' },
  { key: 'subBalances', labelHe: 'יתרות משנה', labelEn: 'Sub-balances' },
  { key: 'transactions', labelHe: 'עסקאות אחרונות', labelEn: 'Recent transactions' },
  { key: 'more', labelHe: 'עוד', labelEn: 'More' },
];

/**
 * Underline tab strip — same visual language as `ProfileTabs`
 * (active tab: 2px primary underline + primary label; inactive: muted).
 */
function BalanceTabs({ selected, onChange, isRTL }: { selected: BalanceTab; onChange: (t: BalanceTab) => void; isRTL: boolean }) {
  return (
    <nav className="border-b border-border -mx-5 px-5">
      <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
        {BALANCE_TABS.map(({ key, labelHe, labelEn }) => {
          const isActive = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                'py-3 -mb-px border-b-2 whitespace-nowrap text-sm transition-colors',
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-muted font-medium hover:text-text-primary',
              )}
            >
              {isRTL ? labelHe : labelEn}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * One draggable row in the "sub-balances" tab. Same reorder mechanics as
 * `VoucherMiniRow` on PaymentMethodsPage: a grip handle starts the drag via
 * `dragControls`, the rest of the row stays a normal tap target.
 */
function BalanceRowItem({
  row,
  isRTL,
  money,
  locale,
  wallet,
  creditsTotal,
  onShowTerms,
}: {
  row: BalanceRow;
  isRTL: boolean;
  money: (n: number) => string;
  locale: string;
  wallet: { totalEarned?: number } | null | undefined;
  creditsTotal: number;
  onShowTerms: (v: Voucher) => void;
}) {
  const dragControls = useDragControls();

  let amountNode: React.ReactNode;
  let labelNode: React.ReactNode;
  let iconNode: React.ReactNode;

  if (row.kind === 'cashback') {
    amountNode = (
      <span className="text-base font-bold text-green-600 mt-1" dir="ltr">{money(wallet?.totalEarned ?? 0)}</span>
    );
    labelNode = <span className="text-[17px] font-bold text-text-primary">{isRTL ? 'קאשבק' : 'Cashback'}</span>;
    iconNode = <Banknote size={26} strokeWidth={1.5} className="text-green-600 mt-1 flex-shrink-0" />;
  } else if (row.kind === 'credits') {
    amountNode = (
      <span className="text-base font-bold text-text-primary mt-1" dir="ltr">{money(creditsTotal)}</span>
    );
    labelNode = <span className="text-[17px] font-bold text-text-primary">{isRTL ? 'זיכויים' : 'Credits'}</span>;
    iconNode = <Undo2 size={26} strokeWidth={1.5} className="text-sky-500 mt-1 flex-shrink-0" />;
  } else {
    const sb = row.data;
    const sbVoucher = mockVouchers.find((v) => v.id === sb.voucherId);
    amountNode = (
      <div className="flex flex-col">
        <span className="text-base font-bold text-text-primary mt-1" dir="ltr">{money(sb.amount)}</span>
        {sbVoucher && (
          <button
            onClick={() => onShowTerms(sbVoucher)}
            className="flex items-center gap-0.5 text-[13px] font-semibold text-sky-500 mt-1.5"
          >
            <span className="underline">{isRTL ? 'לכל התנאים' : 'All terms'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isRTL ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        )}
      </div>
    );
    labelNode = (
      <div className="flex flex-col text-end">
        <span className="text-[17px] font-bold text-text-primary">
          {sb.source === 'gift_card' ? (isRTL ? 'גיפט קארד/שוברים' : 'Gift card / voucher') : (isRTL ? 'שובר' : 'Voucher')}
        </span>
        <span className="text-[15px] text-text-muted mt-1">
          {isRTL ? 'בתוקף עד ' : 'Valid until '}{formatDate(sb.validUntil, locale)}
        </span>
      </div>
    );
    iconNode = sb.source === 'gift_card' ? (
      // Mini rendering of the actual SPAR gift-card art, rather than a
      // generic card glyph — this row's credit came specifically from that card.
      <img
        src="/gift-cards/spar.png"
        alt="SPAR"
        className="w-10 h-6 object-cover rounded-md border border-border/60 flex-shrink-0 mt-1"
        style={{ objectPosition: 'left center' }}
      />
    ) : (
      <CreditCard size={26} strokeWidth={1.5} className="text-sky-500 mt-1 flex-shrink-0" />
    );
  }

  return (
    <Reorder.Item value={row} dragListener={false} dragControls={dragControls} className="relative bg-white">
      <div className="flex items-start gap-3 py-4">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1 mt-1.5"
          aria-label={isRTL ? 'שינוי סדר' : 'Reorder'}
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0 flex items-start justify-between">
          {amountNode}
          <div className="flex items-start gap-4">
            {labelNode}
            {iconNode}
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

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

  // Deep-linked from a notification (e.g. "?tab=subBalances") — falls back
  // to the overview tab for a plain /wallet/balance visit.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as BalanceTab | null;
  const initialTab: BalanceTab = BALANCE_TABS.some((t) => t.key === requestedTab) ? requestedTab! : 'overview';

  const codesRef = useRef<HTMLDivElement>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [tab, setTab] = useState<BalanceTab>(initialTab);
  const [termsVoucher, setTermsVoucher] = useState<Voucher | null>(null);
  const [showSubBalanceHelp, setShowSubBalanceHelp] = useState(false);
  const { hasAny: hasPaymentMethod } = usePaymentMethods();
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>(() => [
    { kind: 'cashback', id: 'cashback' },
    { kind: 'credits', id: 'credits' },
    ...mockSubBalances.map((sb): BalanceRow => ({ kind: 'subBalance', id: sb.id, data: sb })),
  ]);
  const subBalanceTotal = mockSubBalances.reduce((sum, sb) => sum + sb.amount, 0);
  const creditsTotal = mockTransactions
    .filter((t) => t.type === 'refund' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

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
        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {/* Tab strip — same visual language as the profile page's tabs */}
        <BalanceTabs selected={tab} onChange={setTab} isRTL={isRTL} />

        {/* Stats collage */}
        {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 mt-5 mb-6" style={{ gridTemplateRows: 'auto auto' }}>
          {/* Available balance */}
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between h-32">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                {isRTL ? 'יתרה זמינה' : 'Available'}
              </p>
              {/* This tile has always been labelled "Available" while rendering
                  the full balance. With locked value in play that label has to
                  become true; ?? keeps older wallet shapes working. */}
              <p className="text-xl font-bold text-text-primary mt-1 tabular-nums" dir="ltr">
                {money(wallet?.availableBalance ?? wallet?.balance ?? 0)}
              </p>
            </div>
            {(wallet?.lockedBalance ?? 0) > 0 ? (
              <p className="text-[10px] text-text-muted">
                {isRTL
                  ? `+ ${money(wallet!.lockedBalance!)} מתנת פתיחה נעולה`
                  : `+ ${money(wallet!.lockedBalance!)} opening gift, locked`}
              </p>
            ) : (
              <p className="text-[10px] text-text-muted">
                {isRTL ? 'בארנק נקסוס' : 'Nexus wallet'}
              </p>
            )}
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
        )}

        {/* Sub-balances — gift-card / voucher-sourced credit, each with its own expiry */}
        {tab === 'subBalances' && (
          <div className="mt-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-primary tabular-nums" dir="ltr">
                  {money(subBalanceTotal)}
                </span>
                <button
                  onClick={() => setShowSubBalanceHelp(true)}
                  aria-label={isRTL ? 'מידע' : 'Info'}
                  className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                >
                  <span className="material-symbols-rounded text-text-muted" style={{ fontSize: '18px' }}>
                    help
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-secondary">{isRTL ? 'ישראל' : 'Israel'}</span>
                <span className="text-base">🇮🇱</span>
              </div>
            </div>

            {balanceRows.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">
                {isRTL ? 'אין לך יתרות משנה כרגע' : 'No sub-balances right now'}
              </p>
            ) : (
              <Reorder.Group axis="y" values={balanceRows} onReorder={setBalanceRows} className="divide-y divide-border">
                {balanceRows.map((row) => (
                  <BalanceRowItem
                    key={row.id}
                    row={row}
                    isRTL={isRTL}
                    money={money}
                    locale={locale}
                    wallet={wallet}
                    creditsTotal={creditsTotal}
                    onShowTerms={setTermsVoucher}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Legal disclaimer — kept in Hebrew regardless of app language,
                since it quotes Israeli payment-services regulation verbatim. */}
            <p className="text-[11px] leading-[1.6] text-text-muted text-center mt-6 pt-4 border-t border-border" dir="rtl">
              השימוש בקרדיטים מסוג גיפט קארד ושוברים כפופה{' '}
              <a className="underline" href="#" onClick={(e) => e.preventDefault()}>לתנאי השימוש</a>{' '}
              <a className="underline" href="#" onClick={(e) => e.preventDefault()}>בגיפט קארדס ובתווי קנייה</a>.
              וולט אנטרפרייזס ישראל בע&quot;מ פטורה מרישיון לפי חוק הסדרת העיסוק בשירותי תשלום וייזום תשלום, התשפ&quot;ג–2023,
              ולכן היא אינה מפוקחת על ידי רשות ניירות ערך לעניין שירותי התשלום הניתנים על ידיה שלגביהם חל הפטור.
              קרדיטים מסוג גיפט קארד ושוברים ניתנים לשימוש רק במדינה שבה נרכשו.
            </p>
          </div>
        )}

        {/* Recent transactions */}
        {tab === 'transactions' && (() => {
          const recent = [...mockTransactions]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
          return (
            <div className="mt-5 mb-6 animate-fade-in">
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

        {/* More — secondary actions that don't need their own tile */}
        {tab === 'more' && (
          <div className="mt-5 mb-6 space-y-1 animate-fade-in">
            <button
              onClick={() => navigate(`/${lang}/${hasPaymentMethod ? 'wallet/payment-methods' : 'wallet/add-payment-method'}`)}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-surface active:scale-[0.98] transition-all text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>add_card</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {hasPaymentMethod
                  ? (isRTL ? 'אמצעי תשלום' : 'Payment method')
                  : (isRTL ? 'הוספת אמצעי תשלום' : 'Add payment method')}
              </span>
            </button>

            <button
              onClick={() => navigate(`/${lang}/wallet/history`)}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-surface active:scale-[0.98] transition-all text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>history</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {isRTL ? 'היסטוריית ארנק' : 'Wallet history'}
              </span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-surface active:scale-[0.98] transition-all text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>settings</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {isRTL ? 'הגדרות כרטיס' : 'Card settings'}
              </span>
            </button>

            {/* Move the balance card to the archive (hides it from the wallet deck) */}
            <ArchiveCardButton cardId="balance" className="mt-3" />
          </div>
        )}
      </motion.div>

      {/* "All terms" sheet — opened from a sub-balance row's terms link */}
      {termsVoucher && (
        <VoucherTermsSheet voucher={termsVoucher} onClose={() => setTermsVoucher(null)} />
      )}

      {/* "?" info sheet — explains the Nexus balance and what the drag order on sub-balances controls */}
      <InfoSheet
        isOpen={showSubBalanceHelp}
        onClose={() => setShowSubBalanceHelp(false)}
        sections={[
          {
            title: isRTL ? 'יתרת נקסוס' : 'Nexus balance',
            body: isRTL
              ? 'יתרת נקסוס מאגדת בתוכה את כלל ההפקדות, הקאשבק, הזיכויים, וכרטיסי המתנה שקיבלת.'
              : 'Your Nexus balance brings together all your deposits, cashback, credits, and gift cards you’ve received.',
          },
          {
            title: isRTL ? 'סדר יתרות משנה' : 'Sub-balance order',
            body: isRTL
              ? 'התשלום מיתרת נקסוס יתבצע לפי סדר יתרות המשנה שתגדיר ובכפוף לתנאים של כל יתרה.'
              : 'Payment from your Nexus balance will draw on your sub-balances in the order you set, subject to each sub-balance’s own terms.',
          },
        ]}
      />

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
