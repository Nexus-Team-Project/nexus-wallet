import { useState, useMemo, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, type PanInfo } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { mockVouchers } from '../mock/data/vouchers.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import type { VoucherVariant } from '../types/voucher.types';
import AnimatedActionIcon from '../components/layout/AnimatedActionIcon';
import StoreTile from '../components/home/StoreTile';
import giftActionUrl from '../assets/animations/action-gift.json?url';
import type { GiftDetails } from './GiftDetailsPage';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';
import AutoCarousel from '../components/ui/AutoCarousel';
import PaymentsPlanSheet from '../components/business/PaymentsPlanSheet';
import PaymentsSchedule from '../components/business/PaymentsSchedule';
import groupsAnim from '../assets/animations/action-groups.json?url';

/* ─── Amount Tier Definitions ─────────────────────────────────────────── */

interface AmountTier {
  amount: number;
  tier: string;
  tierLabelEn: string;
  tierLabelHe: string;
  gradient: string;
  accent: string;
  pattern: 'stripes' | 'dots' | 'waves' | 'geometric';
}

const AMOUNT_TIERS: AmountTier[] = [
  {
    amount: 100,
    tier: 'basic',
    tierLabelEn: 'Basic',
    tierLabelHe: 'בסיסי',
    gradient: 'linear-gradient(135deg, #52b788 0%, #40916c 50%, #2d6a4f 100%)',
    accent: '#95d5b2',
    pattern: 'stripes',
  },
  {
    amount: 200,
    tier: 'classic',
    tierLabelEn: 'Classic',
    tierLabelHe: 'קלאסי',
    gradient: 'linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #3a0ca3 100%)',
    accent: '#7b2cbf',
    pattern: 'dots',
  },
  {
    amount: 300,
    tier: 'premium',
    tierLabelEn: 'Premium',
    tierLabelHe: 'פרימיום',
    gradient: 'linear-gradient(135deg, #f48c06 0%, #e85d04 50%, #dc2f02 100%)',
    accent: '#ffba08',
    pattern: 'waves',
  },
  {
    amount: 500,
    tier: 'exclusive',
    tierLabelEn: 'Exclusive',
    tierLabelHe: 'אקסקלוסיבי',
    gradient: 'linear-gradient(135deg, #10002b 0%, #240046 30%, #3c096c 60%, #5a189a 100%)',
    accent: '#c77dff',
    pattern: 'geometric',
  },
];

/* ─── Pattern SVGs ────────────────────────────────────────────────────── */

function PatternOverlay({ pattern, accent }: { pattern: string; accent: string }) {
  const opacity = 0.12;
  switch (pattern) {
    case 'stripes':
      return (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity }}>
          <defs>
            <pattern id="stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke={accent} strokeWidth="3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stripes)" />
        </svg>
      );
    case 'dots':
      return (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity }}>
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2.5" fill={accent} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      );
    case 'waves':
      return (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: opacity + 0.04 }}>
          <defs>
            <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q10 0 20 10 Q30 20 40 10" fill="none" stroke={accent} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      );
    case 'geometric':
      return (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: opacity + 0.06 }}>
          <defs>
            <pattern id="geo" width="30" height="30" patternUnits="userSpaceOnUse">
              <polygon points="15,0 30,15 15,30 0,15" fill="none" stroke={accent} strokeWidth="1" />
              <circle cx="15" cy="15" r="2" fill={accent} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo)" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Voucher Card Preview ────────────────────────────────────────────── */

interface CardPreviewProps {
  amount: number;
  tier: AmountTier | null;
  merchantName: string;
  merchantLogo?: string;
  brandColor?: string;
  isCustom: boolean;
  isHe: boolean;
}

function VoucherCardPreview({ amount, tier, merchantName, merchantLogo, brandColor: _brandColor, isCustom: _isCustom, isHe }: CardPreviewProps) {
  const bg = tier
    ? tier.gradient
    : `linear-gradient(135deg, #635bff 0%, #3a0ca3 100%)`;
  const accent = tier?.accent || '#fff';
  const pattern = tier?.pattern || 'stripes';

  return (
    <div
      className="relative w-full rounded-t-2xl rounded-b-xl overflow-hidden p-5 shadow-xl shadow-black/20"
      style={{ aspectRatio: '1.586 / 1', background: bg }}
    >
      <PatternOverlay pattern={pattern} accent={accent} />

      {/* Shimmer for premium/exclusive */}
      {tier && (tier.tier === 'premium' || tier.tier === 'exclusive') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Nexus mark — top-left (mirrors VoucherCard) */}
      <img
        src="/nexus-white-wide-logo.png"
        alt="Nexus"
        draggable={false}
        className="absolute left-4 top-4 h-8 w-auto opacity-95 pointer-events-none"
      />

      {/* Tier / custom label — top-right */}
      <span
        className="absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
      >
        {tier ? (isHe ? tier.tierLabelHe : tier.tierLabelEn) : (isHe ? 'מותאם' : 'Custom')}
      </span>

      {/* Brand logo — centred (mirrors VoucherCard) */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            draggable={false}
            className="h-20 w-auto max-w-[64%] object-contain opacity-90"
          />
        ) : (
          <span className="text-2xl font-extrabold text-center leading-tight text-white">
            {merchantName}
          </span>
        )}
      </div>

      {/* Balance — bottom-right (mirrors VoucherCard exactly) */}
      <div className="absolute bottom-4 right-4 text-right leading-none">
        <span className="block text-[11px] font-medium mb-1 text-white/70">
          {isHe ? 'יתרה' : 'Balance'}
        </span>
        <div className="flex items-baseline justify-end">
          <span className="font-semibold text-white" style={{ fontSize: '1.5rem', lineHeight: 1 }}>₪</span>
          <span className="font-bold tracking-tight tabular-nums text-white" style={{ fontSize: '2.25rem', lineHeight: 1 }}>
            {amount > 0 ? amount : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Amount Selector Button ──────────────────────────────────────────── */

interface AmountBtnProps {
  tier: AmountTier;
  selected: boolean;
  onClick: () => void;
  isHe: boolean;
}

export function AmountButton({ tier, selected, onClick, isHe }: AmountBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 min-w-[72px] py-3.5 px-2 rounded-2xl font-bold text-sm
        transition-all duration-200 active:scale-95
        ${selected
          ? 'text-white shadow-lg scale-[1.02]'
          : 'bg-surface text-text-primary border border-border/50 hover:border-border'
        }
      `}
      style={selected ? { background: tier.gradient, boxShadow: `0 6px 20px ${tier.accent}40` } : undefined}
    >
      <span className="block text-lg">₪{tier.amount}</span>
      <span className={`block text-[10px] mt-0.5 ${selected ? 'text-white/70' : 'text-text-muted'}`}>
        {isHe ? tier.tierLabelHe : tier.tierLabelEn}
      </span>
    </button>
  );
}

/* ─── Variant Bottom Sheet ────────────────────────────────────────────── */

interface VariantSheetProps {
  variant: VoucherVariant;
  isHe: boolean;
  onClose: () => void;
}

function VariantSheet({ variant, isHe, onClose }: VariantSheetProps) {
  const c = variant.conditions;

  const conditionItems = [
    {
      icon: 'storefront',
      label: isHe ? 'בחנויות פיזיות' : 'Physical stores',
      value: c.usableInStore,
    },
    {
      icon: 'language',
      label: isHe ? 'רכישה אונליין' : 'Online purchase',
      value: c.usableOnline,
    },
    {
      icon: 'sell',
      label: isHe ? 'חנויות עודפים' : 'Outlet stores',
      value: c.usableAtOutlets,
    },
    {
      icon: 'stacks',
      label: isHe ? 'כפל מבצעים' : 'Promotion stacking',
      value: c.stackable,
    },
  ];

  const notes = isHe ? c.notesHe : c.notes;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl overflow-hidden"
        style={{ animation: 'sheet-up 0.3s ease-out' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 pb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>
                {variant.icon}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isHe ? variant.nameHe : variant.name}
              </h3>
              {variant.discountPercent && (
                <span className="text-sm text-primary font-semibold">
                  {variant.discountPercent}% {isHe ? 'הנחה' : 'discount'}
                </span>
              )}
            </div>
          </div>

          {/* Conditions list */}
          <div className="space-y-3 mb-5">
            {conditionItems.map((item) => (
              <div key={item.icon} className="flex items-center gap-3 py-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.value ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span
                    className={`material-symbols-outlined ${item.value ? 'text-green-600' : 'text-red-400'}`}
                    style={{ fontSize: 18 }}
                  >
                    {item.value ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <span className={`text-sm font-medium ${item.value ? 'text-text-primary' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {notes && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 shrink-0" style={{ fontSize: 20 }}>info</span>
              <p className="text-sm text-amber-800">{notes}</p>
            </div>
          )}

          {/* Select button */}
          <button
            onClick={onClose}
            className="w-full bg-text-primary text-white py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            {isHe ? 'בחר וריאנט זה' : 'Select this variant'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Stacking Info Sheet ─────────────────────────────────────────────── */

/* ─── Shared bottom-sheet primitive (matches FeesInfoSheet pattern) ─────── */

function VoucherSheet({
  isHe,
  title,
  onClose,
  children,
}: {
  isHe: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(120%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const header = sheetRef.current?.querySelector<HTMLElement>('[data-drag-handle]');
    if (!header) return;
    let startY = 0, curY = 0, dragging = false;
    const settle = (toClosed: boolean) => {
      if (toClosed) { handleClose(); return; }
      if (sheetRef.current) { sheetRef.current.style.transition = 'transform 0.3s ease-out'; sheetRef.current.style.transform = 'translateY(0)'; }
      if (overlayRef.current) { overlayRef.current.style.transition = 'opacity 0.3s ease-out'; overlayRef.current.style.opacity = '1'; }
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('button')) return;
      dragging = true; startY = e.clientY; curY = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
      try { header.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e: PointerEvent) => { if (!dragging) return; const delta = e.clientY - startY; if (delta > 0) { curY = delta; if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`; if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - delta / 400)); } };
    const onUp = () => { if (!dragging) return; dragging = false; settle(curY > 80); };
    header.addEventListener('pointerdown', onDown);
    header.addEventListener('pointermove', onMove);
    header.addEventListener('pointerup', onUp);
    header.addEventListener('pointercancel', onUp);
    return () => { header.removeEventListener('pointerdown', onDown); header.removeEventListener('pointermove', onMove); header.removeEventListener('pointerup', onUp); header.removeEventListener('pointercancel', onUp); };
  }, [handleClose]);

  return createPortal(
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={handleClose} />
      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          ref={sheetRef}
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[82vh] flex flex-col overflow-hidden animate-slide-up"
        >
          <div data-drag-handle className="flex-shrink-0 select-none px-6 pt-3 pb-4" style={{ touchAction: 'none' }}>
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">{title}</h2>
              <button
                onClick={handleClose}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 scrollbar-thin">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function StackingInfoSheet({ isHe, onClose }: { isHe: boolean; onClose: () => void }) {
  const sections = [
    {
      icon: 'stacks',
      title: isHe ? 'כולל כפל מבצעים — 20% קאשבק' : 'Promo stacking — 20% cashback',
      body: isHe
        ? 'הכרטיס ניתן לשימוש בשילוב עם קופונים, הנחות ומבצעים נוספים של בית העסק. מכיוון שהגמישות גבוהה יותר, הקאשבק שתקבל עומד על 20% מערך הכרטיס.'
        : 'The card can be used together with coupons, discounts and other promotions at the store. Because the flexibility is higher, the cashback you receive is 20% of the card value.',
    },
    {
      icon: 'block',
      title: isHe ? 'לא כולל כפל מבצעים — 60% קאשבק' : 'No promo stacking — 60% cashback',
      body: isHe
        ? 'הכרטיס אינו ניתן לשימוש בשילוב עם מבצעים אחרים בבית העסק. בתמורה, הקאשבק שתקבל גבוה משמעותית — 60% מערך הכרטיס.'
        : "The card cannot be combined with other promotions at the store. In return, the cashback you receive is significantly higher — 60% of the card's value.",
    },
  ];
  return (
    <VoucherSheet isHe={isHe} title={isHe ? 'אז איך זה עובד?' : 'So how does it work?'} onClose={onClose}>
      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.icon} className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary mb-1">{s.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </VoucherSheet>
  );
}

/* ─── Online Info Sheet ───────────────────────────────────────────────── */

function OnlineInfoSheet({ isHe, onClose }: { isHe: boolean; onClose: () => void }) {
  const sections = [
    {
      icon: 'language',
      title: isHe ? 'עובד באתרי סחר' : 'Works online',
      body: isHe
        ? 'הכרטיס ניתן לשימוש גם באתר האינטרנט של בית העסק ובאפליקציה שלו, בנוסף לשימוש בחנויות הפיזיות.'
        : "The card can be used on the store's website and app, in addition to physical store locations.",
    },
    {
      icon: 'storefront',
      title: isHe ? 'לא עובד באתרי סחר' : 'In-store only',
      body: isHe
        ? 'הכרטיס מיועד לשימוש בחנויות הפיזיות בלבד. לא ניתן לממש אותו ברכישות אונליין.'
        : 'The card is valid for use at physical store locations only. It cannot be redeemed for online purchases.',
    },
  ];
  return (
    <VoucherSheet isHe={isHe} title={isHe ? 'אז איך זה עובד?' : 'So how does it work?'} onClose={onClose}>
      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.icon} className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary mb-1">{s.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </VoucherSheet>
  );
}

/* ─── How It Works Sheet ──────────────────────────────────────────────── */

function HowItWorksSheet({ isHe, businessName, onClose }: { isHe: boolean; businessName: string; onClose: () => void }) {
  const steps = [
    { he: 'בחר את הסכום הרצוי וצור את הכרטיס',            en: 'Choose your amount and create the card' },
    { he: 'הכרטיס נטען מיד לארנק שלך',                     en: 'The card is instantly loaded to your wallet' },
    { he: `שלם איתו בסניפי ${businessName} בקופה`,         en: `Pay with it at ${businessName} stores at checkout` },
    { he: 'תיהנה מהקאשבק שמתווסף לארנק',                   en: 'Enjoy the cashback added to your wallet' },
  ];
  return (
    <VoucherSheet isHe={isHe} title={isHe ? 'איך זה עובד?' : 'How it works'} onClose={onClose}>
      <ol className="space-y-5">
        {steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-bg-dark text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed pt-0.5">
              {isHe ? step.he : step.en}
            </p>
          </li>
        ))}
      </ol>
    </VoucherSheet>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function VoucherPurchasePage() {
  const { lang = 'he', businessId, voucherId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const isHe = language === 'he';

  // Find voucher and business
  const voucher = useMemo(() => mockVouchers.find((v) => v.id === voucherId), [voucherId]);
  const business = useMemo(() => mockBusinesses.find((b) => b.id === businessId), [businessId]);

  // State
  const navState = location.state as { gift?: GiftDetails } | null;

  const [sheetVariant, setSheetVariant] = useState<VoucherVariant | null>(null);
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(2); // default ₪300
  const [customAmount, setCustomAmount] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [stackable, setStackable] = useState(true);
  const [stackingInfoOpen, setStackingInfoOpen] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);
  const [onlineInfoOpen, setOnlineInfoOpen] = useState(false);
  const [outletsMode, setOutletsMode] = useState(false);
  const [clubPromo, setClubPromo] = useState(true);
  const [cashbackDismissed, setCashbackDismissed] = useState(false);
  const [caresDismissed, setCaresDismissed] = useState(false);
  const [roundUp, setRoundUp] = useState(false);
  const { data: paymentMethods } = usePaymentMethods();
  const [payMethodId, setPayMethodId] = useState(paymentMethods[0]?.id ?? '');
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [connectedWallets, setConnectedWallets] = useState<Record<string, boolean>>({ bit: false, paybox: false });
  const walletOptions: { id: string; label: string; labelHe: string; color: string; logo?: string }[] = [
    { id: 'bit', label: 'bit', labelHe: 'ביט', color: '#E5007D', logo: '/logos/bit.png' },
    { id: 'paybox', label: 'payBox', labelHe: 'פייבוקס', color: '#19A7CE', logo: '/logos/paybox.webp' },
  ];
  const walletMethod = walletOptions.find((w) => w.id === payMethodId && connectedWallets[w.id]);
  const selectedPayMethod = paymentMethods.find((m) => m.id === payMethodId) ?? paymentMethods[0];
  const [paymentsInfoOpen, setPaymentsInfoOpen] = useState(false);
  const [paymentsSheetOpen, setPaymentsSheetOpen] = useState(false);
  const [paymentsCount, setPaymentsCount] = useState(1);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [giftDetails] = useState<GiftDetails | null>(navState?.gift ?? null);

  // Deck refs + height measurement (mirrors WalletPage deck)
  const centerCardRef = useRef<HTMLDivElement>(null);
  const [deckHeight, setDeckHeight] = useState(0);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (centerCardRef.current) setDeckHeight(centerCardRef.current.offsetHeight);
  });

  // Auto-advance to custom card when a custom amount is entered;
  // snap back to last tier when the user clears it.
  const customAmountNumForEffect = parseInt(customAmount, 10);
  const isCustomForEffect = Number.isFinite(customAmountNumForEffect) && customAmountNumForEffect > 0;
  useLayoutEffect(() => {
    if (isCustomForEffect) {
      setSelectedTierIdx(AMOUNT_TIERS.length);
    } else if (selectedTierIdx >= AMOUNT_TIERS.length) {
      setSelectedTierIdx(AMOUNT_TIERS.length - 1);
    }
  }, [isCustomForEffect]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCardDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) <= 80 && Math.abs(info.velocity.x) <= 450) return;
      const draggedLeft = info.offset.x < 0;
      const deckLength = AMOUNT_TIERS.length + (isCustomForEffect ? 1 : 0);
      const target = draggedLeft
        ? isRTL ? selectedTierIdx - 1 : selectedTierIdx + 1
        : isRTL ? selectedTierIdx + 1 : selectedTierIdx - 1;
      if (target < 0 || target >= deckLength) return;
      setSelectedTierIdx(target);
    },
    [isRTL, selectedTierIdx, isCustomForEffect],
  );

  if (!voucher || !business) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <p className="text-text-muted">{isHe ? 'טוען...' : 'Loading...'}</p>
      </div>
    );
  }

  const currentTier = AMOUNT_TIERS[selectedTierIdx];
  const customAmountNum = parseInt(customAmount, 10);
  const isCustom = Number.isFinite(customAmountNum) && customAmountNum > 0;
  const displayAmount = isCustom ? customAmountNum : (currentTier?.amount ?? 0);
  const cashbackRate = stackable ? 20 : 60;
  const total = displayAmount * qty;
  const cashbackAmount = Math.round(total * cashbackRate / 100);


  const categoryGradients: Record<string, string> = {
    'Fast Food': 'from-orange-600 via-red-500 to-amber-600',
    'Fashion': 'from-pink-600 via-fuchsia-500 to-purple-600',
    'Entertainment': 'from-purple-600 via-indigo-500 to-violet-600',
    'Cafe': 'from-amber-700 via-orange-600 to-yellow-600',
    'Hotels': 'from-sky-600 via-blue-500 to-cyan-600',
    'Health & Beauty': 'from-emerald-600 via-teal-500 to-green-600',
    'Electronics': 'from-blue-600 via-indigo-500 to-sky-600',
    'Fitness': 'from-lime-600 via-green-500 to-emerald-600',
    'Supermarket': 'from-green-600 via-emerald-500 to-teal-600',
  };
  const heroGradient = categoryGradients[business.category] || 'from-gray-700 via-gray-600 to-gray-800';

  return (
    <div className="min-h-dvh bg-white max-w-md mx-auto flex flex-col relative">
      {/* ── Background image - bottom edge passes through the vertical center of the voucher card carousel ── */}
      <div
        className="absolute top-0 left-0 right-0 z-0 overflow-hidden"
        style={{ height: 'calc(238px + (min(100vw, 448px) - 40px) / 3.4)' }}
      >
        {/* Gradient fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />

        {/* Background image */}
        {business.heroImageUrl && (
          <img
            src={business.heroImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Dark overlay with fade to white at the bottom for a smooth transition into the page background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 70%, rgba(255,255,255,0.5) 80%, white 92%)',
          }}
        />
      </div>

      {/* Top spacer — back handled by TopBar */}
      <div className="h-28 relative z-10" />

      {/* ── Brand info ── */}
      <div className="relative z-10 px-6 mt-4 mb-2 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/80 shrink-0">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-3xl">{business.logo}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {isHe ? business.nameHe : business.name}
            </h1>
            <p className="text-sm text-white/80 truncate">
              {isHe ? voucher.titleHe : voucher.title}
            </p>
          </div>
        </div>
      </div>

      {/* ── Framer-Motion Card Deck (mirrors WalletPage) ── */}
      <div className="relative z-10 mt-4 px-5 overflow-hidden">
        {/* Outer container height = card natural height × 0.9 (centre-card scale) */}
        <div
          className="relative"
          style={{ height: deckHeight ? deckHeight * 0.9 : 'calc((min(100vw, 448px) - 40px) / 1.7 * 0.9)' }}
        >
          {[...AMOUNT_TIERS.map((_, i) => i), ...(isCustom ? [AMOUNT_TIERS.length] : [])].map((cardIdx) => {
            const rel = cardIdx - selectedTierIdx;
            const isCenter = rel === 0;
            const isNeighbour = Math.abs(rel) === 1;
            const side = isCenter ? 0 : rel > 0 ? (isRTL ? -1 : 1) : isRTL ? 1 : -1;
            const pose = isCenter
              ? { x: '0%', scale: 0.9, opacity: 1 }
              : isNeighbour
                ? { x: `${side * 16}%`, scale: 0.74, opacity: 1 }
                : { x: `${side * 40}%`, scale: 0.6, opacity: 0 };

            const tier = cardIdx < AMOUNT_TIERS.length ? AMOUNT_TIERS[cardIdx] : null;
            const amount = tier ? tier.amount : customAmountNum;

            return (
              <motion.div
                key={cardIdx}
                aria-hidden={!isCenter}
                className="absolute inset-x-0 top-1/2 select-none"
                style={{
                  y: '-50%',
                  transformOrigin: 'center center',
                  zIndex: isCenter ? 30 : 10,
                  filter: isCenter ? 'none' : 'brightness(0.78)',
                  pointerEvents: isCenter ? 'auto' : 'none',
                }}
                initial={false}
                animate={pose}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              >
                <motion.div
                  ref={isCenter ? centerCardRef : undefined}
                  className={`w-full relative ${isCenter ? 'deck-card-drag' : ''}`}
                  style={{ cursor: isCenter ? 'grab' : 'default' }}
                  drag={isCenter ? 'x' : false}
                  dragElastic={0.5}
                  dragSnapToOrigin
                  whileDrag={{ cursor: 'grabbing' }}
                  onPointerDown={(e) => { pressStart.current = { x: e.clientX, y: e.clientY }; }}
                  onDragEnd={isCenter ? (e, info) => {
                    const start = pressStart.current;
                    pressStart.current = null;
                    const dx = start ? Math.abs((e as MouseEvent).clientX - start.x) : 999;
                    if (dx < 5) return;
                    onCardDragEnd(e, info);
                  } : undefined}
                >
                  <VoucherCardPreview
                    amount={amount}
                    tier={tier}
                    merchantName={isHe ? business.nameHe : business.name}
                    merchantLogo={business.logoUrl}
                    brandColor={voucher.brandColor}
                    isCustom={tier === null}
                    isHe={isHe}
                  />
                  {isCenter && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setHowItWorksOpen(true); }}
                      className="absolute bottom-3 left-3 h-7 w-7 inline-flex items-center justify-center rounded-full bg-white/25 backdrop-blur-sm text-white active:bg-white/40 transition-colors"
                      aria-label={isHe ? 'איך זה עובד?' : 'How it works'}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 17 }}>help</span>
                    </button>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-4 pb-2">
          {[...AMOUNT_TIERS, ...(isCustom ? [null] : [])].map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedTierIdx(i)}
              className={`rounded-full transition-all duration-200 ${
                i === selectedTierIdx ? 'w-4 h-1.5 bg-gray-800' : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Custom amount input ── */}
      <div className="relative z-10 px-5 mt-3">
        <label className="block text-xs text-gray-500 mb-2 font-medium">
          {isHe ? 'או הזן סכום משלך' : 'Or enter your own amount'}
        </label>
        <div className="relative">
          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg pointer-events-none">₪</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={isHe ? 'הזן סכום' : 'Enter amount'}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 ps-12 pe-10 text-start font-bold text-lg focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>

        {/* ── Qty + gift row ── */}
        <div className="flex items-center gap-3 mt-3">
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-surface rounded-xl px-2 py-1.5 shrink-0">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:scale-90 transition-transform disabled:opacity-40"
              aria-label={isHe ? 'הפחת' : 'Decrease'}
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>remove</span>
            </button>
            <span className="text-base font-bold text-text-primary w-5 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:scale-90 transition-transform"
              aria-label={isHe ? 'הוסף' : 'Increase'}
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>add</span>
            </button>
          </div>

          {/* Send as gift */}
          <button
            type="button"
            onClick={() => navigate(`/${lang}/business/${businessId}/voucher/${voucherId}/gift`, { state: { qty, gift: giftDetails } })}
            aria-pressed={!!giftDetails}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface rounded-2xl active:opacity-70 transition-opacity"
          >
            <span className="shrink-0">
              <AnimatedActionIcon src={giftActionUrl} size={22} />
            </span>
            <span className="flex flex-col min-w-0 text-center">
              <span className="text-[15px] font-bold text-text-primary truncate">
                {giftDetails
                  ? (isHe ? `מתנה ל${giftDetails.recipientName}` : `Gift for ${giftDetails.recipientName}`)
                  : (isHe ? 'שליחה כמתנה' : 'Send as a gift')}
              </span>
              {giftDetails?.recipientPhone && (
                <span className="text-sm font-normal text-text-muted truncate">{giftDetails.recipientPhone}</span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable content — product-page design language */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-40">

        {/* ── Cashback + cares banners ── */}
        {(!cashbackDismissed || !caresDismissed) && (
          <AutoCarousel className="mt-4 px-5">
            {!cashbackDismissed && (
              <div
                className="relative w-full h-full overflow-hidden rounded-2xl p-5 pe-36 min-h-[120px] flex flex-col justify-center"
                style={{ background: 'linear-gradient(135deg, #EEF0FF 0%, #F1ECFF 55%, #ECEBFF 100%)' }}
              >
                <button
                  onClick={() => setCashbackDismissed(true)}
                  aria-label={isHe ? 'סגירה' : 'Dismiss'}
                  className="absolute top-2 end-2 z-10 w-6 h-6 rounded-full bg-black/10 text-text-secondary flex items-center justify-center active:bg-black/20 transition-colors"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
                </button>
                <p className="text-[15px] font-bold text-text-primary leading-snug">
                  {isHe
                    ? <>תקבל <span className="text-primary">₪{cashbackAmount} קאשבק</span> בעסקה הזו</>
                    : <>Earn <span className="text-primary">₪{cashbackAmount} cashback</span> on this order</>}
                </p>
                <button className="mt-1 self-start text-sm font-semibold text-primary active:opacity-60 transition-opacity">
                  {isHe ? 'גלו את תוכנית התגמולים שלנו' : 'Discover our reward program'}
                </button>
                <img src="/reward-coins.png" alt="" aria-hidden
                  className="pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 h-[230%] w-40 object-contain object-right"
                />
              </div>
            )}
            {!caresDismissed && (
              <div
                className="relative w-full h-full overflow-hidden rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #E9F8EF 0%, #E6F5F1 55%, #E7F1FB 100%)' }}
              >
                <button
                  onClick={() => setCaresDismissed(true)}
                  aria-label={isHe ? 'סגירה' : 'Dismiss'}
                  className="absolute top-2 end-2 z-10 w-6 h-6 rounded-full bg-black/10 text-text-secondary flex items-center justify-center active:bg-black/20 transition-colors"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
                </button>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-green mb-2">
                  <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  {isHe ? 'לנקסוס אכפת' : 'Nexus cares'}
                </span>
                <div className="flex items-stretch gap-4">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-sm font-bold text-text-primary leading-snug">
                      {isHe
                        ? <>עגלו עסקה זו ותרמו <span className="text-accent-green">₪{(Math.ceil(total / 10) * 10 - total) || 10} שקלים</span> למטרות חברתיות נבחרות</>
                        : <>Round up and donate <span className="text-accent-green">₪{(Math.ceil(total / 10) * 10 - total) || 10}</span> to social causes</>}
                    </p>
                    <button
                      role="switch"
                      aria-checked={roundUp}
                      onClick={() => setRoundUp((v) => !v)}
                      className={`mt-3 self-start w-11 h-6 rounded-full transition-colors shrink-0 relative ${roundUp ? 'bg-accent-green' : 'bg-gray-200'}`}
                    >
                      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                        style={{ insetInlineStart: 2, transform: `translateX(${roundUp ? (isRTL ? -20 : 20) : 0}px)` }}
                      />
                    </button>
                  </div>
                  <div className="shrink-0 flex flex-col items-center -me-2">
                    <div className="flex items-center">
                      {[
                        { file: '/logos/barak-188.png', label: isHe ? 'ברק 188' : 'Barak', bg: '#0F2A4A', imgBg: '#FFFFFF', color: '#FFFFFF', rot: -4, pad: 8 },
                        { file: '/logos/bnei-akiva.png', label: isHe ? 'בני עקיבא' : 'Bnei A.', bg: '#1E40AF', imgBg: '#FFFFFF', color: '#FDE047', rot: 4, pad: 5 },
                        { file: '/logos/keren-ramon.png', label: isHe ? 'קרן רמון' : 'Ramon', bg: '#EBE7E4', imgBg: '#EBE7E4', color: '#2E7D32', rot: -3, pad: 5 },
                        { file: '/logos/yeladim-besikui.png', label: isHe ? 'ילדים בסיכוי' : 'Yeladim', bg: '#FBBF24', imgBg: '#FFFFFF', color: '#0F2A4A', rot: 5, pad: 5 },
                      ].map((c, i) => (
                        <span key={c.label} title={c.label}
                          className="relative w-14 h-14 rounded-[16px] shadow-sm border border-black/5 overflow-hidden flex items-center justify-center px-1 text-center"
                          style={{ backgroundColor: c.bg, marginInlineStart: i === 0 ? 0 : -14, transform: `rotate(${c.rot}deg)`, zIndex: 10 - i }}
                        >
                          <span className="text-[10px] font-extrabold leading-[1.05]" style={{ color: c.color }}>{c.label}</span>
                          <img src={c.file} alt="" aria-hidden
                            className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity"
                            style={{ padding: c.pad, backgroundColor: c.imgBg }}
                            onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AutoCarousel>
        )}

        {/* ── Deal terms heading ── */}
        <section className="px-5 pt-6">
          <h2 className="text-xl font-bold text-text-primary">
            {isHe ? 'תנאי עסקה' : 'Deal terms'}
          </h2>
        </section>

        {/* ── Stackable toggle ── */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 bg-white">
            <span className="material-symbols-outlined text-text-muted shrink-0" style={{ fontSize: 20 }}>stacks</span>
            <button
              onClick={() => setStackable((v) => !v)}
              className="flex-1 text-sm font-semibold text-text-primary text-start active:opacity-70 transition-opacity"
            >
              {stackable
                ? (isHe ? 'כולל כפל מבצעים' : 'Promo stacking included')
                : (isHe ? 'לא כולל כפל מבצעים' : 'No promo stacking')}
            </button>
            <button
              onClick={() => setStackingInfoOpen(true)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-surface text-text-muted active:bg-border transition-colors shrink-0"
              aria-label={isHe ? 'מידע על כפל מבצעים' : 'About promo stacking'}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>help</span>
            </button>
            <div
              onClick={() => setStackable((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${stackable ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ insetInlineStart: 2, transform: `translateX(${stackable ? (isRTL ? -20 : 20) : 0}px)` }}
              />
            </div>
          </div>
        </div>

        {/* ── Online mode toggle ── */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 bg-white">
            <span className="material-symbols-outlined text-text-muted shrink-0" style={{ fontSize: 20 }}>language</span>
            <button
              onClick={() => setOnlineMode((v) => !v)}
              className="flex-1 text-sm font-semibold text-text-primary text-start active:opacity-70 transition-opacity"
            >
              {onlineMode
                ? (isHe ? 'עובד באתרי סחר' : 'Works online')
                : (isHe ? 'לא עובד באתרי סחר' : 'In-store only')}
            </button>
            <button
              onClick={() => setOnlineInfoOpen(true)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-surface text-text-muted active:bg-border transition-colors shrink-0"
              aria-label={isHe ? 'מידע על שימוש אונליין' : 'About online usage'}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>help</span>
            </button>
            <div
              onClick={() => setOnlineMode((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${onlineMode ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ insetInlineStart: 2, transform: `translateX(${onlineMode ? (isRTL ? -20 : 20) : 0}px)` }}
              />
            </div>
          </div>
        </div>

        {/* ── Outlets toggle ── */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 bg-white">
            <span className="material-symbols-outlined text-text-muted shrink-0" style={{ fontSize: 20 }}>sell</span>
            <button
              onClick={() => setOutletsMode((v) => !v)}
              className="flex-1 text-sm font-semibold text-text-primary text-start active:opacity-70 transition-opacity"
            >
              {outletsMode
                ? (isHe ? 'סניפי עודפים' : 'Outlet branches')
                : (isHe ? 'ללא סניפי עודפים' : 'No outlet branches')}
            </button>
            <div
              onClick={() => setOutletsMode((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${outletsMode ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ insetInlineStart: 2, transform: `translateX(${outletsMode ? (isRTL ? -20 : 20) : 0}px)` }}
              />
            </div>
          </div>
        </div>

        {/* ── Club promo toggle ── */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 bg-white">
            <span className="material-symbols-outlined text-text-muted shrink-0" style={{ fontSize: 20 }}>loyalty</span>
            <button
              onClick={() => setClubPromo((v) => !v)}
              className="flex-1 text-sm font-semibold text-text-primary text-start active:opacity-70 transition-opacity"
            >
              {clubPromo
                ? (isHe ? 'כולל מבצעי מועדון' : 'Club promotions included')
                : (isHe ? 'לא כולל מבצעי מועדון' : 'No club promotions')}
            </button>
            <div
              onClick={() => setClubPromo((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${clubPromo ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ insetInlineStart: 2, transform: `translateX(${clubPromo ? (isRTL ? -20 : 20) : 0}px)` }}
              />
            </div>
          </div>
        </div>

        {/* ── Deal terms buttons ── */}
        <div className="px-5 pt-3 grid grid-cols-2 gap-3">
          <button className="bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity text-center">
            {isHe ? 'תנאי שימוש' : 'Terms of use'}
          </button>
          <button className="bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity text-center">
            {isHe ? 'אופן מימוש' : 'How to redeem'}
          </button>
          <button className="col-span-2 bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity text-center">
            {isHe ? 'רשימת סניפים משתתפים' : 'Participating branches'}
          </button>
        </div>

        {/* ── Order summary ── */}
        <section className="px-5 pt-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {isHe ? 'סיכום הזמנה' : 'Order summary'}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{isHe ? 'שווי הכרטיס' : 'Card value'}</span>
              <span className="font-semibold text-text-primary">₪{displayAmount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{isHe ? 'כמות' : 'Quantity'}</span>
              <span className="font-semibold text-text-primary">{qty}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{isHe ? `קאשבק (${cashbackRate}%)` : `Cashback (${cashbackRate}%)`}</span>
              <span className="font-semibold text-green-600">+₪{cashbackAmount}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-base font-bold text-text-primary">{isHe ? 'לתשלום' : 'Total'}</span>
              <span className="text-lg font-bold text-text-primary">₪{total}</span>
            </div>
          </div>
        </section>


        {/* ── Payment method ── */}
        <section className="px-5 mt-8">
          <button
            onClick={() => setPaymentOpen((v) => !v)}
            aria-expanded={paymentOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-xl font-bold text-text-primary">{isHe ? 'אמצעי תשלום' : 'Payment method'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 22, transform: paymentOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {paymentOpen && (
            <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
              {(walletMethod || selectedPayMethod) && (
                <div className="w-full flex items-center gap-3 text-start pb-4 border-b border-border/60">
                  <span className="relative shrink-0">
                    {walletMethod ? (
                      <span className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 h-10 min-w-[64px]">
                        <span className="text-sm font-black lowercase leading-none" style={{ color: walletMethod.color }}>{walletMethod.label}</span>
                        {walletMethod.logo && (
                          <img src={walletMethod.logo} alt="" aria-hidden
                            className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                            onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
                          />
                        )}
                      </span>
                    ) : (
                      <PaymentBrandMark brand={selectedPayMethod.brand} />
                    )}
                    <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                      <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check</span>
                    </span>
                  </span>
                  <span className="flex-grow min-w-0">
                    <span className="block text-[15px] font-bold text-text-primary truncate">
                      {walletMethod ? (isHe ? walletMethod.labelHe : walletMethod.label) : (isHe ? selectedPayMethod.labelHe : selectedPayMethod.label)}
                    </span>
                    {!walletMethod && selectedPayMethod.last4 && (
                      <span className="block text-xs text-text-muted" dir="ltr">···· {selectedPayMethod.last4}</span>
                    )}
                  </span>
                </div>
              )}
              <div className="-mx-4 px-4 mt-4">
                <div className="flex overflow-x-auto overscroll-x-contain scrollbar-hide gap-3 snap-x snap-proximity scroll-px-4 pb-1 touch-pan-x">
                  {paymentMethods.map((m) => {
                    const active = m.id === payMethodId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPayMethodId(m.id)}
                        className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${active ? 'border-primary shadow-sm' : 'border-border'}`}
                      >
                        <PaymentBrandMark brand={m.brand} />
                        <span className="text-xs font-medium text-text-secondary text-center leading-tight truncate w-full" dir="ltr">
                          {m.last4 ? `···· ${m.last4}` : (isHe ? m.labelHe : m.label)}
                        </span>
                      </button>
                    );
                  })}
                  {walletOptions.map((w) => {
                    const connected = connectedWallets[w.id];
                    const active = connected && payMethodId === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => connected ? setPayMethodId(w.id) : setConnectedWallets((prev) => ({ ...prev, [w.id]: true }))}
                        className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${active ? 'border-primary shadow-sm' : 'border-border'}`}
                      >
                        <span
                          className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-1.5 h-9 min-w-[64px] transition-all"
                          style={{ filter: connected ? 'none' : 'grayscale(1)', opacity: connected ? 1 : 0.55 }}
                        >
                          <span className="text-sm font-black lowercase leading-none" style={{ color: connected ? w.color : '#9ca3af' }}>{w.label}</span>
                          {w.logo && (
                            <img src={w.logo} alt="" aria-hidden
                              className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                              onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
                            />
                          )}
                        </span>
                        <span className="text-xs font-medium text-center leading-tight truncate w-full inline-flex items-center justify-center gap-0.5"
                          style={{ color: connected ? 'var(--color-text-secondary)' : '#9ca3af' }}>
                          {connected ? (isHe ? w.labelHe : w.label) : (
                            <><span className="material-symbols-rounded" style={{ fontSize: 14 }}>link</span>{isHe ? 'לחיבור' : 'Connect'}</>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => navigate(`/${lang}/wallet/add-payment-method`)}
                    className="flex-none w-36 snap-start rounded-xl bg-surface p-3 flex flex-col items-center justify-center gap-2 active:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>add</span>
                    <span className="text-xs font-semibold text-text-primary text-center leading-tight">
                      {isHe ? 'הוספת אמצעי תשלום' : 'Add payment'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Payments + split ── */}
        <section className="px-5 mt-8">
          <div className="relative flex items-center gap-1.5 mb-3">
            <h2 className="text-xl font-bold text-text-primary">{isHe ? 'תשלומים' : 'Payments'}</h2>
            <button
              onClick={() => setPaymentsInfoOpen((v) => !v)}
              aria-label={isHe ? 'מידע על התשלומים' : 'About payments'}
              className="w-6 h-6 inline-flex items-center justify-center rounded-full text-text-muted active:bg-surface transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>help</span>
            </button>
            {paymentsInfoOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setPaymentsInfoOpen(false)} />
                <div
                  className="absolute top-9 z-30 w-72 max-w-[80vw] rounded-2xl bg-white shadow-xl border border-border p-4"
                  style={{ insetInlineStart: 0 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>credit_card</span>
                    <span className="text-sm font-bold text-text-primary">
                      {isHe ? 'איך התשלומים עובדים' : 'How payments work'}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    {isHe
                      ? 'סכום ההזמנה מתחלק לתשלומים שווים, ללא ריבית וללא עמלות. החיוב הראשון מתבצע היום, והשאר אחת לשבועיים. ניתן לבחור עד 8 תשלומים.'
                      : 'Your order is split into equal installments — no interest, no fees. The first is charged today and the rest every two weeks. Choose up to 8 payments.'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="-mx-5 px-5 flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-5 items-stretch py-1">
            {/* Installments card */}
            <div className="relative snap-start shrink-0 w-[88%] border border-border rounded-2xl bg-white shadow-sm p-4 flex flex-col">
              <span className="absolute top-3 left-3 inline-flex items-center bg-sky-300 rounded-lg px-3 py-1.5">
                <img src="/nexus-logo-black.png" alt="Nexus" className="h-5 w-auto object-contain" />
              </span>
              <h3 className="text-[15px] font-bold text-text-primary mb-3">
                {isHe ? 'חלוקה לתשלומים' : 'Split into payments'}
              </h3>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-text-primary">
                  {paymentsCount === 1
                    ? (isHe ? 'תשלום אחד' : 'One payment')
                    : (isHe
                        ? `${paymentsCount} תשלומים של ₪${Math.round(total / paymentsCount)}`
                        : `${paymentsCount} payments of ₪${Math.round(total / paymentsCount)}`)}
                </span>
                <button
                  onClick={() => setPaymentsSheetOpen(true)}
                  className="shrink-0 bg-white border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary active:bg-surface transition-colors"
                >
                  {isHe ? 'שינוי' : 'Change'}
                </button>
              </div>
            </div>

            {/* Split bill card */}
            <button
              onClick={() => navigate(`/${lang}/business/${businessId}/product/split`, { state: { total } })}
              className="relative snap-start shrink-0 w-[88%] flex flex-col border border-border rounded-2xl bg-white shadow-sm p-4 text-start active:bg-black/[0.02] transition-colors"
            >
              <span className="absolute top-3 left-3 inline-flex items-center bg-sky-300 rounded-lg px-3 py-1.5">
                <img src="/nexus-logo-black.png" alt="Nexus" className="h-5 w-auto object-contain" />
              </span>
              <span className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">
                  <AnimatedActionIcon src={groupsAnim} size={24} playOnView />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[15px] font-bold text-text-primary">
                    {isHe ? 'פיצול עסקה זו למספר משתתפים' : 'Split this order between people'}
                  </span>
                  <span className="text-sm text-text-muted">
                    {isHe ? 'שלמו יחד עם חברים' : 'Pay together with friends'}
                  </span>
                </span>
              </span>
              <span className="self-end mt-auto inline-flex items-center bg-white border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary">
                {isHe ? 'פצל' : 'Split'}
              </span>
            </button>
          </div>

          {paymentsCount > 1 && (
            <div className="mt-3 w-full border border-border rounded-2xl bg-white shadow-sm p-4">
              <h3 className="text-[15px] font-bold text-text-primary mb-3">
                {isHe ? 'לוח התשלומים' : 'Payment schedule'}
              </h3>
              <PaymentsSchedule currency="₪" total={total} count={paymentsCount} compact />
            </div>
          )}
        </section>

        {paymentsSheetOpen && (
          <PaymentsPlanSheet
            isOpen={paymentsSheetOpen}
            onClose={() => setPaymentsSheetOpen(false)}
            currency="₪"
            total={total}
            count={paymentsCount}
            onSave={(n: number) => { setPaymentsCount(n); setPaymentsSheetOpen(false); }}
          />
        )}

        {/* ── About the business ── */}
        <section className="px-5 pt-6">
          <div className="bg-surface rounded-3xl overflow-hidden">
            {business.heroImageUrl ? (
              <img src={business.heroImageUrl} alt={isHe ? business.nameHe : business.name} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center">
                <p className="text-5xl font-extrabold tracking-tighter select-none" style={{ color: 'rgba(0,0,0,0.1)' }}>
                  {isHe ? business.nameHe : business.name}
                </p>
              </div>
            )}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
                    {business.logoUrl
                      ? <img src={business.logoUrl} alt="" className="w-7 h-7 object-contain" />
                      : <span className="text-lg">{business.logo}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{isHe ? business.nameHe : business.name}</p>
                    <p className="text-xs text-text-muted">{business.rating} ★ · {business.reviewCount?.toLocaleString()} {isHe ? 'דירוגים' : 'ratings'}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/${lang}/business/${businessId}`)}
                  className="bg-bg-dark text-white px-4 py-2 rounded-xl text-sm font-bold active:opacity-75 transition-opacity"
                >
                  {isHe ? 'ביקור' : 'Visit'}
                </button>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                {isHe ? business.descriptionHe : business.description}
              </p>
            </div>
          </div>
        </section>

        {/* ── Other offers ── */}
        {(() => {
          const otherVouchers = mockVouchers.filter((v) => v.id !== voucher.id).slice(0, 6);
          if (otherVouchers.length === 0) return null;
          return (
            <section className="pt-6 pb-6">
              <div className="px-5 mb-4">
                <h2 className="text-xl font-bold text-text-primary">{isHe ? 'הצעות נוספות' : 'More offers'}</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {otherVouchers.map((v) => {
                  const otherBusiness = mockBusinesses.find((b) => b.name === v.merchantName);
                  return (
                    <StoreTile
                      key={v.id}
                      image={v.imageUrl}
                      logoUrl={otherBusiness?.logoUrl}
                      bg={v.brandColor ?? '#f0f0f0'}
                      onClick={() => { if (otherBusiness) navigate(`/${lang}/business/${otherBusiness.id}/voucher/${v.id}`); }}
                    >
                      <p className="text-[13px] font-bold text-text-primary leading-tight truncate">{isHe ? v.titleHe : v.title}</p>
                      <p className="text-[12px] font-bold text-primary mt-0.5">₪{v.discountedPrice}</p>
                    </StoreTile>
                  );
                })}
              </div>
            </section>
          );
        })()}

      </main>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30" style={{ pointerEvents: 'none' }}>
        <div
          className="max-w-md mx-auto px-5 pb-5 pt-28"
          style={{
            pointerEvents: 'auto',
            background: 'linear-gradient(to top, white 45%, rgba(255,255,255,0.85) 65%, rgba(255,255,255,0.5) 80%, transparent)',
          }}
        >
          <div className="relative">
            {/* Cashback badge — behind button, text peeking above */}
            {cashbackAmount > 0 && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-0 w-[82%]">
                <div
                  key={`${cashbackRate}-${qty}`}
                  className="flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 px-4 py-2 pb-9 rounded-t-2xl origin-bottom"
                  style={{ animation: 'cashback-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <span className="text-base text-green-700 font-medium leading-none">{isHe ? 'תקבל' : 'Get'}</span>
                  <span className="text-lg font-black text-green-600 leading-none">₪{cashbackAmount}</span>
                  <span className="text-base text-green-700 font-medium leading-none">{isHe ? 'כקאשבק' : 'cashback'}</span>
                </div>
              </div>
            )}

            <button
              className="relative z-10 w-full bg-bg-dark text-white py-2.5 rounded-full font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-bg-dark/30 flex items-center justify-center gap-0"
            >
            <span className="inline-flex items-center gap-0 leading-none">
              <span>{isHe ? 'צור כרטיס עם' : 'Create card with'}</span>
              <span className="inline-flex items-center bg-sky-300 rounded-xl px-2.5 py-1 overflow-hidden" style={{ transform: 'scale(0.873)' }}>
                <img
                  src="/nexus-logo-black.png"
                  alt="Nexus"
                  className="h-6 w-auto object-contain"
                  style={{ transform: 'scale(1.373)' }}
                />
              </span>
            </span>
          </button>
          </div>
        </div>
      </div>

      {/* ── Stacking Info Sheet ── */}
      {stackingInfoOpen && (
        <StackingInfoSheet isHe={isHe} onClose={() => setStackingInfoOpen(false)} />
      )}

      {/* ── Online Info Sheet ── */}
      {onlineInfoOpen && (
        <OnlineInfoSheet isHe={isHe} onClose={() => setOnlineInfoOpen(false)} />
      )}

      {/* ── How it Works Sheet ── */}
      {howItWorksOpen && (
        <HowItWorksSheet isHe={isHe} businessName={isHe ? business.nameHe : business.name} onClose={() => setHowItWorksOpen(false)} />
      )}

      {/* ── Variant Bottom Sheet ── */}
      {sheetVariant && (
        <VariantSheet
          variant={sheetVariant}
          isHe={isHe}
          onClose={() => setSheetVariant(null)}
        />
      )}


      {/* ── Animations & scrollbar hide ── */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes cashback-pop {
          0%   { transform: scale(0.82); opacity: 0.6; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .snap-x::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
