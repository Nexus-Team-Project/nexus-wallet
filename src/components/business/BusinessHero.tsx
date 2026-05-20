import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

interface BusinessHeroProps {
  business: Business;
}

const categoryGradients: Record<string, string> = {
  'Fast Food': 'from-orange-600 via-red-500 to-amber-600',
  'Fashion': 'from-pink-600 via-fuchsia-500 to-purple-600',
  'Entertainment': 'from-purple-600 via-indigo-500 to-violet-600',
  'Cafe': 'from-amber-700 via-orange-600 to-yellow-600',
  'Hotels': 'from-sky-600 via-blue-500 to-cyan-600',
  'Health & Beauty': 'from-emerald-600 via-teal-500 to-green-600',
  'Electronics': 'from-blue-600 via-indigo-500 to-sky-600',
  'Fitness': 'from-lime-600 via-green-500 to-emerald-600',
  'Supermarket': 'from-green-600 via-emerald-500 to-teal-600',
};

export default function BusinessHero({ business }: BusinessHeroProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const gradient = categoryGradients[business.category] || 'from-gray-700 via-gray-600 to-gray-800';
  const description = (isHe ? business.descriptionHe : business.description) || '';

  const images = business.heroImages?.length ? business.heroImages : (business.heroImageUrl ? [business.heroImageUrl] : []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  return (
    <section className="relative w-full h-[550px] overflow-hidden">
      {/* Background gradient fallback */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Hero background carousel */}
      {images.length > 0 && (
        <div className="absolute inset-0">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: i === currentSlide ? 1 : 0 }}
            />
          ))}
        </div>
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Top spacer — back/share handled by TopBar + ActionBar */}
      <div className="h-16" />

      {/* Brand info */}
      <div className="absolute bottom-16 left-0 right-0 z-10 px-6 text-center text-white">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 overflow-hidden">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className={business.id === 'biz_007' ? 'w-full h-full object-cover' : 'w-14 h-14 object-contain'}
              />
            ) : (
              <span className="text-4xl">{business.logo}</span>
            )}
          </div>
        </div>

        {/* Name */}
        <h1 className="text-4xl font-bold mb-0.5">
          {isHe ? business.nameHe : business.name}
        </h1>

        {/* Category */}
        <p className="text-sm font-medium opacity-90 mb-1.5">
          {isHe ? business.categoryHe : business.category}
        </p>

        {/* Description — below name+category, 2 lines max */}
        {description && (
          <p className="text-[13px] leading-relaxed opacity-75 max-w-[280px] mx-auto mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Badges — uniform height with min-height and consistent padding */}
        <div className="flex items-center justify-center gap-2.5">
          {/* Store type */}
          <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-md px-3 rounded-full" style={{ height: 32, minHeight: 32 }}>
            <span className="material-symbols-outlined text-green-300 me-1.5" style={{ fontSize: 14 }}>
              storefront
            </span>
            <span className="text-[11px] font-semibold whitespace-nowrap">{t.business.onlineAndInStore}</span>
          </div>

          {/* Rating */}
          <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-md px-3 rounded-full" style={{ height: 32, minHeight: 32 }}>
            <span className="text-amber-300 me-1" style={{ fontSize: 14 }}>★</span>
            <span className="text-[11px] font-semibold whitespace-nowrap">
              {business.rating}
              <span className="opacity-60 font-normal ms-1">
                ({business.reviewCount >= 1000
                  ? `${(business.reviewCount / 1000).toFixed(1)}k`
                  : business.reviewCount})
              </span>
            </span>
          </div>
        </div>

        {/* Carousel dots */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
