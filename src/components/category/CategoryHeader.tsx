import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

interface CategoryHeaderProps {
  categoryId: VoucherCategory;
}

export default function CategoryHeader({ categoryId }: CategoryHeaderProps) {
  const { t, isRTL } = useLanguage();

  const categoryName = t.store[categoryId as keyof typeof t.store] || categoryId;

  // Back / chat / bell live in the global TopBar above this header,
  // so we only render the large prominent title here.
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-md mx-auto px-4 pt-2 pb-3">
        <h1
          className={`text-3xl font-extrabold text-text-primary leading-tight ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          {categoryName}
        </h1>
      </div>
    </header>
  );
}
