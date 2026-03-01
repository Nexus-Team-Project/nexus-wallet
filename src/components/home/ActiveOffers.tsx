import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import Skeleton from '../ui/Skeleton';
import SectionError from '../ui/SectionError';
import type { ScoredVoucher } from '../../types/recommendation.types';

// ── Pastel backgrounds per category ──

const categoryColors: Record<string, string> = {
  food: 'bg-orange-50',
  shopping: 'bg-pink-50',
  entertainment: 'bg-purple-50',
  tech: 'bg-blue-50',
  travel: 'bg-sky-50',
  health: 'bg-emerald-50',
  education: 'bg-amber-50',
};

const categoryGradients: Record<string, string> = {
  food: 'from-orange-400 to-orange-600',
  shopping: 'from-pink-400 to-pink-600',
  entertainment: 'from-purple-400 to-purple-600',
  tech: 'from-blue-400 to-blue-600',
  travel: 'from-sky-400 to-sky-600',
  health: 'from-emerald-400 to-emerald-600',
  education: 'from-amber-400 to-amber-600',
};

const categorySlides: Record<string, string[]> = {
  food: ['🍔', '🍟', '🥤'],
  shopping: ['👕', '👗', '👜'],
  entertainment: ['🎬', '🍿', '🎭'],
  tech: ['💻', '📱', '🎧'],
  travel: ['🏨', '🏖️', '🌅'],
  health: ['💊', '💄', '🧴'],
  education: ['📚', '🎓', '📖'],
};

const categoryLabels: Record<string, { en: string; he: string }> = {
  food: { en: 'Food', he: 'אוכל' },
  shopping: { en: 'Shopping', he: 'קניות' },
  entertainment: { en: 'Entertainment', he: 'בידור' },
  tech: { en: 'Tech', he: 'טכנולוגיה' },
  travel: { en: 'Travel', he: 'טיולים' },
  health: { en: 'Health', he: 'בריאות' },
  education: { en: 'Education', he: 'לימודים' },
};

// ── Offer Card — mirrors NearYouCard structure exactly ──

function OfferCard({
  scored,
  isHe,
  onNavigate,
}: {
  scored: ScoredVoucher;
  isHe: boolean;
  onNavigate: () => void;
}) {
  const v = scored.voucher;
  const slides = categorySlides[v.category] || ['🎁', '🎉', '⭐'];
  const catLabel = categoryLabels[v.category] || { en: v.category, he: v.category };

  const [slideIndex, setSlideIndex] = useState(0);
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setSlideIndex((prev) =>
        diff > 0 ? (prev + 1) % slides.length : (prev - 1 + slides.length) % slides.length,
      );
    }
  };

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150">
      {/* Pastel image area with swipeable emoji — same structure as NearYouCard */}
      <div
        className={`relative overflow-hidden ${categoryColors[v.category] || 'bg-surface'}`}
        style={{ height: '20vh' }}
        onClick={onNavigate}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Emoji slide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl transition-all duration-300">{slides[slideIndex]}</span>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === slideIndex ? 'bg-gray-800' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Logo badge — top-right (identical to NearYouCard) */}
        <div className="absolute top-2.5 right-2.5 z-10 w-14 h-14 rounded-full bg-white shadow-md border border-border/40 flex items-center justify-center">
          <span className="text-2xl">{v.merchantLogo}</span>
        </div>

        {/* Recommendation reason badge — top-left, styled like distance badge */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-[10px] font-bold text-primary">
            {isHe ? scored.reasonHe : scored.reason}
          </span>
        </div>
      </div>

      {/* Bottom info — identical to NearYouCard */}
      <button
        onClick={onNavigate}
        className="w-full px-3 py-4 flex items-center justify-between"
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">
            {isHe ? v.titleHe : v.title}
          </span>
          <span className="text-[10px] text-text-muted">{v.merchantName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
            {isHe ? catLabel.he : catLabel.en}
          </span>
          {v.discountPercent > 0 && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
              {v.discountPercent}%−
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Personalization Teaser Card — mirrors LocationTeaserCard pattern ──

function PersonalizationTeaserCard({
  isHe,
  firstName,
  onCta,
}: {
  isHe: boolean;
  firstName: string | null;
  onCta: () => void;
}) {
  const greeting = firstName ? `${firstName}, ` : '';

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start flex flex-col">
      {/* Visual header — same layout as LocationTeaserCard */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '20vh',
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
        }}
      >
        {/* Light overlay — same as LocationTeaserCard's bg-white/40 */}
        <div className="absolute inset-0 bg-white/20" />

        {/* Centered sparkle icon — mirrors the location_on pin */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: '28px' }}
        >
          <span
            className="material-symbols-outlined text-primary drop-shadow-md"
            style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>

        {/* Bottom text bar — same bg-black/50 pattern as LocationTeaserCard */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-2 px-3">
          <p className="text-white text-[11px] text-center leading-relaxed">
            {isHe
              ? `${greeting}נגלה יחד מה הכי מתאים לך`
              : `${greeting}let's find what suits you best`}
          </p>
        </div>
      </div>

      {/* CTA area — identical to LocationTeaserCard bottom */}
      <div className="px-3 py-3 flex items-center justify-center">
        <button
          onClick={onCta}
          className="px-5 py-2 rounded-full bg-primary text-white text-xs font-semibold active:scale-[0.97] transition-transform flex items-center gap-1.5"
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '14px' }}
          >
            tune
          </span>
          {isHe ? 'התאמה אישית' : 'Personalize'}
        </button>
      </div>
    </div>
  );
}

// ── Arrow Bubble — identical to NearYou ──

function MoreBubble({ onNavigate }: { onNavigate: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) setVisible(true);
        else if (!entry.isIntersecting && visible) setVisible(false);
      },
      { threshold: 0.3 },
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
        <span className="material-symbols-outlined text-sky-600" style={{ fontSize: '20px' }}>
          chevron_left
        </span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

export default function ActiveOffers() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const { recommendations, isLoading, isError, refetch } = useRecommendations({ maxResults: 8 });
  const firstName = useAuthStore((s) => s.firstName);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);

  // Must call startRegistration() first so RegistrationGuard allows the route.
  const handlePersonalizeNavigate = () => {
    startRegistration({ path: 'preferences-completion', phone: '', missingFields: [] });
    navigate(`/${lang}/register/onboarding/motivation`);
  };

  if (isLoading) {
    return (
      <section className="mb-6">
        <Skeleton className="h-5 w-36 mx-5 mb-3" />
        <div className="flex gap-3 px-5 overflow-hidden">
          <Skeleton className="h-[200px] w-[300px] rounded-lg shrink-0" variant="rectangular" />
          <Skeleton className="h-[200px] w-[300px] rounded-lg shrink-0" variant="rectangular" />
        </div>
      </section>
    );
  }

  if (isError) {
    return <SectionError section="ActiveOffers" onRetry={refetch} />;
  }

  const hasRecommendations = recommendations.length > 0;
  const topCategory = recommendations[0]?.voucher.category || 'food';
  const topCategoryLabel = categoryLabels[topCategory] || { en: 'Deals', he: 'מבצעים' };
  const gradient = categoryGradients[topCategory] || 'from-primary to-primary-dark';

  return (
    <section className="mb-6">
      {/* Header — matches NearYou pattern exactly */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold">{t.home.especiallyForYou}</h3>
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
        >
          {isHe ? 'עוד' : 'More'}
        </button>
      </div>

      {/* Single unified scroll row — same architecture as NearYou */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">

        {/* Category gradient label — only when recommendations exist (mirrors hasDeals in NearYou) */}
        {hasRecommendations && (
          <div
            className={`flex-none w-[120px] rounded-lg bg-gradient-to-b ${gradient} flex items-center justify-center`}
          >
            <span
              className="text-white text-sm font-bold whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {isHe ? topCategoryLabel.he : topCategoryLabel.en}
            </span>
          </div>
        )}

        {/* Personalization teaser — shown when no recommendations (mirrors LocationTeaserCard) */}
        {!hasRecommendations && (
          <PersonalizationTeaserCard
            isHe={isHe}
            firstName={firstName}
            onCta={handlePersonalizeNavigate}
          />
        )}

        {/* Recommendation cards */}
        {recommendations.map((scored) => (
          <OfferCard
            key={scored.voucher.id}
            scored={scored}
            isHe={isHe}
            onNavigate={() => navigate(`/${lang}/store`)}
          />
        ))}

        {/* Arrow bubble — only when there are cards (mirrors NearYou's hasDeals guard) */}
        {hasRecommendations && <MoreBubble onNavigate={() => navigate(`/${lang}/store`)} />}
      </div>
    </section>
  );
}
