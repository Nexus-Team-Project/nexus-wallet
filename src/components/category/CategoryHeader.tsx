import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

interface CategoryHeaderProps {
  categoryId: VoucherCategory;
}

export default function CategoryHeader({ categoryId }: CategoryHeaderProps) {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const categoryName = t.store[categoryId as keyof typeof t.store] || categoryId;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between relative">
        {/* Right side (RTL): location selector */}
        <button className="flex items-center gap-1 z-10">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
            location_on
          </span>
          <span className="text-xs font-medium text-text-secondary">{t.category.location}</span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
            keyboard_arrow_down
          </span>
        </button>

        {/* Center: category title */}
        <h1 className="absolute inset-x-0 text-center text-base font-bold text-text-primary pointer-events-none">
          {categoryName}
        </h1>

        {/* Left side (RTL): back + search */}
        <div className="flex items-center gap-1 z-10">
          <button
            onClick={() => navigate(`/${lang}/search`)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
              search
            </span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
              {isRTL ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
