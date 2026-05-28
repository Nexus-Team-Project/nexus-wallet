import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { subcategoriesByCategory, type Subcategory } from '../../mock/data/subcategories.mock';
import type { VoucherCategory } from '../../types/voucher.types';

interface SubcategoryGridProps {
  categoryId: VoucherCategory;
  onSubcategorySelect: (subcategory: string | null) => void;
}

// Single tile — circular photo + emoji fallback (image may fail to load).
function SubcategoryTile({
  sub,
  isHe,
  selected,
  onClick,
}: {
  sub: Subcategory;
  isHe: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform duration-100"
    >
      <div
        className={`relative w-[76px] h-[76px] rounded-full overflow-hidden shadow-sm border-2 transition-colors duration-100 ${
          selected ? 'border-primary' : 'border-transparent hover:border-primary/40'
        } ${imgFailed ? sub.bg : ''}`}
      >
        {imgFailed ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl drop-shadow-sm leading-none">{sub.emoji}</span>
          </div>
        ) : (
          <img
            src={sub.imageUrl}
            alt={isHe ? sub.labelHe : sub.labelEn}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <span
        className={`text-[11px] font-semibold leading-tight text-center max-w-[76px] line-clamp-2 ${
          selected ? 'text-primary' : 'text-text-primary'
        }`}
      >
        {isHe ? sub.labelHe : sub.labelEn}
      </span>
    </button>
  );
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
    <section className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-y-4 justify-items-center">
        {subcategories.map((sub) => (
          <SubcategoryTile
            key={sub.key}
            sub={sub}
            isHe={isHe}
            selected={selected === sub.key}
            onClick={() => handleSelect(sub.key)}
          />
        ))}
      </div>
    </section>
  );
}
