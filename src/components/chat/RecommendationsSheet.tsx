import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { formatCurrency } from '../../utils/formatCurrency';
import MaskedPrice from '../ui/MaskedPrice';
import GradientSkeletonCard from '../ui/GradientSkeletonCard';
import OffersMap from '../map/OffersMap';
import type { OfferPin, OfferCategory } from '../../types/map';
import type { Voucher, VoucherCategory } from '../../types/voucher.types';

// ── Map preview helpers ─────────────────────────────────────────────────

/** Map a VoucherCategory → the OffersMap's 5-bucket category model so the
 *  shared pin colours stay correct. */
const VOUCHER_TO_OFFER: Record<VoucherCategory, OfferCategory> = {
  food: 'food',
  shopping: 'retail',
  entertainment: 'entertainment',
  travel: 'entertainment',
  tech: 'services',
  education: 'services',
  health: 'wellness',
};

/** Deterministic location per voucher — small offset from Tel Aviv center
 *  so each result lands on a distinct, stable spot on the preview map. */
function getVoucherLocation(voucherId: string) {
  let hash = 0;
  for (let i = 0; i < voucherId.length; i++) hash = (hash * 31 + voucherId.charCodeAt(i)) | 0;
  const offsetLat = ((hash & 0xff) / 0xff - 0.5) * 0.05; // ~±2.7km
  const offsetLng = (((hash >> 8) & 0xff) / 0xff - 0.5) * 0.05;
  return { lat: 32.0853 + offsetLat, lng: 34.7818 + offsetLng };
}

interface RecommendationsContentProps {
  vouchers?: Voucher[];
  intro?: string;
  loading?: boolean;
  onSelect: (voucher: Voucher) => void;
  /** Fired whenever the user switches between the list and map view.
   *  The parent uses it to route an over-drag past the sheet's ceiling
   *  to the full map page when the sheet is showing the map. */
  onViewModeChange?: (mode: 'list' | 'map') => void;
}

// Category style matches the collapsed pill row on the home page (CategoryRow):
// pastel-tinted background, emoji + name, soft border, rounded-full.
const CATEGORY_META: Record<
  VoucherCategory,
  { en: string; he: string; emoji: string; bg: string }
> = {
  food:          { en: 'Food',          he: 'אוכל',      emoji: '🍔', bg: 'bg-orange-50' },
  shopping:      { en: 'Shopping',      he: 'קניות',     emoji: '👕', bg: 'bg-pink-50' },
  entertainment: { en: 'Entertainment', he: 'בידור',     emoji: '🎬', bg: 'bg-purple-50' },
  tech:          { en: 'Tech',          he: 'טכנולוגיה', emoji: '💻', bg: 'bg-blue-50' },
  travel:        { en: 'Travel',        he: 'טיולים',    emoji: '✈️', bg: 'bg-sky-50' },
  health:        { en: 'Health',        he: 'בריאות',    emoji: '💊', bg: 'bg-emerald-50' },
  education:     { en: 'Education',     he: 'לימודים',   emoji: '📚', bg: 'bg-amber-50' },
};

// Stable chip order regardless of which categories happen to be in the results.
const CATEGORY_ORDER = Object.keys(CATEGORY_META) as VoucherCategory[];

// Skeleton card style is shared with the home page — see GradientSkeletonCard.

// ── Result card — one per row, matches home-page SliderCard style ───────────
function ResultCard({
  voucher,
  isHe,
  onSelect,
  comingSoonLabel,
  outOfStockLabel,
}: {
  voucher: Voucher;
  isHe: boolean;
  onSelect: (v: Voucher) => void;
  comingSoonLabel: string;
  outOfStockLabel: string;
}) {
  const { language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { isAuthenticated } = useAuthGate();
  const isUnavailable = !!voucher.comingSoon || !voucher.inStock;

  return (
    <button
      onClick={() => !isUnavailable && onSelect(voucher)}
      disabled={isUnavailable}
      className="w-full bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start active:scale-[0.98] transition-transform duration-150 flex flex-col disabled:opacity-60"
    >
      {/* Atmosphere image area — same 20vh height as home page */}
      <div className="relative bg-surface overflow-hidden" style={{ height: '20vh' }}>
        {voucher.imageUrl ? (
          <img
            src={voucher.imageUrl}
            alt={voucher.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 56 }}>{voucher.image}</span>
          </div>
        )}

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Brand logo circle — top-start corner */}
        {voucher.brandLogo && (
          <div
            className="absolute top-2.5 start-2.5 z-10 w-10 h-10 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: voucher.brandColor || '#FFFFFF' }}
          >
            <img
              src={voucher.brandLogo}
              alt={voucher.merchantName}
              className="w-[80%] h-[80%] object-contain"
            />
          </div>
        )}

        {/* Discount badge — top end */}
        <div className="absolute top-2.5 end-2.5 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700">
            {voucher.discountPercent}%
          </span>
        </div>

        {/* Coming soon overlay */}
        {voucher.comingSoon && (
          <div className="absolute inset-0 bg-cyan-600/75 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{comingSoonLabel}</span>
          </div>
        )}

        {/* Out-of-stock overlay */}
        {!voucher.comingSoon && !voucher.inStock && (
          <div className="absolute inset-0 bg-text-primary/40 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{outOfStockLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom info — merchant · title · price */}
      <div className="px-3 py-3">
        <p className="text-[10px] text-text-secondary leading-tight">{voucher.merchantName}</p>
        <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug mt-0.5">
          {isHe ? voucher.titleHe : voucher.title}
        </p>
        {!voucher.comingSoon && (
          <div className="flex items-center gap-2 mt-0.5">
            <MaskedPrice
              amount={voucher.discountedPrice}
              className="text-sm font-bold text-primary"
            />
            {isAuthenticated && voucher.originalPrice !== voucher.discountedPrice && (
              <span className="text-[11px] text-text-muted line-through">
                {formatCurrency(voucher.originalPrice, 'ILS', locale)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// In-sheet content — rendered INSIDE the existing chat-page bottom sheet
// when recommendations are loading or present. The sheet itself (in
// AiChatPage) handles the rise animation; this component just renders the
// header + scrollable list (skeletons while loading, real cards otherwise).
type CategoryFilter = VoucherCategory | 'all';

export default function RecommendationsContent({
  vouchers,
  intro,
  loading,
  onSelect,
  onViewModeChange,
}: RecommendationsContentProps) {
  const { language, t } = useLanguage();
  const isHe = language === 'he';

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  // View-mode toggle for the WHOLE recommendation panel: 'list' (default) ↔
  // 'map' (renders the filtered vouchers as OffersMap pins).
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Surface the view-mode to the parent (AiChatPage) so an over-drag past
  // the sheet's ceiling can route to the full map page when in map mode.
  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  // Categories actually present in the current results, in stable order
  const availableCategories = useMemo<VoucherCategory[]>(() => {
    if (!vouchers || vouchers.length === 0) return [];
    const present = new Set(vouchers.map((v) => v.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [vouchers]);

  // Reset filter + view-mode whenever the result set changes so a stale
  // selection doesn't hide everything in the next batch.
  useEffect(() => {
    setSelectedCategory('all');
    setViewMode('list');
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    if (selectedCategory === 'all') return vouchers;
    return vouchers.filter((v) => v.category === selectedCategory);
  }, [vouchers, selectedCategory]);

  // Build OffersMap pins for the current filtered set — only when map mode
  // is on, to avoid the hash work on every list render.
  const offerPins = useMemo<OfferPin[]>(() => {
    if (viewMode !== 'map') return [];
    return filteredVouchers.map((v) => {
      const loc = getVoucherLocation(v.id);
      return {
        id: v.id,
        name: isHe ? v.titleHe : v.title,
        category: VOUCHER_TO_OFFER[v.category] ?? 'services',
        lng: loc.lng,
        lat: loc.lat,
        tenantId: v.merchantName,
        brandLogo: v.brandLogo,
        brandColor: v.brandColor,
      };
    });
  }, [viewMode, filteredVouchers, isHe]);

  const handlePinClick = useCallback(
    (pin: OfferPin) => {
      const v = filteredVouchers.find((x) => x.id === pin.id);
      if (v) onSelect(v);
    },
    [filteredVouchers, onSelect],
  );

  // ── Map mode extras: loading spinner + draggable bottom strip ──

  const [mapLoading, setMapLoading] = useState(false);
  const [stripSnap, setStripSnap] = useState<'peek' | 'collapsed'>('peek');
  const stripCardsRef = useRef<HTMLDivElement>(null);
  const peekHeightRef = useRef<number>(220);

  // Flash a brief loading spinner when entering map view (modern + concise).
  useEffect(() => {
    if (viewMode !== 'map') return;
    setMapLoading(true);
    const t = window.setTimeout(() => setMapLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [viewMode]);

  // Reset strip snap whenever vouchers change.
  useEffect(() => {
    setStripSnap('peek');
  }, [vouchers]);

  // Re-measure the strip's natural peek height when the card set changes.
  useEffect(() => {
    if (viewMode !== 'map') return;
    const el = stripCardsRef.current;
    if (!el) return;
    const wasTransition = el.style.transition;
    el.style.transition = 'none';
    el.style.height = 'auto';
    peekHeightRef.current = el.getBoundingClientRect().height;
    el.style.height = stripSnap === 'peek' ? `${peekHeightRef.current}px` : '0px';
    requestAnimationFrame(() => {
      if (el) el.style.transition = wasTransition || 'height 0.3s cubic-bezier(.4,0,.2,1)';
    });
    // stripSnap intentionally omitted — the snap-change effect handles that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filteredVouchers.length]);

  // Animate strip height on snap change.
  useEffect(() => {
    if (viewMode !== 'map') return;
    const el = stripCardsRef.current;
    if (!el) return;
    el.style.transition = 'height 0.3s cubic-bezier(.4,0,.2,1)';
    el.style.height = stripSnap === 'peek' ? `${peekHeightRef.current}px` : '0px';
  }, [stripSnap, viewMode]);

  // Touch + mouse drag for the bottom-strip handle.
  useEffect(() => {
    if (viewMode !== 'map') return;
    const handle = document.getElementById('chat-map-strip-handle');
    if (!handle) return;
    let startY = 0;
    let startH = 0;
    let dragging = false;
    let moved = false;
    const apply = (h: number) => {
      const el = stripCardsRef.current;
      if (!el) return;
      el.style.transition = 'none';
      el.style.height = `${h}px`;
    };
    const snapTo = (h: number) => {
      const el = stripCardsRef.current;
      if (!el) return;
      el.style.transition = 'height 0.3s cubic-bezier(.4,0,.2,1)';
      el.style.height = `${h}px`;
    };
    const begin = (clientY: number) => {
      startY = clientY;
      startH = stripCardsRef.current?.getBoundingClientRect().height ?? 0;
      dragging = true;
      moved = false;
    };
    const move = (clientY: number) => {
      if (!dragging) return;
      const delta = startY - clientY;
      if (Math.abs(delta) > 4) moved = true;
      const newH = Math.max(0, Math.min(peekHeightRef.current, startH + delta));
      apply(newH);
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      const cur = stripCardsRef.current?.getBoundingClientRect().height ?? 0;
      if (!moved) {
        const goingToPeek = cur < peekHeightRef.current / 2;
        snapTo(goingToPeek ? peekHeightRef.current : 0);
        setStripSnap(goingToPeek ? 'peek' : 'collapsed');
        return;
      }
      if (cur > peekHeightRef.current / 2) {
        snapTo(peekHeightRef.current);
        setStripSnap('peek');
      } else {
        snapTo(0);
        setStripSnap('collapsed');
      }
    };
    const onTouchStart = (e: TouchEvent) => begin(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      if (moved) e.preventDefault();
      move(e.touches[0].clientY);
    };
    const onTouchEnd = () => end();
    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); begin(e.clientY); };
    const onMouseMove = (e: MouseEvent) => move(e.clientY);
    const onMouseUp = () => end();
    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove', onTouchMove, { passive: false });
    handle.addEventListener('touchend', onTouchEnd, { passive: true });
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [viewMode]);

  // "Search this area" — quick visual signal via the loading spinner.
  const handleSearchArea = useCallback(() => {
    setMapLoading(true);
    window.setTimeout(() => setMapLoading(false), 700);
  }, []);

  // Real slider when we have results with multiple categories. Skeleton slider
  // while loading, so the chip row visually matches what's coming.
  const showRealCategorySlider = !loading && availableCategories.length > 1;
  const showSkeletonCategorySlider = !!loading;
  const canShowMap = !loading && filteredVouchers.length > 0;

  // Shared two-segment toggle — single white pill housing both icons.
  // Map (location pin) on one side, List (menu lines) on the other; the
  // active segment gets a subtle gray fill. Rendered in both modes.
  const renderToggle = () =>
    canShowMap ? (
      <div
        role="group"
        aria-label={isHe ? 'בחר תצוגה' : 'View mode'}
        className="shrink-0 flex items-center bg-white shadow-md rounded-full p-1"
      >
        <button
          type="button"
          onClick={() => setViewMode('map')}
          aria-pressed={viewMode === 'map'}
          aria-label={isHe ? 'הצג מפה' : 'Show map'}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            viewMode === 'map' ? 'bg-surface' : ''
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              viewMode === 'map' ? 'text-text-primary' : 'text-text-muted'
            }`}
            style={{ fontSize: '18px' }}
          >
            location_on
          </span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
          aria-label={isHe ? 'הצג רשימה' : 'Show list'}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            viewMode === 'list' ? 'bg-surface' : ''
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              viewMode === 'list' ? 'text-text-primary' : 'text-text-muted'
            }`}
            style={{ fontSize: '18px' }}
          >
            menu
          </span>
        </button>
      </div>
    ) : null;

  // ── Map mode: full-bleed OffersMap with title + toggle overlaid ──
  if (viewMode === 'map' && canShowMap) {
    return (
      <div
        className="relative h-full overflow-hidden rounded-t-[28px]"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Map fills the whole card, edge-to-edge */}
        <OffersMap
          pins={offerPins}
          initialZoom={12}
          onPinClick={handlePinClick}
          showControls={false}
          showPopup
          rtl={isHe}
          className="w-full h-full"
        />

        {/* Top white fade — softens the edge under the drag handle and
            makes the header text legible without a background pill. */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 z-[5] pointer-events-none"
          style={{
            height: '160px',
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Bottom white fade — softens the bottom edge so the map blends
            into the floating action buttons sitting above the viewport. */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 z-[5] pointer-events-none"
          style={{
            height: '110px',
            background:
              'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Header overlay — plain text on the map (no pill). The top fade
            above provides the readability boost. pt-9 clears the parent
            sheet's floating drag handle. */}
        <div className="absolute top-0 inset-x-0 z-10 pt-9 px-5 pointer-events-none">
          <div className="flex items-start justify-between gap-3 pointer-events-auto">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary leading-tight truncate">
                {isHe ? 'ההמלצות של Nexus' : 'Nexus picks'}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 leading-tight">
                {filteredVouchers.length} {isHe ? 'תוצאות' : 'results'}
              </p>
            </div>
            {renderToggle()}
          </div>
        </div>

        {/* Category chips — horizontal scrollable row sitting below the
            header. Filters the visible pins by category. */}
        {availableCategories.length > 1 && (
          <div className="absolute top-[80px] inset-x-0 z-10 px-3 pointer-events-none">
            <div className="flex items-center overflow-x-auto hide-scrollbar gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`flex-none whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white/90 backdrop-blur-sm text-text-secondary shadow-sm'
                }`}
              >
                {isHe ? 'הכל' : 'All'}
              </button>
              {availableCategories.map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-none whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white/90 backdrop-blur-sm text-text-secondary shadow-sm'
                    }`}
                  >
                    <span className="text-sm leading-none">{meta.emoji}</span>
                    <span>{isHe ? meta.he : meta.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* "Search this area" floating pill — centred horizontally,
            sits just below the chips. Triggers a brief loading flash. */}
        <button
          type="button"
          onClick={handleSearchArea}
          className="absolute top-[140px] left-1/2 -translate-x-1/2 z-10 bg-white shadow-md rounded-full px-4 py-1.5 flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '14px' }}>
            refresh
          </span>
          <span className="text-xs font-semibold text-text-primary">
            {isHe ? 'חפש באזור הזה' : 'Search this area'}
          </span>
        </button>

        {/* Modern loading spinner — small circle with rounded gradient ring,
            shown briefly on map entry and on "search this area" tap. */}
        {mapLoading && (
          <div
            aria-hidden
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center">
              <div
                className="w-5 h-5 rounded-full animate-spin"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(91,140,255,0.05), rgba(91,140,255,0.95))',
                  WebkitMask: 'radial-gradient(circle 5px at center, transparent 98%, black 100%)',
                  mask: 'radial-gradient(circle 5px at center, transparent 98%, black 100%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom draggable card strip — peek (shows cards) ↔ collapsed
            (just the handle). Each card tap opens the voucher detail. */}
        <div className="absolute bottom-0 inset-x-0 z-20" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <div
            id="chat-map-strip-handle"
            className="select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <div className="flex justify-center pt-1 pb-1.5">
              <div className="w-10 h-1.5 bg-white/95 rounded-full shadow-md backdrop-blur-sm" />
            </div>
            <div className="flex justify-center mb-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-full px-3.5 py-1 shadow-md flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>local_offer</span>
                <span className="text-[11px] font-semibold text-text-primary">
                  {filteredVouchers.length} {isHe ? 'הטבות' : 'deals'}
                </span>
                <span
                  className="material-symbols-outlined text-text-muted transition-transform"
                  style={{ fontSize: '13px', transform: stripSnap === 'collapsed' ? 'rotate(0deg)' : 'rotate(180deg)' }}
                >
                  expand_less
                </span>
              </div>
            </div>
          </div>
          <div ref={stripCardsRef} className="overflow-hidden" style={{ height: `${peekHeightRef.current}px` }}>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 snap-x snap-mandatory items-stretch px-[7.5%] scroll-px-[7.5%]">
              {filteredVouchers.map((voucher) => (
                <button
                  key={voucher.id}
                  type="button"
                  onClick={() => onSelect(voucher)}
                  className="flex-none w-[80vw] max-w-[260px] snap-center bg-white rounded-2xl overflow-hidden text-start active:scale-[0.98] transition-all duration-200 flex flex-col p-2 shadow-md"
                >
                  <div className="relative bg-surface overflow-hidden rounded-xl" style={{ height: '14vh' }}>
                    {voucher.imageUrl ? (
                      <img src={voucher.imageUrl} alt={voucher.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        {voucher.image || voucher.merchantLogo}
                      </div>
                    )}
                    {voucher.brandLogo && (
                      <div
                        className="absolute top-2 start-2 z-10 w-8 h-8 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: voucher.brandColor || '#FFFFFF' }}
                      >
                        <img src={voucher.brandLogo} alt="" className="w-[80%] h-[80%] object-contain" />
                      </div>
                    )}
                    {voucher.discountPercent > 0 && (
                      <div className="absolute top-2 end-2 z-10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700">
                          {voucher.discountPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full px-1.5 pt-2 pb-1">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {isHe ? voucher.titleHe : voucher.title}
                    </p>
                    <p className="text-[10px] text-text-muted truncate mt-0.5">
                      {voucher.merchantName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List mode: standard column flow ──
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* pt-9 (36px) clears the parent sheet's floating drag handle. */}
      <div dir={isHe ? 'rtl' : 'ltr'} className="px-5 pt-9 pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-text-primary">
              {isHe ? 'ההמלצות של Nexus' : "Nexus picks"}
            </h3>
            {intro ? (
              <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">{intro}</p>
            ) : loading ? (
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {isHe ? 'מחפש המלצות בשבילך…' : 'Finding picks for you…'}
              </p>
            ) : null}
          </div>
          {renderToggle()}
        </div>
      </div>

      {/* Horizontal category slider — square style matches the home page's
          expanded CategoryRow. Skeleton placeholders while loading. */}
      {(showRealCategorySlider || showSkeletonCategorySlider) && (
        <div
          dir={isHe ? 'rtl' : 'ltr'}
          className="flex-shrink-0 overflow-x-auto hide-scrollbar mt-2"
        >
          <div className="flex gap-4 px-5 pb-1">
            {showSkeletonCategorySlider
              ? [0, 1, 2, 3, 4].map((i) => <SkeletonChip key={i} />)
              : (
                <>
                  <CategoryChip
                    emoji="✨"
                    label={isHe ? 'הכל' : 'All'}
                    bg="bg-surface"
                    active={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                  />
                  {availableCategories.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    return (
                      <CategoryChip
                        key={cat}
                        emoji={meta.emoji}
                        label={isHe ? meta.he : meta.en}
                        bg={meta.bg}
                        active={selectedCategory === cat}
                        onClick={() => setSelectedCategory(cat)}
                      />
                    );
                  })}
                </>
              )}
          </div>
        </div>
      )}

      {/* Scrollable list — one card per row. overscrollContain prevents the
          scroll from bleeding into the page when reaching the edges. */}
      <div
        dir={isHe ? 'rtl' : 'ltr'}
        className="flex-1 overflow-y-auto subtle-scrollbar px-5 pt-2 pb-8 space-y-3"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <GradientSkeletonCard key={i} index={i} className="w-full" imageHeight="20vh" />
            ))
          : filteredVouchers.map((voucher) => (
              <ResultCard
                key={voucher.id}
                voucher={voucher}
                isHe={isHe}
                onSelect={onSelect}
                comingSoonLabel={t.store.comingSoon}
                outOfStockLabel={t.store.outOfStock}
              />
            ))}
      </div>
    </div>
  );
}

function SkeletonChip() {
  // Same outer footprint as CategoryChip (72px square + bar underneath) so the
  // layout doesn't reflow when results swap in.
  return (
    <div className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
      <div className="w-[72px] h-[72px] rounded-2xl bg-gray-200" />
      <div className="h-2 w-14 bg-gray-200 rounded" />
    </div>
  );
}

function CategoryChip({
  emoji,
  label,
  bg,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  bg: string;
  active: boolean;
  onClick: () => void;
}) {
  // Same shape as the home page's expanded CategoryRow squares — a 72×72
  // pastel rounded square with a large emoji, label centered underneath.
  // Selected state highlights the square with a primary border.
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
    >
      <div
        className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-sm border-2 transition-colors duration-100 ${bg} ${
          active ? 'border-primary' : 'border-transparent'
        }`}
      >
        <span className="text-4xl drop-shadow-sm">{emoji}</span>
      </div>
      <span className="text-[11px] font-semibold text-text-primary leading-tight text-center max-w-[72px]">
        {label}
      </span>
    </button>
  );
}
