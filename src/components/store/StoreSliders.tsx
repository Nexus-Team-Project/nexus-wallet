/**
 * StoreSliders — horizontal slider sections.
 *
 * Named exports (individual sliders, placed at specific spots in HomePage):
 *   PopularSlider           — הכי פופולרים
 *   RecommendedSlider       — מומלץ
 *   NewSlider               — חדש
 *   OnlineSlider            — הטבות אונליין
 *   ComingSoonSlider        — בקרוב
 *
 * Default export: all sliders combined, used inside StorePage.
 *
 * Card design intentionally matches TopStores / TenantOffers:
 *   w-[75vw] max-w-[300px] · image area 20vh · sky-blue "More" button
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useVouchers } from '../../hooks/useVouchers';
import VoucherDetail from './VoucherDetail';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';
import type { Voucher, StoreFilter } from '../../types/voucher.types';

// ── Gradient label colours per slider ─────────────────────────────────────────
const GRADIENTS = {
  popular:     'linear-gradient(to bottom, #f97316, #c2410c)', // orange
  recommended: 'linear-gradient(to bottom, #a855f7, #7e22ce)', // purple
  new:         'linear-gradient(to bottom, #3b82f6, #1d4ed8)', // blue
  online:      'linear-gradient(to bottom, #0ea5e9, #0369a1)', // sky
  comingSoon:  'linear-gradient(to bottom, #06b6d4, #0e7490)', // cyan
} as const;

// ── Card — matches TopStores / TenantOffers dimensions ────────────────────────

export function SliderCard({
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
  const isUnavailable = !!voucher.comingSoon || !voucher.inStock;

  return (
    <button
      onClick={() => !isUnavailable && onSelect(voucher)}
      disabled={isUnavailable}
      className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150 flex flex-col disabled:opacity-60"
    >
      {/* Atmosphere image area */}
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
            <img src={voucher.brandLogo} alt={voucher.merchantName} className="w-[80%] h-[80%] object-contain" />
          </div>
        )}

        {/* Discount badge — top end */}
        <div className="absolute top-2.5 end-2.5 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-300">
            {voucher.discountPercent}% {isHe ? 'הנחה' : 'OFF'}
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
          <p className="text-sm font-bold text-primary mt-0.5">₪{voucher.discountedPrice}</p>
        )}
      </div>
    </button>
  );
}

// ── More bubble — sky-blue to match TopStores ──────────────────────────────────

function MoreBubble({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 bg-sky-100 flex items-center justify-center active:scale-90 transition-transform rounded-full"
      >
        <span className="material-symbols-outlined text-sky-600" style={{ fontSize: '20px' }}>
          chevron_left
        </span>
      </button>
    </div>
  );
}

// ── Gradient palette — exported so category sliders can reuse ─────────────────
export const SLIDER_GRADIENTS = GRADIENTS;

// ── Generic section ────────────────────────────────────────────────────────────

export function SliderSection({
  title,
  gradient,
  vouchers,
  isHe,
  filter,
  onSelectFilter,
  onSelectVoucher,
  comingSoonLabel,
  outOfStockLabel,
}: {
  title: string;
  gradient: string;
  vouchers: Voucher[];
  isHe: boolean;
  filter: StoreFilter;
  onSelectFilter: (f: StoreFilter) => void;
  onSelectVoucher: (v: Voucher) => void;
  comingSoonLabel: string;
  outOfStockLabel: string;
}) {
  if (!vouchers.length) return null;

  return (
    <section className="mb-6">
      {/* Header — same layout / sky-blue "More" as TopStores */}
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">{title}</h3>
        <button
          onClick={() => onSelectFilter(filter)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal active:scale-95 transition-colors"
        >
          {isHe ? 'עוד' : 'More'}
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {/* Gradient label rectangle — matches TenantOffers / TopStores pattern */}
        <div
          className="flex-none w-[90px] rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: gradient, minHeight: '20vh' }}
        >
          <span
            className="text-white text-sm font-bold whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
          </span>
        </div>

        {/* Voucher cards */}
        {vouchers.map((v) => (
          <SliderCard
            key={v.id}
            voucher={v}
            isHe={isHe}
            onSelect={onSelectVoucher}
            comingSoonLabel={comingSoonLabel}
            outOfStockLabel={outOfStockLabel}
          />
        ))}

        {/* Arrow bubble */}
        <MoreBubble onNavigate={() => onSelectFilter(filter)} />
      </div>
    </section>
  );
}

// ── Shared hook for all individual slider components ──────────────────────────

function useSlider() {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const { data: allVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  return { t, isHe, all: allVouchers ?? [], selectedVoucher, setSelectedVoucher };
}

// ═══════════════════════════════════════
//  NAMED EXPORTS — individual sliders
// ═══════════════════════════════════════

interface SliderProps {
  onSelectFilter: (filter: StoreFilter) => void;
}

// ── 1. הכי פופולרים — styled like "Especially for you" (CategoryRowStore) ─────
export function PopularSlider({ onSelectFilter }: SliderProps) {
  const { t, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.popular).slice(0, 8);
  if (!vouchers.length) return null;

  const items: CategoryRowItem[] = vouchers
    .filter((v) => v.imageUrl)
    .map((v) => ({
      id: v.id,
      name: v.title,
      nameHe: v.titleHe,
      image: v.imageUrl as string,
      price: v.discountedPrice,
      currency: '₪',
      onClick: () => setSelectedVoucher(v),
    }));

  return (
    <>
      <div className="mb-6">
        <CategoryRowStore
          title={t.store.mostPopular}
          titleHe={t.store.mostPopular}
          items={items}
          accentColor="#1c1c1c"
          bgVideo="/popular-category.mp4"
          titleInMedia
          mediaPosition="bottom"
          aspectRatio="2 / 3"
          onSeeAll={() => onSelectFilter('popular')}
        />
      </div>
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </>
  );
}

// ── 2. מומלץ ──────────────────────────────────────────────────────────────────
export function RecommendedSlider({ onSelectFilter }: SliderProps) {
  const { t, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = [...all]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 8);
  if (!vouchers.length) return null;

  const items: CategoryRowItem[] = vouchers.map((v) => ({
    id: v.id,
    name: v.title,
    nameHe: v.titleHe,
    image: v.imageUrl,
    emoji: v.imageUrl ? undefined : v.image,
    price: v.discountedPrice,
    currency: '₪',
    onClick: () => setSelectedVoucher(v),
  }));

  return (
    <>
      <div className="mb-6">
        <CategoryRowStore
          title={t.store.recommended}
          titleHe={t.store.recommended}
          items={items}
          accentColor="#1c1c1c"
          bgVideo="/recommended-category.mp4"
          titleInMedia
          topTitle={t.store.recommended}
          mediaPosition="bottom"
          aspectRatio="2 / 3"
          onSeeAll={() => onSelectFilter('recommended')}
        />
      </div>
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </>
  );
}

// ── 3. חדש ────────────────────────────────────────────────────────────────────
export function NewSlider({ onSelectFilter }: SliderProps) {
  const { t, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.isNew).slice(0, 8);
  if (!vouchers.length) return null;

  const items: CategoryRowItem[] = vouchers.map((v) => ({
    id: v.id,
    name: v.title,
    nameHe: v.titleHe,
    image: v.imageUrl,
    emoji: v.imageUrl ? undefined : v.image,
    price: v.discountedPrice,
    currency: '₪',
    onClick: () => setSelectedVoucher(v),
  }));

  return (
    <>
      <div className="mb-6">
        <CategoryRowStore
          title={t.store.newDeals}
          titleHe={t.store.newDeals}
          items={items}
          accentColor="#1c1c1c"
          bgVideo="/new-category.mp4"
          titleInMedia
          mediaPosition="bottom"
          aspectRatio="2 / 3"
          onSeeAll={() => onSelectFilter('new')}
        />
      </div>
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </>
  );
}

// ── Curated browse categories (Women / Men / Pets) — new card design ──────────

const WOMEN_GRADIENT = 'linear-gradient(135deg, #ec4899 0%, #db2777 42%, #1c1c1c 100%)';
const MEN_GRADIENT = 'linear-gradient(135deg, #475569 0%, #334155 42%, #0f172a 100%)';
const PETS_GRADIENT = 'linear-gradient(135deg, #f59e0b 0%, #d97706 42%, #1c1c1c 100%)';

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&q=80`;

function useBrowseNav() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  return { isHe: language === 'he', go: () => navigate(`/${lang}/store`) };
}

function BrowseCategory({
  title,
  titleHe,
  gradient,
  items,
}: {
  title: string;
  titleHe: string;
  gradient: string;
  items: CategoryRowItem[];
}) {
  const { isHe, go } = useBrowseNav();
  return (
    <div className="mb-6">
      <CategoryRowStore
        title={title}
        titleHe={titleHe}
        items={items}
        accentColor="#1c1c1c"
        bgGradient={gradient}
        titleInMedia
        topTitle={isHe ? titleHe : title}
        mediaPosition="bottom"
        aspectRatio="2 / 3"
        onSeeAll={go}
      />
    </div>
  );
}

export function WomenSlider() {
  const { go } = useBrowseNav();
  const items: CategoryRowItem[] = [
    { id: 'w1', name: 'Summer Dress', nameHe: 'שמלת קיץ', image: IMG('1595777457583-95e059d581b8'), price: 199, currency: '₪', onClick: go },
    { id: 'w2', name: 'Handbag', nameHe: 'תיק יד', image: IMG('1591561954557-26941169b49e'), price: 249, currency: '₪', onClick: go },
    { id: 'w3', name: 'Heels', nameHe: 'נעלי עקב', image: IMG('1543163521-1bf539c55dd2'), price: 179, currency: '₪', onClick: go },
    { id: 'w4', name: 'Sunglasses', nameHe: 'משקפי שמש', image: IMG('1511499767150-a48a237f0083'), price: 129, currency: '₪', onClick: go },
  ];
  return <BrowseCategory title="Women" titleHe="נשים" gradient={WOMEN_GRADIENT} items={items} />;
}

export function MenSlider() {
  const { go } = useBrowseNav();
  const items: CategoryRowItem[] = [
    { id: 'm1', name: 'Linen Shirt', nameHe: 'חולצת פשתן', image: IMG('1602810318383-e386cc2a3ccf'), price: 149, currency: '₪', onClick: go },
    { id: 'm2', name: 'Watch', nameHe: 'שעון יד', image: IMG('1524805444758-089113d48a6d'), price: 399, currency: '₪', onClick: go },
    { id: 'm3', name: 'Sneakers', nameHe: 'סניקרס', image: IMG('1542291026-7eec264c27ff'), price: 229, currency: '₪', onClick: go },
    { id: 'm4', name: 'Trainers', nameHe: 'נעלי ספורט', image: IMG('1553062407-98eeb64c6a62'), price: 259, currency: '₪', onClick: go },
  ];
  return <BrowseCategory title="Men" titleHe="גברים" gradient={MEN_GRADIENT} items={items} />;
}

export function PetsSlider() {
  const { go } = useBrowseNav();
  const items: CategoryRowItem[] = [
    { id: 'p1', name: 'Dog Essentials', nameHe: 'אביזרים לכלב', image: IMG('1543466835-00a7907e9de1'), price: 89, currency: '₪', onClick: go },
    { id: 'p2', name: 'Cat Care', nameHe: 'טיפוח לחתול', image: IMG('1514888286974-6c03e2ca1dba'), price: 79, currency: '₪', onClick: go },
    { id: 'p3', name: 'Pet Food', nameHe: 'מזון לחיות', image: IMG('1589924691995-400dc9ecc119'), price: 119, currency: '₪', onClick: go },
    { id: 'p4', name: 'Accessories', nameHe: 'אביזרים', image: IMG('1601758228041-f3b2795255f1'), price: 59, currency: '₪', onClick: go },
  ];
  return <BrowseCategory title="Pets" titleHe="חיות מחמד" gradient={PETS_GRADIENT} items={items} />;
}

// ── 4. הטבות אונליין ──────────────────────────────────────────────────────────
export function OnlineSlider({ onSelectFilter }: SliderProps) {
  const { t, isHe, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.isOnline && !v.comingSoon).slice(0, 8);
  return (
    <>
      <SliderSection
        title={t.store.online}
        gradient={GRADIENTS.online}
        vouchers={vouchers}
        isHe={isHe}
        filter="online"
        onSelectFilter={onSelectFilter}
        onSelectVoucher={setSelectedVoucher}
        comingSoonLabel={t.store.comingSoon}
        outOfStockLabel={t.store.outOfStock}
      />
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </>
  );
}

// ── 5. בקרוב ──────────────────────────────────────────────────────────────────
export function ComingSoonSlider({ onSelectFilter }: SliderProps) {
  const { t, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.comingSoon).slice(0, 8);
  if (!vouchers.length) return null;

  // Coming-soon vouchers usually have no product photo — fall back to the
  // emoji so the row still reads while the "בקרוב" video plays behind.
  const items: CategoryRowItem[] = vouchers.map((v) => ({
    id: v.id,
    name: v.title,
    nameHe: v.titleHe,
    image: v.imageUrl,
    emoji: v.imageUrl ? undefined : v.image,
    currency: '₪',
    onClick: () => setSelectedVoucher(v),
  }));

  return (
    <>
      <div className="mb-6">
        <CategoryRowStore
          title={t.store.comingSoon}
          titleHe={t.store.comingSoon}
          items={items}
          accentColor="#1c1c1c"
          bgVideo="/coming-soon-category.mp4"
          titleInMedia
          mediaPosition="bottom"
          aspectRatio="2 / 3"
          onSeeAll={() => onSelectFilter('coming-soon')}
        />
      </div>
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </>
  );
}

// ═══════════════════════════════════════
//  DEFAULT — all sliders combined (StorePage)
// ═══════════════════════════════════════

interface StoreSlidersProps {
  onSelectFilter: (filter: StoreFilter) => void;
}

export default function StoreSliders({ onSelectFilter }: StoreSlidersProps) {
  return (
    <>
      <ComingSoonSlider onSelectFilter={onSelectFilter} />
      <NewSlider onSelectFilter={onSelectFilter} />
      <PopularSlider onSelectFilter={onSelectFilter} />
      <RecommendedSlider onSelectFilter={onSelectFilter} />
      <OnlineSlider onSelectFilter={onSelectFilter} />
    </>
  );
}
