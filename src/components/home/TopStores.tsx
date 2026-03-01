import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import type { Business } from '../../types/search.types';

// Pastel backgrounds per category for visual variety
const categoryColors: Record<string, string> = {
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

// Extra emojis per category to create multiple slides per store
const categorySlides: Record<string, string[]> = {
  'Fast Food': ['🍔', '🍟', '🥤'],
  'Fashion': ['👕', '👗', '👜'],
  'Entertainment': ['🎬', '🍿', '🎭'],
  'Cafe': ['☕', '🥐', '🍰'],
  'Hotels': ['🏨', '🏖️', '🌅'],
  'Health & Beauty': ['💊', '💄', '🧴'],
  'Electronics': ['💻', '📱', '🎧'],
  'Fitness': ['💪', '🏋️', '🧘'],
  'Supermarket': ['🛒', '🥑', '🧀'],
};

function StoreCard({ store, isHe, onNavigate }: { store: Business; isHe: boolean; onNavigate: () => void }) {
  const slideEmojis = categorySlides[store.category] || [store.logo];
  const hasMultipleSlides = slideEmojis.length > 1;
  const discount = businessDiscount[store.id] || 0;
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 3) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 20;
    if (hasMultipleSlides && isSwiping.current && Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % slideEmojis.length);
      } else {
        setCurrent((prev) => (prev - 1 + slideEmojis.length) % slideEmojis.length);
      }
    } else if (!isSwiping.current) {
      onNavigate();
    }
  };

  return (
    <div
      className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150"
    >
      {/* Swipeable image area */}
      <div
        className={`relative overflow-hidden ${categoryColors[store.category] || 'bg-surface'}`}
        style={{ height: '20vh' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides — crossfade */}
        {slideEmojis.map((emoji, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              idx === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-7xl">{emoji}</span>
          </div>
        ))}

        {/* Logo badge — top-right corner */}
        <div className="absolute top-2.5 right-2.5 z-10 w-14 h-14 rounded-full bg-white shadow-md border border-border/40 flex items-center justify-center">
          <span className="text-2xl">{store.logo}</span>
        </div>

        {/* Dot indicators — only when multiple slides */}
        {hasMultipleSlides && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1">
            {slideEmojis.map((_, idx) => (
              <span
                key={idx}
                className={`block rounded-full transition-all duration-300 ${
                  idx === current
                    ? 'w-4 h-1.5 bg-gray-800'
                    : 'w-1.5 h-1.5 bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom info — title right, tags left */}
      <button
        onClick={onNavigate}
        className="w-full px-3 py-4 flex items-center justify-between"
      >
        {/* Title + subtitle — right side in RTL (comes first in DOM) */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">
            {isHe ? store.nameHe : store.name}
          </span>
          <span className="text-[10px] text-text-muted">
            {isHe ? store.locationHe : store.location}
          </span>
        </div>
        {/* Tags — left side in RTL (comes second in DOM) */}
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
      </button>
    </div>
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
