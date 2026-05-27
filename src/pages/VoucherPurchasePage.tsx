import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { mockVouchers, mockVoucherVariants, defaultVoucherVariants } from '../mock/data/vouchers.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import type { VoucherVariant } from '../types/voucher.types';

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

function VoucherCardPreview({ amount, tier, merchantName, merchantLogo, brandColor, isCustom: _isCustom, isHe }: CardPreviewProps) {
  const bg = tier
    ? tier.gradient
    : `linear-gradient(135deg, ${brandColor || '#635bff'} 0%, ${brandColor ? brandColor + 'cc' : '#5649d8'} 100%)`;
  const accent = tier?.accent || '#fff';
  const pattern = tier?.pattern || 'stripes';
  return (
    <div
      className="relative w-full aspect-[1.7/1] rounded-3xl overflow-hidden shadow-lg shadow-black/15"
      style={{ background: bg }}
    >
      <PatternOverlay pattern={pattern} accent={accent} />

      {/* Shimmer effect for premium tiers */}
      {tier && (tier.tier === 'premium' || tier.tier === 'exclusive') && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        {/* Top row: merchant info + bare Nexus logo on the opposite side */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            {merchantLogo ? (
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden">
                <img src={merchantLogo} alt="" className="w-7 h-7 object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>storefront</span>
              </div>
            )}
            <span className="text-white/90 text-sm font-semibold">{merchantName}</span>
          </div>
          <img src="/nexus-logo-animated-white.gif" alt="Nexus" className="h-7 w-auto object-contain" />
        </div>

        {/* Bottom row: amount + nexus branding */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-white/60 text-xs font-medium mb-0.5">
              {isHe ? 'שווי הוואצ׳ר' : 'Voucher value'}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-4xl font-bold tracking-tight">
                {amount > 0 ? `₪${amount}` : '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-white/70" style={{ fontSize: 12 }}>verified</span>
            <span className="text-[9px] text-white/70 font-medium">
              {isHe ? 'מאובטח' : 'Secure'}
            </span>
          </div>
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

/* ─── Collapsible Section ─────────────────────────────────────────────── */

function CollapsibleSection({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white px-4 py-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full active:opacity-70 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-[#F4F4F4] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-gray-600" style={{ fontSize: 20 }}>{icon}</span>
        </div>
        <div className="font-bold text-sm flex-1 text-start">{title}</div>
        <span
          className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ fontSize: 20 }}
        >
          expand_more
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function VoucherPurchasePage() {
  const { lang = 'he', businessId, voucherId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Find voucher and business
  const voucher = useMemo(() => mockVouchers.find((v) => v.id === voucherId), [voucherId]);
  const business = useMemo(() => mockBusinesses.find((b) => b.id === businessId), [businessId]);

  // Variants for this merchant
  const variants = useMemo(() => {
    if (!voucher) return defaultVoucherVariants;
    return mockVoucherVariants[voucher.merchantName] || defaultVoucherVariants;
  }, [voucher]);

  // State
  const [selectedVariant, setSelectedVariant] = useState<VoucherVariant>(variants[0]);
  const [sheetVariant, setSheetVariant] = useState<VoucherVariant | null>(null);
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(2); // default ₪300
  const [customAmount, setCustomAmount] = useState<string>('');

  // Collapsible sections
  const [orderOpen, setOrderOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [validityOpen, setValidityOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [howOpen, setHowOpen] = useState(true);
  const [extraTermsOpen, setExtraTermsOpen] = useState(false);
  const [otherOffersOpen, setOtherOffersOpen] = useState(true);

  // Carousel refs and scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to selected card on mount
  useEffect(() => {
    const container = scrollRef.current;
    const card = cardRefs.current[selectedTierIdx];
    if (container && card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'instant' });
    }
  }, []);

  // Auto-scroll to the custom card whenever a custom amount is entered
  const customAmountNumForEffect = parseInt(customAmount, 10);
  const isCustomForEffect = Number.isFinite(customAmountNumForEffect) && customAmountNumForEffect > 0;
  useEffect(() => {
    if (!isCustomForEffect) return;
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const card = cardRefs.current[AMOUNT_TIERS.length];
      if (container && card) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    });
  }, [isCustomForEffect, customAmountNumForEffect]);

  // Detect which card is centered on scroll
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== selectedTierIdx) {
      setSelectedTierIdx(closestIndex);
    }
    // If user swiped away from the custom card back to a tier, clear the custom input
    if (closestIndex < AMOUNT_TIERS.length) {
      setCustomAmount((prev) => (prev ? '' : prev));
    }
  }, [selectedTierIdx]);

  // Debounced scroll handler
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(handleScroll, 50);
  }, [handleScroll]);

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
  const discount = selectedVariant.discountPercent ?? voucher.discountPercent;
  const discountedAmount = Math.round(displayAmount * (1 - discount / 100));

  const handleVariantClick = (v: VoucherVariant) => {
    setSelectedVariant(v);
    setSheetVariant(v);
  };

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
        {/* Discount badge */}
        <div className="flex items-center gap-2 mt-1">
          <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-green-300 me-1" style={{ fontSize: 14 }}>local_offer</span>
            <span className="text-[11px] font-semibold">
              {isHe ? `עד ${voucher.discountPercent}% הנחה` : `Up to ${voucher.discountPercent}% off`}
            </span>
          </div>
          <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-amber-300 me-1" style={{ fontSize: 14 }}>★</span>
            <span className="text-[11px] font-semibold">{business.rating}</span>
          </div>
        </div>
      </div>

      {/* ── Swipeable Voucher Card Carousel ── */}
      <div className="relative z-10 mt-4">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-2 pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {AMOUNT_TIERS.map((tier, index) => (
            <div
              key={tier.amount}
              ref={(el) => { cardRefs.current[index] = el; }}
              className="flex-shrink-0 w-full snap-center px-5"
            >
              <VoucherCardPreview
                amount={tier.amount}
                tier={tier}
                merchantName={isHe ? business.nameHe : business.name}
                merchantLogo={business.logoUrl}
                brandColor={voucher.brandColor}
                isCustom={false}
                isHe={isHe}
              />
            </div>
          ))}
          {isCustom && (
            <div
              key="custom"
              ref={(el) => { cardRefs.current[AMOUNT_TIERS.length] = el; }}
              className="flex-shrink-0 w-full snap-center px-5"
            >
              <VoucherCardPreview
                amount={customAmountNum}
                tier={null}
                merchantName={isHe ? business.nameHe : business.name}
                merchantLogo={business.logoUrl}
                brandColor={voucher.brandColor}
                isCustom={true}
                isHe={isHe}
              />
            </div>
          )}
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
      </div>

      {/* Scrollable content */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-40">
        <section className="mt-6 space-y-px overflow-hidden" style={{ backgroundColor: '#E5E5EA' }}>

          {/* Variant filter bar */}
          <div className="bg-white px-4 py-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <div className="p-2.5 border border-gray-800 rounded-xl shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
            </div>
            {variants.map((v) => {
              const isActive = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleVariantClick(v)}
                  className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 flex items-center gap-1.5 transition-all active:scale-95 ${
                    isActive ? 'bg-gray-900 text-white' : 'bg-[#F4F4F4] text-gray-800'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-gray-500'}`} style={{ fontSize: 16 }}>{v.icon}</span>
                  {isHe ? v.nameHe : v.name}
                  {v.discountPercent && (
                    <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-primary'}`}>-{v.discountPercent}%</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Price offer card */}
          <CollapsibleSection
            icon="receipt_long"
            title={isHe ? 'סיכום הזמנה' : 'Order Summary'}
            open={orderOpen}
            onToggle={() => setOrderOpen(!orderOpen)}
          >
            <div className="text-xs text-gray-500 mb-3">{isHe ? `הנחה ${discount}%` : `${discount}% discount`}</div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <div className="text-sm text-gray-600">{isHe ? 'שווי הכרטיס' : 'Card value'}</div>
                <div className="text-xs text-green-600 font-medium">{isHe ? `חיסכון ₪${displayAmount - discountedAmount}` : `Save ₪${displayAmount - discountedAmount}`}</div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-lg font-bold">₪{discountedAmount}</div>
                  <div className="text-[10px] text-gray-400 line-through">₪{displayAmount}</div>
                </div>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>chevron_forward</span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Conditions card */}
          <CollapsibleSection
            icon="verified"
            title={isHe ? 'תנאי שימוש' : 'Usage Terms'}
            open={termsOpen}
            onToggle={() => setTermsOpen(!termsOpen)}
          >
            {[
              { icon: 'storefront', label: isHe ? 'בחנויות פיזיות' : 'Physical stores', value: selectedVariant.conditions.usableInStore },
              { icon: 'language', label: isHe ? 'רכישה אונליין' : 'Online purchase', value: selectedVariant.conditions.usableOnline },
              { icon: 'sell', label: isHe ? 'חנויות עודפים' : 'Outlet stores', value: selectedVariant.conditions.usableAtOutlets },
              { icon: 'stacks', label: isHe ? 'כפל מבצעים' : 'Promotion stacking', value: selectedVariant.conditions.stackable },
            ].map((item, idx, arr) => (
              <div key={item.icon} className={`flex items-center justify-between py-3 ${idx < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>{item.icon}</span>
                  <span className={`text-sm ${item.value ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
                </div>
                <div className={`p-1.5 rounded-full ${item.value ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <span className={`material-symbols-outlined ${item.value ? 'text-green-600' : 'text-gray-400'}`} style={{ fontSize: 16 }}>
                    {item.value ? 'check_circle' : 'cancel'}
                  </span>
                </div>
              </div>
            ))}
          </CollapsibleSection>

          {/* Validity & terms banner */}
          <CollapsibleSection
            icon="schedule"
            title={`${isHe ? 'בתוקף עד' : 'Valid until'} ${new Date(voucher.validUntil).toLocaleDateString(isHe ? 'he-IL' : 'en-IL')}`}
            open={validityOpen}
            onToggle={() => setValidityOpen(!validityOpen)}
          >
            <p className="text-xs text-gray-500 leading-relaxed">
              {isHe ? voucher.termsAndConditionsHe : voucher.termsAndConditions}
            </p>
          </CollapsibleSection>

          {/* About business */}
          <div className="mt-3">
            <CollapsibleSection
              icon="store"
              title={isHe ? 'על בית העסק' : 'About the business'}
              open={aboutOpen}
              onToggle={() => setAboutOpen(!aboutOpen)}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F4F4] flex items-center justify-center shrink-0 overflow-hidden">
                  {business.logoUrl ? (
                    <img src={business.logoUrl} alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">{business.logo}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{isHe ? business.nameHe : business.name}</div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3">
                    {isHe ? business.descriptionHe : business.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/${lang}/business/${businessId}`)}
                className="mt-3 w-full bg-[#F4F4F4] hover:bg-gray-200 transition-colors text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>{isHe ? 'לדף בית העסק' : 'Go to business page'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {isHe ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </CollapsibleSection>
          </div>

          {/* How it works */}
          <div className="mt-3">
            <CollapsibleSection
              icon="help"
              title={isHe ? 'איך זה עובד?' : 'How it works'}
              open={howOpen}
              onToggle={() => setHowOpen(!howOpen)}
            >
              <ol className="space-y-3">
                {[
                  {
                    he: 'בחר את הסכום הרצוי וצור את הכרטיס',
                    en: 'Choose your amount and create the card',
                  },
                  {
                    he: 'הכרטיס נטען מיד לארנק שלך',
                    en: 'The card is instantly loaded to your wallet',
                  },
                  {
                    he: `שלם איתו בסניפי ${isHe ? business.nameHe : business.name} בקופה`,
                    en: `Pay with it at ${business.name} stores at checkout`,
                  },
                  {
                    he: 'תיהנה מהקאשבק שמתווסף לארנק',
                    en: 'Enjoy the cashback added to your wallet',
                  },
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {isHe ? step.he : step.en}
                    </p>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          </div>

          {/* Additional terms */}
          <div className="mt-3">
            <CollapsibleSection
              icon="gavel"
              title={isHe ? 'תנאים נוספים' : 'Additional terms'}
              open={extraTermsOpen}
              onToggle={() => setExtraTermsOpen(!extraTermsOpen)}
            >
              <ul className="space-y-2 text-xs text-gray-500 leading-relaxed list-disc ps-5">
                <li>{isHe ? 'הכרטיס אישי ואינו ניתן להעברה.' : 'The card is personal and non-transferable.'}</li>
                <li>{isHe ? 'לא ניתן להמיר את הכרטיס למזומן.' : 'The card cannot be redeemed for cash.'}</li>
                <li>{isHe ? 'יתרת הכרטיס תקפה עד מועד הפקיעה המצוין בכרטיס.' : 'Card balance is valid until the expiration date shown on the card.'}</li>
                <li>{isHe ? 'במקרה של אובדן או גניבה ניתן לחסום את הכרטיס מתוך האפליקציה.' : 'In case of loss or theft, the card can be blocked from within the app.'}</li>
                <li>{isHe ? 'נקסוס שומרת על הזכות לשנות את תנאי הכרטיס בהודעה מוקדמת.' : 'Nexus reserves the right to modify card terms with prior notice.'}</li>
              </ul>
            </CollapsibleSection>
          </div>

          {/* Other offers */}
          {(() => {
            const otherVouchers = mockVouchers.filter((v) => v.id !== voucher.id).slice(0, 6);
            if (otherVouchers.length === 0) return null;
            return (
              <div className="mt-3">
                <CollapsibleSection
                  icon="local_offer"
                  title={isHe ? 'הצעות אחרות' : 'Other offers'}
                  open={otherOffersOpen}
                  onToggle={() => setOtherOffersOpen(!otherOffersOpen)}
                >
                  <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory">
                    {otherVouchers.map((v) => {
                      const otherBusiness = mockBusinesses.find((b) => b.name === v.merchantName);
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            if (otherBusiness) {
                              navigate(`/${lang}/business/${otherBusiness.id}/voucher/${v.id}`);
                            }
                          }}
                          className="flex-none w-[65vw] max-w-[260px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform flex flex-col"
                        >
                          {/* Image area */}
                          <div className="relative bg-surface overflow-hidden" style={{ height: '18vh' }}>
                            {v.imageUrl ? (
                              <img src={v.imageUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span style={{ fontSize: 48 }}>{v.image}</span>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                            {/* Brand logo */}
                            {v.brandLogo && (
                              <div
                                className="absolute top-2.5 start-2.5 z-10 w-9 h-9 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: v.brandColor || '#FFFFFF' }}
                              >
                                <img src={v.brandLogo} alt={v.merchantName} className="w-[80%] h-[80%] object-contain" />
                              </div>
                            )}
                            {/* Discount badge */}
                            {v.discountPercent > 0 && (
                              <div className="absolute top-2.5 end-2.5 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700">
                                  {v.discountPercent}%
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Bottom info */}
                          <div className="px-3 py-3">
                            <p className="text-[10px] text-text-secondary leading-tight">{v.merchantName}</p>
                            <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug mt-0.5">
                              {isHe ? v.titleHe : v.title}
                            </p>
                            <p className="text-sm font-bold text-primary mt-0.5">₪{v.discountedPrice}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              </div>
            );
          })()}

        </section>
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
            {displayAmount - discountedAmount > 0 && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-0 w-[82%]">
                <div
                  key={displayAmount - discountedAmount}
                  className="flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 px-4 py-2 pb-9 rounded-t-2xl origin-bottom"
                  style={{ animation: 'cashback-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <span className="text-base text-green-700 font-medium leading-none">{isHe ? 'תקבל' : 'Get'}</span>
                  <span className="text-lg font-black text-green-600 leading-none">₪{displayAmount - discountedAmount}</span>
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
