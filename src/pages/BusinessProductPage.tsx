import { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useCartStore } from '../stores/cartStore';
import { useLanguage } from '../i18n/LanguageContext';
import { ProductImage } from '../components/business/BusinessContent';
import AddressSheet, { type Address } from '../components/business/AddressSheet';
import RatingBars from '../components/ui/RatingBars';
import { useInViewOnce } from '../hooks/useInViewOnce';
import { useUIStore } from '../stores/uiStore';

/**
 * BusinessProductPage — Rhode-style product detail screen.
 *
 * Reached by tapping a product in a business store's "all products" grid.
 * Lays out a brand header, an image gallery, price / shipping / quantity
 * controls, a description block, policy pills and a sticky bottom action
 * bar (Add to cart / Buy now). Adapted to nexus-wallet conventions
 * (RTL/bilingual, max-w-md frame, brand-purple accents).
 */

// Brand-purple accents borrowed from the Rhode reference design.
// Brand primary — matches --color-primary used by every other CTA in the app
// (bg-primary). Keeping the buttons here on the same value so they read as part
// of the site rather than a one-off violet.
const PURPLE = '#635bff';
const PURPLE_SOFT = '#E4E2FB';

export default function BusinessProductPage() {
  const { businessId, productId } = useParams<{ businessId: string; productId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Add to the global cart; a shrinking copy of the product image flies into
  // the global floating cart button (rendered by AppLayout).
  const addToGlobalCart = useCartStore((s) => s.addItem);
  const flyerSeq = useRef(0);
  const [flyers, setFlyers] = useState<
    { id: number; top: number; left: number; w: number; h: number; endX: number; endY: number }[]
  >([]);

  const [addresses, setAddresses] = useState<Address[]>([
    { id: 'home', label: isHe ? 'בית' : 'Home', line: isHe ? 'הרצל 45, תל אביב' : '45 Herzl St, Tel Aviv' },
    { id: 'work', label: isHe ? 'עבודה' : 'Work', line: isHe ? 'רוטשילד 12, תל אביב' : '12 Rothschild Blvd, Tel Aviv' },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState('home');
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  // Price-insights time window (Google-Flights-style price history below reviews).
  const [priceRange, setPriceRange] = useState<'1m' | '3m' | '1y'>('3m');
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];

  // While lifted, the page becomes a viewport-tall card so raising it actually
  // exposes the black checkout beneath (a long document would just scroll and
  // keep covering the screen). Measured against the *visible* viewport
  // (visualViewport) — what the user truly sees, excluding browser toolbars.
  const visibleHeight = () =>
    (typeof window !== 'undefined' && window.visualViewport?.height) ||
    (typeof window !== 'undefined' ? window.innerHeight : 800);
  const [vpHeight, setVpHeight] = useState(() =>
    typeof window !== 'undefined' ? visibleHeight() : 800,
  );
  useEffect(() => {
    const update = () => setVpHeight(visibleHeight());
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);
  // The frame lifts by this much (kept fixed — this sets where the black
  // checkout sits and how big the top strip is).
  const liftMax = vpHeight * 0.62;
  // Independently, slide the page CONTENT up inside the fixed frame so the
  // part BELOW the hero image (price / qty / CTAs) shows, instead of pinning
  // to the very top. Larger pageReveal = page sits higher inside the card =
  // you see further past the burger. The frame + black stay put.
  const pageReveal = vpHeight * 1.0;
  const pageShift = liftMax - pageReveal;

  // The lift is driven by a single MotionValue (0 = down/closed,
  // -liftMax = fully lifted). The page transform AND the checkout reveal are
  // both bound to it, so the black checkout opens *gradually, in lockstep with
  // how far the top page has actually risen* — including mid-drag — rather than
  // a fixed-duration pop.
  const liftY = useMotionValue(0);
  useEffect(() => {
    const controls = animate(liftY, quickBuyOpen ? -liftMax : 0, {
      type: 'spring',
      damping: 32,
      stiffness: 340,
    });
    return controls.stop;
  }, [quickBuyOpen, liftMax, liftY]);
  // 0 → 1 as the page rises from rest to fully lifted.
  const liftProgress = useTransform(liftY, [0, -liftMax], [0, 1]);
  // Checkout grows + fades in over the back half of the rise, so it unfolds
  // gradually as the page clears it (not all at once at the start).
  const checkoutScale = useTransform(liftProgress, [0.15, 1], [0.9, 1]);
  const checkoutOpacity = useTransform(liftProgress, [0.2, 0.95], [0, 1]);

  // Lock body scroll while the page is lifted so the drag gesture owns
  // the vertical axis instead of fighting document scroll.
  const setProductLifted = useUIStore((s) => s.setProductLifted);
  useEffect(() => {
    document.body.style.overflow = quickBuyOpen ? 'hidden' : '';
    // Tell AppLayout to hide the global TopBar overlay while lifted, so the
    // lifted card covers the top strip (user icon / support / bell).
    setProductLifted(quickBuyOpen);
    return () => {
      document.body.style.overflow = '';
      setProductLifted(false);
    };
  }, [quickBuyOpen, setProductLifted]);

  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.offsetWidth / 2;
    let closest = 0;
    let min = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const dist = Math.abs(center - (c.offsetLeft + c.offsetWidth / 2));
      if (dist < min) {
        min = dist;
        closest = i;
      }
    });
    setActiveImage(closest);
  };

  // Drives the price-insights entrance: band fills, the chart line draws
  // itself and the marker/dot pop in once the section scrolls into view.
  const { ref: insightsRef, inView: insightsInView } = useInViewOnce<HTMLDivElement>(0.3);

  if (!business || !product) return <Navigate to=".." replace />;

  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const productDesc = isHe ? product.descriptionHe : product.description;

  // Selectable colour variants — swatch row under the price.
  const colorOptions = [
    { hex: '#A14D3A', name: isHe ? 'חימר' : 'Clay' },
    { hex: '#ECECEC', name: isHe ? 'אבן' : 'Stone' },
    { hex: '#1A1A1A', name: isHe ? 'שחור' : 'Black' },
    { hex: '#9CAE9C', name: isHe ? 'מרווה' : 'Sage' },
  ];
  const selectedColor = colorOptions[colorIndex] ?? colorOptions[0];

  // Build a small gallery: the product shot first, then a couple of brand
  // hero images so the strip feels populated even with one product photo.
  const gallery = [product.image, ...(business.heroImages ?? [])].slice(0, 4);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Free-shipping progress — playful flourish from the reference design.
  const freeShippingThreshold = 150;
  const cartTotal = product.price * qty;
  const shippingProgress = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, freeShippingThreshold - cartTotal);

  const stars = Math.round(business.rating);
  const otherProducts = (business.products ?? []).filter((p) => p.id !== productId).slice(0, 6);

  // Mock rating distribution derived from overall rating
  const ratingBars = [
    { label: '5', pct: Math.round(Math.min(95, (business.rating - 1) / 4 * 95)) },
    { label: '4', pct: 8 },
    { label: '3', pct: 4 },
    { label: '2', pct: 2 },
    { label: '1', pct: 1 },
  ];

  // ── Price-insights model ─────────────────────────────────────────────
  // A Google-Flights-style price-history read on the product. All figures
  // are derived deterministically from the product price so the chart, the
  // range bar marker and the copy stay internally consistent.
  const cur = product.currency;
  const priceLow = Math.round(product.price * 0.82);
  const priceHigh = Math.round(product.price * 1.34);
  // Where today's price sits inside the [low, high] band (0–1).
  const priceMarker = Math.max(
    0.04,
    Math.min(0.96, (product.price - priceLow) / (priceHigh - priceLow)),
  );
  // Three-way verdict on where today's price sits in the band.
  const priceVerdict: 'low' | 'typical' | 'high' =
    priceMarker <= 0.4 ? 'low' : priceMarker <= 0.66 ? 'typical' : 'high';
  // Dynamic headline that mirrors the verdict.
  const verdictHeadline = isHe
    ? { low: 'המחירים נמוכים כרגע', typical: 'המחירים רגילים כרגע', high: 'המחירים גבוהים כרגע' }[priceVerdict]
    : { low: 'Prices are low right now', typical: 'Prices are typical right now', high: 'Prices are high right now' }[priceVerdict];
  // The verdict phrase, emphasised black inside the summary sentence.
  const verdictPhrase = isHe
    ? { low: 'מתחת למחיר הרגיל', typical: 'בערך המחיר הרגיל', high: 'מעל המחיר הרגיל' }[priceVerdict]
    : { low: 'below the usual price', typical: 'around the usual price', high: 'above the usual price' }[priceVerdict];

  // History series per selected window. Each entry is a normalised value
  // 0–1 (share of the band) that the SVG maps to a y-coordinate.
  const priceSeries: Record<typeof priceRange, number[]> = {
    '1m': [0.55, 0.5, 0.62, 0.48, 0.4, 0.46, 0.38, priceMarker],
    '3m': [0.7, 0.62, 0.66, 0.5, 0.58, 0.44, 0.5, 0.36, 0.42, priceMarker],
    '1y': [0.9, 0.78, 0.84, 0.66, 0.72, 0.6, 0.5, 0.56, 0.44, 0.5, 0.4, priceMarker],
  };
  const series = priceSeries[priceRange];
  const axisLabels: Record<typeof priceRange, string[]> = {
    '1m': isHe ? ['לפני חודש', 'השבוע', 'היום'] : ['1 mo ago', 'This week', 'Today'],
    '3m': isHe ? ['אוג׳', 'ספט׳', 'אוק׳'] : ['Aug', 'Sep', 'Oct'],
    '1y': isHe ? ['רבעון 1', 'רבעון 3', 'היום'] : ['Q1', 'Q3', 'Today'],
  };

  // Map the 0–1 series to an SVG polyline / area path in a 320×120 viewBox.
  const CHART_W = 320;
  const CHART_H = 120;
  const chartPts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * CHART_W;
    // Higher value = higher price = higher on screen (smaller y). Pad 12px.
    const y = 12 + (1 - v) * (CHART_H - 24);
    return { x, y };
  });
  const linePath = chartPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
  // Grid lines + price labels (top = high, bottom = low).
  const gridRows = [
    { y: 12, price: priceHigh },
    { y: CHART_H / 2, price: Math.round((priceHigh + priceLow) / 2) },
    { y: CHART_H - 12, price: priceLow },
  ];

  const rangePills: { id: typeof priceRange; label: string }[] = [
    { id: '1m', label: isHe ? 'חודש' : '1 month' },
    { id: '3m', label: isHe ? '3 חודשים' : '3 months' },
    { id: '1y', label: isHe ? 'שנה' : '1 year' },
  ];

  const mockReviews = [
    {
      body: isHe ? 'מוצר מעולה, אפשר להרגיש את האיכות מיד. ממליץ בחום לכולם!' : 'Amazing product, you can feel the quality right away. Highly recommend!',
      stars: 5,
      author: isHe ? 'מינלי · היום' : 'Minali · Today',
    },
    {
      body: isHe ? 'שירות נהדר ומשלוח מהיר. המוצר הגיע בדיוק כמתואר.' : 'Great service and fast shipping. The product arrived exactly as described.',
      stars: 4,
      author: isHe ? 'יואב · לפני 3 ימים' : 'Yoav · 3 days ago',
    },
  ];

  // Add to the global cart; a shrinking copy of the product image flies
  // toward the global cart button parked at the bottom-right corner.
  const handleAddToCart = () => {
    const startEl = galleryRef.current;
    if (startEl) {
      const s = startEl.getBoundingClientRect();
      flyerSeq.current += 1;
      setFlyers((f) => [
        ...f,
        {
          id: flyerSeq.current,
          top: s.top + s.height / 2 - 60,
          left: s.left + s.width / 2 - 60,
          w: 120,
          h: 120,
          // Global FAB centre: right:16 + 28 (half), bottom:96 + 28; minus
          // half the 28px flyer.
          endX: window.innerWidth - 58,
          endY: window.innerHeight - 138,
        },
      ]);
    }
    addToGlobalCart(
      {
        businessId: business.id,
        productId: product.id,
        name: product.name,
        nameHe: product.nameHe,
        image: product.image,
        price: product.price,
        currency: product.currency,
      },
      qty,
    );
  };

  return (
    <>
      {/* Fly-to-cart image copies → the global cart button. */}
      {flyers.map((fl) => (
        <motion.img
          key={fl.id}
          src={product.image}
          aria-hidden
          initial={{ top: fl.top, left: fl.left, width: fl.w, height: fl.h, borderRadius: 24, opacity: 1 }}
          animate={{ top: fl.endY, left: fl.endX, width: 28, height: 28, borderRadius: 999, opacity: 0.35 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setFlyers((f) => f.filter((x) => x.id !== fl.id))}
          style={{ position: 'fixed', zIndex: 70, objectFit: 'cover', pointerEvents: 'none' }}
        />
      ))}

    {/* ───────────────────────────────────────────────
        BLACK CHECKOUT — sits fixed UNDERNEATH the product page.
        Revealed in the lower area when the page lifts up.
       ─────────────────────────────────────────────── */}
    <AnimatePresence>
      {quickBuyOpen && (
        <motion.div
          className="fixed inset-x-0 top-0 bottom-0 z-0 max-w-md mx-auto overflow-hidden"
          style={{ background: '#121212' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          dir={isHe ? 'rtl' : 'ltr'}
        >
          <div className="absolute inset-0 overflow-y-auto scrollbar-hide pt-[40vh] pb-10" style={{ touchAction: 'pan-y' }}>
            <motion.div
              className="mx-4 bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-5"
              style={{
                // Reveal is bound to the page's lift (liftProgress): the card
                // scales + fades in gradually as the page rises to clear it,
                // staying in lockstep with the upward motion.
                scale: checkoutScale,
                opacity: checkoutOpacity,
                transformOrigin: 'top center',
              }}
            >
              {/* Brand header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={business.logoUrl}
                    alt={brandName}
                    className="w-8 h-8 object-contain"
                    style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg leading-tight">{brandName}</p>
                  <div className="flex items-center gap-1 text-[13px] text-gray-400">
                    <span className="font-medium text-white">{business.rating.toFixed(1)}</span>
                    <span className="material-symbols-rounded text-white" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span>({business.reviewCount.toLocaleString()})</span>
                  </div>
                </div>
              </div>

              {/* Product row */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0">
                  <img src={product.image} alt={productName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-white font-medium text-[15px] leading-snug flex-1">{productName}</p>
                    <p className="text-white font-medium text-[15px] shrink-0 whitespace-nowrap">
                      {product.currency}{product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-3">
                    <div className="flex items-center gap-3 bg-black/40 rounded-lg px-2 py-1">
                      <button className="text-white p-1 active:opacity-60" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{qty <= 1 ? 'delete' : 'remove'}</span>
                      </button>
                      <span className="text-white font-bold text-sm min-w-[14px] text-center">{qty}</span>
                      <button className="text-white p-1 active:opacity-60" onClick={() => setQty((q) => q + 1)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                      </button>
                    </div>
                    <button className="bg-black/40 w-10 h-8 rounded-lg flex items-center justify-center active:opacity-60">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>more_horiz</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Shipping progress */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">
                    {remainingForFree > 0
                      ? (isHe ? `הוסף ${product.currency}${remainingForFree} למשלוח חינם` : `Add ${product.currency}${remainingForFree} for free shipping`)
                      : (isHe ? '🎉 מגיע לך משלוח חינם!' : "🎉 You've earned free shipping!")}
                  </span>
                  <button className="text-white">{isHe ? 'הוסף מוצרים' : 'Add items'}</button>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${shippingProgress}%` }} />
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-white font-medium text-base">{isHe ? 'סה״כ' : 'Subtotal'}</span>
                <span className="text-white font-medium text-base">{product.currency}{cartTotal.toLocaleString()}</span>
              </div>

              {/* Checkout */}
              <button
                className="w-full bg-sky-200 text-bg-dark font-bold py-3.5 rounded-full text-base active:scale-95 transition-transform"
                onClick={() => navigate(`/${language}/business/${business.id}/product/${product.id}/checkout`, { state: { qty, color: { hex: selectedColor.hex, name: selectedColor.name } } })}
              >
                {isHe ? 'המשך לתשלום' : 'Continue to checkout'}
              </button>
            </motion.div>

            {/* Close X — flows directly below the black checkout card (not
                pinned to the screen edge), pulls the page back down. */}
            <motion.div
              className="flex justify-center mt-6"
              style={{ opacity: checkoutOpacity }}
            >
              <button
                onClick={() => setQuickBuyOpen(false)}
                aria-label="Close"
                className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>close</span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Close control — pulls the page back down over the checkout. */}
    <AnimatePresence>
      {quickBuyOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickBuyOpen(false)}
          className="fixed top-4 z-[60] w-10 h-10 bg-white/90 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow"
          style={isHe ? { left: 16 } : { right: 16 }}
        >
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>close</span>
        </motion.button>
      )}
    </AnimatePresence>

    <motion.div
      className={`isolate bg-white pt-16 pb-32 ${
        quickBuyOpen
          ? 'fixed inset-x-0 top-0 max-w-md mx-auto overflow-hidden'
          : 'relative min-h-screen overflow-x-hidden'
      }`}
      style={{
        zIndex: 10,
        height: quickBuyOpen ? vpHeight : undefined,
        borderRadius: quickBuyOpen ? '0 0 28px 28px' : 0,
        boxShadow: quickBuyOpen ? '0 14px 40px rgba(0,0,0,0.35)' : 'none',
        touchAction: quickBuyOpen ? 'none' : 'auto',
        y: liftY,
      }}
      dir={isHe ? 'rtl' : 'ltr'}
      drag={quickBuyOpen ? 'y' : false}
      dragConstraints={{ top: -liftMax, bottom: 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80 || info.velocity.y > 400) {
          setQuickBuyOpen(false);
        } else {
          // Released without dismissing — spring back up to fully lifted.
          animate(liftY, -liftMax, { type: 'spring', damping: 32, stiffness: 340 });
        }
      }}
    >
      {/* Soft brand glow at the top — mirrors the home (Wallet) page gradient. */}
      <div aria-hidden className="pointer-events-none absolute top-0 inset-x-0 h-[280px] -z-10">
        <div
          className="w-full h-full opacity-[0.12]"
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
      {/* Page content — shifts within the lifted frame (pageShift) so the
          top of the page + white space show, while the frame & black stay. */}
      <motion.div
        animate={{ y: quickBuyOpen ? pageShift : 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
      >
      {/* ── Brand row — the global TopBar (logo / profile / chat / bell +
            back) floats above; this in-page row identifies the seller. ── */}
      <div className="px-5 pt-2 flex items-center gap-2">
        <button
          onClick={() => navigate(`/${language}/business/${business.id}/store`)}
          className="flex items-center gap-2 min-w-0 flex-1 active:opacity-70 transition-opacity"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={brandName}
                className="w-10 h-10 object-contain"
                style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
              />
            ) : (
              <span className="text-sm font-bold text-black">{brandName.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 text-start">
            <p className="text-sm font-bold text-text-primary leading-tight truncate">{brandName}</p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-text-primary">
              <span>{business.rating}</span>
              <span className="text-black">★</span>
              <span className="text-text-muted font-medium">({business.reviewCount.toLocaleString()})</span>
            </div>
          </div>
        </button>

        <button
          className="h-10 w-10 inline-flex items-center justify-center rounded-full active:bg-surface transition-colors"
          aria-label="More options"
        >
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 24 }}>
            more_horiz
          </span>
        </button>
      </div>

      {/* ── Image gallery — drag/swipe carousel ── */}
      <section className="pt-3">
        <div
          ref={galleryRef}
          onScroll={onGalleryScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-5 scroll-px-5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {gallery.map((src, i) => (
            <div key={`${src}-${i}`} className="flex-shrink-0 w-[93%] snap-start">
              <div className="relative bg-[#F7F7F7] rounded-3xl aspect-[4/5] flex items-center justify-center overflow-hidden p-6">
                {discountPercent > 0 && (
                  <span className="absolute top-4 start-4 z-10 bg-pink-100 text-pink-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    -{discountPercent}%
                  </span>
                )}
                <ProductImage src={src} />
                {gallery.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {gallery.map((_, d) => (
                      <span
                        key={d}
                        className="h-1.5 rounded-full transition-all duration-200 backdrop-blur-sm"
                        style={{
                          width: activeImage === d ? 18 : 6,
                          backgroundColor: activeImage === d ? '#000000' : 'rgba(0,0,0,0.22)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Title + rating + price ── */}
      <section className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-text-primary leading-snug">{productName}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFavorite((f) => !f)}
              className="h-12 w-12 inline-flex items-center justify-center rounded-full border border-border/60 active:bg-surface transition-colors"
              aria-label="Favorite"
            >
              <span
                className={`material-symbols-outlined ${favorite ? 'text-pink-500' : 'text-text-primary'}`}
                style={{ fontSize: 24, fontVariationSettings: favorite ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300" }}
              >
                favorite
              </span>
            </button>
            <button
              className="h-12 w-12 inline-flex items-center justify-center rounded-full border border-border/60 active:bg-surface transition-colors"
              aria-label="Share"
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 24, fontVariationSettings: "'wght' 300" }}>
                ios_share
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 -mt-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`material-symbols-rounded leading-none ${s <= stars ? 'text-black' : 'text-gray-200'}`}
                style={{
                  fontSize: 19,
                  marginInline: -2,
                  fontVariationSettings: s <= stars ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            ))}
          </div>
          <span className="text-xs font-light tracking-tight text-text-muted">
            {business.reviewCount.toLocaleString()} {isHe ? 'דירוגים' : 'ratings'}
          </span>
        </div>

        <div className="flex items-end gap-2.5 mt-3">
          <span className="text-lg font-bold text-text-primary">
            {product.currency}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-text-muted line-through mb-0.5">
              {product.currency}{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Ship-to selector — opens the address bottom sheet. */}
        <button
          onClick={() => setAddressSheetOpen(true)}
          className="mt-3 inline-flex items-center gap-1 text-text-muted active:opacity-70 transition-opacity"
        >
          <span className="text-xs font-light tracking-tight">
            {isHe ? 'משלוח ל' : 'Ship to'} {selectedAddress?.line}
          </span>
          <span className="material-symbols-rounded leading-none" style={{ fontSize: 16 }}>
            expand_more
          </span>
        </button>
      </section>

      {/* ── Shipping info + free-shipping progress ── */}
      <section className="px-5 pt-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>
                local_shipping
              </span>
              {isHe ? 'משלוח עד הבית' : 'Ship to home'}
            </span>
            <span className="font-semibold text-text-primary">
              {remainingForFree === 0
                ? (isHe ? 'משלוח חינם' : 'Free shipping')
                : `${product.currency}25`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-bg-dark"
              initial={{ width: 0 }}
              animate={{ width: `${shippingProgress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {remainingForFree === 0
              ? (isHe ? 'יש לך משלוח חינם! 🎉' : "You've unlocked free shipping! 🎉")
              : isHe
                ? `הוסף ${product.currency}${remainingForFree} למשלוח חינם`
                : `Free shipping on orders over ${product.currency}${freeShippingThreshold}`}
          </p>
        </div>
      </section>

      {/* ── Colour selector ── */}
      <section className="px-5 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-text-primary">
            {isHe ? 'צבע' : 'Color'}
          </span>
          <span className="text-sm text-text-muted">{selectedColor.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {colorOptions.map((c, i) => {
            const active = i === colorIndex;
            return (
              <button
                key={c.hex}
                onClick={() => setColorIndex(i)}
                aria-label={c.name}
                aria-pressed={active}
                className={`w-9 h-9 rounded-lg transition-transform active:scale-90 ${
                  active ? 'ring-2 ring-offset-2 ring-primary' : 'ring-1 ring-inset ring-black/10'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </section>

      {/* ── Quantity selector ── */}
      <section className="px-5 pt-5">
        <span className="text-sm font-semibold text-text-primary block mb-2">
          {isHe ? 'כמות' : 'Quantity'}
        </span>
        <div className="flex items-center gap-3 bg-surface rounded-xl px-2 py-1.5 self-start inline-flex">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:scale-90 transition-transform disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="Decrease"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>remove</span>
          </button>
          <span className="text-base font-bold text-text-primary w-5 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:scale-90 transition-transform"
            aria-label="Increase"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>add</span>
          </button>
        </div>

        {/* ── CTA buttons ── */}
        <div className="flex flex-col gap-3 mt-5 mb-8">
          <button
            onClick={() => {
              window.scrollTo({ top: 0 });
              setQuickBuyOpen(true);
            }}
            className="w-full bg-bg-dark text-white py-3.5 rounded-full font-bold text-base active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            {isHe ? 'קנייה מהירה' : 'Buy now'}
          </button>
          <button
            onClick={handleAddToCart}
            className="w-full py-3.5 rounded-full font-bold text-base bg-sky-200 text-bg-dark active:scale-[0.98] transition-transform"
          >
            {isHe ? 'הוספה לסל' : 'Add to cart'}
          </button>
        </div>
      </section>

      {/* ── Description ── */}
      <section className="px-5 pt-6">
        <h2 className="text-base font-bold text-text-primary mb-2">
          {isHe ? 'תיאור' : 'Description'}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">{productDesc}</p>
        {(isHe ? business.descriptionHe : business.description) && (
          <p className="text-sm text-text-secondary leading-relaxed mt-3">
            {isHe ? business.descriptionHe : business.description}
          </p>
        )}
      </section>

      {/* ── Policy + Visit pills ── */}
      <section className="px-5 pt-6 pb-10">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button className="bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity">
            {isHe ? 'מדיניות החזרות' : 'Refund policy'}
          </button>
          <button className="bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity">
            {isHe ? 'מדיניות משלוח' : 'Shipping policy'}
          </button>
          <button className="col-span-2 bg-surface rounded-2xl py-3.5 px-4 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity">
            {isHe ? 'תנאים והגבלות' : 'Terms & conditions'}
          </button>
        </div>
        <button
          onClick={() => navigate(`/${language}/business/${business.id}/store`)}
          className="w-full bg-surface rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>link</span>
          {isHe ? `ביקור ב${brandName}` : `Visit ${brandName}`}
        </button>
      </section>

      {/* ── Ratings & Reviews ── */}
      <section className="px-5 pt-8">
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
        <div className="flex overflow-x-auto gap-4 scrollbar-hide pb-2 -mx-5 px-5">
          {mockReviews.map((r, i) => (
            <div key={i} className="min-w-[260px] flex-shrink-0 bg-white border border-border/60 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-text-primary mb-1">{productName}</p>
              <p className="text-sm text-text-secondary leading-snug line-clamp-2 mb-3">{r.body}</p>
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`material-symbols-rounded ${s <= r.stars ? 'text-black' : 'text-gray-200'}`}
                    style={{ fontSize: 12, fontVariationSettings: s <= r.stars ? "'FILL' 1" : "'FILL' 0" }}
                  >star</span>
                ))}
              </div>
              <p className="text-xs text-text-muted">{r.author}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(`/${language}/business/${business.id}/product/${product.id}/reviews`)}
          className="w-full bg-surface text-text-primary font-bold py-3.5 rounded-2xl text-sm mt-5 active:opacity-70 transition-opacity"
        >
          {isHe ? 'כל הביקורות' : 'View all reviews'}
        </button>
      </section>

      {/* ── Price insights ── (Google-Flights-style price history) */}
      <section className="px-5 pt-8">
        <h2 className="text-xl font-bold text-text-primary mb-1.5">
          {verdictHeadline}
        </h2>
        <p className="text-sm text-text-secondary leading-snug mb-5">
          {isHe ? (
            <>
              המחיר כרגע <span className="font-bold text-text-primary">{cur}{product.price}</span>. זהו{' '}
              <span className="font-bold text-text-primary">{verdictPhrase}</span>. המחיר נע בדרך כלל בין{' '}
              {cur}{priceLow}–{cur}{priceHigh}.
            </>
          ) : (
            <>
              Currently <span className="font-bold text-text-primary">{cur}{product.price}</span>. This is{' '}
              <span className="font-bold text-text-primary">{verdictPhrase}</span>. The price usually ranges{' '}
              {cur}{priceLow}–{cur}{priceHigh}.
            </>
          )}
        </p>

        {/* Price-range band: cheap → typical → expensive, with a marker.
            Centered "Today" + big current price sit above the band. */}
        <div ref={insightsRef} className="mb-6">
          <div className="text-center mb-3">
            <p className="text-sm text-text-muted">{isHe ? 'היום' : 'Today'}</p>
            <p className="text-3xl font-extrabold tracking-tight text-text-primary">
              {cur}{product.price}
            </p>
          </div>
          <div className="relative">
            {/* Marker triangle pointing up at the band, at today's position.
                Pops in once the band has filled. */}
            <div
              className="absolute -top-2 transition-all duration-500 ease-out"
              style={{
                left: `${priceMarker * 100}%`,
                transform: `translateX(-50%) translateY(${insightsInView ? '0' : '-4px'})`,
                opacity: insightsInView ? 1 : 0,
                transitionDelay: insightsInView ? '650ms' : '0ms',
              }}
            >
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: `8px solid ${PURPLE}`,
                }}
              />
            </div>
            {/* Band fills left→right on scroll-in, like the shipping slider. */}
            <div
              className="h-2.5 rounded-full transition-[clip-path] duration-700 ease-out"
              style={{
                background:
                  `linear-gradient(to right, ${PURPLE_SOFT} 0%, #c3bdfa 35%, #9089f7 65%, ${PURPLE} 100%)`,
                clipPath: insightsInView ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-text-muted">
            <span>{cur}{priceLow}</span>
            <span>{cur}{priceHigh}</span>
          </div>
        </div>

        {/* Price-history area chart. */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-32 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.28" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Horizontal grid lines */}
            {gridRows.map((g) => (
              <line
                key={g.y}
                x1={0}
                x2={CHART_W}
                y1={g.y}
                y2={g.y}
                stroke="#eceaf5"
                strokeWidth={1}
              />
            ))}
            {/* Area fill — fades in as the line finishes drawing. */}
            <path
              d={areaPath}
              fill="url(#priceFill)"
              style={{
                opacity: insightsInView ? 1 : 0,
                transition: 'opacity 0.6s ease-out',
                transitionDelay: '0.45s',
              }}
            />
            {/* Line — "draws" itself left→right via a normalised dash. */}
            <path
              d={linePath}
              fill="none"
              stroke={PURPLE}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: insightsInView ? 0 : 1,
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
            {/* Current-price dot (last point) — pops once the line lands. */}
            <circle
              cx={chartPts[chartPts.length - 1].x}
              cy={chartPts[chartPts.length - 1].y}
              r={4}
              fill={PURPLE}
              stroke="#fff"
              strokeWidth={2}
              style={{
                opacity: insightsInView ? 1 : 0,
                transform: `scale(${insightsInView ? 1 : 0})`,
                transformOrigin: `${chartPts[chartPts.length - 1].x}px ${chartPts[chartPts.length - 1].y}px`,
                transition: 'opacity 0.3s ease-out, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: '0.95s',
              }}
            />
          </svg>
          {/* Y-axis price labels overlaid on the grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            {gridRows.map((g) => (
              <span
                key={g.y}
                className="absolute text-[10px] font-medium text-text-muted bg-white/70 px-1"
                style={{
                  top: `${(g.y / CHART_H) * 100}%`,
                  [isHe ? 'right' : 'left']: 0,
                  transform: 'translateY(-50%)',
                }}
              >
                {cur}{g.price}
              </span>
            ))}
          </div>
        </div>
        {/* Date axis */}
        <div className="flex justify-between mt-1.5 text-[11px] font-medium text-text-muted">
          {axisLabels[priceRange].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        {/* Time-range pills */}
        <div className="flex justify-center gap-2 mt-5">
          {rangePills.map((pill) => {
            const active = priceRange === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setPriceRange(pill.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#0d0d1b] text-white'
                    : 'bg-surface text-text-secondary active:bg-gray-100'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Follow brand ── */}
      <section className="px-5 pt-6">
        <div className="bg-surface rounded-3xl overflow-hidden">
          {business.heroImages?.[0] ? (
            <img
              src={business.heroImages[0]}
              alt={brandName}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 flex items-center justify-center">
              <p className="text-5xl font-extrabold tracking-tighter select-none" style={{ color: 'rgba(0,0,0,0.12)' }}>
                {brandName}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-bold text-text-primary">{brandName}</span>
            <button className="bg-black text-white px-5 py-2 rounded-xl text-sm font-bold active:opacity-75 transition-opacity">
              {isHe ? 'עקוב' : 'Follow'}
            </button>
          </div>
        </div>

      </section>

      {/* ── More from brand ── */}
      {otherProducts.length > 0 && (
        <section className="pt-6 pb-14">
          <div className="px-5 flex items-center gap-1 mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {isHe ? `עוד מ${brandName}` : `More from ${brandName}`}
            </h2>
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>
          <div className="flex overflow-x-auto gap-3 scrollbar-hide px-5">
            {otherProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/${language}/business/${business.id}/product/${p.id}`)}
                className="min-w-[140px] w-[140px] aspect-square bg-surface rounded-2xl overflow-hidden flex-shrink-0 border border-border/40 active:scale-95 transition-transform"
              >
                <img
                  src={p.image}
                  alt={isHe ? p.nameHe : p.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      )}
      </motion.div>

      {/* Faded scrim — washes the whole page out while it's lifted, so it
          reads as the dimmed/inactive surface above the checkout. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ background: 'rgba(255,255,255,0.6)', opacity: quickBuyOpen ? 1 : 0 }}
      />

      {/* Pull handle — sits at the bottom edge (the seam) of the lifted card
          to signal you can drag the page back down. */}
      {quickBuyOpen && (
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 bottom-3 w-12 h-1.5 rounded-full bg-text-primary/30"
        />
      )}

    </motion.div>

    <AddressSheet
      isOpen={addressSheetOpen}
      onClose={() => setAddressSheetOpen(false)}
      addresses={addresses}
      selectedId={selectedAddressId}
      onSelect={setSelectedAddressId}
      onAddAddress={(addr) => setAddresses((prev) => [...prev, addr])}
    />
    </>
  );
}
