import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import type { Business } from '../../types/search.types';

/** Circle background colors that match each brand's logo */
const brandBgColors: Record<string, string> = {
  biz_001: '#FFFFFF', // McDonald's
  biz_002: '#000000', // Castro
  biz_003: '#FFFFFF', // Cinema City
  biz_004: '#000000', // Aroma
  biz_005: '#274968', // Isrotel
  biz_006: '#FFFFFF', // Superpharm
  biz_007: '#3478BE', // KSP
  biz_008: '#C44530', // Holmes Place
  biz_009: '#FFFFFF', // Shufersal
  biz_010: '#FFFFFF', // H&M
};

const categoryGradients: Record<string, string> = {
  'Fast Food': 'from-orange-400 to-orange-600',
  'Fashion': 'from-pink-400 to-pink-600',
  'Entertainment': 'from-purple-400 to-purple-600',
  'Cafe': 'from-amber-400 to-amber-600',
  'Hotels': 'from-sky-400 to-sky-600',
  'Health & Beauty': 'from-emerald-400 to-emerald-600',
  'Electronics': 'from-blue-400 to-blue-600',
  'Fitness': 'from-lime-500 to-lime-700',
  'Supermarket': 'from-green-400 to-green-600',
};

// Mock discount per business
const businessDiscount: Record<string, number> = {
  'biz_001': 15, 'biz_002': 20, 'biz_003': 25, 'biz_004': 10,
  'biz_005': 30, 'biz_006': 15, 'biz_007': 20, 'biz_008': 10,
  'biz_009': 12, 'biz_010': 25,
};


function StoreCard({ store, isHe, onNavigate }: { store: Business; isHe: boolean; onNavigate: () => void }) {
  const discount = businessDiscount[store.id] || 0;

  return (
    <button
      onClick={onNavigate}
      className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150"
    >
      {/* Atmosphere image area */}
      <div
        className="relative overflow-hidden bg-surface"
        style={{ height: '20vh' }}
      >
        {store.heroImageUrl ? (
          <img
            src={store.heroImageUrl}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl">{store.logo}</span>
          </div>
        )}

        {/* Dark gradient overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Brand logo circle — top-end corner */}
        <div
          className="absolute top-2.5 end-2.5 z-10 w-12 h-12 rounded-full shadow-md border-2 border-white flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: brandBgColors[store.id] || '#FFFFFF' }}
        >
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className={store.id === 'biz_007' ? 'w-full h-full object-cover' : 'w-[80%] h-[80%] object-contain'} />
          ) : (
            <span className="text-xl">{store.logo}</span>
          )}
        </div>
      </div>

      {/* Bottom info — title right, tags left */}
      <div className="w-full px-3 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">
            {isHe ? store.nameHe : store.name}
          </span>
          <span className="text-[10px] text-text-muted">
            {isHe ? store.locationHe : store.location}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
            {isHe ? store.categoryHe : store.category}
          </span>
          {discount > 0 && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
              {discount}%−
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MoreBubble({ onNavigate }: { onNavigate: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          setVisible(true);
        } else if (!entry.isIntersecting && visible) {
          setVisible(false);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 bg-sky-100 flex items-center justify-center active:scale-90"
        style={{
          opacity: visible ? 1 : 0,
          borderRadius: visible ? '50%' : '20% 50% 50% 20%',
          transform: visible ? 'none' : 'translateX(-16px) scaleX(0.2) scaleY(0.5)',
          animation: visible ? 'drip-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
        }}
      >
        <span
          className="material-symbols-outlined text-sky-600"
          style={{ fontSize: '20px' }}
        >
          chevron_left
        </span>
      </button>
    </div>
  );
}

export default function TopStores() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Hide section if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Top stores by rating
  const topStores = [...mockBusinesses]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Get the dominant category for the label
  const topCategory = topStores[0]?.category || '';
  const topCategoryName = isHe ? (topStores[0]?.categoryHe || '') : topCategory;
  const gradient = categoryGradients[topCategory] || 'from-primary to-primary-dark';

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">{t.home.reorder}</h3>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
        >
          {isHe ? 'עוד' : 'More'}
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {/* Category label — narrow rectangle at start */}
        <div
          className={`flex-none w-[120px] rounded-lg bg-gradient-to-b ${gradient} flex items-center justify-center`}
        >
          <span
            className="text-white text-sm font-bold whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {topCategoryName}
          </span>
        </div>

        {/* Store cards */}
        {topStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            isHe={isHe}
            onNavigate={() => navigate(`/${lang}/store`)}
          />
        ))}

        {/* Arrow bubble at the end — animates in */}
        <MoreBubble onNavigate={() => navigate(`/${lang}/store`)} />
      </div>
    </section>
  );
}
