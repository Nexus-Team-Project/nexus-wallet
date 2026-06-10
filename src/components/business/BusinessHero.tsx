import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';
import BusinessMenuSheet from './BusinessMenuSheet';
import BusinessContactSheet from './BusinessContactSheet';
import AnimatedNavIcon from '../layout/AnimatedNavIcon';
import navSearchUrl from '../../assets/animations/nav-search.json?url';
import navSearchBoldUrl from '../../assets/animations/nav-search-bold.json?url';

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
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const [following, setFollowing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
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
    <section className="relative w-full h-[460px] overflow-hidden">
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

      {/* Action buttons overlaid on the LOWER part of the hero image —
          Rhode/Pura style. The global top strip (TopBar) is kept; these
          sit on the bottom of the image. */}
      <header className="absolute bottom-10 inset-x-0 z-30 flex items-center justify-start px-4">
        {/* End-side actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFollowing((f) => !f)}
            className={`h-10 px-5 inline-flex items-center rounded-lg text-sm font-semibold active:scale-95 transition-all ${
              following ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-md text-white'
            }`}
          >
            {following ? (isHe ? 'עוקב' : 'Following') : (isHe ? 'עקוב' : 'Follow')}
          </button>
          <button
            onClick={() => navigate(`/${language}/search?store=${business.id}`)}
            className="h-10 w-10 inline-flex items-center justify-center bg-white/20 backdrop-blur-md rounded-lg active:scale-95 transition-transform"
            aria-label="Search"
          >
            {/* Same wired nav-search Lottie as the bottom-bar pill, forced
                white (the icon's native ink is dark) so it reads on the dark
                hero overlay. */}
            <span className="leading-none" style={{ filter: 'brightness(0) invert(1)' }}>
              <AnimatedNavIcon src={navSearchUrl} boldSrc={navSearchBoldUrl} active size={22} />
            </span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="h-10 w-10 inline-flex items-center justify-center bg-white/20 backdrop-blur-md rounded-lg active:scale-95 transition-transform"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: 22 }}>more_vert</span>
          </button>
        </div>
      </header>

      {/* Brand info */}
      <div className="absolute bottom-28 left-0 right-0 z-10 px-6 text-center text-white">
        {/* Logo — full-width brand mark (includes the brand name), no
            background plate. The name is intentionally NOT re-printed
            below since the logo already carries it. */}
        <div className="flex justify-center mb-4">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-24 w-auto max-w-[70%] object-contain"
            />
          ) : (
            <h1 className="text-4xl font-bold text-white">
              {isHe ? business.nameHe : business.name}
            </h1>
          )}
        </div>

        {/* Description — below name, 2 lines max */}
        {description && (
          <p className="text-[13px] leading-relaxed opacity-75 max-w-[280px] mx-auto mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Rating — plain inline text, no badge plate */}
        <div className="flex items-center justify-center gap-1.5 text-white">
          <span className="text-white text-[15px]">★</span>
          <span className="text-[15px] font-bold">{business.rating}</span>
          <span className="text-[15px] font-medium opacity-90">
            ({business.reviewCount.toLocaleString()})
          </span>
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

      {/* Three-dots action menu — slides up from the bottom */}
      <BusinessMenuSheet
        business={business}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onContact={() => setContactOpen(true)}
      />

      {/* Contact-options sheet — raised after "Contact" is tapped */}
      <BusinessContactSheet
        business={business}
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </section>
  );
}
