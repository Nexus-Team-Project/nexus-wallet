import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useVouchers } from '../hooks/useVouchers';
import { mockBusinesses } from '../mock/data/businesses.mock';
import DiscountFinderCard, { type DiscountFinderResult } from '../components/chat/DiscountFinderCard';
import RecommendationsContent from '../components/chat/RecommendationsSheet';
import StoreFeaturedRow from '../components/store/StoreFeaturedRow';
import VoucherDetail from '../components/store/VoucherDetail';
import type { Voucher, StoreFilter, SpecialFilter, VoucherCategory } from '../types/voucher.types';

const SPECIAL_FILTERS = new Set<SpecialFilter>([
  'coming-soon', 'expiring', 'online', 'new', 'popular', 'recommended',
]);
const isSpecialFilter = (f: StoreFilter): f is SpecialFilter =>
  SPECIAL_FILTERS.has(f as SpecialFilter);

const POPULAR_HE = ['פיצה', 'נעלי ספורט', 'גיפט קארד', 'קפה', 'מלון', 'מחשב נייד'];
const POPULAR_EN = ['Pizza', 'Sneakers', 'Gift card', 'Coffee', 'Hotel', 'Laptop'];

export default function StorePage() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const location = useLocation();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const initialFilter = (location.state as { filter?: StoreFilter } | null)?.filter;
  const [selectedFilter, setSelectedFilter] = useState<StoreFilter | undefined>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Tapping a store goes straight to that business's "create a deal on your
  // terms" page. Match the merchant to a business by name — case-insensitive
  // and tolerant of name variants (e.g. "Aroma" ↔ "Aroma Espresso Bar"), in
  // both English and Hebrew. Falls back to the voucher detail sheet only when
  // the merchant has no partner business at all.
  const handleSelectStore = (v: Voucher) => {
    const mn = v.merchantName.trim().toLowerCase();
    const biz = mockBusinesses.find((b) => {
      const n = b.name.trim().toLowerCase();
      const nh = b.nameHe.trim().toLowerCase();
      return (
        n === mn || nh === mn ||
        n.startsWith(mn) || mn.startsWith(n) ||
        nh.startsWith(mn) || mn.startsWith(nh)
      );
    });
    if (biz) {
      navigate(`/${lang}/business/${biz.id}/voucher/${v.id}`);
    } else {
      setSelectedVoucher(v);
    }
  };

  // Fetch everything once and filter client-side so the list reacts instantly
  // to finder / search changes.
  const { data: vouchers = [], isLoading } = useVouchers();

  // Finder "picked a category/subcategory" → filter the list by that category.
  const handleFinderComplete = (result: DiscountFinderResult) => {
    setSearchQuery('');
    setSelectedFilter(result.category);
  };

  // Finder free-text / popular-search query → search the list.
  const handleFinderSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Finder "בקטגוריות [הכל]" selector → filter (or clear, on 'all').
  const handleFinderCategory = (category: VoucherCategory | 'all') => {
    setSearchQuery('');
    setSelectedFilter(category === 'all' ? undefined : category);
  };

  const filtered = useMemo(() => {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const result = vouchers.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          v.title.toLowerCase().includes(q) ||
          v.titleHe.includes(searchQuery) ||
          v.merchantName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (!selectedFilter) return true;

      if (isSpecialFilter(selectedFilter)) {
        switch (selectedFilter) {
          case 'coming-soon': return !!v.comingSoon;
          case 'expiring': {
            const expiry = new Date(v.validUntil);
            return expiry >= today && expiry <= oneMonthLater;
          }
          case 'online': return !!v.isOnline;
          case 'new': return !!v.isNew;
          case 'popular': return !!v.popular;
          case 'recommended': return true;
          default: return true;
        }
      }

      return v.category === selectedFilter;
    });

    // Default ordering — biggest discount first (the cashback list's
    // "Recommended" sort).
    result.sort((a, b) => b.discountPercent - a.discountPercent);
    return result;
  }, [vouchers, searchQuery, selectedFilter]);

  // "My brands" strip — popular vouchers with real artwork. Shown on the
  // default view; hidden once the user searches or picks a category.
  const featured = useMemo(
    () => vouchers.filter((v) => v.imageUrl && v.popular && v.inStock).slice(0, 8),
    [vouchers]
  );
  const showFeatured = !searchQuery && !selectedFilter;

  const initialCategory =
    initialFilter && !isSpecialFilter(initialFilter)
      ? (initialFilter as VoucherCategory)
      : undefined;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      {/* Pink gradient curtain — same lilac top as the chat/search page,
          curtaining down on entry. A top band that fades into the white card
          below it. */}
      <div
        className="absolute inset-x-0 top-0 h-[380px] pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(180deg, #f5e6f0 0%, #efe0f5 35%, #f7f0fb 70%, rgba(255,255,255,0) 100%)',
          animation: 'chat-pink-curtain 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
          willChange: 'transform',
        }}
      />

      <div className="relative z-10">
        {/* ── Pink top: the search configuration we work with (the chat finder) ── */}
        <div className="pt-24">
          <DiscountFinderCard
            onComplete={handleFinderComplete}
            onSearchQuery={handleFinderSearch}
            onCategoryChange={handleFinderCategory}
            popularSearches={isHe ? POPULAR_HE : POPULAR_EN}
            initialCategory={initialCategory}
            initialItemType="businesses"
          />
        </div>

        {/* ── White card: Nexus-picks frame (header + map toggle + category
            squares) with the cashback-style business list inside. ── */}
        <div
          className="bg-white rounded-t-[28px] shadow-[0_-2px_24px_rgba(0,0,0,0.06)] min-h-[55dvh] pt-3 mt-6"
          style={{
            animation: 'chat-card-drop 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
            willChange: 'transform',
          }}
        >
          {/* Grabber — echoes the chat sheet's handle */}
          <div className="w-9 h-[3px] rounded-full bg-gray-300/80 mx-auto mb-1" />

          <div className="h-[70dvh]">
            <RecommendationsContent
              vouchers={filtered}
              loading={isLoading}
              onSelect={handleSelectStore}
              variant="stores"
              afterCategories={
                showFeatured ? (
                  // "My Brands" slider — sits directly below the category row.
                  <div className="pb-1">
                    <h3 className="px-5 mb-2 text-base font-bold text-text-primary">
                      {isHe ? 'המותגים שלי' : 'My Brands'}
                    </h3>
                    <StoreFeaturedRow vouchers={featured} onSelect={handleSelectStore} />
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </div>
  );
}
