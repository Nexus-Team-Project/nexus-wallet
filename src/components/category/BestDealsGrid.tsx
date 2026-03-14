import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher } from '../../types/voucher.types';

interface BestDealsGridProps {
  vouchers: Voucher[];
  onSelect: (voucher: Voucher) => void;
}

function DealCard({ voucher, isHe, onSelect }: { voucher: Voucher; isHe: boolean; onSelect: (v: Voucher) => void }) {
  return (
    <button
      onClick={() => onSelect(voucher)}
      className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden text-start active:scale-[0.97] transition-transform duration-150"
    >
      {/* Image area */}
      <div className="relative bg-surface flex items-center justify-center h-28">
        <span style={{ fontSize: 42 }}>{voucher.image}</span>
        {/* Discount badge */}
        <span className="absolute top-2 end-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700">
          {voucher.discountPercent}%
        </span>
      </div>
      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-[10px] text-text-secondary leading-tight">{voucher.merchantName}</p>
        <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug mt-0.5">
          {isHe ? voucher.titleHe : voucher.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-primary">₪{voucher.discountedPrice}</span>
          <span className="text-xs text-text-muted line-through">₪{voucher.originalPrice}</span>
        </div>
      </div>
    </button>
  );
}

export default function BestDealsGrid({ vouchers, onSelect }: BestDealsGridProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const topDeals = [...vouchers]
    .filter((v) => v.inStock && !v.comingSoon)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 4);

  if (!topDeals.length) return null;

  return (
    <section className="px-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold">{t.category.bestDeals}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {topDeals.map((v) => (
          <DealCard key={v.id} voucher={v} isHe={isHe} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
