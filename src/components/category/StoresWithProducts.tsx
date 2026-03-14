import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';
import type { Voucher } from '../../types/voucher.types';

const categoryColors: Record<string, string> = {
  'Fast Food': 'bg-orange-50 border-orange-200',
  'Fashion': 'bg-pink-50 border-pink-200',
  'Entertainment': 'bg-purple-50 border-purple-200',
  'Cafe': 'bg-amber-50 border-amber-200',
  'Hotels': 'bg-sky-50 border-sky-200',
  'Health & Beauty': 'bg-emerald-50 border-emerald-200',
  'Electronics': 'bg-blue-50 border-blue-200',
  'Fitness': 'bg-lime-50 border-lime-200',
  'Supermarket': 'bg-green-50 border-green-200',
};

function ProductCard({ voucher, isHe, onSelect }: { voucher: Voucher; isHe: boolean; onSelect: (v: Voucher) => void }) {
  return (
    <button
      onClick={() => onSelect(voucher)}
      className="flex-none w-36 bg-white border border-border rounded-2xl shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative bg-surface flex items-center justify-center h-24">
        <span style={{ fontSize: 36 }}>{voucher.image}</span>
        {voucher.discountPercent > 0 && (
          <span className="absolute top-1.5 end-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-pink-100 text-pink-700">
            {voucher.discountPercent}%
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-text-primary line-clamp-1 leading-snug">
          {isHe ? voucher.titleHe : voucher.title}
        </p>
        <p className="text-sm font-bold text-primary mt-0.5">₪{voucher.discountedPrice}</p>
      </div>
    </button>
  );
}

interface StoresWithProductsProps {
  stores: Business[];
  vouchersByMerchant: Map<string, Voucher[]>;
  onSelectVoucher: (voucher: Voucher) => void;
}

export default function StoresWithProducts({ stores, vouchersByMerchant, onSelectVoucher }: StoresWithProductsProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Only show stores that have vouchers
  const storesWithVouchers = stores.filter((s) => {
    const name = s.name;
    return vouchersByMerchant.has(name) && (vouchersByMerchant.get(name)?.length || 0) > 0;
  });

  if (!storesWithVouchers.length) return null;

  return (
    <section className="max-w-md mx-auto">
      <h3 className="text-base font-bold px-4 mb-4">{t.category.storesWithProducts}</h3>
      <div className="space-y-6">
        {storesWithVouchers.slice(0, 4).map((store) => {
          const storeVouchers = vouchersByMerchant.get(store.name) || [];
          const colorClass = categoryColors[store.category] || 'bg-surface border-border';

          return (
            <div key={store.id}>
              {/* Store header */}
              <div className="flex items-center gap-3 px-4 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${colorClass}`}>
                  <span className="text-xl">{store.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{isHe ? store.nameHe : store.name}</p>
                  <p className="text-[10px] text-text-muted">
                    {store.reviewCount} {t.category.reviews} · ★ {store.rating}
                  </p>
                </div>
              </div>

              {/* Horizontal product slider */}
              <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 snap-x snap-mandatory">
                {storeVouchers.slice(0, 6).map((v) => (
                  <ProductCard key={v.id} voucher={v} isHe={isHe} onSelect={onSelectVoucher} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
