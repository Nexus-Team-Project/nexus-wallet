import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { useSearch } from '../hooks/useSearch';
import MaskedPrice from '../components/ui/MaskedPrice';
import { MicButton } from '../components/ui/MicButton';
import VoucherDetail from '../components/store/VoucherDetail';
import ActiveOffers from '../components/home/ActiveOffers';
import SearchGaliPrompt from '../components/search/SearchGaliPrompt';
import type { Voucher, VoucherCategory } from '../types/voucher.types';

const categories: { key: VoucherCategory; emoji: string; bg: string }[] = [
  { key: 'food', emoji: '🍔', bg: 'bg-orange-50' },
  { key: 'shopping', emoji: '🛍️', bg: 'bg-pink-50' },
  { key: 'entertainment', emoji: '🎬', bg: 'bg-purple-50' },
  { key: 'travel', emoji: '✈️', bg: 'bg-sky-50' },
  { key: 'health', emoji: '💊', bg: 'bg-emerald-50' },
  { key: 'education', emoji: '📚', bg: 'bg-amber-50' },
  { key: 'tech', emoji: '💻', bg: 'bg-blue-50' },
];

export default function SearchPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isHe = language === 'he';
  const { isAuthenticated } = useAuthGate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const { data: results } = useSearch(searchQuery);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const totalResults =
    (results?.vouchers?.length || 0) +
    (results?.businesses?.length || 0) +
    (results?.products?.length || 0) +
    (results?.services?.length || 0);

  return (
    <div className="bg-white" style={{ animation: 'sheet-up 0.35s ease-out' }}>
      {/* Search header */}
      <div className="bg-white px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-surface rounded-full px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/40">
            <span
              className="material-symbols-outlined text-text-muted mr-2.5 rtl:mr-0 rtl:ml-2.5"
              style={{ fontSize: '20px' }}
            >
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-text-muted"
            />
            <button
              onClick={() => setSearchQuery('')}
              className={`flex-shrink-0 w-6 h-6 rounded-full bg-text-muted/20 flex items-center justify-center ml-1 rtl:ml-0 rtl:mr-1 ${searchQuery ? '' : 'hidden'}`}
            >
              <span
                className="material-symbols-outlined text-text-secondary"
                style={{ fontSize: '14px' }}
              >
                close
              </span>
            </button>
            <div className={searchQuery ? 'hidden' : 'flex-shrink-0'}>
              <MicButton size="sm" onTranscript={setSearchQuery} onInterim={setSearchQuery} />
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-surface flex items-center justify-center hover:bg-border/50 transition-colors"
            aria-label="Back"
          >
            <span
              className="material-symbols-outlined text-text-primary"
              style={{ fontSize: '20px' }}
            >
              keyboard_arrow_down
            </span>
          </button>
        </div>
      </div>

      {/* Especially for you — card slider like home page */}
      <ActiveOffers />

      {/* Content */}
      {!isSearching ? (
        /* Browse mode - category grid */
        <div className="px-5 pt-5">
          <h3 className="text-base font-bold text-text-primary mb-4">
            {isHe ? 'קטגוריות' : 'Categories'}
          </h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-4">
            {categories.map(({ key, emoji, bg }) => (
              <button
                key={key}
                onClick={() => setSearchQuery(t.store[key as keyof typeof t.store])}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
              >
                <div
                  className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-sm border-2 border-transparent hover:border-primary/40 transition-colors duration-100 ${bg}`}
                >
                  <span className="text-4xl drop-shadow-sm">{emoji}</span>
                </div>
                <span className="text-[11px] font-semibold text-text-primary leading-tight text-center max-w-[72px]">
                  {t.store[key as keyof typeof t.store]}
                </span>
              </button>
            ))}
          </div>

          {/* Quick suggestions */}
          <h3 className="text-base font-bold text-text-primary mt-8 mb-4">
            {isHe ? 'חיפושים פופולריים' : 'Popular searches'}
          </h3>
          <div className="flex flex-wrap gap-2 pb-4">
            {(isHe
              ? ['קפה', 'קניות', 'קולנוע', 'ספורט', 'אוכל', 'טכנולוגיה']
              : ['coffee', 'shopping', 'cinema', 'fitness', 'food', 'tech']
            ).map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface border border-border hover:bg-border/50 transition-colors"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>search</span>
                <span className="text-xs font-medium text-text-secondary">{term}</span>
              </button>
            ))}
          </div>

        </div>
      ) : (
        /* Search results - grouped by type */
        <div className="pb-8">
          {/* Results count */}
          {results && totalResults > 0 && (
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs text-text-muted">
                {isHe
                  ? `${totalResults} תוצאות`
                  : `${totalResults} results`}
              </p>
            </div>
          )}

          {/* ===== OFFERS / הטבות ===== */}
          {results && (results.vouchers?.length ?? 0) > 0 && (
            <section className="pt-4">
              <div className="flex items-center justify-between px-5 mb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px' }}
                  >
                    local_offer
                  </span>
                  {isHe ? 'הטבות' : 'Offers'}
                </h3>
                <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-full">
                  {results.vouchers.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {results.vouchers?.map((voucher) => (
                  <button
                    key={voucher.id}
                    onClick={() => setSelectedVoucher(voucher)}
                    className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-surface/50 transition-colors text-start"
                  >
                    <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {voucher.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {isHe ? voucher.titleHe : voucher.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {voucher.merchantName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <MaskedPrice
                        amount={voucher.discountedPrice}
                        className="text-sm font-bold text-text-primary"
                      />
                      {voucher.discountPercent > 0 && (
                        <span className="text-[10px] font-medium text-success mt-0.5">
                          {voucher.discountPercent}% {t.store.discount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== BUSINESSES / עסקים ===== */}
          {results && (results.businesses?.length ?? 0) > 0 && (
            <section className="pt-4">
              <div className="flex items-center justify-between px-5 mb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px' }}
                  >
                    storefront
                  </span>
                  {isHe ? 'עסקים' : 'Businesses'}
                </h3>
                <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-full">
                  {results.businesses.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {results.businesses?.map((biz) => (
                  <div
                    key={biz.id}
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {biz.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {isHe ? biz.nameHe : biz.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {isHe ? biz.categoryHe : biz.category}
                        {' · '}
                        {isHe ? biz.locationHe : biz.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-warning">★</span>
                      <span className="text-xs font-medium text-text-secondary">
                        {biz.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== PRODUCTS / מוצרים ===== */}
          {results && (results.products?.length ?? 0) > 0 && (
            <section className="pt-4">
              <div className="flex items-center justify-between px-5 mb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px' }}
                  >
                    shopping_bag
                  </span>
                  {isHe ? 'מוצרים' : 'Products'}
                </h3>
                <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-full">
                  {results.products.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {results.products?.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {isHe ? product.nameHe : product.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {product.merchantName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <MaskedPrice
                        amount={product.price}
                        className="text-sm font-bold text-text-primary"
                      />
                      {isAuthenticated && product.originalPrice && (
                        <MaskedPrice
                          amount={product.originalPrice}
                          className="text-[10px] text-text-muted line-through mt-0.5"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== SERVICES / שירותים ===== */}
          {results && (results.services?.length ?? 0) > 0 && (
            <section className="pt-4">
              <div className="flex items-center justify-between px-5 mb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px' }}
                  >
                    support_agent
                  </span>
                  {isHe ? 'שירותים' : 'Services'}
                </h3>
                <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-full">
                  {results.services.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {results.services?.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {isHe ? service.nameHe : service.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {service.providerName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-medium text-text-secondary">
                        {isAuthenticated
                          ? (isHe ? service.priceRangeHe : service.priceRange)
                          : '₪ ***'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-warning">★</span>
                        <span className="text-[10px] font-medium text-text-muted">
                          {service.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {results && totalResults === 0 && (
            <div className="text-center py-16 px-5">
              <span
                className="material-symbols-outlined text-text-muted mb-3 block"
                style={{ fontSize: '48px' }}
              >
                search_off
              </span>
              <p className="text-text-secondary text-sm">{t.common.noResults}</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Gali AI prompt */}
      {!isSearching && <SearchGaliPrompt />}

      {/* Voucher detail bottom sheet */}
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </div>
  );
}
