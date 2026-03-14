import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

const brandColors: Record<string, string> = {
  'Fast Food': 'bg-orange-50 border-orange-200',
  'Fashion': 'bg-pink-50 border-pink-200',
  'Entertainment': 'bg-purple-50 border-purple-200',
  'Cafe': 'bg-amber-50 border-amber-200',
  'Hotels': 'bg-sky-50 border-sky-200',
  'Health & Beauty': 'bg-emerald-50 border-emerald-200',
  'Electronics': 'bg-blue-50 border-blue-200',
  'Fitness': 'bg-lime-50 border-lime-200',
  'Supermarket': 'bg-green-50 border-green-200',
};

interface FeaturedStoresCarouselProps {
  stores: Business[];
}

export default function FeaturedStoresCarousel({ stores }: FeaturedStoresCarouselProps) {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  if (!stores.length) return null;

  return (
    <section className="max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-base font-bold">{t.category.topStoresInCategory}</h3>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal active:scale-95 transition-transform"
        >
          {t.category.allLabel}
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 items-center">
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => navigate(`/${lang}/store`)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-sm ${
                brandColors[store.category] || 'bg-surface border-border'
              }`}
            >
              <span className="text-2xl">{store.logo}</span>
            </div>
            <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[64px] line-clamp-1">
              {isHe ? store.nameHe : store.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
