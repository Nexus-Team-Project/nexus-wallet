import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import StoreActionsSheet from './StoreActionsSheet';
import ProductPager from '../category/ProductPager';
import type { Business } from '../../types/search.types';

interface BrandCatalogStoreProps {
  business: Business;
}

/** Compact review count — 161500 → "161.5K". */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

/**
 * BrandCatalogStore — a clean white "product catalog" card (rhode-style):
 * a header with the brand logo + rating + menu, a 2×2 grid of product tiles
 * (grey rounded cards with a price tag and a favourite heart), and a big
 * "Shop all" footer with a circular arrow. Used on the home feed.
 */
export default function BrandCatalogStore({ business }: BrandCatalogStoreProps) {
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Follow state — same logic as the business page's follow button.
  const [following, setFollowing] = useState(false);

  const products = (business.products ?? []).filter((p) => p.image);
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  const openStore = () => navigate(`/${lang}/business/${business.id}/store`);
  const openProduct = (productId: string) =>
    navigate(`/${lang}/business/${business.id}/product/${productId}`);
  const toggleFav = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5"
    >
      {/* Header — logo + name + rating + menu */}
      <header className="flex items-center justify-between mb-6">
        <button onClick={openStore} className="flex items-center gap-3 text-start active:opacity-70">
          <span className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-surface shrink-0">
            <img
              src={business.logoUrl}
              alt={isHe ? business.nameHe : business.name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold text-text-primary leading-tight">
              {isHe ? business.nameHe : business.name}
            </span>
            <span className="flex items-center text-xs font-medium text-text-primary mt-0.5">
              <span>{business.rating.toFixed(1)}</span>
              <span className="mx-0.5 text-amber-400">★</span>
              <span className="text-text-muted">({formatCount(business.reviewCount)})</span>
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          {/* Follow — copied from the business page (same toggle logic), adapted
              to the light catalog card. */}
          <button
            onClick={() => setFollowing((f) => !f)}
            className={`h-9 px-4 inline-flex items-center rounded-lg text-sm font-semibold active:scale-95 transition-all ${
              following ? 'bg-surface text-text-secondary border border-border' : 'bg-bg-dark text-white'
            }`}
          >
            {following ? (isHe ? 'עוקב' : 'Following') : (isHe ? 'עקוב' : 'Follow')}
          </button>
          <button onClick={() => setMenuOpen(true)} aria-label={isHe ? 'פעולות' : 'Actions'} className="p-2 active:opacity-60">
            <span className="material-symbols-rounded block text-text-primary" style={{ fontSize: 24 }}>more_horiz</span>
          </button>
        </div>
      </header>

      {/* Product pager — discrete batches of 4 (shared ProductPager). */}
      <ProductPager
        items={products}
        className="mb-8"
        gridClassName="grid grid-cols-2 gap-4"
        dotActive="bg-text-primary"
        dotInactive="bg-border"
        renderItem={(p) => {
          const faved = favorites.has(p.id);
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => openProduct(p.id)}
              className="relative bg-[#f5f5f5] rounded-2xl p-4 flex items-center justify-center aspect-[1/1.2] active:scale-[0.98] transition-transform cursor-pointer"
            >
              {/* Price tag — top start */}
              <span
                className="absolute top-3 bg-[#b1b1b1] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm"
                style={{ insetInlineStart: 12 }}
                dir="ltr"
              >
                {p.currency}{p.price}
              </span>
              <img
                src={p.image}
                alt={isHe ? p.nameHe : p.name}
                className="max-h-32 object-contain"
                draggable={false}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Favourite heart — bottom end */}
              <button
                aria-label={isHe ? 'הוספה למועדפים' : 'Add to favorites'}
                onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
                className="absolute bottom-3 bg-[#b1b1b1] rounded-full p-2 active:scale-90 transition-transform"
                style={{ insetInlineEnd: 12 }}
              >
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill={faved ? 'white' : 'none'}
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          );
        }}
      />

      {/* Footer CTA — big "Shop all" + circular arrow */}
      <button onClick={openStore} className="flex items-center justify-between w-full pt-2 active:opacity-70">
        <span className="text-4xl font-semibold tracking-tight text-text-primary">
          {isHe ? 'לכל המוצרים' : 'Shop all'}
        </span>
        <span className="w-12 h-12 bg-[#b1b1b1] rounded-full flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>{arrow}</span>
        </span>
      </button>

      <StoreActionsSheet business={business} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  );
}
