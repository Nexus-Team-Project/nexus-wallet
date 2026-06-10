import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import { useUser } from '../hooks/useUser';
import AddressSheet, { type Address } from '../components/business/AddressSheet';
import AddressMapThumb from '../components/business/AddressMapThumb';
import SlideToConfirm from '../components/business/SlideToConfirm';
import FeesInfoSheet from '../components/business/FeesInfoSheet';
import PaymentsPlanSheet from '../components/business/PaymentsPlanSheet';
import PaymentsSchedule from '../components/business/PaymentsSchedule';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';
import AutoCarousel from '../components/ui/AutoCarousel';
import groupsAnim from '../assets/animations/action-groups.json?url';
import { resolveGiftCard } from '../data/giftCards';
import { useTenantStore } from '../stores/tenantStore';
import type { GiftDetails } from './GiftDetailsPage';
import AnimatedActionIcon from '../components/layout/AnimatedActionIcon';
import giftActionUrl from '../assets/animations/action-gift.json?url';
import AnimatedLocationIcon from '../components/ui/AnimatedLocationIcon';

/**
 * BusinessCheckoutPage — "Review & Pay" screen.
 *
 * Reached from the product page's quick-buy sheet ("Continue to checkout").
 * Mirrors the Rhode Review-&-Pay layout adapted to nexus-wallet conventions
 * (RTL/bilingual, max-w-md frame, brand tokens, Material symbols). The
 * AppLayout suppresses its global chrome for this route so the page owns its
 * own sticky header + fixed pay bar.
 *
 * Pay now → a short processing state → the order-confirmation screen.
 */

const FREE_SHIPPING_THRESHOLD = 150;

type ShippingId = 'priority' | 'standard' | 'scheduled';

// Flat surcharge for the faster "Priority" option, on top of the base
// (standard) shipping cost.
const PRIORITY_SURCHARGE = 15;

// Fallback map center (Tel Aviv) for addresses typed manually without coords.
const DEFAULT_CENTER = { lng: 34.7818, lat: 32.0853 };

export default function BusinessCheckoutPage() {
  const { businessId, productId } = useParams<{ businessId: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { data: user } = useUser();
  const tenantConfig = useTenantStore((s) => s.config);

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const navState = location.state as { qty?: number; color?: { hex: string; name: string }; gift?: GiftDetails } | null;
  const qty = Math.max(1, navState?.qty ?? 1);
  // Selected colour variant carried over from the product page (swatch + name).
  // Falls back to a default so the order summary always shows the chosen colour
  // even when the checkout is opened directly (no navigation state).
  const selectedColor = navState?.color ?? { hex: '#A14D3A', name: isHe ? 'חימר' : 'Clay' };

  const [addresses, setAddresses] = useState<Address[]>([
    { id: 'home', label: isHe ? 'בית' : 'Home', line: isHe ? 'הרצל 45, תל אביב' : '45 Herzl St, Tel Aviv', coords: { lng: 34.7706, lat: 32.0632 } },
    { id: 'work', label: isHe ? 'עבודה' : 'Work', line: isHe ? 'רוטשילד 12, תל אביב' : '12 Rothschild Blvd, Tel Aviv', coords: { lng: 34.7710, lat: 32.0644 } },
    { id: 'parents', label: isHe ? 'הורים' : 'Parents', line: isHe ? 'דיזנגוף 100, תל אביב' : '100 Dizengoff St, Tel Aviv', coords: { lng: 34.7740, lat: 32.0790 } },
    { id: 'gym', label: isHe ? 'חדר כושר' : 'Gym', line: isHe ? 'ויצמן 15, חיפה' : '15 Weizmann St, Haifa', coords: { lng: 34.9896, lat: 32.7940 } },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState('home');
  // Per-address replay counter — bumped only for the address the user just
  // tapped, so only that pin re-animates (not the one being deselected).
  const [addrAnimTick, setAddrAnimTick] = useState<Record<string, number>>({});
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(true);
  const [addressOpen, setAddressOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [paymentsInfoOpen, setPaymentsInfoOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [feesInfoOpen, setFeesInfoOpen] = useState(false);
  const [paymentsSheetOpen, setPaymentsSheetOpen] = useState(false);
  const [paymentsCount, setPaymentsCount] = useState(1);
  const [cashbackDismissed, setCashbackDismissed] = useState(false);
  const [caresDismissed, setCaresDismissed] = useState(false);
  const { data: paymentMethods } = usePaymentMethods();
  const [payMethodId, setPayMethodId] = useState(paymentMethods[0]?.id ?? '');
  const selectedPayMethod = paymentMethods.find((m) => m.id === payMethodId) ?? paymentMethods[0];

  // Instant-pay wallets (Bit / PayBox). Greyed out until "connected"; once
  // linked they gain their brand colour and become selectable like a card.
  const [connectedWallets, setConnectedWallets] = useState<Record<string, boolean>>({ bit: false, paybox: false });
  const walletOptions: { id: string; label: string; labelHe: string; color: string; logo?: string }[] = [
    { id: 'bit', label: 'bit', labelHe: 'ביט', color: '#E5007D', logo: '/logos/bit.png' },
    { id: 'paybox', label: 'payBox', labelHe: 'פייבוקס', color: '#19A7CE', logo: '/logos/paybox.webp' },
  ];
  const walletMethod = walletOptions.find((w) => w.id === payMethodId && connectedWallets[w.id]);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const mapCenter = selectedAddress?.coords ?? DEFAULT_CENTER;

  const [shipping, setShipping] = useState<ShippingId>('standard');
  const [instructions, setInstructions] = useState('');
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);

  const [marketing, setMarketing] = useState(false);

  // "Send as a gift" — the order carries gift details (chosen on the dedicated
  // gift-details page). Pre-filled from nav state when returning from that page.
  const [giftDetails] = useState<GiftDetails | null>(navState?.gift ?? null);
  const giftMode = !!giftDetails;
  // The chosen gift-card design — drives the thumbnail in the gift row.
  const giftCard = giftDetails ? resolveGiftCard(giftDetails.cardId, tenantConfig) : null;

  // "Nexus cares" — opt in to round the order up for a cause.
  const [roundUp, setRoundUp] = useState(false);

  // Courier tip — a preset amount or a manually-typed custom amount.
  const [tipOpen, setTipOpen] = useState(true);
  const [tipPreset, setTipPreset] = useState<number | 'custom'>(10);
  const [customTip, setCustomTip] = useState('');

  const [discountInput, setDiscountInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);

  if (!business || !product) return <Navigate to=".." replace />;

  const cur = product.currency;
  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;

  // "Just one more thing" cross-sell — a few other in-stock items from the
  // same business (the current product excluded), capped so the strip stays
  // a quick add-on glance rather than a full catalog.
  const upsellProducts = (business.products ?? [])
    .filter((p) => p.id !== product.id && p.inStock)
    .slice(0, 3);

  const subtotal = product.price * qty;
  const standardCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 25;
  const shippingOptions: {
    id: ShippingId;
    label: string;
    note: string;
    cost: number;
    fast?: boolean;
    scheduled?: boolean;
  }[] = [
    {
      id: 'priority',
      label: isHe ? 'מהיר' : 'Priority',
      note: isHe ? '1-2 ימי עסקים' : '1-2 business days',
      cost: standardCost + PRIORITY_SURCHARGE,
      fast: true,
    },
    {
      id: 'standard',
      label: isHe ? 'רגיל' : 'Standard',
      note: isHe ? '3-5 ימי עסקים' : '3-5 business days',
      cost: standardCost,
    },
    {
      id: 'scheduled',
      label: isHe ? 'מתוזמן' : 'Scheduled',
      note: isHe ? 'בחירת תאריך ושעה' : 'Select a date and time',
      cost: standardCost,
      scheduled: true,
    },
  ];
  const selectedShipping = shippingOptions.find((o) => o.id === shipping) ?? shippingOptions[1];

  // 10% off on any applied code — purely a mock flourish.
  const discount = appliedCode ? Math.round(subtotal * 0.1) : 0;
  // Estimated taxes — rough VAT-style estimate on the discounted goods total.
  const taxes = Math.round((subtotal - discount) * 0.17);
  // Service (operation) fee — 5% of the goods total, capped at a small max.
  const serviceFee = Math.min(6, Math.round(subtotal * 0.05));
  // Courier tip — resolved from the selected preset or the custom field.
  const tip = tipPreset === 'custom'
    ? Math.max(0, Math.round(Number(customTip) || 0))
    : tipPreset;
  const baseTotal = subtotal + selectedShipping.cost + taxes + serviceFee + tip - discount;

  // "Nexus cares" round-up — opt in to round the order up to the next ₪10 and
  // donate the difference to a cause. Falls back to a full ₪10 when the base
  // already lands on a round number so there's always something to give.
  const roundedUpTotal = baseTotal % 10 === 0 ? baseTotal + 10 : Math.ceil(baseTotal / 10) * 10;
  const roundUpDonation = roundUp ? roundedUpTotal - baseTotal : 0;
  const total = baseTotal + roundUpDonation;

  // Loyalty cashback shown in the info banner (3% of total).
  const cashbackAmount = Math.max(1, Math.round(total * 0.03));

  const fmt = (n: number) => `${cur}${n.toLocaleString()}`;
  const shippingLabel = selectedShipping.cost === 0
    ? (isHe ? 'חינם' : 'Free')
    : fmt(selectedShipping.cost);

  const handleApply = () => {
    const code = discountInput.trim();
    if (!code) return;
    setAppliedCode(code.toUpperCase());
  };

  const handlePay = () => {
    if (paying) return;
    setPaying(true);
    window.setTimeout(() => {
      navigate(`/${language}/business/${business.id}/product/${product.id}/order-confirmed`, {
        replace: true,
        state: {
          qty,
          total,
          shippingLabel,
          address: selectedAddress?.line,
        },
      });
    }, 1200);
  };

  return (
    <div className="relative min-h-dvh bg-white flex flex-col overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Decorative gradient glow — same treatment as the home page: a tall
          warm-to-cool wash at the top, faded into the white page below. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0">
        <div
          className="w-full h-full opacity-[0.18]"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Close — stays pinned at the top while the page scrolls (topmost),
          floating over the decorative gradient. Negative bottom margin cancels
          its height so the non-sticky title below stays on the same line. */}
      <button
        onClick={() => navigate(-1)}
        aria-label={isHe ? 'סגירה' : 'Close'}
        className="sticky top-4 z-30 self-start ms-4 mt-4 -mb-9 h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:bg-surface transition-colors"
      >
        <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>close</span>
      </button>

      {/* Header — non-sticky title, sitting over the decorative top gradient. */}
      <header className="relative z-20 px-4 pt-4 pb-4 flex items-center justify-center bg-transparent">
        <h1 className="text-lg font-bold text-text-primary">{isHe ? 'סקירה ותשלום' : 'Review & Pay'}</h1>
      </header>

      <main className="relative z-10 flex-grow px-5 pb-36">
        {/* Customer — collapsible card */}
        <section className="mt-5">
          <button
            onClick={() => setCustomerOpen((v) => !v)}
            aria-expanded={customerOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'לקוח' : 'Customer'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 22, transform: customerOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {customerOpen && (
            <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-text-primary truncate">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || (isHe ? 'אורח' : 'Guest')}
                  </p>
                  <p className="text-sm text-text-muted truncate" dir="ltr">{user?.email ?? 'user@example.com'}</p>
                  {user?.phone && <p className="text-sm text-text-muted" dir="ltr">{user.phone}</p>}
                </div>
                <button
                  onClick={() => navigate(`/${language}/profile`)}
                  className="shrink-0 border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary active:bg-surface transition-colors"
                >
                  {isHe ? 'שינוי' : 'Change'}
                </button>
              </div>
            </div>
          )}

          {/* Send as a gift — opens the dedicated gift-details page. Once gift
              details are saved, the row shows a summary + edit/remove controls. */}
          <div className="relative mt-3 w-full rounded-2xl border border-border bg-white shadow-sm transition-colors">
            <button
              type="button"
              onClick={() =>
                navigate(`/${language}/business/${business.id}/product/${product.id}/gift`, {
                  state: { qty, color: selectedColor, gift: giftDetails },
                })
              }
              aria-pressed={giftMode}
              className="w-full flex items-stretch text-sm font-semibold active:bg-black/[0.03] transition-colors"
            >
              <span className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3 text-text-primary">
                {/* Wired gift Lottie (same artwork as the chat "send a gift"
                    quick action) — plays on mount and replays on press. */}
                <span className="shrink-0">
                  <AnimatedActionIcon src={giftActionUrl} size={22} />
                </span>
                <span className="flex flex-col min-w-0 text-start">
                  <span className="text-[15px] font-bold truncate">
                    {giftMode && giftDetails
                      ? (isHe
                          ? `מתנה ל${giftDetails.recipientName || 'הנמען/ת'}`
                          : `Gift for ${giftDetails.recipientName || 'recipient'}`)
                      : (isHe ? 'שליחה כמתנה' : 'Send as a gift')}
                  </span>
                  {giftMode && giftDetails?.recipientPhone && (
                    <span className="text-sm font-normal text-text-muted truncate">
                      {giftDetails.recipientPhone}
                    </span>
                  )}
                </span>
              </span>

              {giftMode && giftCard ? (
                /* A faithful miniature of the whole gift card — a portrait card
                   (store logo, illustration, Nexus wordmark on its gradient)
                   floating in the row, with a small edit badge in the corner. */
                <span className="shrink-0 flex items-center self-stretch pe-3 ps-1 py-2">
                  <span
                    className="relative w-12 aspect-[3/4] rounded-xl overflow-hidden shadow-md ring-1 ring-black/5 flex flex-col items-center justify-between px-1 py-1.5"
                    style={{ background: giftCard.gradient }}
                  >
                    {business.logoUrl ? (
                      <img src={business.logoUrl} alt="" aria-hidden className="h-3 max-w-full object-contain" />
                    ) : (
                      <span className="h-3" />
                    )}
                    <img src={giftCard.image} alt="" aria-hidden className="w-7 h-7 object-contain drop-shadow-sm" />
                    <img
                      src="/nexus-white-wide-logo.png"
                      alt=""
                      aria-hidden
                      className="h-1.5 w-auto object-contain"
                      style={giftCard.ink !== '#ffffff' ? { filter: 'brightness(0)', opacity: 0.7 } : { opacity: 0.9 }}
                    />
                    <span
                      className="absolute top-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/45 backdrop-blur-sm shadow"
                      style={{ insetInlineStart: 2 }}
                    >
                      <span className="material-symbols-rounded text-white" style={{ fontSize: 11 }}>edit</span>
                    </span>
                  </span>
                </span>
              ) : (
                <span className="flex items-center pe-4 ps-2 text-text-muted">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    {isHe ? 'chevron_left' : 'chevron_right'}
                  </span>
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ── Delivery address ── */}
        <section className="mt-6">
          <button
            onClick={() => setAddressOpen((v) => !v)}
            aria-expanded={addressOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'כתובת למשלוח' : 'Delivery address'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 22, transform: addressOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {addressOpen && (
          <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
            {/* Real map — mirrors the business-page "locations" map: flies to
                the active address, with a loading shimmer until tiles load. */}
            <div className="relative rounded-2xl overflow-hidden border border-border/30 h-[220px] mb-4">
              <AddressMapThumb
                lng={mapCenter.lng}
                lat={mapCenter.lat}
                avatarUrl={user?.avatar}
                onLoad={() => setMapReady(true)}
                className="w-full h-full"
                // Static — only recenters when a different address card is
                // picked (via flyTo); the user can't pan/zoom it by hand.
                interactive={false}
              />
              {/* Plain gray loading box with a sweeping glow; fades out once the
                  interactive GL map has loaded. */}
              <div
                aria-hidden
                className="absolute inset-0 z-[5] pointer-events-none overflow-hidden bg-[#e9eaef] transition-opacity duration-500"
                style={{ opacity: mapReady ? 0 : 1 }}
              >
                <div
                  className="absolute inset-y-0 w-2/3"
                  style={{
                    background:
                      'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                    animation: 'map-shimmer 1.4s ease-in-out infinite',
                  }}
                />
              </div>
            </div>

            {/* Saved-address cards — horizontal carousel (mirrors the branch
                "locations" section). Sits snug under the map; selecting a card
                recenters it. */}
            <div className="-mx-4 px-4 mb-4 border-b border-border/60 pb-4">
              <div className="flex overflow-x-auto scrollbar-hide gap-3 snap-x snap-mandatory scroll-px-4 pb-1">
                {addresses.map((addr) => {
                  const active = addr.id === selectedAddressId;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setAddrAnimTick((m) => ({ ...m, [addr.id]: (m[addr.id] ?? 0) + 1 }));
                      }}
                      className={`flex-none w-48 snap-start text-start rounded-2xl border-2 p-3 transition-colors active:scale-[0.99] ${
                        active ? 'border-primary shadow-md bg-primary/5' : 'border-border/40 shadow-sm bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 mb-1.5">
                        <AnimatedLocationIcon size={18} className={active ? 'text-primary' : 'text-text-muted'} playKey={addrAnimTick[addr.id] ?? 0} />
                        {active && (
                          <span className="material-symbols-rounded text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </span>
                      <span className="block text-sm font-bold text-text-primary">{addr.label}</span>
                      <span className="block text-xs text-text-muted leading-snug">{addr.line}</span>
                    </button>
                  );
                })}
                {/* Add a new address — last card (the other side in RTL). */}
                <button
                  onClick={() => setAddressSheetOpen(true)}
                  className="flex-none w-32 snap-start rounded-2xl bg-surface flex flex-col items-center justify-center gap-2 py-5 active:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>add</span>
                  <span className="text-xs font-semibold text-text-primary text-center leading-tight">{isHe ? 'הוספת כתובת' : 'Add address'}</span>
                </button>
              </div>
            </div>

            {/* Delivery instructions — floating-label field */}
            <div className="relative border border-border rounded-xl px-3 pt-4 pb-2.5 mb-4">
              <span
                className="absolute -top-2 bg-white px-1 text-[10px] text-text-muted"
                style={{ insetInlineStart: 10 }}
              >
                {isHe ? 'הוראות למשלוח' : 'Delivery instructions'}
              </span>
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={isHe ? 'לדוגמה: השאירו בלובי' : 'e.g. Meet me at the lobby'}
                className="w-full text-sm font-medium text-text-primary bg-transparent outline-none placeholder:font-normal placeholder:text-text-muted"
              />
            </div>

            {/* Leave at the door — toggle */}
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <span className="flex items-center gap-3">
                <span className="material-symbols-rounded text-text-secondary" style={{ fontSize: 22 }}>door_front</span>
                <span className="text-sm text-text-primary">{isHe ? 'השאירו ליד הדלת' : 'Leave at the door'}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={leaveAtDoor}
                aria-label={isHe ? 'השאירו ליד הדלת' : 'Leave at the door'}
                onClick={() => setLeaveAtDoor((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${leaveAtDoor ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ insetInlineStart: 2, transform: `translateX(${leaveAtDoor ? (isHe ? -20 : 20) : 0}px)` }}
                />
              </button>
            </div>
          </div>
          )}
        </section>

        {/* ── Delivery options ── */}
        <section className="mt-8">
          <button
            onClick={() => setOptionsOpen((v) => !v)}
            aria-expanded={optionsOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'מתי?' : 'When?'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 22, transform: optionsOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {optionsOpen && (
          <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
            {shippingOptions.map((opt) => {
              const active = opt.id === shipping;
              return (
                <button
                  key={opt.id}
                  onClick={() => setShipping(opt.id)}
                  className={`w-full flex items-center justify-between gap-3 p-4 text-start transition-colors ${
                    active
                      ? 'border-2 border-bg-dark'
                      : 'border-b border-border/60 last:border-b-0 active:bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {/* Selection mark — the same check_circle used in the other
                        sections (address, payment) so it reads consistently. */}
                    {active ? (
                      <span
                        className="material-symbols-rounded text-primary shrink-0"
                        style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    ) : (
                      <span className="w-[18px] h-[18px] shrink-0" aria-hidden />
                    )}
                    <span className="flex flex-col min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-text-primary">{opt.label}</span>
                        <span className="text-xs text-text-muted">{opt.note}</span>
                        {opt.fast && (
                          <span className="material-symbols-rounded text-amber-500" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                            bolt
                          </span>
                        )}
                      </span>
                      {opt.fast && (
                        <span className="text-[10px] text-text-muted underline">
                          {isHe ? 'קבלו את ההזמנה מהר יותר' : 'Get your order faster'}
                        </span>
                      )}
                    </span>
                  </span>
                  {opt.id === 'priority' ? (
                    <span className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-bold text-text-primary shrink-0 whitespace-nowrap">
                      + {fmt(PRIORITY_SURCHARGE)}
                    </span>
                  ) : opt.scheduled ? (
                    <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 18 }}>
                      {isHe ? 'chevron_left' : 'chevron_right'}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          )}
        </section>

        {/* ── Payment method ── */}
        <section className="mt-8">
          <button
            onClick={() => setPaymentOpen((v) => !v)}
            aria-expanded={paymentOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'אמצעי תשלום' : 'Payment method'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 22, transform: paymentOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {paymentOpen && (
          <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
            {/* Selected method row — shows the chosen wallet (Bit/PayBox) when
                one is selected, otherwise the chosen card. */}
            {(walletMethod || selectedPayMethod) && (
              <div className="w-full flex items-center gap-3 text-start pb-4 border-b border-border/60">
                <span className="relative shrink-0">
                  {walletMethod ? (
                    <span className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 h-10 min-w-[64px]">
                      <span className="text-sm font-black lowercase leading-none" style={{ color: walletMethod.color }}>
                        {walletMethod.label}
                      </span>
                      {walletMethod.logo && (
                        <img
                          src={walletMethod.logo}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                          onLoad={(e) => {
                            if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1';
                          }}
                        />
                      )}
                    </span>
                  ) : (
                    <PaymentBrandMark brand={selectedPayMethod.brand} />
                  )}
                  <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                    <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  </span>
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block text-[15px] font-bold text-text-primary truncate">
                    {walletMethod
                      ? (isHe ? walletMethod.labelHe : walletMethod.label)
                      : (isHe ? selectedPayMethod.labelHe : selectedPayMethod.label)}
                  </span>
                  {!walletMethod && selectedPayMethod.last4 && (
                    <span className="block text-xs text-text-muted" dir="ltr">···· {selectedPayMethod.last4}</span>
                  )}
                </span>
              </div>
            )}

            {/* Method options — horizontal carousel sourced from the wallet
                payment-methods page; the "Add" tile continues at the end. */}
            <div className="-mx-4 px-4 mt-4">
              <div className="flex overflow-x-auto overscroll-x-contain scrollbar-hide gap-3 snap-x snap-proximity scroll-px-4 pb-1 touch-pan-x">
                {paymentMethods.map((m) => {
                  const active = m.id === payMethodId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethodId(m.id)}
                      className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${
                        active ? 'border-primary shadow-sm' : 'border-border'
                      }`}
                    >
                      <PaymentBrandMark brand={m.brand} />
                      <span className="text-xs font-medium text-text-secondary text-center leading-tight truncate w-full" dir="ltr">
                        {m.last4 ? `···· ${m.last4}` : (isHe ? m.labelHe : m.label)}
                      </span>
                    </button>
                  );
                })}

                {/* Instant-pay wallets — Bit & PayBox. Greyed out until linked;
                    tapping an unlinked one "connects" it (gains brand colour),
                    after which tapping selects it as the payment method. */}
                {walletOptions.map((w) => {
                  const connected = connectedWallets[w.id];
                  const active = connected && payMethodId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        connected
                          ? setPayMethodId(w.id)
                          : setConnectedWallets((prev) => ({ ...prev, [w.id]: true }))
                      }
                      className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${
                        active ? 'border-primary shadow-sm' : 'border-border'
                      }`}
                    >
                      <span
                        className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-1.5 h-9 min-w-[64px] transition-all"
                        style={{ filter: connected ? 'none' : 'grayscale(1)', opacity: connected ? 1 : 0.55 }}
                      >
                        {/* Styled wordmark base; the real logo (when available)
                            loads on top and covers it. */}
                        <span
                          className="text-sm font-black lowercase leading-none"
                          style={{ color: connected ? w.color : '#9ca3af' }}
                        >
                          {w.label}
                        </span>
                        {w.logo && (
                          <img
                            src={w.logo}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                            onLoad={(e) => {
                              if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1';
                            }}
                          />
                        )}
                      </span>
                      <span
                        className="text-xs font-medium text-center leading-tight truncate w-full inline-flex items-center justify-center gap-0.5"
                        style={{ color: connected ? 'var(--color-text-secondary)' : '#9ca3af' }}
                      >
                        {connected ? (
                          isHe ? w.labelHe : w.label
                        ) : (
                          <>
                            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>link</span>
                            {isHe ? 'לחיבור' : 'Connect'}
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}

                {/* Add a new method tile */}
                <button
                  type="button"
                  onClick={() => navigate(`/${language}/wallet/add-payment-method`)}
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

        {/* ── Nexus Payments — installments + split, in a swipeable slider ── */}
        <section className="mt-8">
          <div className="relative w-full flex items-center gap-1.5 mb-3">
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'תשלומים' : 'Payments'}</h2>
            {/* "?" info — explains how the installment charges work. */}
            <button
              type="button"
              onClick={() => setPaymentsInfoOpen((v) => !v)}
              aria-label={isHe ? 'מידע על התשלומים' : 'About payments'}
              aria-expanded={paymentsInfoOpen}
              className="w-6 h-6 inline-flex items-center justify-center rounded-full text-text-muted active:bg-surface transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>help</span>
            </button>

            {/* Info popover — tap outside to dismiss. */}
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

          {/* Swipeable slider — each payment option is its own card slide. */}
          <div className="-mx-5 px-5 flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-5 items-stretch py-1">
            {/* Installments */}
            <div className="relative snap-start shrink-0 w-[88%] border border-border rounded-2xl bg-white shadow-sm p-4 flex flex-col">
              {/* Sky-blue Nexus mark — top-left corner */}
              <span className="absolute top-3 left-3 inline-flex items-center bg-sky-300 rounded-lg px-3 py-1.5">
                <img src="/nexus-logo-black.png" alt="Nexus" className="h-5 w-auto object-contain" />
              </span>

              <h3 className="text-[15px] font-bold text-text-primary mb-3">
                {isHe ? 'חלוקה לתשלומים' : 'Split into payments'}
              </h3>

              {/* Current plan + white "Change" button */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-text-primary">
                  {paymentsCount === 1
                    ? (isHe ? 'תשלום אחד' : 'One payment')
                    : (isHe
                        ? `${paymentsCount} תשלומים של ${fmt(Math.round(total / paymentsCount))}`
                        : `${paymentsCount} payments of ${fmt(Math.round(total / paymentsCount))}`)}
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentsSheetOpen(true)}
                  className="shrink-0 bg-white border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary active:bg-surface transition-colors"
                >
                  {isHe ? 'שינוי' : 'Change'}
                </button>
              </div>
            </div>

            {/* Split the order between several people — opens the split-bill screen */}
            <button
              type="button"
              onClick={() =>
                navigate(`/${language}/business/${business.id}/product/${product.id}/split`, {
                  state: { total },
                })
              }
              className="relative snap-start shrink-0 w-[88%] flex flex-col border border-border rounded-2xl bg-white shadow-sm p-4 text-start active:bg-black/[0.02] transition-colors"
            >
              {/* Sky-blue Nexus mark — top-left corner */}
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

              {/* "Split" — white button, bottom-left corner */}
              <span className="self-end mt-auto inline-flex items-center bg-white border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary">
                {isHe ? 'פצל' : 'Split'}
              </span>
            </button>
          </div>

          {/* Installment schedule — a full-width card snug under the slider,
              shown once more than one payment is chosen. */}
          {paymentsCount > 1 && (
            <div className="mt-3 w-full border border-border rounded-2xl bg-white shadow-sm p-4">
              <h3 className="text-[15px] font-bold text-text-primary mb-3">
                {isHe ? 'לוח התשלומים' : 'Payment schedule'}
              </h3>
              <PaymentsSchedule currency={cur} total={total} count={paymentsCount} compact />
            </div>
          )}
        </section>

        {/* Courier tip */}
        <section className="mt-9">
          <button
            onClick={() => setTipOpen((v) => !v)}
            aria-expanded={tipOpen}
            className="w-full flex items-center justify-between gap-3 mb-3"
          >
            <h2 className="text-lg font-bold text-text-primary">{isHe ? 'טיפ' : 'Tip'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 24, transform: tipOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {tipOpen && (
            <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
              <div className="flex gap-2">
                {[0, 5, 10, 15].map((amt) => {
                  const active = tipPreset === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipPreset(amt)}
                      className={`flex-1 rounded-2xl py-3 text-sm font-bold border transition-colors ${
                        active
                          ? 'bg-bg-dark text-white border-bg-dark'
                          : 'bg-surface text-text-primary border-transparent active:bg-primary/5'
                      }`}
                    >
                      {amt === 0 ? (isHe ? 'ללא' : 'None') : fmt(amt)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setTipPreset('custom')}
                  aria-label={isHe ? 'סכום אחר' : 'Other amount'}
                  className={`flex-1 rounded-2xl py-3 flex items-center justify-center border transition-colors ${
                    tipPreset === 'custom'
                      ? 'bg-bg-dark text-white border-bg-dark'
                      : 'bg-surface text-text-primary border-transparent active:bg-primary/5'
                  }`}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>edit</span>
                </button>
              </div>
              {tipPreset === 'custom' && (
                <div className="relative mt-3">
                  <span className="absolute inset-y-0 start-4 flex items-center text-text-muted text-sm font-semibold pointer-events-none">
                    {cur}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder={isHe ? 'הזן סכום' : 'Enter amount'}
                    className="w-full bg-surface border border-transparent rounded-2xl ps-9 pe-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Promo gallery — auto-rotating + swipeable: loyalty cashback and the
            "Nexus cares" round-up-for-a-cause banner share one slot. */}
        {(!cashbackDismissed || !caresDismissed) && (
        <AutoCarousel className="mt-6">
          {!cashbackDismissed && (
            <div
              className="relative w-full h-full overflow-hidden rounded-2xl p-5 pe-36 min-h-[120px] flex flex-col justify-center"
              style={{ background: 'linear-gradient(135deg, #EEF0FF 0%, #F1ECFF 55%, #ECEBFF 100%)' }}
            >
              {/* Dismiss — gray circle with an X in the corner. */}
              <button
                type="button"
                onClick={() => setCashbackDismissed(true)}
                aria-label={isHe ? 'סגירה' : 'Dismiss'}
                className="absolute top-2 end-2 z-10 w-6 h-6 rounded-full bg-black/10 text-text-secondary flex items-center justify-center active:bg-black/20 transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
              </button>

              <p className="text-[15px] font-bold text-text-primary leading-snug">
                {isHe
                  ? <>תקבל <span className="text-primary">{fmt(cashbackAmount)} קאשבק</span> בהזמנה הזו</>
                  : <>Earn <span className="text-primary">{fmt(cashbackAmount)} cashback</span> on this order</>}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/${language}/wallet/rewards`)}
                className="mt-1 self-start text-sm font-semibold text-primary active:opacity-60 transition-opacity"
              >
                {isHe ? 'גלו את תוכנית התגמולים שלנו' : 'Discover our reward program'}
              </button>
              {/* Transparent falling-coins PNG — oversized so the banner crops
                  it (overflow-hidden on the card), making the coins read large. */}
              <img
                src="/reward-coins.png"
                alt=""
                aria-hidden
                className="pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 h-[230%] w-40 object-contain object-right"
              />
            </div>
          )}

          {!caresDismissed && (
            <div
              className="relative w-full h-full overflow-hidden rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #E9F8EF 0%, #E6F5F1 55%, #E7F1FB 100%)' }}
            >
              {/* Dismiss — gray circle with an X in the top-left corner. */}
              <button
                type="button"
                onClick={() => setCaresDismissed(true)}
                aria-label={isHe ? 'סגירה' : 'Dismiss'}
                className="absolute top-2 end-2 z-10 w-6 h-6 rounded-full bg-black/10 text-text-secondary flex items-center justify-center active:bg-black/20 transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
              </button>

              {/* Top label — "Nexus cares" with a filled heart */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-green mb-2">
                <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                {isHe ? 'לנקסוס אכפת' : 'Nexus cares'}
              </span>

              {/* Two columns: text + toggle on the start (right in RTL),
                  the nonprofit logo tiles on the end (left in RTL). */}
              <div className="flex items-stretch gap-4">
                {/* Text (two lines) with the opt-in toggle pinned below it. */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-sm font-bold text-text-primary leading-snug">
                    {isHe
                      ? <>עגלו עסקה זו ותרמו <span className="text-accent-green">{roundedUpTotal - baseTotal} שקלים</span> למטרות חברתיות נבחרות</>
                      : <>Round up this order and donate <span className="text-accent-green">{fmt(roundedUpTotal - baseTotal)}</span> to selected social causes</>}
                  </p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={roundUp}
                    aria-label={isHe ? 'עיגול לתרומה' : 'Round up to donate'}
                    onClick={() => setRoundUp((v) => !v)}
                    className={`mt-3 self-start w-11 h-6 rounded-full transition-colors shrink-0 relative ${roundUp ? 'bg-accent-green' : 'bg-gray-200'}`}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                      style={{ insetInlineStart: 2, transform: `translateX(${roundUp ? (isHe ? -20 : 20) : 0}px)` }}
                    />
                  </button>
                </div>

                {/* Nonprofit logo tiles — overlapping rounded squares, nudged
                    toward the end (left in RTL) edge of the card. */}
                <div className="shrink-0 flex flex-col items-center -me-2">
                  <div className="flex items-center">
                    {[
                      { file: '/logos/barak-188.png', label: isHe ? 'ברק 188' : 'Barak', bg: '#0F2A4A', imgBg: '#FFFFFF', color: '#FFFFFF', rot: -4, pad: 8 },
                      { file: '/logos/bnei-akiva.png', label: isHe ? 'בני עקיבא' : 'Bnei A.', bg: '#1E40AF', imgBg: '#FFFFFF', color: '#FDE047', rot: 4, pad: 5 },
                      { file: '/logos/keren-ramon.png', label: isHe ? 'קרן רמון' : 'Ramon', bg: '#EBE7E4', imgBg: '#EBE7E4', color: '#2E7D32', rot: -3, pad: 5 },
                      { file: '/logos/yeladim-besikui.png', label: isHe ? 'ילדים בסיכוי' : 'Yeladim', bg: '#FBBF24', imgBg: '#FFFFFF', color: '#0F2A4A', rot: 5, pad: 5 },
                    ].map((c, i) => (
                      <span
                        key={c.label}
                        title={c.label}
                        className="relative w-14 h-14 rounded-[16px] shadow-sm border border-black/5 overflow-hidden flex items-center justify-center px-1 text-center"
                        style={{
                          backgroundColor: c.bg,
                          marginInlineStart: i === 0 ? 0 : -14,
                          transform: `rotate(${c.rot}deg)`,
                          zIndex: 10 - i,
                        }}
                      >
                        <span className="text-[10px] font-extrabold leading-[1.05]" style={{ color: c.color }}>
                          {c.label}
                        </span>
                        <img
                          src={c.file}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity"
                          style={{ padding: c.pad, backgroundColor: c.imgBg }}
                          onLoad={(e) => {
                            if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1';
                          }}
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

        {/* Marketing opt-in */}
        <label className="mt-5 flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="h-5 w-5 rounded-md border-border text-primary focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm text-text-secondary">
            {isHe ? `אשמח לקבל חדשות והטבות מ${brandName}` : `Sign me up for news and offers from ${brandName}`}
          </span>
        </label>

        {/* Order summary */}
        <section className="mt-9">
          <button
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
            className="w-full flex items-center justify-between gap-3 mb-5"
          >
            <h2 className="text-xl font-bold text-text-primary">{isHe ? 'סיכום הזמנה' : 'Order summary'}</h2>
            <span
              className="material-symbols-rounded text-text-muted transition-transform"
              style={{ fontSize: 24, transform: summaryOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          {summaryOpen && (
          <>
          <div className="flex items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 bg-surface rounded-xl border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={product.image} alt={productName} className="w-full h-full object-cover" />
                <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-bg-dark text-white text-[11px] font-bold flex items-center justify-center">
                  {qty}
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[15px] font-medium text-text-primary truncate">{productName}</span>
                {selectedColor && (
                  <span className="mt-1 flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="inline-block w-3.5 h-3.5 rounded-[5px] border border-border/60 shrink-0"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <span className="text-xs text-text-muted truncate">{selectedColor.name}</span>
                  </span>
                )}
              </div>
            </div>
            <span className="text-[15px] font-medium text-text-primary shrink-0">{fmt(subtotal)}</span>
          </div>

          {/* Discount code */}
          {appliedCode ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 mb-5">
              <span className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-rounded text-primary shrink-0" style={{ fontSize: 20 }}>sell</span>
                <span className="text-sm font-semibold text-text-primary truncate">{appliedCode}</span>
              </span>
              <button
                onClick={() => { setAppliedCode(null); setDiscountInput(''); }}
                className="text-xs font-semibold text-text-muted active:opacity-60"
              >
                {isHe ? 'הסרה' : 'Remove'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder={isHe ? 'קוד הנחה או שובר' : 'Discount code or gift card'}
                className="flex-grow bg-surface border border-transparent rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleApply}
                disabled={!discountInput.trim()}
                className="bg-surface text-text-secondary px-6 py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
              >
                {isHe ? 'החל' : 'Apply'}
              </button>
            </div>
          )}

          {/* Totals breakdown */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{isHe ? 'סכום ביניים' : 'Subtotal'}</span>
              <span className="text-text-primary font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setFeesInfoOpen(true)}
                className="flex items-center gap-1 text-text-secondary active:opacity-60 transition-opacity"
              >
                {isHe ? 'משלוח' : 'Shipping'}
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 16 }}>help</span>
              </button>
              <span className="text-text-primary font-medium">{shippingLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setFeesInfoOpen(true)}
                className="flex items-center gap-1 text-text-secondary active:opacity-60 transition-opacity"
              >
                {isHe ? 'דמי תפעול' : 'Service fee'}
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 16 }}>help</span>
              </button>
              <span className="text-text-primary font-medium">{fmt(serviceFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setFeesInfoOpen(true)}
                className="flex items-center gap-1 text-text-secondary active:opacity-60 transition-opacity"
              >
                {isHe ? 'מסים משוערים' : 'Estimated taxes'}
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 16 }}>help</span>
              </button>
              <span className="text-text-primary font-medium">{fmt(taxes)}</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{isHe ? 'טיפ' : 'Tip'}</span>
                <span className="text-text-primary font-medium">{fmt(tip)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{isHe ? 'הנחה' : 'Discount'}</span>
                <span className="text-accent-green font-medium">-{fmt(discount)}</span>
              </div>
            )}
            {roundUpDonation > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-text-secondary">
                  <span className="material-symbols-rounded text-accent-green" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  {isHe ? 'תרומה (עיגול)' : 'Round-up donation'}
                </span>
                <span className="text-text-primary font-medium">{fmt(roundUpDonation)}</span>
              </div>
            )}
          </div>
          </>
          )}
        </section>

        {/* "Just one more thing" — cross-sell strip */}
        {upsellProducts.length > 0 && (
          <section className="mt-9">
            <h2 className="text-center text-lg font-bold text-text-primary mb-4">
              {isHe ? 'עוד דבר אחד' : 'Just one more thing'}
            </h2>
            <div className="space-y-3">
              {upsellProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border border-border rounded-2xl bg-white shadow-sm p-3"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/${language}/business/${business.id}/product/${p.id}`)}
                    className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-surface active:opacity-80 transition-opacity"
                  >
                    <img
                      src={p.image}
                      alt={isHe ? p.nameHe : p.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {isHe ? p.nameHe : p.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {isHe ? p.descriptionHe : p.description}
                    </p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {`${p.currency}${p.price.toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/${language}/business/${business.id}/product/${p.id}`)}
                    className="shrink-0 text-sm font-semibold text-primary px-2 py-1 active:opacity-60 transition-opacity"
                  >
                    {isHe ? 'הוספה' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky pay bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pt-3 pb-5 bg-white/85 backdrop-blur-md border-t border-border/60">
        <div className="relative">
          {/* Cashback badge — peeks above the pay button (mirrors the voucher
              creation screen's "Get ₪X cashback" element). */}
          {cashbackAmount > 0 && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-0 w-[82%]">
              <div
                key={cashbackAmount}
                className="flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 px-4 py-2 pb-9 rounded-t-2xl origin-bottom"
                style={{ animation: 'cashback-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <span className="text-base text-green-700 font-medium leading-none">{isHe ? 'תקבל' : 'Get'}</span>
                <span className="text-lg font-black text-green-600 leading-none">{fmt(cashbackAmount)}</span>
                <span className="text-base text-green-700 font-medium leading-none">{isHe ? 'כקאשבק' : 'cashback'}</span>
              </div>
            </div>
          )}

          <div className="relative z-10">
            <SlideToConfirm
              rtl={isHe}
              loading={paying}
              onConfirm={handlePay}
              label={isHe ? 'שלם עכשיו' : 'Pay now'}
              amount={fmt(total)}
              confirmLabel={isHe ? 'אשר תשלום' : 'Confirm payment'}
              loadingLabel={isHe ? 'מעבד תשלום…' : 'Processing…'}
              hint={isHe ? 'החלק כדי לשלם' : 'Swipe to pay'}
            />
          </div>
        </div>
      </div>

      <AddressSheet
        isOpen={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        addresses={addresses}
        selectedId={selectedAddressId}
        onSelect={setSelectedAddressId}
        onAddAddress={(addr) => setAddresses((prev) => [...prev, addr])}
      />

      <FeesInfoSheet
        isOpen={feesInfoOpen}
        onClose={() => setFeesInfoOpen(false)}
        currency={cur}
        shipping={selectedShipping.cost}
        serviceFee={serviceFee}
        taxes={taxes}
      />

      <PaymentsPlanSheet
        isOpen={paymentsSheetOpen}
        onClose={() => setPaymentsSheetOpen(false)}
        currency={cur}
        total={total}
        count={paymentsCount}
        onSave={setPaymentsCount}
        maxPayments={8}
      />
    </div>
  );
}
