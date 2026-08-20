import { useState, useMemo, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, type PanInfo } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../i18n/LanguageContext';
import { mockVouchers, mockUserVouchers } from '../mock/data/vouchers.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockTransactions } from '../mock/data/transactions.mock';
import { mockSubBalances } from '../mock/data/subBalances.mock';
import type { VoucherVariant } from '../types/voucher.types';
import AnimatedActionIcon from '../components/layout/AnimatedActionIcon';
import StoreTile from '../components/home/StoreTile';
import giftActionUrl from '../assets/animations/action-gift.json?url';
import type { GiftDetails } from './GiftDetailsPage';
import { usePaymentMethods, type PaymentMethod } from '../hooks/usePaymentMethods';
import { useWallet } from '../hooks/useWallet';
import PaymentOptionsSheet from '../components/wallet/PaymentOptionsSheet';
import SplitPaymentSheet, { type SplitAmounts } from '../components/wallet/SplitPaymentSheet';
import { useOpeningGift, useRedeemOpeningGift, useGiftAvailability } from '../hooks/useOpeningGift';
import { evaluateLaunchGift, computeOrderTotals } from '../utils/launchGift';
import { composeVoucherAmount, formatCompositionParts, MAX_COMPOSE_TARGET } from '../utils/voucherComposition';
import { useAuthGate } from '../hooks/useAuthGate';
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
  /**
   * Number of physical vouchers this card is composed of (custom amounts are
   * fulfilled as a fixed-denomination combination). > 1 renders the count
   * badge on the left edge; the stacked under-card layers live in the deck.
   */
  voucherCount?: number;
}

function VoucherCardPreview({ amount, tier, merchantName, merchantLogo, brandColor: _brandColor, isCustom: _isCustom, isHe, voucherCount = 1 }: CardPreviewProps) {
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

      {/* Voucher-count badge — left edge. A composed card IS several physical
          vouchers; the circle says how many, even past the 3-layer visual cap. */}
      {voucherCount > 1 && (
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 h-7 min-w-7 px-1.5 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          aria-label={isHe ? `${voucherCount} שוברים` : `${voucherCount} vouchers`}
        >
          <span className="text-[13px] font-bold text-white tabular-nums leading-none">×{voucherCount}</span>
        </div>
      )}

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

/* ─── Denominations Info Sheet ────────────────────────────────────────── */

function DenominationsInfoSheet({ isHe, example, onClose }: {
  isHe: boolean;
  example: { typed: number; total: number; partsLabel: string } | null;
  onClose: () => void;
}) {
  const sections = [
    {
      icon: 'confirmation_number',
      title: isHe ? 'שוברים בערכים קבועים' : 'Fixed voucher values',
      body: isHe
        ? 'בתי העסק מנפיקים שוברים בערכים קבועים מראש (למשל ₪100, ₪200, ₪500). לא ניתן להנפיק שובר בסכום חופשי, ולכן אנחנו מרכיבים עבורך שילוב של שוברים.'
        : 'Merchants issue vouchers in fixed values (e.g. ₪100, ₪200, ₪500). A voucher cannot be issued for an arbitrary amount, so we build a combination of vouchers for you.',
    },
    {
      icon: 'task_alt',
      title: isHe ? 'תמיד מכסים את הקנייה' : 'Always covers your purchase',
      body: isHe
        ? 'אנחנו בוחרים את השילוב הקטן ביותר ששווה לסכום שביקשת או מעט יותר — כך הכרטיס תמיד מספיק לתשלום בקופה.'
        : 'We pick the smallest combination equal to or just above the amount you asked for — so the card always covers the bill at the register.',
    },
    {
      icon: 'account_balance_wallet',
      title: isHe ? 'היתרה לא הולכת לאיבוד' : 'The remainder is not lost',
      body: isHe
        ? 'אם השילוב גבוה מהסכום שביקשת, ההפרש נשאר כיתרה בכרטיס וזמין לקנייה הבאה באותו בית עסק.'
        : 'If the combination is above what you asked for, the difference stays as balance on the card for your next purchase at this merchant.',
    },
    {
      icon: 'rule',
      title: isHe ? 'תנאים אחידים לכל הצירוף' : 'Uniform terms for the whole batch',
      body: isHe
        ? 'תנאי העסקה שתבחר — כפל מבצעים, שימוש אונליין וכדומה — חלים באופן אחיד על כל השוברים בצירוף. אין שובר עם תנאים שונים משאר הצירוף.'
        : 'The deal terms you choose — promo stacking, online use and so on — apply uniformly to every voucher in the batch. No voucher carries different terms from the rest.',
    },
  ];
  return (
    <VoucherSheet isHe={isHe} title={isHe ? 'למה הסכום שונה ממה שהזנתי?' : 'Why is the amount different?'} onClose={onClose}>
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
        {example && (
          <div className="bg-surface rounded-2xl px-4 py-3 text-sm text-text-secondary leading-relaxed">
            {isHe ? (
              <>ביקשת <b className="text-text-primary">₪{example.typed}</b> ← נטען <b className="text-text-primary">₪{example.total}</b>{' '}
                <span dir="ltr">({example.partsLabel})</span></>
            ) : (
              <>You asked for <b className="text-text-primary">₪{example.typed}</b> → we load <b className="text-text-primary">₪{example.total}</b>{' '}
                <span dir="ltr">({example.partsLabel})</span></>
            )}
          </div>
        )}
      </div>
    </VoucherSheet>
  );
}

/* ─── Launch-gift row ─────────────────────────────────────────────────── */

type LaunchGiftRowState =
  | 'applied'
  | 'opted-out'
  | 'below-minimum'
  | 'not-launch-brand'
  /** Not signed in: an OFFER, never a balance. No "your", no padlock. */
  | 'anonymous'
  /** Signed in and ineligible, or already spent. Silence is the right answer. */
  | 'hidden';

function LaunchGiftRow({
  state,
  amount,
  shortfall,
  minPurchase,
  campaignOpen,
  isHe,
  isRTL,
  onApply,
  onRemove,
  onShowBrands,
  onJoin,
}: {
  state: LaunchGiftRowState;
  amount: number;
  shortfall?: number;
  minPurchase?: number;
  campaignOpen: boolean;
  isHe: boolean;
  isRTL: boolean;
  onApply: () => void;
  onRemove: () => void;
  onShowBrands: () => void;
  onJoin: () => void;
}) {
  // Never advertise a gift a signed-in member cannot have, and never mention it
  // once the campaign cap is exhausted.
  if (state === 'hidden') return null;
  if (state === 'anonymous' && !campaignOpen) return null;

  const dir = isRTL ? 'rtl' : 'ltr';

  if (state === 'applied') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-y border-primary/20"
        dir={dir}
      >
        <span className="material-symbols-rounded text-primary shrink-0" style={{ fontSize: 20 }}>
          card_giftcard
        </span>
        <span className="flex-1 text-sm font-bold text-text-primary truncate">
          {isHe ? `מתנת פתיחה ₪${amount} הופעלה` : `₪${amount} opening gift applied`}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-sm font-semibold text-text-muted active:opacity-60 transition-opacity"
        >
          {isHe ? 'הסרה' : 'Remove'}
        </button>
      </div>
    );
  }

  if (state === 'opted-out') {
    return (
      <div className="flex items-center gap-2 px-4 py-3" dir={dir}>
        <span className="material-symbols-rounded text-primary shrink-0" style={{ fontSize: 20 }}>
          card_giftcard
        </span>
        <span className="flex-1 text-sm font-semibold text-text-primary truncate">
          {isHe ? `השתמשו במתנת הפתיחה ₪${amount}` : `Use your ₪${amount} opening gift`}
        </span>
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 text-sm font-bold text-primary active:opacity-60 transition-opacity"
        >
          {isHe ? 'הפעלה' : 'Apply'}
        </button>
      </div>
    );
  }

  if (state === 'anonymous') {
    return (
      <div className="flex items-center gap-2 px-4 py-3" dir={dir}>
        <span className="material-symbols-rounded text-primary shrink-0" style={{ fontSize: 20 }}>
          card_giftcard
        </span>
        {/* Conditional and impersonal throughout — this money belongs to nobody
            yet, so the copy must not imply otherwise. */}
        <span className="flex-1 text-[13px] text-text-secondary leading-snug">
          {isHe
            ? `חדשים בנקסוס? מתנת פתיחה ₪${amount} בקנייה מעל ₪${minPurchase ?? 100} במותגי ההשקה`
            : `New to Nexus? A ₪${amount} opening gift on orders over ₪${minPurchase ?? 100} at launch brands`}
        </span>
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 text-sm font-bold text-primary active:opacity-60 transition-opacity"
        >
          {isHe ? 'הצטרפות' : 'Join'}
        </button>
      </div>
    );
  }

  // Blocked states. The lock glyph is honest here: the money IS theirs, it just
  // isn't unlocked for this particular transaction yet.
  const isBelowMin = state === 'below-minimum';
  return (
    <div className="flex items-center gap-2 px-4 py-3" dir={dir}>
      <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>
        lock
      </span>
      <span className="flex-1 text-[13px] text-text-muted leading-snug">
        {isBelowMin
          ? isHe
            ? `הוסיפו ₪${shortfall ?? 0} כדי להשתמש במתנה ₪${amount} (מינימום ₪${minPurchase ?? 100})`
            : `Add ₪${shortfall ?? 0} more to use your ₪${amount} gift (min ₪${minPurchase ?? 100})`
          : isHe
            ? `מתנת הפתיחה ₪${amount} תקפה במותגי ההשקה`
            : `Your ₪${amount} opening gift is valid at launch brands`}
      </span>
      {!isBelowMin && (
        <button
          type="button"
          onClick={onShowBrands}
          className="shrink-0 text-sm font-bold text-primary active:opacity-60 transition-opacity"
        >
          {isHe ? 'לרשימה' : 'See list'}
        </button>
      )}
    </div>
  );
}

/* ─── Launch brands sheet ─────────────────────────────────────────────── */

function LaunchBrandsSheet({
  isHe,
  brandIds,
  onClose,
}: {
  isHe: boolean;
  brandIds: string[];
  onClose: () => void;
}) {
  const brands = brandIds
    .map((id) => mockBusinesses.find((b) => b.id === id))
    .filter((b): b is (typeof mockBusinesses)[number] => !!b);

  return (
    <VoucherSheet
      isHe={isHe}
      title={isHe ? 'מותגי ההשקה' : 'Launch brands'}
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary leading-relaxed mb-5">
        {isHe
          ? 'מתנת הפתיחה ניתנת למימוש במותגים הבאים.'
          : 'The opening gift can be redeemed at these brands.'}
      </p>
      <div className="space-y-2">
        {brands.map((b) => (
          <div key={b.id} className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
              {b.logoUrl ? (
                <img src={b.logoUrl} alt="" className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-lg">{b.logo}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {isHe ? b.nameHe : b.name}
              </p>
              <p className="text-xs text-text-muted truncate">
                {isHe ? b.categoryHe : b.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    </VoucherSheet>
  );
}

/* ─── Loading skeleton ────────────────────────────────────────────────── */

// Brief artificial hold so the create-voucher page shows a loading skeleton
// on entry (mock data resolves instantly otherwise). Set to 0 to disable.
const ARTIFICIAL_LOADING_MS = 850;

// Colourful gradient palettes for the loading skeleton — same set as the
// search / stores results-card skeleton, so the whole app shares one look.
const SKELETON_COLORS: ReadonlyArray<readonly [string, string, string]> = [
  ['#fdba74', '#f87171', '#fcd34d'], // warm — orange / red / amber
  ['#93c5fd', '#67e8f9', '#5eead4'], // ocean — blue / cyan / teal
  ['#f9a8d4', '#fbbf24', '#fb7185'], // sunset — pink / amber / rose
];
const skeletonBlobBg = ([c1, c2, c3]: readonly [string, string, string]) => `
  radial-gradient(circle at 25% 30%, ${c1} 0%, transparent 55%),
  radial-gradient(circle at 75% 70%, ${c2} 0%, transparent 55%),
  radial-gradient(circle at 50% 55%, ${c3} 0%, transparent 60%),
  linear-gradient(135deg, ${c1}, ${c2})
`;

function VoucherPurchaseSkeleton() {
  return (
    <div className="min-h-dvh bg-white max-w-md mx-auto flex flex-col relative overflow-hidden" aria-hidden>
      {/* Hero backdrop */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />

      <div className="h-28 relative z-10" />

      {/* Brand info row */}
      <div className="relative z-10 px-6 mt-4 mb-2 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/70 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/2 bg-white/60 rounded animate-pulse" />
          <div className="h-3 w-1/3 bg-white/50 rounded animate-pulse" />
        </div>
      </div>

      {/* Voucher card deck placeholder — WalletPage skeleton layout (centred
          card + side-peek cards) coloured with the results-card skeleton blobs. */}
      <div className="relative z-10 mt-4 px-5">
        <div className="relative flex items-center justify-center" style={{ minHeight: 200 }}>
          <div
            className="absolute start-0 h-[78%] w-[12%] rounded-2xl animate-pulse opacity-40"
            style={{ background: skeletonBlobBg(SKELETON_COLORS[0]), filter: 'saturate(0.85)' }}
          />
          <div
            className="absolute end-0 h-[78%] w-[12%] rounded-2xl animate-pulse opacity-40"
            style={{ background: skeletonBlobBg(SKELETON_COLORS[2]), filter: 'saturate(0.85)' }}
          />
          <div
            className="relative w-[80%] aspect-[1.586/1] rounded-2xl shadow-xl animate-pulse"
            style={{ background: skeletonBlobBg(SKELETON_COLORS[1]), filter: 'saturate(0.85)' }}
          />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4 pb-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
        ))}
      </div>

      {/* Custom amount input + qty/gift row */}
      <div className="relative z-10 px-5 mt-3 space-y-3">
        <div className="h-12 w-full rounded-2xl bg-surface animate-pulse" />
        <div className="flex gap-3">
          <div className="h-12 w-28 rounded-xl bg-surface animate-pulse" />
          <div className="h-12 flex-1 rounded-2xl bg-surface animate-pulse" />
        </div>
      </div>

      {/* Deal-terms heading + rows */}
      <div className="relative z-10 px-5 mt-6 space-y-3">
        <div className="h-6 w-1/3 bg-border rounded animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full rounded-2xl bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function VoucherPurchasePage() {
  const { lang = 'he', businessId, voucherId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { language, isRTL } = useLanguage();
  const isHe = language === 'he';

  // Find voucher and business
  const voucher = useMemo(() => mockVouchers.find((v) => v.id === voucherId), [voucherId]);
  const business = useMemo(() => mockBusinesses.find((b) => b.id === businessId), [businessId]);

  // State
  const navState = location.state as { gift?: GiftDetails } | null;

  // ── Story mode ────────────────────────────────────────────────────────────
  // VoucherStoriesPage renders this page inside a story frame to walk the user
  // through the real flow. `?story=1` skips the artificial entry skeleton, and
  // `?sheet=split` opens the split-payment sheet on mount so the story can show
  // it without simulating taps. Read once — story frames never change route.
  const storyParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const storyMode = storyParams.get('story') === '1';
  const storySheet = storyParams.get('sheet');

  const [sheetVariant, setSheetVariant] = useState<VoucherVariant | null>(null);
  // Story mode starts one tier lower so the walkthrough can scroll ₪200 → ₪300
  // → ₪500 through the deck (see the cycling effect below).
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(storyMode ? 1 : 2); // default ₪300
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
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { data: launchGift } = useOpeningGift();
  /** Read-only probe. Never grants, never reserves a cap slot. */
  const { data: giftAvailability } = useGiftAvailability();
  const redeemGift = useRedeemOpeningGift();
  /**
   * Explicit opt-out only. `giftOn` is DERIVED from this plus eligibility
   * rather than being a `useState(true)` that effects reset — that shape is how
   * "I removed it and it silently came back" bugs happen. This way eligibility
   * can flap (tier 300 → custom 90 → tier 300) and restore itself, while a
   * deliberate Remove sticks for the session.
   */
  const [giftOptedOut, setGiftOptedOut] = useState(false);
  const [launchBrandsOpen, setLaunchBrandsOpen] = useState(false);
  const { data: paymentMethods } = usePaymentMethods();
  const { data: wallet } = useWallet();
  const [payMethodId, setPayMethodId] = useState(paymentMethods[0]?.id ?? '');
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [paymentOptionsOpen, setPaymentOptionsOpen] = useState(storySheet === 'payment-options');
  const [splitSheetOpen, setSplitSheetOpen] = useState(storySheet === 'split');
  const [splitAmounts, setSplitAmounts] = useState<SplitAmounts | null>(null);
  // Only the Nexus wallet has a real ceiling in this mock — regular cards
  // and wallets are treated as uncapped for the waterfall fill.
  const availableForSplit = useCallback(
    (m: PaymentMethod) => (m.brand === 'nexus' ? wallet?.availableBalance ?? wallet?.balance ?? 0 : Infinity),
    [wallet],
  );
  // Same composition as the balance-detail page's "sub-balances" tab —
  // shown nested under the Nexus row in the split sheet.
  const nexusBreakdown = {
    cashback: wallet?.totalEarned ?? 0,
    credits: mockTransactions
      .filter((t) => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    gifts: mockSubBalances.reduce((sum, sb) => sum + sb.amount, 0),
  };
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
  const [denomInfoOpen, setDenomInfoOpen] = useState(false);
  const [giftDetails] = useState<GiftDetails | null>(navState?.gift ?? null);

  // Loading skeleton on entry (artificial — mock data is instant).
  const [loading, setLoading] = useState(ARTIFICIAL_LOADING_MS > 0 && !storyMode);
  useEffect(() => {
    if (ARTIFICIAL_LOADING_MS <= 0 || storyMode) return;
    const id = window.setTimeout(() => setLoading(false), ARTIFICIAL_LOADING_MS);
    return () => window.clearTimeout(id);
  }, [storyMode]);

  // Story mode `&cycle=1`: scroll the amount deck ₪200 → ₪300 → ₪500 on its own
  // so the "choose the voucher value" beat shows the choice being made rather
  // than a static card.
  useEffect(() => {
    if (!storyMode || storyParams.get('cycle') !== '1') return;
    const timers = [
      window.setTimeout(() => setSelectedTierIdx(2), 1_600),
      window.setTimeout(() => setSelectedTierIdx(3), 3_200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [storyMode, storyParams]);


  // Scroll-linked hero whiten: a white veil over the hero image whose opacity
  // grows as the page scrolls, dissolving the ambiance into the white page
  // (mirrors BusinessHero). Driven via ref so the heavy page doesn't re-render
  // on every scroll frame. capture:true so it fires whichever element scrolls.
  const heroVeilRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const HERO_FADE_DIST = 300;
    let raf = 0;
    const update = () => {
      const top = document.scrollingElement?.scrollTop ?? window.scrollY;
      const f = Math.min(1, Math.max(0, top / HERO_FADE_DIST));
      if (heroVeilRef.current) heroVeilRef.current.style.opacity = String(f);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  // Deck refs + height measurement (mirrors WalletPage deck)
  const centerCardRef = useRef<HTMLDivElement>(null);
  const [deckHeight, setDeckHeight] = useState(0);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (centerCardRef.current) setDeckHeight(centerCardRef.current.offsetHeight);
  });

  // Auto-advance to custom card when a custom amount is entered;
  // snap back to the tier the user was on when they clear it.
  const customAmountNumForEffect = Number(customAmount);
  const isCustomForEffect = Number.isFinite(customAmountNumForEffect) && customAmountNumForEffect > 0;
  const lastTierIdxRef = useRef(storyMode ? 1 : 2);
  useEffect(() => {
    if (selectedTierIdx < AMOUNT_TIERS.length) lastTierIdxRef.current = selectedTierIdx;
  }, [selectedTierIdx]);
  useLayoutEffect(() => {
    if (isCustomForEffect) {
      setSelectedTierIdx(AMOUNT_TIERS.length);
    } else if (selectedTierIdx >= AMOUNT_TIERS.length) {
      setSelectedTierIdx(lastTierIdxRef.current);
    }
  }, [isCustomForEffect]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCardDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) <= 80 && Math.abs(info.velocity.x) <= 450) return;
      const draggedLeft = info.offset.x < 0;
      // On the composed custom card the deck shows that card ALONE; a sideways
      // swipe (either direction) resets the typed amount and re-enters the
      // preset gallery at its adjacent card.
      if (isCustomForEffect && selectedTierIdx >= AMOUNT_TIERS.length) {
        setCustomAmount('');
        setSelectedTierIdx(AMOUNT_TIERS.length - 1);
        return;
      }
      const target = draggedLeft
        ? isRTL ? selectedTierIdx - 1 : selectedTierIdx + 1
        : isRTL ? selectedTierIdx + 1 : selectedTierIdx - 1;
      if (target < 0 || target >= AMOUNT_TIERS.length) return;
      setSelectedTierIdx(target);
    },
    [isRTL, selectedTierIdx, isCustomForEffect],
  );

  if (loading) {
    return <VoucherPurchaseSkeleton />;
  }

  if (!voucher || !business) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <p className="text-text-muted">{isHe ? 'טוען...' : 'Loading...'}</p>
      </div>
    );
  }

  const currentTier = AMOUNT_TIERS[selectedTierIdx];
  const customAmountNum = Number(customAmount);
  const isCustom = Number.isFinite(customAmountNum) && customAmountNum > 0;
  // Custom amounts are fulfilled from fixed-denomination inventory: the
  // smallest voucher combination whose sum COVERS the requested amount.
  const denominations = voucher.denominations ?? AMOUNT_TIERS.map((t) => t.amount);
  const composition = isCustom ? composeVoucherAmount(customAmountNum, denominations) : null;
  /** Physical vouchers behind the composed card (per single unit, qty excluded). */
  const compositionCount = composition ? composition.parts.reduce((s, p) => s + p.count, 0) : 0;
  /** Per-card face value — for custom this is the composition total, not the typed number. */
  const displayAmount = isCustom ? (composition?.total ?? 0) : (currentTier?.amount ?? 0);
  const cashbackRate = stackable ? 20 : 60;

  // ── Launch gift: applicability (question B) ──────────────────────────────
  // Eligibility (question A) was already decided at OTP. `launchGift` is null
  // for anonymous visitors and for anyone who signed in without a phone, so
  // this collapses to 'no-gift' and the page behaves exactly as before.
  //
  // Owner decision: the minimum is measured on the TRANSACTION (cart) total.
  // Switch this to `displayAmount` to make it per-card instead.
  const giftQualifyingAmount = displayAmount * qty;

  const giftApplicability = evaluateLaunchGift({
    gift: launchGift ?? null,
    businessId,
    qualifyingAmount: giftQualifyingAmount,
  });
  const giftAvailable = giftApplicability.applicable;
  const giftOn = giftAvailable && !giftOptedOut;

  const { subtotal, giftApplied, cashDue, cashbackAmount } = computeOrderTotals({
    unitAmount: displayAmount,
    qty,
    cashbackRate,
    giftAmount: giftOn ? giftApplicability.amount : 0,
  });

  // `total` keeps its name and its meaning: cash due. Every downstream reader
  // (installments, split bill, payment method, success page) already treats it
  // that way and stays correct. `subtotal` is the new pre-gift figure.
  const total = cashDue;

  // Match PaymentsSchedule's round2 rather than Math.round, so the card and the
  // schedule below it never disagree. Invisible while totals were 100/200/300/
  // 500; with a gift applied they become 75/175/275/475 and "₪38" would sit
  // next to a schedule reading "₪37.50".
  const installmentLabel = (
    Math.round((total / paymentsCount) * 100) / 100
  ).toLocaleString(undefined, { maximumFractionDigits: 2 });


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
    <div className="min-h-dvh bg-white max-w-md mx-auto flex flex-col relative reveal-stagger">
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

        {/* Scroll-linked white veil — grows as the content scrolls so the hero
            image dissolves into the white page (mirrors BusinessHero). */}
        <div
          ref={heroVeilRef}
          aria-hidden
          className="absolute inset-0 bg-white pointer-events-none"
          style={{ opacity: 0 }}
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
      <div className="relative z-10 mt-4 px-5 overflow-hidden" data-story-tap="amount">
        {/* Outer container height = card natural height × 0.9 (centre-card scale) */}
        <div
          className="relative"
          style={{ height: deckHeight ? deckHeight * 0.9 : 'calc((min(100vw, 448px) - 40px) / 1.7 * 0.9)' }}
        >
          {/* While a composed custom amount is active the deck shows that
              stack alone — the preset cards leave the gallery entirely. */}
          {(isCustom ? [AMOUNT_TIERS.length] : AMOUNT_TIERS.map((_, i) => i)).map((cardIdx) => {
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
            // Custom card face shows the real purchasable value (the composition
            // total), never the raw typed number.
            const amount = tier ? tier.amount : (composition?.total ?? 0);

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
                  {/* A composed custom card is honest about being several
                      physical vouchers: the under-vouchers peek out above it as
                      a fanned stack (2 vouchers → one layer, 3+ → two layers,
                      capped), each at its own slight angle and colored by its
                      denomination's tier, while the count badge on the card
                      face carries the true number. The wrapper padding grows
                      the measured deck height, so the fan is never clipped. */}
                  {tier === null && compositionCount > 1 ? (() => {
                    // Individual vouchers beneath the top of the stack, biggest
                    // first: 700 = [500, 200] → the 200 peeks under the card.
                    const unders = (composition?.parts ?? [])
                      .flatMap((p) => Array<number>(p.count).fill(p.denom))
                      .slice(1, 3);
                    const PEEK = 10;
                    const pad = unders.length * PEEK + 8;
                    return (
                      <div className="relative" style={{ paddingTop: pad }}>
                        {[...unders].reverse().map((denom, di) => {
                          const depth = unders.length - di; // 2 = deepest, drawn first
                          const gradient =
                            AMOUNT_TIERS.find((t) => t.amount === denom)?.gradient ??
                            'linear-gradient(135deg, #635bff 0%, #3a0ca3 100%)';
                          return (
                            <div
                              key={di}
                              aria-hidden
                              className="absolute left-1/2 rounded-t-2xl pointer-events-none"
                              style={{
                                width: `${100 - depth * 4}%`,
                                height: depth * PEEK + 26,
                                top: (unders.length - depth) * PEEK + 8,
                                background: gradient,
                                transform: `translateX(-50%) rotate(${depth === 1 ? -2.2 : 2.6}deg)`,
                                transformOrigin: 'center bottom',
                                filter: `brightness(${depth === 1 ? 0.95 : 0.85})`,
                              }}
                            />
                          );
                        })}
                        <VoucherCardPreview
                          amount={amount}
                          tier={tier}
                          merchantName={isHe ? business.nameHe : business.name}
                          merchantLogo={business.logoUrl}
                          brandColor={voucher.brandColor}
                          isCustom={tier === null}
                          isHe={isHe}
                          voucherCount={compositionCount}
                        />
                      </div>
                    );
                  })() : (
                    <VoucherCardPreview
                      amount={amount}
                      tier={tier}
                      merchantName={isHe ? business.nameHe : business.name}
                      merchantLogo={business.logoUrl}
                      brandColor={voucher.brandColor}
                      isCustom={tier === null}
                      isHe={isHe}
                    />
                  )}
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
              onClick={() => {
                // Leaving the composed card via a dot also resets the amount.
                if (isCustom && i < AMOUNT_TIERS.length) setCustomAmount('');
                setSelectedTierIdx(i);
              }}
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
          {isHe ? 'או הזן את הסכום שאתה צריך' : 'Or enter the amount you need'}
        </label>
        <div className="relative">
          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg pointer-events-none">₪</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_COMPOSE_TARGET}
            value={customAmount}
            onChange={(e) => {
              const v = e.target.value;
              const n = Number(v);
              setCustomAmount(Number.isFinite(n) && n > MAX_COMPOSE_TARGET ? String(MAX_COMPOSE_TARGET) : v);
            }}
            placeholder={isHe ? 'הזן סכום' : 'Enter amount'}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 ps-12 pe-10 text-start font-bold text-lg focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>

        {/* ── Composition suggestion — always visible while a custom amount is
            entered, so the member sees the real loadable value next to what
            they typed, and the jump (if any) is explained, never discovered
            at the summary. */}
        {isCustom && composition && (
          <div className="mt-2 bg-surface rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>confirmation_number</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {compositionCount > 1
                  ? (isHe
                      ? `נטענים לך שוברים בסך ₪${composition.total.toLocaleString()}${composition.exact ? ' ✓' : ''}`
                      : `We'll load vouchers totaling ₪${composition.total.toLocaleString()}${composition.exact ? ' ✓' : ''}`)
                  : composition.exact
                    ? (isHe ? `הסכום זמין במלואו — ₪${composition.total.toLocaleString()} ✓` : `Available in full — ₪${composition.total.toLocaleString()} ✓`)
                    : (isHe ? `נטען לך שובר של ₪${composition.total.toLocaleString()}` : `We'll load a ₪${composition.total.toLocaleString()} voucher`)}
              </p>
              {!composition.exact && (
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {isHe
                    ? `₪${composition.delta} יותר מהסכום שהזנת — היתרה תישאר בכרטיס לקנייה הבאה`
                    : `₪${composition.delta} more than you entered — the remainder stays on your card`}
                </p>
              )}
              <p className="text-[11px] text-text-muted mt-1" dir="ltr" style={{ textAlign: isHe ? 'right' : 'left' }}>
                {formatCompositionParts(composition.parts)}
              </p>
            </div>
            <button
              onClick={() => setDenomInfoOpen(true)}
              aria-label={isHe ? 'למה הסכום שונה?' : 'Why is the amount different?'}
              className="w-5 h-5 rounded-full border border-border/70 inline-flex items-center justify-center shrink-0 mt-0.5"
            >
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 12 }}>question_mark</span>
            </button>
          </div>
        )}

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
        {/* data-story: scroll anchor for the how-to-create-a-voucher stories
            (VoucherStoriesPage drives this page inside a story frame). */}
        <section className="px-5 pt-6" data-story="terms">
          <h2 className="text-xl font-bold text-text-primary">
            {isHe ? 'תנאי עסקה' : 'Deal terms'}
          </h2>
          {/* A composed card is several physical vouchers — the terms chosen
              below are batch-wide, never per-voucher. Said here, where the
              terms are chosen, so it can't be discovered later as a surprise. */}
          {isCustom && compositionCount > 1 && (
            <p className="text-[12px] text-text-muted mt-1.5 leading-relaxed">
              {isHe
                ? `התנאים שתבחר כאן חלים באופן אחיד על כל ${compositionCount} השוברים בצירוף`
                : `The terms you choose here apply uniformly to all ${compositionCount} vouchers in this batch`}
            </p>
          )}
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
              data-story-tap="terms-help"
              className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-surface text-text-muted active:bg-border transition-colors shrink-0"
              aria-label={isHe ? 'מידע על כפל מבצעים' : 'About promo stacking'}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>help</span>
            </button>
            <div
              onClick={() => setStackable((v) => !v)}
              // data-story-tap: the how-to stories press this switch for real,
              // so it visibly flips under the hand.
              data-story-tap="terms-stack"
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
          {/* Collapsible header */}
          <button
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
            className="w-full flex items-center justify-between gap-3 mb-4"
          >
            <h2 className="text-xl font-bold text-text-primary">{isHe ? 'סיכום הזמנה' : 'Order summary'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform duration-200"
              style={{ fontSize: 22, transform: summaryOpen ? 'none' : 'rotate(180deg)' }}
            >
              expand_less
            </span>
          </button>

          {summaryOpen && (
            <div className="border border-border rounded-2xl bg-white overflow-hidden">
              {/* Product row */}
              <div className="flex items-center gap-3 px-4 py-3" dir={isRTL ? 'rtl' : 'ltr'}>
                {business.logoUrl && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/60 shrink-0 bg-surface">
                    <img src={business.logoUrl} alt="" draggable={false} className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-text-primary truncate">
                      {isHe ? business.nameHe : business.name}
                    </span>
                    {currentTier && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-white bg-gray-700 shrink-0">
                        {isHe ? currentTier.tierLabelHe : currentTier.tierLabelEn}
                      </span>
                    )}
                    {!currentTier && isCustom && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-white bg-gray-700 shrink-0">
                        {isHe ? 'מותאם' : 'Custom'}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-text-primary shrink-0">₪{displayAmount * qty}</span>
              </div>

              <div className="border-t border-border/60" />

              {/* Launch-gift affordance. Sits in the coupon row's slot but is
                  NOT the coupon input: the gift is already the member's money,
                  so making them type a code to unlock it would reframe it as
                  something to discover. The DOM slot is kept mounted across
                  every state — when a custom amount drops below the minimum the
                  total jumps, and the only acceptable explanation is this row
                  changing in place from "applied" to "add ₪X more". */}
              <LaunchGiftRow
                state={
                  !isAuthenticated && giftApplicability.reason === 'no-gift'
                    ? 'anonymous'
                    : giftOn
                      ? 'applied'
                      : giftAvailable
                        ? 'opted-out'
                        : giftApplicability.reason === 'below-minimum'
                          ? 'below-minimum'
                          : giftApplicability.reason === 'not-launch-brand'
                            ? 'not-launch-brand'
                            : 'hidden'
                }
                amount={giftApplicability.applicable ? giftApplicability.amount : giftAvailability?.amount ?? 25}
                shortfall={'shortfall' in giftApplicability ? giftApplicability.shortfall : undefined}
                minPurchase={
                  ('minPurchase' in giftApplicability ? giftApplicability.minPurchase : undefined) ??
                  giftAvailability?.minPurchase
                }
                campaignOpen={!!giftAvailability?.open}
                isHe={isHe}
                isRTL={isRTL}
                onApply={() => setGiftOptedOut(false)}
                onRemove={() => setGiftOptedOut(true)}
                onShowBrands={() => setLaunchBrandsOpen(true)}
                onJoin={() =>
                  requireAuth({
                    promptMessage: isHe
                      ? `הרשמה כדי לקבל מתנת פתיחה של ₪${giftAvailability?.amount ?? 25}`
                      : `Sign up to receive a ₪${giftAvailability?.amount ?? 25} opening gift`,
                  })
                }
              />

              {/* Coupon code input */}
              <div className="flex items-center px-4 py-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={isHe ? 'קוד הנחה או שובר' : 'Discount or voucher code'}
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                />
                <div className="w-px h-4 bg-border/70 mx-3 shrink-0" />
                <button
                  type="button"
                  className="shrink-0 text-sm font-bold text-primary active:opacity-60 transition-opacity"
                >
                  {isHe ? 'חל' : 'Apply'}
                </button>
              </div>

              <div className="border-t border-border/60" />

              {/* Line items */}
              <div className="px-4 py-3 space-y-2.5" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Composition breakdown — a custom amount is fulfilled as a
                    combination of fixed-denomination vouchers; itemized with
                    TOTAL counts (count × qty) so the rows sum to the subtotal. */}
                {isCustom && composition && (
                  <>
                    {composition.parts.map((p) => (
                      <div key={p.denom} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-text-primary">₪{p.denom * p.count * qty}</span>
                        <span className="text-text-secondary">
                          {isHe ? `שובר ₪${p.denom}` : `₪${p.denom} voucher`}
                          {p.count * qty > 1 ? ` ×${p.count * qty}` : ''}
                        </span>
                      </div>
                    ))}
                    {composition.delta > 0 && (
                      <p className="text-[11px] text-text-muted -mt-1">
                        {isHe
                          ? `₪${composition.delta} מעל הסכום שביקשת — היתרה נשמרת בכרטיס`
                          : `₪${composition.delta} above the amount you asked for — the remainder stays on the card`}
                      </p>
                    )}
                  </>
                )}
                {qty > 1 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">₪{displayAmount}</span>
                      <span className="text-text-secondary">{isHe ? 'מחיר ליחידה' : 'Unit price'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">×{qty}</span>
                      <span className="text-text-secondary">{isHe ? 'כמות' : 'Quantity'}</span>
                    </div>
                  </>
                )}
                {/* Subtotal is the PRE-GIFT gross. It used to render
                    `displayAmount`, ignoring qty — already inconsistent with the
                    product row above, and outright wrong once a discount row
                    sits between it and the total. */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">₪{subtotal}</span>
                  <span className="text-text-secondary">{isHe ? 'סכום ביניים' : 'Subtotal'}</span>
                </div>
                {/* Gift sits BETWEEN subtotal and cashback so that
                    Subtotal − Gift = Total reads as one unbroken subtraction,
                    leaving the cashback "+₪" as the single acknowledged break in
                    the chain. text-primary, not green: green on this page means
                    cashback, and the two are not the same kind of number — one
                    reduces what you pay now, the other is credit you get later. */}
                {giftApplied > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">−₪{giftApplied}</span>
                    <span className="text-text-secondary">{isHe ? 'מתנת פתיחה' : 'Opening gift'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-600">+₪{cashbackAmount}</span>
                  <div className="flex items-center gap-1">
                    <button className="w-4 h-4 rounded-full border border-border/70 inline-flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 11 }}>question_mark</span>
                    </button>
                    <span className="text-text-secondary">{isHe ? `קאשבק (${cashbackRate}%)` : `Cashback (${cashbackRate}%)`}</span>
                  </div>
                </div>
                {/* Says out loud the one number a member would otherwise
                    dispute — "why ₪20 cashback when I paid ₪75?" — and keeps the
                    pre-gift rule visible in the product, not just in a comment.
                    Cheapest regression detector we have for it. */}
                {giftApplied > 0 && (
                  <p className="text-[11px] text-text-muted -mt-1">
                    {isHe
                      ? `הקאשבק מחושב על ₪${subtotal} המלאים`
                      : `Cashback is calculated on the full ₪${subtotal}`}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-base font-bold text-text-primary">₪{total}</span>
                  <span className="text-base font-bold text-text-primary">{isHe ? 'לתשלום' : 'Total'}</span>
                </div>
              </div>
            </div>
          )}
        </section>


        {/* ── Payment method ── */}
        {/* data-story: scroll anchor — see the note on the deal-terms section. */}
        <section className="px-5 mt-8" data-story="payment">
          <div className="w-full flex items-center gap-1 mb-3">
            <button
              onClick={() => setPaymentOpen((v) => !v)}
              aria-expanded={paymentOpen}
              className="flex-1 flex items-center justify-between gap-3"
            >
              <h2 className="text-xl font-bold text-text-primary">{isHe ? 'אמצעי תשלום' : 'Payment method'}</h2>
              <span
                className="material-symbols-rounded text-text-muted transition-transform"
                style={{ fontSize: 22, transform: paymentOpen ? 'rotate(180deg)' : 'none' }}
              >
                expand_more
              </span>
            </button>
            <button
              onClick={() => setPaymentOptionsOpen(true)}
              data-story-tap="payment-options"
              aria-label={isHe ? 'אפשרויות תשלום' : 'Payment options'}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-text-muted active:bg-surface transition-colors flex-shrink-0"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>more_vert</span>
            </button>
          </div>
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
                <div className="flex overflow-x-auto overscroll-x-contain scrollbar-hide gap-3 snap-x snap-proximity scroll-px-4 pt-2 pb-1 touch-pan-x">
                  {paymentMethods.map((m) => {
                    // A method also counts as selected when the split covers
                    // it (any of its buckets, for Nexus) with a positive amount.
                    const splitBucketsUsed = splitAmounts
                      ? Object.entries(splitAmounts).filter(
                          ([key, value]) => value > 0 && (key === m.id || key.startsWith(`${m.id}:`)),
                        ).length
                      : 0;
                    const active = m.id === payMethodId || splitBucketsUsed > 0;
                    // More than one Nexus sub-balance funding this purchase —
                    // show how many instead of a plain checkmark.
                    const badgeCount = m.brand === 'nexus' && splitBucketsUsed > 1 ? splitBucketsUsed : null;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPayMethodId(m.id)}
                        // data-story-tap: the how-to stories press these chips
                        // for real, so the selection switches under the hand.
                        data-story-tap={`pay:${m.id}`}
                        className={`relative flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${active ? 'border-primary shadow-sm' : 'border-border'}`}
                      >
                        {active && (
                          <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-primary text-white flex items-center justify-center shadow">
                            {badgeCount ? (
                              <span className="text-[11px] font-bold leading-none">{badgeCount}</span>
                            ) : (
                              <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check</span>
                            )}
                          </span>
                        )}
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
          {splitAmounts && (
            <div className="flex items-center justify-between gap-3 mt-3 px-4 py-3 rounded-2xl bg-surface border border-border">
              <span className="text-sm font-semibold text-text-primary">
                {isHe
                  ? `מפוצל בין ${Object.values(splitAmounts).filter((v) => v > 0).length} אמצעי תשלום`
                  : `Split across ${Object.values(splitAmounts).filter((v) => v > 0).length} payment methods`}
              </span>
              <button
                onClick={() => setSplitSheetOpen(true)}
                className="text-sm font-semibold text-primary flex-shrink-0"
              >
                {isHe ? 'עריכה' : 'Edit'}
              </button>
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
                        ? `${paymentsCount} תשלומים של ₪${installmentLabel}`
                        : `${paymentsCount} payments of ₪${installmentLabel}`)}
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

        <PaymentOptionsSheet
          isOpen={paymentOptionsOpen}
          onClose={() => setPaymentOptionsOpen(false)}
          onSelectSplit={() => {
            setPaymentOptionsOpen(false);
            setSplitSheetOpen(true);
          }}
        />

        <SplitPaymentSheet
          isOpen={splitSheetOpen}
          onClose={() => setSplitSheetOpen(false)}
          methods={paymentMethods}
          total={total}
          availableFor={availableForSplit}
          nexusBreakdown={nexusBreakdown}
          onConfirm={(amounts) => {
            setSplitAmounts(amounts);
            setSplitSheetOpen(false);
          }}
        />

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
            {/* Cashback badge — behind button, text peeking above. Bobs up and
                down periodically, like the collapsed search-results card. */}
            {cashbackAmount > 0 && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-0 w-[82%]">
                {/* Bob wrapper — periodic translateY nudge (peek-bob). Kept
                    separate so it doesn't clash with the pill's pop scale. */}
                <div style={{ animation: 'peek-bob 3s ease-in-out infinite' }}>
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
              </div>
            )}

            <button
              className="relative z-10 w-full bg-bg-dark text-white py-2.5 rounded-full font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-bg-dark/30 flex items-center justify-center gap-0"
              onClick={() => {
                // Persist a freshly-purchased active voucher so it shows up as a
                // brand-new card in the wallet deck (mock create — pushed to the
                // shared array + cache invalidated so the wallet refetches it).
                const newUserVoucher = {
                  id: `uv_${Date.now()}`,
                  voucherId: voucher.id,
                  voucher,
                  purchasedAt: new Date().toISOString(),
                  expiresAt: voucher.validUntil + 'T23:59:59Z',
                  status: 'active' as const,
                  redemptionCode: `NXS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                  qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-${Date.now()}`,
                };
                mockUserVouchers.push(newUserVoucher);
                queryClient.invalidateQueries({ queryKey: ['userVouchers'] });

                // The campaign's single conversion event: value created from
                // nothing becomes value backed by cash the member just paid.
                // The mutation re-reads the gift and no-ops unless it is still
                // active, so a double-tapped CTA redeems exactly once.
                if (giftApplied > 0) {
                  redeemGift.mutate({
                    businessId,
                    voucherId: voucher.id,
                    subtotal,
                  });
                }

                navigate(`/${lang}/pay/voucher-success`, {
                  state: {
                    // These two were both `displayAmount`, so a 2×₪300 order
                    // already reported ₪300 paid. With a gift they must differ:
                    // face value received vs. cash actually charged.
                    voucherValue: subtotal,
                    amountPaid: total,
                    giftApplied,
                    cashback: cashbackAmount,
                    merchantName: business.name,
                    merchantNameHe: business.nameHe,
                    merchantLogo: business.logoUrl,
                    brandColor: voucher.brandColor ?? '#0a2540',
                    discountPercent: voucher?.discountPercent,
                    tier: currentTier ? (isHe ? currentTier.tierLabelHe : currentTier.tierLabelEn) : undefined,
                    // Custom-amount orders: what the member asked for vs. the
                    // fixed-denomination combination actually loaded.
                    requestedAmount: isCustom ? Math.ceil(customAmountNum) : undefined,
                    composition: isCustom && composition ? composition.parts : undefined,
                    paymentMethodId: selectedPayMethod?.id,
                    userVoucherId: newUserVoucher.id,
                    returnTo: `/${lang}/business/${businessId}`,
                  },
                });
              }}
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

      {/* ── Launch brands sheet ── */}
      {launchBrandsOpen && (
        <LaunchBrandsSheet
          isHe={isHe}
          brandIds={launchGift?.conditions.eligibleBrandIds ?? []}
          onClose={() => setLaunchBrandsOpen(false)}
        />
      )}

      {/* ── How it Works Sheet ── */}
      {howItWorksOpen && (
        <HowItWorksSheet isHe={isHe} businessName={isHe ? business.nameHe : business.name} onClose={() => setHowItWorksOpen(false)} />
      )}

      {/* ── Denominations Info Sheet ── */}
      {denomInfoOpen && (
        <DenominationsInfoSheet
          isHe={isHe}
          example={isCustom && composition && !composition.exact
            ? {
                typed: Math.ceil(customAmountNum),
                total: composition.total,
                partsLabel: formatCompositionParts(composition.parts),
              }
            : null}
          onClose={() => setDenomInfoOpen(false)}
        />
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
