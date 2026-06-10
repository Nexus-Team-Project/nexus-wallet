import { useMemo, useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import { ProductImage } from '../components/business/BusinessContent';
import BusinessStoreFilterSheet, {
  type StoreFilter,
  type StoreSort,
} from '../components/business/BusinessStoreFilterSheet';
import type { Product } from '../types/search.types';

export default function BusinessStorePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [filter, setFilter] = useState<StoreFilter>('all');
  const [sort, setSort] = useState<StoreSort>('recommended');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Collapse the big hero into a compact sticky bar once scrolled past it.
  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const products = useMemo<Product[]>(() => business?.products ?? [], [business]);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === 'sale') list = list.filter((p) => p.originalPrice);
    else if (filter === 'stock') list = list.filter((p) => p.inStock);

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, filter, sort]);

  if (!business) return <Navigate to=".." replace />;

  const name = isHe ? business.nameHe : business.name;

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterTabs: { key: StoreFilter; label: string }[] = [
    { key: 'all', label: isHe ? 'הכל' : 'All' },
    { key: 'sale', label: isHe ? 'במבצע' : 'On sale' },
    { key: 'stock', label: isHe ? 'במלאי' : 'In stock' },
  ];

  return (
    <div className="relative isolate bg-white min-h-screen" dir={isHe ? 'rtl' : 'ltr'}>
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
      {/* ── Compact sticky header — the logo drops into a framed box and the
            brand row slides in once the big header scrolls away (Rhode-style). ── */}
      <div
        className="fixed top-0 inset-x-0 z-40 max-w-md mx-auto transition-all duration-300"
        style={{
          opacity: collapsed ? 1 : 0,
          transform: collapsed ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: collapsed ? 'auto' : 'none',
        }}
      >
        <header className="bg-white/95 backdrop-blur-md px-5 py-3 flex items-center justify-between gap-3">
          {/* Start: framed logo + name + rating */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={name}
                  className="w-8 h-8 object-contain"
                  style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
                />
              ) : (
                <span className="text-base font-bold text-black">{name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate text-black">{name}</h1>
              <div className="flex items-center gap-1 text-xs font-semibold text-black">
                <span>{business.rating}</span>
                <span>★</span>
                <span className="text-gray-500 font-medium">({business.reviewCount.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* End: Follow + search + dots */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setFollowing((f) => !f)}
              className="bg-surface text-black px-5 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform"
            >
              {following ? (isHe ? 'עוקב' : 'Following') : (isHe ? 'עקוב' : 'Follow')}
            </button>
            <button
              onClick={() => navigate(`/${language}/search?store=${business.id}`)}
              aria-label="Search"
              className="text-gray-700 active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined block" style={{ fontSize: 24 }}>search</span>
            </button>
            <button aria-label="More" className="text-gray-700 active:scale-90 transition-transform">
              <span className="material-symbols-outlined block" style={{ fontSize: 24 }}>more_vert</span>
            </button>
          </div>
        </header>
      </div>

      {/* ── Clean logo header — no hero image ── */}
      <section className="relative pt-2 pb-10">
        {/* Back row */}
        <div className="px-2">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full active:bg-surface transition-colors"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 24 }}>
              {isHe ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
        </div>

        {/* Logo — moved up: big & centred, same size/position as the business page */}
        <div className="flex justify-center mt-2 mb-12">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={name}
              className="h-24 w-auto max-w-[70%] object-contain"
              // Castro's logo mark is white — invisible on the white header.
              // Knock it to a solid black silhouette so it reads on white.
              style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
            />
          ) : (
            <span className="h-24 inline-flex items-center justify-center text-4xl font-bold text-text-primary">
              {name.charAt(0)}
            </span>
          )}
        </div>

        {/* Brand row — name/rating on the start, dark actions on the end */}
        <div className="px-5 mt-1 flex items-center gap-3">
          {/* Name + rating — black */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-black leading-tight truncate">{name}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-black text-[13px]">★</span>
              <span className="text-[13px] font-bold text-black">{business.rating}</span>
              <span className="text-[13px] text-black/60">({business.reviewCount.toLocaleString()})</span>
            </div>
          </div>

          {/* Actions — same shape as business page, dark */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFollowing((f) => !f)}
              className="h-10 px-5 inline-flex items-center rounded-lg text-sm font-semibold bg-surface text-black active:scale-95 transition-all"
            >
              {following ? (isHe ? 'עוקב' : 'Following') : (isHe ? 'עקוב' : 'Follow')}
            </button>
            <button
              onClick={() => navigate(`/${language}/search?store=${business.id}`)}
              className="h-10 w-10 inline-flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-gray-700 leading-none" style={{ fontSize: 22 }}>search</span>
            </button>
            <button
              className="h-10 w-10 inline-flex items-center justify-center active:scale-95 transition-transform"
              aria-label="More"
            >
              <span className="material-symbols-outlined text-gray-700 leading-none" style={{ fontSize: 22 }}>more_vert</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="relative z-20 bg-white">
        {/* Filter strip — sticks to the very top, or just below the compact
            header once it slides in, so the categories read as a continuous
            band across the screen. */}
        <div
          className="sticky z-30 bg-white pt-3 pb-3 transition-[top] duration-200"
          style={{ top: collapsed ? 72 : 0 }}
        >
          <div className="relative flex items-center">
            <div className="flex items-center gap-4 px-5 pe-16 overflow-x-auto hide-scrollbar text-sm font-bold">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`shrink-0 whitespace-nowrap transition-all active:scale-95 ${
                    filter === tab.key
                      ? 'bg-black text-white px-4 py-1.5 rounded-full'
                      : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Floating filter/sort icon */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="absolute end-5 bg-black rounded-full p-2.5 text-white shadow-lg active:scale-95 transition-transform"
              aria-label="Filter"
            >
              <span className="material-symbols-outlined block" style={{ fontSize: 18 }}>tune</span>
            </button>
          </div>
        </div>

        {/* Product count */}
        <p className="px-5 pt-1 pb-3 text-xs font-medium text-text-muted">
          {filtered.length} {isHe ? 'מוצרים' : 'products'}
        </p>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 40 }}>
              inventory_2
            </span>
            <p className="mt-2 text-sm text-text-muted">
              {isHe ? 'אין מוצרים בקטגוריה זו' : 'No products in this category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-5 pb-28">
            {filtered.map((product) => {
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
              const fav = favorites.has(product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => navigate(`/${language}/business/${business.id}/product/${product.id}`)}
                  className="text-start active:scale-[0.98] transition-transform"
                >
                  <div className="relative bg-gray-50 rounded-2xl aspect-[3/4] flex items-center justify-center overflow-hidden p-4">
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 start-2.5 z-10 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{discountPercent}% {isHe ? 'הנחה' : 'OFF'}
                      </span>
                    )}
                    {/* Favorite heart */}
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

      {/* Filter & sort sheet — unified floating-card design */}
      <BusinessStoreFilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        filterOptions={filterTabs}
        resultCount={filtered.length}
      />
    </div>
  );
}
