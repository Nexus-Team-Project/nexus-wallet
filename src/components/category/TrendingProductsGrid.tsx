import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { SliderSection, SLIDER_GRADIENTS } from '../store/StoreSliders';
import type { Voucher, VoucherCategory } from '../../types/voucher.types';

interface TrendingProductsGridProps {
  vouchers: Voucher[];
  categoryId: VoucherCategory;
  onSelect: (voucher: Voucher) => void;
}

export default function TrendingProductsGrid({ vouchers, categoryId, onSelect }: TrendingProductsGridProps) {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  // Trending = popular first, then highest discount, capped at 8
  const trending = [...vouchers]
    .filter((v) => v.inStock && !v.comingSoon)
    .sort((a, b) => {
      if (a.popular !== b.popular) return a.popular ? -1 : 1;
      return b.discountPercent - a.discountPercent;
    })
    .slice(0, 8);

  if (!trending.length) return null;

  return (
    <SliderSection
      title={t.category.trendingProducts}
      gradient={SLIDER_GRADIENTS.recommended}
      vouchers={trending}
      isHe={isHe}
      filter={categoryId}
      onSelectFilter={() => navigate(`/${lang}/store`, { state: { filter: categoryId } })}
      onSelectVoucher={onSelect}
      comingSoonLabel={t.store.comingSoon}
      outOfStockLabel={t.store.outOfStock}
    />
  );
}
