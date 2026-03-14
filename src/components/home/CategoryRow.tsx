import {} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';

const categoryBg: Record<string, string> = {
  'Fast Food': 'bg-orange-50',
  'Fashion': 'bg-pink-50',
  'Entertainment': 'bg-purple-50',
  'Cafe': 'bg-amber-50',
  'Hotels': 'bg-sky-50',
  'Health & Beauty': 'bg-emerald-50',
  'Electronics': 'bg-blue-50',
  'Fitness': 'bg-lime-50',
  'Supermarket': 'bg-green-50',
};

// Map business category → VoucherCategory for navigation
const bizToCategory: Record<string, string> = {
  'Fast Food': 'food',
  'Fashion': 'shopping',
  'Entertainment': 'entertainment',
  'Cafe': 'food',
  'Hotels': 'travel',
  'Health & Beauty': 'health',
  'Electronics': 'tech',
  'Fitness': 'health',
  'Supermarket': 'food',
};

function getUniqueCategories() {
  const seen = new Set<string>();
  return mockBusinesses.filter((b) => {
    if (seen.has(b.category)) return false;
    seen.add(b.category);
    return true;
  });
}

interface CategoryRowProps {
  collapsed?: boolean;
}

export default function CategoryRow({ collapsed = false }: CategoryRowProps) {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const categories = getUniqueCategories();

  return (
    <div
      className="relative transition-all duration-300 ease-in-out"
      style={{ height: collapsed ? '44px' : '130px' }}
    >
      {/* Expanded: large squares — fades out when collapsed */}
      <div
        className="flex overflow-x-auto hide-scrollbar gap-4 px-5 py-3 absolute inset-x-0 top-0 transition-all duration-300 ease-in-out"
        style={{
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? 'translateY(-20px)' : 'translateY(0)',
          pointerEvents: collapsed ? 'none' : 'auto',
        }}
      >
        {categories.map((biz) => (
          <button
            key={biz.category}
            onClick={() => navigate(`/${lang}/category/${bizToCategory[biz.category] || 'food'}`)}
            className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
          >
            <div
              className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-sm border-2 border-transparent hover:border-primary/40 transition-colors duration-100 ${categoryBg[biz.category] || 'bg-surface'}`}
            >
              <span className="text-4xl drop-shadow-sm">{biz.logo}</span>
            </div>
            <span className="text-[11px] font-semibold text-text-primary leading-tight text-center max-w-[72px]">
              {isHe ? biz.categoryHe : biz.category}
            </span>
          </button>
        ))}
      </div>

      {/* Collapsed: pills — fades in when collapsed */}
      <div
        className="flex overflow-x-auto hide-scrollbar gap-2 px-5 py-2 absolute inset-x-0 top-0 transition-all duration-300 ease-in-out"
        style={{
          opacity: collapsed ? 1 : 0,
          transform: collapsed ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: collapsed ? 'auto' : 'none',
        }}
      >
        {categories.map((biz) => (
          <button
            key={biz.category}
            onClick={() => navigate(`/${lang}/category/${bizToCategory[biz.category] || 'food'}`)}
            className={`flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full border border-border/60 shadow-sm active:scale-95 transition-transform duration-100 ${categoryBg[biz.category] || 'bg-surface'}`}
          >
            <span className="text-base leading-none">{biz.logo}</span>
            <span className="text-[11px] font-semibold text-text-primary whitespace-nowrap">
              {isHe ? biz.categoryHe : biz.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
