import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher } from '../../types/voucher.types';

interface TrendingProductsGridProps {
  vouchers: Voucher[];
  onSelect: (voucher: Voucher) => void;
}

function TrendingCard({ voucher, isHe, onSelect }: { voucher: Voucher; isHe: boolean; onSelect: (v: Voucher) => void }) {
  return (
    <button
      onClick={() => onSelect(voucher)}
      className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden text-start active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative bg-surface flex items-center justify-center h-32">
        <span style={{ fontSize: 46 }}>{voucher.image}</span>
        {voucher.discountPercent > 0 && (
          <span className="absolute top-2 end-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700">
            {voucher.discountPercent}%
          </span>
        )}
        {voucher.popular && (
          <span className="absolute top-2 start-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
            ★
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-text-primary line-clamp-1 leading-snug">
          {isHe ? voucher.titleHe : voucher.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-primary">₪{voucher.discountedPrice}</span>
          {voucher.originalPrice !== voucher.discountedPrice && (
            <span className="text-xs text-text-muted line-through">₪{voucher.originalPrice}</span>
          )}
        </div>
        <p className="text-[10px] text-text-muted mt-1">{voucher.merchantName}</p>
      </div>
    </button>
  );
}

const PAGE_SIZE = 6;

export default function TrendingProductsGrid({ vouchers, onSelect }: TrendingProductsGridProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [shown, setShown] = useState(PAGE_SIZE);

  const available = vouchers.filter((v) => v.inStock && !v.comingSoon);
  const displayed = available.slice(0, shown);
  const hasMore = shown < available.length;

  if (!available.length) return null;

  return (
    <section className="px-4 max-w-md mx-auto">
      <h3 className="text-base font-bold mb-3">{t.category.trendingProducts}</h3>
      <div className="grid grid-cols-2 gap-3">
        {displayed.map((v) => (
          <TrendingCard key={v.id} voucher={v} isHe={isHe} onSelect={onSelect} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShown((s) => s + PAGE_SIZE)}
          className="w-full mt-4 py-3 rounded-xl bg-surface text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
        >
          {t.category.showMore}
        </button>
      )}
    </section>
  );
}
