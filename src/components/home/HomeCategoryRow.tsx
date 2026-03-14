import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

const categories: { key: VoucherCategory; icon: string; iconColor: string; bg: string }[] = [
  { key: 'food', icon: 'restaurant', iconColor: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'shopping', icon: 'checkroom', iconColor: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'entertainment', icon: 'movie', iconColor: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'travel', icon: 'flight', iconColor: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'health', icon: 'favorite', iconColor: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'education', icon: 'school', iconColor: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'tech', icon: 'devices', iconColor: 'text-blue-600', bg: 'bg-blue-50' },
];

export default function HomeCategoryRow() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const getLabel = (key: VoucherCategory) =>
    (t.store as Record<string, string>)[key] ?? key;

  return (
    <section className="mb-5">
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 py-1">
        {categories.map(({ key, icon, iconColor, bg }) => (
          <button
            key={key}
            onClick={() => navigate(`/${lang}/category/${key}`)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
          >
            <div
              className={`w-[56px] h-[56px] rounded-2xl ${bg} flex items-center justify-center shadow-sm`}
            >
              <span
                className={`material-symbols-outlined ${iconColor}`}
                style={{ fontSize: 26 }}
              >
                {icon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[56px] line-clamp-1">
              {getLabel(key)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
