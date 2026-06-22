import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business, Product, Service } from '../../types/search.types';
import type { Branch } from '../../types/branch.types';
import type { Voucher } from '../../types/voucher.types';
import type { Review } from '../../mock/data/reviews.mock';
import OffersMap from '../map/OffersMap';
import RatingBars from '../ui/RatingBars';
import AnimatedLocationIcon from '../ui/AnimatedLocationIcon';
import type { OfferPin, OfferCategory } from '../../types/map';

/* ─── Stories Row Section ─────────────────────────────────────────── */

interface StoriesRowProps {
  business: Business;
}

// Category-based story images (random images from the advertiser's domain)
const categoryStoryImages: Record<string, string[]> = {
  'Fast Food': [
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200&q=80',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&q=80',
    'https://images.unsplash.com/photo-1586816001966-79b736744398?w=200&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&q=80',
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&q=80',
    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=200&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&q=80',
  ],
  'Entertainment': [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&q=80',
  ],
  'Cafe': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=200&q=80',
  ],
  'Hotels': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=200&q=80',
  ],
  'Health & Beauty': [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&q=80',
    'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=200&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=200&q=80',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=80',
    'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=200&q=80',
  ],
  'Electronics': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=200&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&q=80',
    'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=200&q=80',
    'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=200&q=80',
  ],
  'Fitness': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&q=80',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&q=80',
  ],
  'Supermarket': [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&q=80',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=200&q=80',
    'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=200&q=80',
  ],
};

const storyLabelsEn = ['New', 'Sale', 'Tips', 'Events', 'News'];
const storyLabelsHe = ['חדש', 'מבצע', 'טיפים', 'אירועים', 'חדשות'];

export function StoriesRow({ business }: StoriesRowProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const labels = isHe ? storyLabelsHe : storyLabelsEn;

  const images = categoryStoryImages[business.category] || categoryStoryImages['Fast Food'];

  const stories = images.map((image, i) => ({
    id: i + 1,
    image,
    label: labels[i] || labels[0],
  }));

  return (
    <div className="px-6 py-4">
      <h2 className="text-2xl font-bold text-text-primary mb-4">{t.business.stories}</h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-3">
        {stories.map((story) => (
          <button
            key={story.id}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center">
                  <img src={story.image} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-text-secondary font-medium">{story.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Offers Slider Section ───────────────────────────────────────── */

interface OffersSectionProps {
  vouchers: Voucher[];
  business: Business;
  onSelect: (v: Voucher) => void;
  /** Override the section heading (e.g. the club's "הטבות {tenant}"). */
  title?: string;
}

export function OffersSlider({ vouchers, business, onSelect, title }: OffersSectionProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  if (vouchers.length === 0) return null;

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title ?? t.business.offers}</h2>
        <button className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95">
          {t.business.allOffers}
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-6 pb-1 snap-x snap-mandatory">
        {vouchers.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150 flex flex-col"
          >
            {/* Image area */}
            <div className="relative bg-surface overflow-hidden" style={{ height: '20vh' }}>
              {v.imageUrl ? (
                <img src={v.imageUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: 56 }}>{v.image}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Brand logo — top start */}
              {business.logoUrl && (
                <div
                  className="absolute top-2.5 start-2.5 z-10 w-10 h-10 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden bg-white"
                >
                  <img src={business.logoUrl} alt={isHe ? business.nameHe : business.name} className="w-[80%] h-[80%] object-contain" />
                </div>
              )}

              {/* Discount badge — top end */}
              <div className="absolute top-2.5 end-2.5 z-10">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-300">
                  {v.discountPercent}% {isHe ? 'הנחה' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Bottom info */}
            <div className="px-3 py-3">
              <p className="text-[10px] text-text-secondary leading-tight">{isHe ? business.nameHe : business.name}</p>
              <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug mt-0.5">
                {isHe ? v.titleHe : v.title}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">₪{v.discountedPrice}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Products Section ───────────────────────────────────────────── */

/**
 * Product thumbnail that adapts to the image content:
 *  - Transparent product cut-out (PNG/SVG with alpha) → sits centred on the
 *    grey plate (object-contain), light backgrounds multiplied away.
 *  - Full photo (e.g. a model / dish, no transparency) → fills the whole
 *    square (object-cover), no grey showing.
 * Detection samples the image's corner pixels on a tiny canvas; if any corner
 * is (semi-)transparent it's treated as a cut-out. Cross-origin-tainted or
 * failed loads fall back to "cover".
 */
export function ProductImage({ src }: { src: string }) {
  const [fit, setFit] = useState<'cover' | 'contain'>('contain');

  useEffect(() => {
    let cancelled = false;
    let idleId: ReturnType<typeof requestIdleCallback> | undefined;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const analyse = () => {
        if (cancelled) return;
        try {
          const size = 24;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { setFit('cover'); return; }
          ctx.drawImage(img, 0, 0, size, size);
          const pts: Array<[number, number]> = [
            [0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1],
            [size >> 1, 0], [0, size >> 1], [size - 1, size >> 1], [size >> 1, size - 1],
          ];
          const transparent = pts.some(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] < 250);
          setFit(transparent ? 'contain' : 'cover');
        } catch {
          setFit('cover');
        }
      };
      if ('requestIdleCallback' in window) {
        idleId = requestIdleCallback(analyse);
      } else {
        analyse();
      }
    };
    img.onerror = () => { if (!cancelled) setFit('cover'); };
    img.src = src;
    return () => {
      cancelled = true;
      if (idleId !== undefined) cancelIdleCallback(idleId);
    };
  }, [src]);

  if (fit === 'cover') {
    return <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />;
  }
  return (
    <img src={src} alt="" className="object-contain h-24" style={{ mixBlendMode: 'multiply' }} />
  );
}

interface ProductsSectionProps {
  products: Product[];
  business: Business;
}

export function ProductsSection({ products, business }: ProductsSectionProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const navigate = useNavigate();

  if (!products || products.length === 0) return null;

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{t.business.products}</h2>
        <button
          onClick={() => navigate(`/${language}/business/${business.id}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
        >
          {t.business.allProducts}
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-6 pb-1">
        {products.map((product) => {
          const discountPercent = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;

          return (
            <button
              key={product.id}
              onClick={() => navigate(`/${language}/business/${business.id}/product/${product.id}`)}
              className="min-w-[160px] w-40 shrink-0 text-start active:scale-[0.98] transition-transform"
            >
              {/* Square image area */}
              <div className="bg-gray-50 rounded-2xl p-4 relative aspect-square flex items-center justify-center overflow-hidden">
                {discountPercent > 0 && (
                  <span className="absolute top-2 start-2 z-10 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{discountPercent}% {isHe ? 'הנחה' : 'OFF'}
                  </span>
                )}
                <ProductImage src={product.image} />
              </div>
              {/* Product info */}
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-text-primary leading-tight line-clamp-1">
                  {isHe ? product.nameHe : product.name}
                </h3>
                <p className="text-lg font-bold text-text-primary mt-1">
                  {product.currency}{product.price}
                </p>
                {product.originalPrice && (
                  <p className="text-[10px] text-text-muted line-through">
                    {product.currency}{product.originalPrice}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Services Section ───────────────────────────────────────────── */

interface ServicesSectionProps {
  services: Service[];
  business: Business;
}

export function ServicesSection({ services, business: _business }: ServicesSectionProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  if (!services || services.length === 0) return null;

  return (
    <div className="px-6 pb-6">
      <h2 className="text-2xl font-bold text-text-primary mb-4">{t.business.services}</h2>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-surface rounded-2xl p-4 flex items-center gap-3"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>
                {service.icon}
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {isHe ? service.nameHe : service.name}
              </p>
              <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                {isHe ? service.descriptionHe : service.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {(isHe ? service.priceRangeHe : service.priceRange) && (
                  <span className="text-xs font-semibold text-primary">
                    {isHe ? service.priceRangeHe : service.priceRange}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-amber-400" style={{ fontSize: 11 }}>★</span>
                  <span className="text-[11px] text-text-muted">{service.rating}</span>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Buy In Store (Map) Section ──────────────────────────────────── */

interface MapSectionProps {
  branches: Branch[];
  business: Business;
}

// Map a business category string to one of OffersMap's 5 buckets. Branches
// render with the brand logo on the pin anyway, so this only drives the
// fallback tint behind the logo.
function businessToOfferCategory(category: string): OfferCategory {
  const c = (category || '').toLowerCase();
  if (/(food|restaurant|cafe|coffee|burger|אוכל|מסעד|קפה|המבורגר)/.test(c)) return 'food';
  if (/(retail|shop|fashion|store|קני|אופנ|חנות)/.test(c)) return 'retail';
  if (/(health|wellness|spa|beauty|בריאות|יופי|ספא)/.test(c)) return 'wellness';
  if (/(entertain|cinema|movie|fun|בידור|קולנוע)/.test(c)) return 'entertainment';
  return 'services';
}

export function BuyInStoreSection({ branches, business }: MapSectionProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const [activeIndex, setActiveIndex] = useState(0);
  // Per-branch replay counter — bumped only for the branch that just became
  // selected, so its location pin re-animates on selection.
  const [branchAnimTick, setBranchAnimTick] = useState<Record<string, number>>({});
  const [mapReady, setMapReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lng: number; lat: number; zoom?: number } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  // Suppress the scroll-spy while we programmatically center a card, so the
  // smooth-scroll doesn't echo back and fight the selection.
  const programmaticScroll = useRef(false);

  // Branches → OffersMap pins. Each pin keeps the branch id so clicks map back.
  const pins = useMemo<OfferPin[]>(
    () =>
      branches.map((b) => ({
        id: b.id,
        name: isHe ? b.nameHe : b.name,
        category: businessToOfferCategory(business.category),
        lng: b.lng,
        lat: b.lat,
        tenantId: business.id,
        brandLogo: business.logoUrl,
      })),
    [branches, business.category, business.id, business.logoUrl, isHe],
  );

  // Select a branch: highlight its pin + fly the map to it.
  const focusBranch = useCallback(
    (index: number) => {
      const branch = branches[index];
      if (!branch) return;
      activeIndexRef.current = index;
      setActiveIndex(index);
      setBranchAnimTick((m) => ({ ...m, [branch.id]: (m[branch.id] ?? 0) + 1 }));
      setFlyTarget({ lng: branch.lng, lat: branch.lat, zoom: 15 });
    },
    [branches],
  );

  // flyTo fires on reference change — clear it shortly after so re-selecting
  // the same branch still triggers a fresh fly.
  useEffect(() => {
    if (!flyTarget) return;
    const id = setTimeout(() => setFlyTarget(null), 750);
    return () => clearTimeout(id);
  }, [flyTarget]);

  // Center on the first branch once on mount.
  useEffect(() => {
    if (branches.length > 0) {
      setFlyTarget({ lng: branches[0].lng, lat: branches[0].lat, zoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.length]);

  // Scroll-spy: whichever card is centered becomes the active branch.
  const rafRef = useRef<number>(0);
  const onCarouselScroll = useCallback(() => {
    if (programmaticScroll.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = carouselRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      let closest = 0;
      let min = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(center - c);
        if (d < min) { min = d; closest = i; }
      });
      if (closest !== activeIndexRef.current) focusBranch(closest);
    });
  }, [focusBranch]);

  // Center a card in the carousel (used when a pin is tapped on the map).
  const scrollCardIntoView = useCallback((index: number) => {
    const el = carouselRef.current;
    const child = el?.children[index] as HTMLElement | undefined;
    if (!el || !child) return;
    programmaticScroll.current = true;
    child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setTimeout(() => { programmaticScroll.current = false; }, 450);
  }, []);

  const handlePinClick = useCallback(
    (pin: OfferPin) => {
      const idx = branches.findIndex((b) => b.id === pin.id);
      if (idx >= 0) {
        focusBranch(idx);
        scrollCardIntoView(idx);
      }
    },
    [branches, focusBranch, scrollCardIntoView],
  );

  if (branches.length === 0) return null;

  return (
    <div className="pb-6">
      <div className="px-6">
        <h2 className="text-2xl font-bold text-text-primary mb-1">{t.business.buyInStore}</h2>
        <p className="text-sm text-text-secondary mb-4">
          {branches.length} {t.business.branches}
        </p>

        {/* Map — MapLibre OffersMap. Recenters on the active branch. */}
        <div className="relative rounded-2xl overflow-hidden mb-4 border border-border/30 h-[220px]">
          <OffersMap
            pins={pins}
            initialCenter={[branches[0].lng, branches[0].lat]}
            initialZoom={14}
            selectedPinId={branches[activeIndex]?.id ?? null}
            flyTo={flyTarget}
            onPinClick={handlePinClick}
            onLoad={() => setMapReady(true)}
            showControls={false}
            showPopup={false}
            rtl={isHe}
            className="w-full h-full"
          />

          {/* Plain gray loading box with a sweeping glow — no map symbols.
              Fades out once the interactive GL map has loaded. */}
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
      </div>

      {/* Branch carousel — scroll a card to center it; the map flies to it. */}
      <div
        ref={carouselRef}
        onScroll={onCarouselScroll}
        className="flex overflow-x-auto scrollbar-hide gap-3 snap-x snap-mandatory px-6 scroll-px-6 pb-1"
      >
        {branches.map((branch, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={branch.id}
              onClick={() => { focusBranch(i); scrollCardIntoView(i); }}
              className={`flex-none w-[82%] snap-center text-start bg-white rounded-2xl overflow-hidden border-2 transition-colors active:scale-[0.99] ${
                active ? 'border-primary shadow-md' : 'border-border/40 shadow-sm'
              }`}
            >
              {/* Top row: brand logo + branch name */}
              <div className="flex items-center gap-3 p-3.5 pb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-border/30">
                  {business.logoUrl ? (
                    <img src={business.logoUrl} alt="" className={business.id === 'biz_007' ? 'w-full h-full object-cover' : 'w-7 h-7 object-contain'} />
                  ) : (
                    <span className="text-lg">{business.logo}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {isHe ? branch.nameHe : branch.name}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {isHe ? business.categoryHe : business.category}
                  </p>
                </div>
              </div>
              {/* Bottom row: address + hours + navigate */}
              <div className="flex items-center gap-3 px-3.5 pb-3.5">
                <div className="flex-1 min-w-0 ps-[52px]">
                  <p className="text-xs text-text-secondary line-clamp-1">
                    {isHe ? branch.addressHe : branch.address}
                  </p>
                  {branch.openHour !== undefined && (
                    <p className="text-[11px] text-text-muted mt-0.5" dir="ltr">
                      {branch.openHour}:00 – {branch.closeHour}:00
                    </p>
                  )}
                </div>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://waze.com/ul?ll=${branch.lat},${branch.lng}&navigate=yes`);
                  }}
                  className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <AnimatedLocationIcon size={18} className="text-primary" playKey={branchAnimTick[branch.id] ?? 0} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* View all locations — same gray pill as the reviews "view all". */}
      <div className="px-6">
        <button
          onClick={() => navigate(`/${language}/near-you-map`)}
          className="w-full bg-surface text-text-primary font-bold py-3.5 rounded-2xl text-sm mt-4 active:opacity-70 transition-opacity"
        >
          {isHe ? 'כל המיקומים' : 'View all locations'}
        </button>
      </div>
    </div>
  );
}

/* ─── Reviews Section ─────────────────────────────────────────────── */

interface ReviewsSectionProps {
  reviews: Review[];
  business: Business;
}

export function ReviewsSection({ reviews, business }: ReviewsSectionProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [showAll, setShowAll] = useState(false);
  const displayReviews = showAll ? reviews : reviews.slice(0, 3);

  if (reviews.length === 0) return null;

  // Rating distribution → percentages (5★ … 1★), matching the product page.
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { ratingCounts[r.rating - 1]++; });
  const ratingBars = [5, 4, 3, 2, 1].map((star) => ({
    label: String(star),
    pct: reviews.length ? Math.round((ratingCounts[star - 1] / reviews.length) * 100) : 0,
  }));

  return (
    <section className="px-6 pt-2 pb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
      <h2 className="text-xl font-bold text-text-primary mb-5">
        {isHe ? 'דירוגים וביקורות' : 'Ratings & reviews'}
      </h2>

      {/* Summary row: big number + bar chart */}
      <div className="flex items-start gap-8 mb-6">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-5xl font-extrabold tracking-tighter text-text-primary">
              {business.rating.toFixed(1)}
            </span>
            <span className="material-symbols-rounded text-black" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            {business.reviewCount.toLocaleString()} {isHe ? 'דירוגים' : 'ratings'}
          </p>
        </div>
        <RatingBars bars={ratingBars} />
      </div>

      {/* Horizontal review cards */}
      <div className="flex overflow-x-auto gap-4 scrollbar-hide pb-2 -mx-6 px-6">
        {displayReviews.map((review) => (
          <div key={review.id} className="min-w-[260px] flex-shrink-0 bg-white border border-border/60 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-bold text-text-primary mb-1">{review.userName}</p>
            <p className="text-sm text-text-secondary leading-snug line-clamp-2 mb-3">
              {isHe ? review.textHe : review.text}
            </p>
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`material-symbols-rounded ${s <= review.rating ? 'text-black' : 'text-gray-200'}`}
                  style={{ fontSize: 12, fontVariationSettings: s <= review.rating ? "'FILL' 1" : "'FILL' 0" }}
                >star</span>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              {new Date(review.date).toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
                month: 'short', day: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAll(true)}
        className="w-full bg-surface text-text-primary font-bold py-3.5 rounded-2xl text-sm mt-5 active:opacity-70 transition-opacity"
      >
        {isHe ? 'כל הביקורות' : 'View all reviews'}
      </button>
    </section>
  );
}

/* ─── Similar Businesses Slider ──────────────────────────────────── */

interface SimilarBusinessesProps {
  business: Business;
  allBusinesses: Business[];
  onSelect: (b: Business) => void;
}

export function SimilarBusinesses({ business, allBusinesses, onSelect }: SimilarBusinessesProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const similar = allBusinesses.filter(
    (b) => b.id !== business.id && b.category === business.category,
  );

  if (similar.length === 0) return null;

  return (
    <div className="pb-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{t.business.similarBusinesses}</h2>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-6 pb-1 snap-x snap-mandatory">
        {similar.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150 flex flex-col"
          >
            {/* Image area */}
            <div className="relative bg-surface overflow-hidden" style={{ height: '20vh' }}>
              {b.heroImageUrl ? (
                <img src={b.heroImageUrl} alt={b.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: 56 }}>{b.logo}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Brand logo */}
              {b.logoUrl && (
                <div className="absolute top-2.5 start-2.5 z-10 w-10 h-10 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden bg-white">
                  <img src={b.logoUrl} alt={b.name} className="w-[80%] h-[80%] object-contain" />
                </div>
              )}

              {/* Rating badge */}
              <div className="absolute top-2.5 end-2.5 z-10">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-text-primary">
                  <span className="material-symbols-outlined text-warning" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>star</span>
                  {b.rating}
                </span>
              </div>
            </div>

            {/* Bottom info */}
            <div className="px-3 py-3">
              <p className="text-[10px] text-text-secondary leading-tight">{isHe ? b.categoryHe : b.category}</p>
              <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug mt-0.5">
                {isHe ? b.nameHe : b.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Sticky CTA Button ──────────────────────────────────────────── */

// Fraction of the button's width the finger must travel for the swipe to
// commit (navigate). Below this the fill recedes back to the pay state.
const COMMIT_FRACTION = 0.7;

interface StickyCTAProps {
  business: Business;
  /** First/featured voucher of this business — swipe target. */
  firstVoucherId?: string;
}

export function StickyCTA({ business, firstVoucherId }: StickyCTAProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isHe = language === 'he';
  // The pay button doubles as a slide-to-confirm control: a tap jumps to
  // the wallet, a horizontal drag opens the business's first voucher. The
  // sky-blue fill tracks the finger along the FULL width of the button —
  // the drag distance is measured against the live button width so the
  // fill literally follows the finger across the track and commits once it
  // passes COMMIT_FRACTION of the way.
  const btnRef = useRef<HTMLButtonElement>(null);
  const [trackW, setTrackW] = useState(280);
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const update = () => setTrackW(el.offsetWidth || 280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const offsetX = useMotionValue(0);
  const draggedRef = useRef(false);
  // Map the pan distance (over the full button width) → 0…1 fill progress.
  // In RTL the gesture goes leftwards (negative offset), so the input
  // range is flipped.
  const progress = useTransform(
    offsetX,
    isHe ? [-trackW, 0] : [0, trackW],
    isHe ? [1, 0] : [0, 1],
    { clamp: true },
  );
  const payOpacity = useTransform(progress, [0, 0.9], [1, 0]);

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    const dist = isHe ? -info.offset.x : info.offset.x;
    if (dist > trackW * COMMIT_FRACTION && firstVoucherId) {
      navigate(`/${language}/business/${business.id}/voucher/${firstVoucherId}`);
    }
    // Recede the fill back to the dark pay state.
    animate(offsetX, 0, { type: 'spring', stiffness: 500, damping: 40 });
    // Keep the flag up one tick so the synthetic click after a touch-pan
    // doesn't fire the fast-pay action.
    setTimeout(() => { draggedRef.current = false; }, 80);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999]" style={{ pointerEvents: 'none' }}>
      <div className="max-w-md mx-auto px-5 pb-5 pt-3 flex flex-col items-center gap-2" style={{ pointerEvents: 'auto', background: 'linear-gradient(to top, white 60%, transparent)' }}>
        <motion.button
          ref={btnRef}
          onPanStart={() => { draggedRef.current = true; }}
          onPan={(_, info) => { offsetX.set(info.offset.x); }}
          onPanEnd={handlePanEnd}
          onClick={() => {
            if (draggedRef.current) return;
            navigate(`/${language}/wallet`, { state: { payMode: true } });
          }}
          style={{ touchAction: 'pan-y' }}
          className="relative w-full overflow-hidden bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 flex items-center justify-center gap-0"
        >
          {/* Sky-blue fill — grows horizontally, tracking the finger along
              the button. Anchored to the swipe-start edge (right in RTL,
              left in LTR) so it sweeps across the full track. */}
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 bg-sky-300 pointer-events-none"
            style={{ scaleX: progress, transformOrigin: isHe ? 'right' : 'left' }}
          />

          {/* Pay label — fades out as the button is slid. */}
          <motion.span
            className="relative z-10 inline-flex items-center gap-0 leading-none pointer-events-none"
            style={{ opacity: payOpacity }}
          >
            <span>{isHe ? `שלם ב${business.name} עם` : `Pay at ${business.name} with`}</span>
            <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden" style={{ transform: 'scale(0.873)' }}>
              <img
                src="/nexus-logo-black.png"
                alt="Nexus"
                className="h-7 w-auto object-contain"
                style={{ transform: 'scale(1.373)' }}
              />
            </span>
          </motion.span>

          {/* Build label — crossfades in over the same space, navy on sky. */}
          <motion.span
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{ opacity: progress, color: '#0a153f' }}
          >
            {isHe ? 'צור עסקה בתנאים שלך' : 'Create a deal on your terms'}
          </motion.span>
        </motion.button>

        {/* Hint — the drag affordance. Pulses to invite the gesture. */}
        <p className="flex items-center gap-1 text-xs font-medium text-text-secondary animate-pulse">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }} aria-hidden="true">
            {isHe ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
          </span>
          <span>{isHe ? 'או החלק ליצירת עסקה בתנאים שלך' : 'Or swipe to create a deal on your terms'}</span>
        </p>
      </div>
    </div>
  );
}
