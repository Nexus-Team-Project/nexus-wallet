import { useMemo, useState } from 'react';
import { ProductImage } from '../business/BusinessContent';
import type { Business, Product } from '../../types/search.types';

type StoreFilter = 'all' | 'sale' | 'stock';

interface StoreSearchResultsProps {
  business: Business;
  isHe: boolean;
  loading?: boolean;
}

/**
 * Store-scoped search results rendered INSIDE the chat bottom sheet. Mirrors
 * the BusinessStorePage structure — centred store logo, filter tabs and a
 * two-products-per-row grid — so the in-chat search feels like staying inside
 * the same store rather than dropping into the generic recommendations list.
 */
export default function StoreSearchResults({
  business,
  isHe,
  loading = false,
}: StoreSearchResultsProps) {
  const name = isHe ? business.nameHe : business.name;
  const products = useMemo<Product[]>(() => business.products ?? [], [business]);

  const [filter, setFilter] = useState<StoreFilter>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = products;
    if (filter === 'sale') list = list.filter((p) => p.originalPrice);
    else if (filter === 'stock') list = list.filter((p) => p.inStock);
    return list;
  }, [products, filter]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterTabs: { key: StoreFilter; label: string; emoji: string; bg: string }[] = [
    { key: 'all', label: isHe ? 'הכל' : 'All', emoji: '🛍️', bg: 'bg-surface/70' },
    { key: 'sale', label: isHe ? 'במבצע' : 'On sale', emoji: '🔥', bg: 'bg-orange-50/70' },
    { key: 'stock', label: isHe ? 'במלאי' : 'In stock', emoji: '📦', bg: 'bg-emerald-50/70' },
  ];

  return (
    <div dir={isHe ? 'rtl' : 'ltr'} className="flex flex-col h-full min-h-0 bg-white rounded-t-[28px]">
      {/* ── Store header — framed-square logo + name + rating laid out as a
          start-aligned row (mirrors the BusinessStorePage compact sticky
          header). pt-9 clears the sheet's floating drag handle. ── */}
      <div className="flex-shrink-0 px-5 pt-9 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={name}
                className="w-8 h-8 object-contain"
                // Castro's logo mark is white — invisible on the light box.
                style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
              />
            ) : (
              <span className="text-base font-bold text-black">{name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg leading-tight truncate text-black">{name}</h2>
            <div className="flex items-center gap-1 text-xs font-semibold text-black">
              <span>{business.rating}</span>
              <span>★</span>
              <span className="text-gray-500 font-medium">
                ({business.reviewCount.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Filter squares — mirror the home-page category tiles: 72×72
            rounded-2xl with a big emoji and a label underneath. The active
            filter is marked by a solid black border ring. */}
        <div className="mt-3 flex items-center gap-4 overflow-x-auto hide-scrollbar">
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
              >
                <div
                  className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-sm border-2 transition-colors duration-100 backdrop-blur-sm ${tab.bg} ${
                    active ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <span className="text-4xl drop-shadow-sm">{tab.emoji}</span>
                </div>
                <span className="text-[11px] font-semibold text-text-primary leading-tight text-center max-w-[72px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="pt-3 text-xs font-medium text-text-muted">
          {filtered.length} {isHe ? 'מוצרים' : 'products'}
        </p>
      </div>

      {/* ── Product grid — two per row, same card as the store page ── */}
      <div
        className="flex-1 overflow-y-auto subtle-scrollbar px-5 pb-8"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-2xl aspect-[3/4]" />
                <div className="h-3 w-3/4 bg-gray-100 rounded mt-2.5" />
                <div className="h-3 w-1/2 bg-gray-100 rounded mt-1.5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 40 }}>
              search_off
            </span>
            <p className="mt-2 text-sm text-text-muted">
              {isHe ? 'לא נמצאו מוצרים' : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {filtered.map((product) => {
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
              const fav = favorites.has(product.id);

              return (
                <button
                  key={product.id}
                  className="text-start active:scale-[0.98] transition-transform"
                >
                  <div className="relative bg-gray-50 rounded-2xl aspect-[3/4] flex items-center justify-center overflow-hidden p-4">
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 start-2.5 z-10 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{discountPercent}% {isHe ? 'הנחה' : 'OFF'}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(product.id);
                      }}
                      className="absolute top-2 end-2 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm active:scale-90 transition-transform"
                      aria-label="Favorite"
                    >
                      <span
                        className={`material-symbols-outlined ${fav ? 'text-pink-500' : 'text-text-muted'}`}
                        style={{ fontSize: 18, fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                    <ProductImage src={product.image} />
                  </div>

                  <h3 className="mt-2.5 text-sm font-semibold text-text-primary leading-tight line-clamp-1">
                    {isHe ? product.nameHe : product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[15px] font-bold text-text-primary">
                      {product.currency}{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-text-muted line-through">
                        {product.currency}{product.originalPrice}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
