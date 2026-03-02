import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNearbyDeals } from '../../hooks/useNearbyDeals';
import { formatDistance } from '../../utils/haversine';
import Skeleton from '../ui/Skeleton';
import SectionError from '../ui/SectionError';
import type { NearbyDeal } from '../../types/branch.types';

// ── Pastel backgrounds per voucher category ──
const categoryColors: Record<string, string> = {
  food: 'bg-orange-50',
  shopping: 'bg-pink-50',
  entertainment: 'bg-purple-50',
  tech: 'bg-blue-50',
  travel: 'bg-sky-50',
  health: 'bg-emerald-50',
  education: 'bg-amber-50',
};

const categoryGradients: Record<string, string> = {
  food: 'from-orange-400 to-orange-600',
  shopping: 'from-pink-400 to-pink-600',
  entertainment: 'from-purple-400 to-purple-600',
  tech: 'from-blue-400 to-blue-600',
  travel: 'from-sky-400 to-sky-600',
  health: 'from-emerald-400 to-emerald-600',
  education: 'from-amber-400 to-amber-600',
};

const categorySlides: Record<string, string[]> = {
  food: ['🍔', '🍟', '🥤'],
  shopping: ['👕', '👗', '👜'],
  entertainment: ['🎬', '🍿', '🎭'],
  tech: ['💻', '📱', '🎧'],
  travel: ['🏨', '🏖️', '🌅'],
  health: ['💊', '💄', '🧴'],
  education: ['📚', '🎓', '📖'],
};

const categoryLabels: Record<string, { en: string; he: string }> = {
  food: { en: 'Food', he: 'אוכל' },
  shopping: { en: 'Shopping', he: 'קניות' },
  entertainment: { en: 'Entertainment', he: 'בידור' },
  tech: { en: 'Tech', he: 'טכנולוגיה' },
  travel: { en: 'Travel', he: 'טיולים' },
  health: { en: 'Health', he: 'בריאות' },
  education: { en: 'Education', he: 'לימודים' },
};

// ── Map tile helpers ──

/**
 * Convert lat/lng → OSM tile coordinates at a given zoom level.
 * Returns fractional x, y so we can compute pixel offsets.
 */
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * Build an array of OSM tile URLs that cover a 3×2 grid around the given lat/lng.
 * Returns tile URLs + CSS background-position offsets to compose a map image.
 */
function getMapTiles(lat: number, lng: number): {
  tiles: { url: string; x: number; y: number }[];
  offsetX: number;
  offsetY: number;
} {
  const zoom = 16;
  const { x, y } = latLngToTile(lat, lng, zoom);
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  // Fractional offset within the center tile (0-1)
  const offsetX = (x - tileX) * 256;
  const offsetY = (y - tileY) * 256;

  const tiles: { url: string; x: number; y: number }[] = [];
  // 3 columns × 2 rows grid centered on the point
  for (let dy = -1; dy <= 0; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        url: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX + dx}/${tileY + dy}@2x.png`,
        x: dx,
        y: dy,
      });
    }
  }
  return { tiles, offsetX, offsetY };
}

// ── NearYou Card ──

function NearYouCard({
  deal,
  isHe,
  onNavigate,
}: {
  deal: NearbyDeal;
  isHe: boolean;
  onNavigate: () => void;
}) {
  const v = deal.voucher;
  const catLabel = categoryLabels[v.category] || { en: v.category, he: v.category };
  const distanceText = formatDistance(deal.distanceKm, isHe);
  const bgColor = categoryColors[v.category] || 'bg-gray-50';
  const slides = categorySlides[v.category] || ['🎁', '🎉', '⭐'];
  const hasMultipleSlides = slides.length > 1;

  // Richer crossfade swipe — same pattern as OfferCard in ActiveOffers
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 3) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (hasMultipleSlides && isSwiping.current && Math.abs(diff) > 20) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % slides.length);
      } else {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      }
    } else if (!isSwiping.current) {
      onNavigate();
    }
  };

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150">
      {/* Pastel image area — crossfade emoji slides */}
      <div
        className={`relative overflow-hidden ${bgColor}`}
        style={{ height: '20vh' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Crossfade slides */}
        {slides.map((emoji, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              idx === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-7xl">{emoji}</span>
          </div>
        ))}

        {/* Logo badge — top-right corner */}
        <div className="absolute top-2.5 right-2.5 z-10 w-14 h-14 rounded-full bg-white shadow-md border border-border/40 flex items-center justify-center">
          <span className="text-2xl">{v.merchantLogo}</span>
        </div>

        {/* Distance badge — top-left */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '12px' }}
          >
            location_on
          </span>
          <span className="text-[10px] font-bold text-primary">
            {distanceText}
          </span>
        </div>

        {/* Dot indicators — pill for active, dot for inactive */}
        {hasMultipleSlides && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`block rounded-full transition-all duration-300 ${
                  idx === current ? 'w-4 h-1.5 bg-gray-800' : 'w-1.5 h-1.5 bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom info */}
      <button
        onClick={onNavigate}
        className="w-full px-3 py-4 flex items-center justify-between"
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">
            {isHe ? v.titleHe : v.title}
          </span>
          <span className="text-[10px] text-text-muted">
            {isHe ? deal.branch.addressHe : deal.branch.address}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
            {isHe ? catLabel.he : catLabel.en}
          </span>
          {v.discountPercent > 0 && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
              {v.discountPercent}%−
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Location Teaser Card ──

// Tel Aviv center coordinates for the teaser map
const TEASER_MAP_CENTER = { lat: 32.0853, lng: 34.7818 };

function LocationTeaserCard({
  onRequestLocation,
  subtitle,
  ctaLabel,
}: {
  onRequestLocation: () => void;
  subtitle: string;
  ctaLabel: string;
}) {
  const { tiles, offsetX, offsetY } = getMapTiles(TEASER_MAP_CENTER.lat, TEASER_MAP_CENTER.lng);

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start flex flex-col">
      {/* Map image area */}
      <div
        className="relative overflow-hidden bg-gray-100"
        style={{ height: '20vh' }}
      >
        {/* OSM tile grid — map of Tel Aviv center */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${-offsetX + 150}px, ${-offsetY + 60}px)`,
          }}
        >
          {tiles.map((tile) => (
            <img
              key={tile.url}
              src={tile.url}
              alt=""
              width={256}
              height={256}
              loading="lazy"
              className="absolute"
              style={{
                left: `${(tile.x + 1) * 256}px`,
                top: `${(tile.y + 1) * 256}px`,
              }}
            />
          ))}
        </div>

        {/* Semi-transparent overlay for readability */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />

        {/* Location pin icon */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '28px' }}>
          <span
            className="material-symbols-outlined text-primary drop-shadow-md"
            style={{ fontSize: '56px' }}
          >
            location_on
          </span>
        </div>

        {/* Semi-transparent black bar at the bottom with descriptive text */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-2 px-3">
          <p className="text-white text-[11px] text-center leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom white area with CTA button */}
      <div className="px-3 py-3 flex items-center justify-center">
        <button
          onClick={onRequestLocation}
          className="px-5 py-2 rounded-full bg-primary text-white text-xs font-semibold active:scale-[0.97] transition-transform flex items-center gap-1.5"
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '14px' }}
          >
            location_on
          </span>
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

// ── Location Denied Bottom Sheet ──

function LocationDeniedSheet({
  isOpen,
  onClose,
  onRetry,
  isHe,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  isHe: boolean;
  t: any;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl px-6 pt-5 pb-8 animate-slide-up"
        style={{ maxHeight: '70vh' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '28px' }}>
            location_off
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-center mb-2">
          {t.home.nearYouDeniedTitle}
        </h3>

        {/* Body */}
        <p className="text-sm text-text-secondary text-center leading-relaxed mb-4">
          {t.home.nearYouDeniedBody}
        </p>

        {/* How-to box */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-start gap-2">
          <span className="material-symbols-outlined text-gray-400 mt-0.5" style={{ fontSize: '18px' }}>
            info
          </span>
          <p className="text-xs text-text-muted leading-relaxed" dir={isHe ? 'rtl' : 'ltr'}>
            {t.home.nearYouDeniedHowTo}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            {t.home.nearYouDeniedRetry}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-text-secondary text-sm font-medium active:scale-[0.98] transition-transform"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Arrow Bubble ──

function MoreBubble({ onNavigate }: { onNavigate: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) setVisible(true);
        else if (!entry.isIntersecting && visible) setVisible(false);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 bg-sky-100 flex items-center justify-center active:scale-90"
        style={{
          opacity: visible ? 1 : 0,
          borderRadius: visible ? '50%' : '20% 50% 50% 20%',
          transform: visible ? 'none' : 'translateX(-16px) scaleX(0.2) scaleY(0.5)',
          animation: visible
            ? 'drip-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'none',
        }}
      >
        <span
          className="material-symbols-outlined text-sky-600"
          style={{ fontSize: '20px' }}
        >
          chevron_left
        </span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

export default function NearYou() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const { deals, isLoading, isError, refetch, permission, requestLocation } = useNearbyDeals(8);
  const [showDeniedSheet, setShowDeniedSheet] = useState(false);
  const prevPermission = useRef(permission);

  // Show denied sheet only when permission *transitions* to denied (user clicked → got denied)
  useEffect(() => {
    if (permission === 'denied' && prevPermission.current !== 'denied') {
      setShowDeniedSheet(true);
    }
    prevPermission.current = permission;
  }, [permission]);

  // Loading state
  if (isLoading) {
    return (
      <section className="mb-6">
        <Skeleton className="h-5 w-36 mx-5 mb-3" />
        <div className="flex gap-3 px-5 overflow-hidden">
          <Skeleton className="h-[200px] w-[300px] rounded-lg shrink-0" variant="rectangular" />
          <Skeleton className="h-[200px] w-[300px] rounded-lg shrink-0" variant="rectangular" />
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return <SectionError section="NearYou" onRetry={refetch} />;
  }

  // If unavailable (no geolocation support), hide entirely
  if (permission === 'unavailable') {
    return null;
  }

  const hasDeals = deals.length > 0;
  const showTeaser = permission === 'prompt' || permission === 'denied';

  // Determine gradient from top deal's category
  const topCategory = deals[0]?.voucher.category || 'food';
  const topCategoryLabel = categoryLabels[topCategory] || { en: 'Near You', he: 'קרוב אליך' };
  const gradient = categoryGradients[topCategory] || 'from-primary to-primary-dark';

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold">{t.home.nearYouTitle}</h3>
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '16px' }}
          >
            location_on
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Map view button */}
          {hasDeals && (
            <button
              onClick={() => navigate(`/${lang}/near-you-map`)}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-90"
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: '16px' }}
              >
                map
              </span>
            </button>
          )}
          <button
            onClick={() => navigate(`/${lang}/store`)}
            className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
          >
            {isHe ? 'עוד' : 'More'}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {/* Category gradient label — only when cards are visible */}
        {hasDeals && !showTeaser && (
          <div
            className={`flex-none w-[120px] rounded-lg bg-gradient-to-b ${gradient} flex items-center justify-center`}
          >
            <span
              className="text-white text-sm font-bold whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {isHe ? topCategoryLabel.he : topCategoryLabel.en}
            </span>
          </div>
        )}

        {/* Teaser card when location not yet shared */}
        {showTeaser && (
          <LocationTeaserCard
            onRequestLocation={requestLocation}
            subtitle={t.home.nearYouLocationCtaSubtitle}
            ctaLabel={t.home.nearYouShareLocation}
          />
        )}

        {/* Deal cards — hidden until user grants location */}
        {!showTeaser && deals.map((deal) => (
          <NearYouCard
            key={deal.voucher.id}
            deal={deal}
            isHe={isHe}
            onNavigate={() => navigate(`/${lang}/store`)}
          />
        ))}

        {/* Arrow bubble at the end */}
        {hasDeals && !showTeaser && <MoreBubble onNavigate={() => navigate(`/${lang}/store`)} />}
      </div>

      {/* Denied bottom sheet */}
      <LocationDeniedSheet
        isOpen={showDeniedSheet}
        onClose={() => setShowDeniedSheet(false)}
        onRetry={requestLocation}
        isHe={isHe}
        t={t}
      />
    </section>
  );
}
