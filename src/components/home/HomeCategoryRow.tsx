import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

const categories: { key: VoucherCategory; icon: string; iconColor: string; bg: string; border: string }[] = [
  { key: 'food', icon: 'restaurant', iconColor: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'shopping', icon: 'checkroom', iconColor: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { key: 'entertainment', icon: 'movie', iconColor: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { key: 'travel', icon: 'flight', iconColor: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
  { key: 'health', icon: 'favorite', iconColor: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'education', icon: 'school', iconColor: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { key: 'tech', icon: 'devices', iconColor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
];

export default function HomeCategoryRow() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  const getLabel = (key: VoucherCategory) =>
    (t.store as Record<string, string>)[key] ?? key;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">{isHe ? 'קטגוריות' : 'Categories'}</h3>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-5 items-center">
        {categories.map(({ key, icon, iconColor, bg, border }) => (
          <button
            key={key}
            onClick={() => navigate(`/${lang}/category/${key}`)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
          >
            <div
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-2 shadow-sm ${bg} ${border}`}
            >
              <span
                className={`material-symbols-outlined ${iconColor}`}
                style={{ fontSize: 26 }}
              >
                {icon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[60px] line-clamp-1">
              {getLabel(key)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
