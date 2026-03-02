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
import { useLanguage } from '../../i18n/LanguageContext';
import { useVouchers } from '../../hooks/useVouchers';
import VoucherDetail from './VoucherDetail';
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

function SliderCard({
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
      {/* Emoji / image area — same height as TopStores (20vh) */}
      <div className="relative bg-surface flex items-center justify-center" style={{ height: '20vh' }}>
        <span style={{ fontSize: 56 }}>{voucher.image}</span>

        {/* Discount badge — top end */}
        <div className="absolute top-2 end-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700">
            {voucher.discountPercent}%
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

// ── Generic section ────────────────────────────────────────────────────────────

function SliderSection({
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

// ── 1. הכי פופולרים ───────────────────────────────────────────────────────────
export function PopularSlider({ onSelectFilter }: SliderProps) {
  const { t, isHe, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.popular).slice(0, 8);
  return (
    <>
      <SliderSection
        title={t.store.mostPopular}
        gradient={GRADIENTS.popular}
        vouchers={vouchers}
        isHe={isHe}
        filter="popular"
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

// ── 2. מומלץ ──────────────────────────────────────────────────────────────────
export function RecommendedSlider({ onSelectFilter }: SliderProps) {
  const { t, isHe, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = [...all]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 8);
  return (
    <>
      <SliderSection
        title={t.store.recommended}
        gradient={GRADIENTS.recommended}
        vouchers={vouchers}
        isHe={isHe}
        filter="recommended"
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

// ── 3. חדש ────────────────────────────────────────────────────────────────────
export function NewSlider({ onSelectFilter }: SliderProps) {
  const { t, isHe, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.isNew).slice(0, 8);
  return (
    <>
      <SliderSection
        title={t.store.newDeals}
        gradient={GRADIENTS.new}
        vouchers={vouchers}
        isHe={isHe}
        filter="new"
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
  const { t, isHe, all, selectedVoucher, setSelectedVoucher } = useSlider();
  const vouchers = all.filter((v) => v.comingSoon).slice(0, 8);
  return (
    <>
      <SliderSection
        title={t.store.comingSoon}
        gradient={GRADIENTS.comingSoon}
        vouchers={vouchers}
        isHe={isHe}
        filter="coming-soon"
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
