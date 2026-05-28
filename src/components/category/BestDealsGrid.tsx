import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { SliderSection, SLIDER_GRADIENTS } from '../store/StoreSliders';
import type { Voucher, VoucherCategory } from '../../types/voucher.types';

interface BestDealsGridProps {
  vouchers: Voucher[];
  categoryId: VoucherCategory;
  onSelect: (voucher: Voucher) => void;
}

export default function BestDealsGrid({ vouchers, categoryId, onSelect }: BestDealsGridProps) {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  const topDeals = [...vouchers]
    .filter((v) => v.inStock && !v.comingSoon)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 8);

  if (!topDeals.length) return null;

  return (
    <SliderSection
      title={t.category.bestDeals}
      gradient={SLIDER_GRADIENTS.popular}
      vouchers={topDeals}
      isHe={isHe}
      filter={categoryId}
      onSelectFilter={() => navigate(`/${lang}/store`, { state: { filter: categoryId } })}
      onSelectVoucher={onSelect}
      comingSoonLabel={t.store.comingSoon}
      outOfStockLabel={t.store.outOfStock}
    />
  );
}
