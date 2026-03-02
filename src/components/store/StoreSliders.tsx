/**
 * StoreSliders — three horizontal slider sections rendered on the
 * StorePage when no filter / search is active.
 *
 * Sections:
 *  1. חדש / New     (isNew: true)
 *  2. הכי פופולרים  (popular: true)
 *  3. מומלץ         (all, sorted by discountPercent desc)
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useVouchers } from '../../hooks/useVouchers';
import VoucherDetail from './VoucherDetail';
import type { Voucher, StoreFilter } from '../../types/voucher.types';

// ── Gradient definitions per slider ──────────────────────────────────────────
const GRADIENTS = {
  new:         'linear-gradient(to bottom, #3b82f6, #1d4ed8)',   // blue
  popular:     'linear-gradient(to bottom, #f97316, #c2410c)',   // orange
  recommended: 'linear-gradient(to bottom, #a855f7, #7e22ce)',   // purple
} as const;

// ── Compact slider card ───────────────────────────────────────────────────────

function SliderCard({
  voucher,
  isHe,
  onSelect,
}: {
  voucher: Voucher;
  isHe: boolean;
  onSelect: (v: Voucher) => void;
}) {
  const { t } = useLanguage();
  const isUnavailable = !!voucher.comingSoon || !voucher.inStock;

  return (
    <button
      onClick={() => !isUnavailable && onSelect(voucher)}
      disabled={isUnavailable}
      className="flex-none w-[44vw] max-w-[190px] bg-white border border-border rounded-xl shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150 flex flex-col disabled:opacity-60"
    >
      {/* Emoji / image area */}
      <div className="relative bg-surface flex items-center justify-center" style={{ height: '13vh' }}>
        <span style={{ fontSize: 38 }}>{voucher.image}</span>

        {/* Discount badge */}
        <div className="absolute top-1.5 end-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700">
            {voucher.discountPercent}%
          </span>
        </div>

        {/* Coming soon overlay */}
        {voucher.comingSoon && (
          <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{t.store.comingSoon}</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {!voucher.comingSoon && !voucher.inStock && (
          <div className="absolute inset-0 bg-text-primary/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{t.store.outOfStock}</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="px-2.5 py-2 flex-1">
        <p className="text-[10px] text-text-secondary leading-tight">{voucher.merchantName}</p>
        <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug mt-0.5">
          {isHe ? voucher.titleHe : voucher.title}
        </p>
        <p className="text-sm font-bold text-primary mt-1">₪{voucher.discountedPrice}</p>
      </div>
    </button>
  );
}

// ── More bubble ───────────────────────────────────────────────────────────────

function MoreBubble({
  color,
  onNavigate,
}: {
  color: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform rounded-full"
        style={{ background: `${color}22` }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '20px', color }}
        >
          chevron_left
        </span>
      </button>
    </div>
  );
}

// ── Single slider section ─────────────────────────────────────────────────────

function SliderSection({
  title,
  gradient,
  accentColor,
  vouchers,
  isHe,
  filter,
  onSelectFilter,
  onSelectVoucher,
}: {
  title: string;
  gradient: string;
  accentColor: string;
  vouchers: Voucher[];
  isHe: boolean;
  filter: StoreFilter;
  onSelectFilter: (f: StoreFilter) => void;
  onSelectVoucher: (v: Voucher) => void;
}) {
  if (!vouchers.length) return null;

  return (
    <section className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">{title}</h3>
        <button
          onClick={() => onSelectFilter(filter)}
          className="px-3 py-1 rounded-md text-xs font-normal active:scale-95 transition-colors"
          style={{ background: `${accentColor}1a`, color: accentColor }}
        >
          {isHe ? 'עוד' : 'More'}
        </button>
      </div>

      {/* Scroll row */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {/* Gradient label rectangle */}
        <div
          className="flex-none w-[90px] rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient, minHeight: '13vh' }}
        >
          <span
            className="text-white text-sm font-bold whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
          </span>
        </div>

        {/* Cards */}
        {vouchers.map((v) => (
          <SliderCard key={v.id} voucher={v} isHe={isHe} onSelect={onSelectVoucher} />
        ))}

        {/* More bubble */}
        <MoreBubble color={accentColor} onNavigate={() => onSelectFilter(filter)} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

interface StoreSlidersProps {
  onSelectFilter: (filter: StoreFilter) => void;
}

export default function StoreSliders({ onSelectFilter }: StoreSlidersProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const { data: allVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  if (!allVouchers?.length) return null;

  const newVouchers = allVouchers.filter((v) => v.isNew).slice(0, 8);
  const popularVouchers = allVouchers.filter((v) => v.popular).slice(0, 8);
  const recommendedVouchers = [...allVouchers]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 8);

  return (
    <>
      <SliderSection
        title={t.store.newDeals}
        gradient={GRADIENTS.new}
        accentColor="#3b82f6"
        vouchers={newVouchers}
        isHe={isHe}
        filter="new"
        onSelectFilter={onSelectFilter}
        onSelectVoucher={setSelectedVoucher}
      />

      <SliderSection
        title={t.store.mostPopular}
        gradient={GRADIENTS.popular}
        accentColor="#f97316"
        vouchers={popularVouchers}
        isHe={isHe}
        filter="popular"
        onSelectFilter={onSelectFilter}
        onSelectVoucher={setSelectedVoucher}
      />

      <SliderSection
        title={t.store.recommended}
        gradient={GRADIENTS.recommended}
        accentColor="#a855f7"
        vouchers={recommendedVouchers}
        isHe={isHe}
        filter="recommended"
        onSelectFilter={onSelectFilter}
        onSelectVoucher={setSelectedVoucher}
      />

      {/* Detail sheet — shared across all sliders */}
      {selectedVoucher && (
        <VoucherDetail
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </>
  );
}
