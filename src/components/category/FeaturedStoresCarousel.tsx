import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';
import type { Business } from '../../types/search.types';

interface FeaturedStoresCarouselProps {
  stores: Business[];
}

// Individual store tile — kept as its own component so we can hold a
// per-image `imgError` state and fall back to the emoji when the real
// PNG fails to load. Hoisted out of the carousel to avoid resetting
// state on every parent re-render.
//
// Visual is intentionally identical to home-page BrandSlider: 60px disc
// painted with the brand's signature background colour, transparent
// PNG logo at 85% contain on top (or 100% cover for the few brands
// flagged as full-bleed). Shared utils make sure the two surfaces
// can never drift apart.
function StoreTile({ store, isHe, onClick }: { store: Business; isHe: boolean; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!store.logoUrl && !imgError;
  const bgColor = brandBgColors[store.id] ?? '#FFFFFF';
  const fullBleed = FULL_BLEED_LOGOS.has(store.id);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
    >
      <div
        className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-sm flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        {showImage ? (
          <img
            src={store.logoUrl}
            alt={isHe ? store.nameHe : store.name}
            className={fullBleed ? 'w-full h-full object-cover' : 'w-[85%] h-[85%] object-contain'}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl">{store.logo}</span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[60px] line-clamp-1">
        {isHe ? store.nameHe : store.name}
      </span>
    </button>
  );
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
          <StoreTile
            key={store.id}
            store={store}
            isHe={isHe}
            onClick={() => navigate(`/${lang}/store`)}
          />
        ))}
      </div>
    </section>
  );
}
