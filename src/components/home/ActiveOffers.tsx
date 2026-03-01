import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuthStore } from '../../stores/authStore';
import Skeleton from '../ui/Skeleton';
import SectionError from '../ui/SectionError';
import type { ScoredVoucher } from '../../types/recommendation.types';
import type { Voucher as _Voucher } from '../../types/voucher.types';

// ── Info Tooltip ──

function InfoTooltip({
  isHe: _isHe,
  text,
  ctaLabel,
  onCta,
  onClose,
}: {
  isHe: boolean;
  text: string;
  ctaLabel: string;
  onCta: () => void;
  onClose: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  return (
    <div
      ref={tooltipRef}
      className="absolute top-full mt-2 start-0 z-50 w-[calc(100vw-40px)] max-w-[340px] bg-white rounded-xl shadow-xl border border-border/60 p-4 animate-fade-in"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 end-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
      </button>

      {/* Sparkle icon + text */}
      <div className="flex gap-2 mb-3">
        <span className="text-xl shrink-0 mt-0.5">✨</span>
        <p className="text-xs text-text-secondary leading-relaxed pe-4">{text}</p>
      </div>

      {/* CTA */}
      <button
        onClick={onCta}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold active:scale-[0.97] transition-transform"
      >
        {ctaLabel}
      </button>
    </div>
  );
}

// ── Pastel backgrounds per voucher category ──
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

// Extra emojis per category to create multiple slides per card
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

// ── Swipeable Card ──

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
  const slideEmojis = categorySlides[v.category] || [v.image];
  const hasMultipleSlides = slideEmojis.length > 1;
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
    if (hasMultipleSlides && isSwiping.current && Math.abs(diff) > 20) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % slideEmojis.length);
      } else {
        setCurrent((prev) => (prev - 1 + slideEmojis.length) % slideEmojis.length);
      }
    } else if (!isSwiping.current) {
      onNavigate();
    }
  };

  const catLabel = categoryLabels[v.category] || { en: v.category, he: v.category };

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150">
      {/* Swipeable image area */}
      <div
        className={`relative overflow-hidden ${categoryColors[v.category] || 'bg-surface'}`}
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
          <span className="text-2xl">{v.merchantLogo}</span>
        </div>

        {/* Recommendation reason badge — top-left */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-[9px] font-semibold text-primary">
            {isHe ? scored.reasonHe : scored.reason}
          </span>
        </div>

        {/* Dot indicators */}
        {hasMultipleSlides && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1">
            {slideEmojis.map((_, idx) => (
              <span
                key={idx}
                className={`block rounded-full transition-all duration-300 ${
                  idx === current ? 'w-4 h-1.5 bg-gray-800' : 'w-1.5 h-1.5 bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom info */}
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

// ── Personalization Teaser Card ──

function PersonalizationTeaserCard({
  isHe,
  firstName,
  onCta,
}: {
  isHe: boolean;
  firstName: string | null;
  onCta: () => void;
}) {
  const greeting = firstName
    ? (isHe ? `${firstName}, ` : `${firstName}, `)
    : '';

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start flex flex-col">
      {/* Visual header */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '20vh',
          background: 'linear-gradient(135deg, #f3f0ff 0%, #ede9fe 50%, #ddd6fe 100%)',
        }}
      >
        {/* Sparkle ring decoration */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(124,58,237,0.12)',
            boxShadow: '0 0 0 12px rgba(124,58,237,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>

        {/* Bottom caption bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-primary/80 backdrop-blur-sm py-2 px-3">
          <p className="text-white text-[11px] text-center leading-relaxed">
            {isHe
              ? `${greeting}נגלה יחד מה הכי מתאים לך`
              : `${greeting}let's find what suits you best`}
          </p>
        </div>
      </div>

      {/* CTA area */}
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

// ── Arrow Bubble ──

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
  const preferencesIncomplete = useAuthStore((s) => s.preferencesIncomplete);
  const firstName = useAuthStore((s) => s.firstName);
  const [showInfo, setShowInfo] = useState(false);

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

  // Show personalization teaser when preferences haven't been filled yet
  if (preferencesIncomplete || recommendations.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 className="text-base font-bold">{t.home.especiallyForYou}</h3>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
          <PersonalizationTeaserCard
            isHe={isHe}
            firstName={firstName}
            onCta={() => navigate(`/${lang}/register/onboarding/motivation`)}
          />
        </div>
      </section>
    );
  }

  // Top category for the gradient label
  const topCategory = recommendations[0]?.voucher.category || 'food';
  const topCategoryLabel = categoryLabels[topCategory] || { en: 'Deals', he: 'מבצעים' };
  const gradient = categoryGradients[topCategory] || 'from-primary to-primary-dark';

  return (
    <section className="mb-6">
      <div className="relative flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold">{t.home.especiallyForYou}</h3>
          <button
            onClick={() => setShowInfo((p) => !p)}
            className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="text-[10px] font-bold text-gray-500 leading-none">i</span>
          </button>
        </div>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
        >
          {isHe ? 'עוד' : 'More'}
        </button>

        {/* Info tooltip */}
        {showInfo && (
          <InfoTooltip
            isHe={isHe}
            text={t.home.smartRecoInfo}
            ctaLabel={t.home.fillQuestionnaire}
            onCta={() => {
              setShowInfo(false);
              navigate(`/${lang}/register/preferences`);
            }}
            onClose={() => setShowInfo(false)}
          />
        )}
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {/* Category gradient label — narrow rectangle at start */}
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

        {/* Recommendation cards */}
        {recommendations.map((scored) => (
          <OfferCard
            key={scored.voucher.id}
            scored={scored}
            isHe={isHe}
            onNavigate={() => navigate(`/${lang}/store`)}
          />
        ))}

        {/* Arrow bubble at the end */}
        <MoreBubble onNavigate={() => navigate(`/${lang}/store`)} />
      </div>
    </section>
  );
}
