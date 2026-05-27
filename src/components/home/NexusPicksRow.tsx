import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRecommendationsStore } from '../../stores/recommendationsStore';
import { SliderCard } from '../store/StoreSliders';
import VoucherDetail from '../store/VoucherDetail';
import type { Voucher } from '../../types/voucher.types';

// Top "Nexus picks for you" row.
// Renders ONLY after the user has had a chat search session — i.e. when the
// recommendationsStore has picks. Returns null otherwise so the row doesn't
// permanently occupy space on the home page.
export default function NexusPicksRow() {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const picks = useRecommendationsStore((s) => s.picks);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  if (picks.length === 0) return null;
  const vouchers = picks;

  return (
    <section className="mb-6 pt-3">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">
          {isHe ? 'ההמלצות של Nexus עבורך' : 'Nexus picks for you'}
        </h3>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {vouchers.map((v) => (
          <SliderCard
            key={v.id}
            voucher={v}
            isHe={isHe}
            onSelect={setSelectedVoucher}
            comingSoonLabel={t.store.comingSoon}
            outOfStockLabel={t.store.outOfStock}
          />
        ))}
      </div>

      {selectedVoucher && (
        <VoucherDetail
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </section>
  );
}
