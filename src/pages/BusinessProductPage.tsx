import { useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import { ProductImage } from '../components/business/BusinessContent';

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
const PURPLE = '#5D3CF3';
const PURPLE_SOFT = '#DED6EB';

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

  if (!business || !product) return <Navigate to=".." replace />;

  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const productDesc = isHe ? product.descriptionHe : product.description;

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

  return (
    <div className="bg-white min-h-screen pt-16 pb-32" dir={isHe ? 'rtl' : 'ltr'}>
      {/* ── Brand row — the global TopBar (logo / profile / chat / bell +
            back) floats above; this in-page row identifies the seller. ── */}
      <div className="px-5 pt-2 flex items-center gap-2">
        <button
          onClick={() => navigate(`/${language}/business/${business.id}/store`)}
          className="flex items-center gap-2 min-w-0 flex-1 active:opacity-70 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-surface border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={brandName}
                className="w-6 h-6 object-contain"
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
              <span className="text-amber-400">★</span>
              <span className="text-text-muted font-medium">({business.reviewCount.toLocaleString()})</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFavorite((f) => !f)}
          className="h-10 w-10 inline-flex items-center justify-center rounded-full active:bg-surface transition-colors"
          aria-label="Favorite"
        >
          <span
            className={`material-symbols-outlined ${favorite ? 'text-pink-500' : 'text-text-primary'}`}
            style={{ fontSize: 24, fontVariationSettings: favorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      </div>

      {/* ── Image gallery ── */}
      <section className="px-5 pt-3">
        <div className="relative bg-[#F7F7F7] rounded-3xl aspect-[4/5] flex items-center justify-center overflow-hidden p-6">
          {discountPercent > 0 && (
            <span className="absolute top-4 start-4 z-10 bg-pink-100 text-pink-600 text-xs font-bold px-2.5 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
          <ProductImage key={gallery[activeImage]} src={gallery[activeImage]} />
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2.5 mt-3">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setActiveImage(i)}
                className={`w-14 h-14 rounded-xl bg-[#F7F7F7] flex items-center justify-center overflow-hidden p-1.5 transition-all ${
                  activeImage === i ? 'ring-2 ring-offset-1' : 'opacity-70'
                }`}
                style={activeImage === i ? { '--tw-ring-color': PURPLE } as React.CSSProperties : undefined}
                aria-label={`Image ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Title + rating + price ── */}
      <section className="px-5 pt-5">
        <h1 className="text-2xl font-bold text-text-primary leading-snug">{productName}</h1>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={s <= stars ? 'text-amber-400' : 'text-gray-200'}
                style={{ fontSize: 15 }}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs font-medium text-text-muted">
            {business.reviewCount.toLocaleString()} {isHe ? 'דירוגים' : 'ratings'}
          </span>
        </div>

        <div className="flex items-end gap-2.5 mt-3">
          <span className="text-2xl font-bold text-text-primary">
            {product.currency}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-base text-text-muted line-through mb-0.5">
              {product.currency}{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </section>

      {/* ── Shipping info + free-shipping progress ── */}
      <section className="px-5 pt-5">
        <div className="bg-surface rounded-2xl p-4 space-y-3">
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
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: PURPLE }}
              initial={{ width: 0 }}
              animate={{ width: `${shippingProgress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            {remainingForFree === 0
              ? (isHe ? 'יש לך משלוח חינם! 🎉' : "You've unlocked free shipping! 🎉")
              : isHe
                ? `הוסף ${product.currency}${remainingForFree} למשלוח חינם`
                : `Add ${product.currency}${remainingForFree} more for free shipping`}
          </p>
        </div>
      </section>

      {/* ── Quantity selector ── */}
      <section className="px-5 pt-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          {isHe ? 'כמות' : 'Quantity'}
        </span>
        <div className="flex items-center gap-4 bg-surface rounded-full px-2 py-1.5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white active:scale-90 transition-transform disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="Decrease"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>remove</span>
          </button>
          <span className="text-base font-bold text-text-primary w-5 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white active:scale-90 transition-transform"
            aria-label="Increase"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>add</span>
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

      {/* ── Policy pills ── */}
      <section className="px-5 pt-6 grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: PURPLE }}>
            replay
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary">{isHe ? 'מדיניות החזרות' : 'Refund policy'}</p>
            <p className="text-[11px] text-text-muted">{isHe ? '30 ימים' : '30 days'}</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: PURPLE }}>
            local_shipping
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary">{isHe ? 'מדיניות משלוח' : 'Shipping policy'}</p>
            <p className="text-[11px] text-text-muted">{isHe ? '2-4 ימי עסקים' : '2-4 business days'}</p>
          </div>
        </div>
      </section>

      {/* ── Ratings teaser ── */}
      <section className="px-5 pt-6">
        <button
          onClick={() => navigate(`/${language}/business/${business.id}`)}
          className="w-full bg-surface rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-text-primary">{business.rating}</span>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= stars ? 'text-amber-400' : 'text-gray-200'} style={{ fontSize: 13 }}>★</span>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                {business.reviewCount.toLocaleString()} {isHe ? 'ביקורות' : 'reviews'}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 22 }}>
            {isHe ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </section>

      {/* ── Visit brand link ── */}
      <section className="px-5 pt-4">
        <button
          onClick={() => navigate(`/${language}/business/${business.id}/store`)}
          className="text-sm font-semibold underline underline-offset-2"
          style={{ color: PURPLE }}
        >
          {isHe ? `לחנות של ${brandName}` : `Visit ${brandName}`}
        </button>
      </section>

      {/* ── Sticky bottom actions ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[999]" style={{ pointerEvents: 'none' }}>
        <div
          className="max-w-md mx-auto px-5 pb-5 pt-3 flex items-center gap-3"
          style={{ pointerEvents: 'auto', background: 'linear-gradient(to top, white 70%, transparent)' }}
        >
          <button
            onClick={() => navigate(`/${language}/wallet`)}
            className="flex-1 py-3.5 rounded-full font-bold text-sm active:scale-[0.98] transition-transform"
            style={{ background: PURPLE_SOFT, color: PURPLE }}
          >
            {isHe ? 'הוספה לסל' : 'Add to cart'}
          </button>
          <button
            onClick={() => navigate(`/${language}/wallet`)}
            className="flex-1 py-3.5 rounded-full font-bold text-sm text-white bg-black active:scale-[0.98] transition-transform"
          >
            {isHe ? 'קנייה מהירה' : 'Buy now'}
          </button>
        </div>
      </div>
    </div>
  );
}
