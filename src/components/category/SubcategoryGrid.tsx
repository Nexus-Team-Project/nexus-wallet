import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { subcategoriesByCategory } from '../../mock/data/subcategories.mock';
import type { VoucherCategory } from '../../types/voucher.types';

interface SubcategoryGridProps {
  categoryId: VoucherCategory;
  onSubcategorySelect: (subcategory: string | null) => void;
}

export default function SubcategoryGrid({ categoryId, onSubcategorySelect }: SubcategoryGridProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [selected, setSelected] = useState<string | null>(null);

  const subcategories = subcategoriesByCategory[categoryId] || [];

  const handleSelect = (key: string) => {
    const next = selected === key ? null : key;
    setSelected(next);
    onSubcategorySelect(next);
  };

  return (
    <section className="px-4 py-4 max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-3">
        {subcategories.map((sub) => (
          <button
            key={sub.key}
            onClick={() => handleSelect(sub.key)}
            className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 ${
              selected === sub.key ? 'scale-[0.97]' : ''
            }`}
          >
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${sub.bg} ${
                selected === sub.key ? 'ring-2 ring-primary shadow-md' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined ${sub.iconColor}`}
                style={{ fontSize: '28px' }}
              >
                {sub.icon}
              </span>
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight line-clamp-2 ${
              selected === sub.key ? 'text-primary' : 'text-text-primary'
            }`}>
              {isHe ? sub.labelHe : sub.labelEn}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
