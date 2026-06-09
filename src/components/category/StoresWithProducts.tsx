import { useLanguage } from '../../i18n/LanguageContext';
import { SliderCard } from '../store/StoreSliders';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';
import type { Business } from '../../types/search.types';
import type { Voucher } from '../../types/voucher.types';

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
    return vouchersByMerchant.has(s.name) && (vouchersByMerchant.get(s.name)?.length || 0) > 0;
  });

  if (!storesWithVouchers.length) return null;

  return (
    <section className="max-w-md mx-auto">
      <h3 className="text-base font-bold px-5 mb-4">{t.category.storesWithProducts}</h3>
      <div className="space-y-6">
        {storesWithVouchers.slice(0, 4).map((store) => {
          const storeVouchers = vouchersByMerchant.get(store.name) || [];
          // Match the home-page BrandSlider treatment exactly: a small
          // round disc painted with the brand's signature background
          // colour, transparent PNG logo at 80% contain on top (or
          // full-bleed cover for the brands flagged for it).
          const bgColor = brandBgColors[store.id] ?? '#FFFFFF';
          const fullBleed = FULL_BLEED_LOGOS.has(store.id);

          return (
            <div key={store.id}>
              {/* Store header — round brand logo + name + rating */}
              <div className="flex items-center gap-3 px-5 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm overflow-hidden"
                  style={{ backgroundColor: bgColor }}
                >
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={isHe ? store.nameHe : store.name}
                      className={fullBleed ? 'w-full h-full object-cover' : 'w-[80%] h-[80%] object-contain'}
                    />
                  ) : (
                    <span className="text-xl drop-shadow-sm leading-none">{store.logo}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {isHe ? store.nameHe : store.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {store.reviewCount} {t.category.reviews} · ★ {store.rating}
                  </p>
                </div>
              </div>

              {/* Horizontal product slider — uses the same SliderCard as home */}
              <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
                {storeVouchers.slice(0, 6).map((v) => (
                  <SliderCard
                    key={v.id}
                    voucher={v}
                    isHe={isHe}
                    onSelect={onSelectVoucher}
                    comingSoonLabel={t.store.comingSoon}
                    outOfStockLabel={t.store.outOfStock}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
