import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNearbyDeals } from '../../hooks/useNearbyDeals';
import Skeleton from '../ui/Skeleton';
import SectionError from '../ui/SectionError';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';

// ── Location-denied bottom sheet ──────────────────────────────────────────────

function LocationDeniedSheet({
  isOpen,
  onClose,
  onRetry,
  isHe,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  isHe: boolean;
  t: any;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose} />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-2xl shadow-xl px-6 pt-5 pb-8 animate-slide-up"
        style={{ maxHeight: '70vh' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '28px' }}>
            location_off
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-center mb-2">{t.home.nearYouDeniedTitle}</h3>

        {/* Body */}
        <p className="text-sm text-text-secondary text-center leading-relaxed mb-4">
          {t.home.nearYouDeniedBody}
        </p>

        {/* How-to box */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-start gap-2">
          <span className="material-symbols-outlined text-gray-400 mt-0.5" style={{ fontSize: '18px' }}>
            info
          </span>
          <p className="text-xs text-text-muted leading-relaxed" dir={isHe ? 'rtl' : 'ltr'}>
            {t.home.nearYouDeniedHowTo}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            {t.home.nearYouDeniedRetry}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-text-secondary text-sm font-medium active:scale-[0.98] transition-transform"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

/**
 * NearYou ("קרוב אליך") — presented as the big CategoryRowStore card with a
 * first-person street-walk video behind the nearby deals (matching the other
 * home categories). Until the user shares their location it shows the same card
 * with a blurred teaser row + a "share location" CTA.
 */
export default function NearYou() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const { deals, isLoading, isError, refetch, permission, requestLocation } = useNearbyDeals(8);
  const [showDeniedSheet, setShowDeniedSheet] = useState(false);
  const prevPermission = useRef(permission);

  // Show denied sheet only when permission *transitions* to denied.
  useEffect(() => {
    if (permission === 'denied' && prevPermission.current !== 'denied') {
      setShowDeniedSheet(true);
    }
    prevPermission.current = permission;
  }, [permission]);

  // Loading state
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

  // Error state
  if (isError) {
    return <SectionError section="NearYou" onRetry={refetch} />;
  }

  // If unavailable (no geolocation support), hide entirely
  if (permission === 'unavailable') {
    return null;
  }

  const showTeaser = permission === 'prompt' || permission === 'denied';

  const items: CategoryRowItem[] = deals.map((deal) => ({
    id: deal.voucher.id,
    name: deal.voucher.title,
    nameHe: deal.voucher.titleHe,
    image: deal.voucher.imageUrl,
    emoji: deal.voucher.imageUrl ? undefined : deal.voucher.image,
    price: deal.voucher.discountedPrice,
    currency: '₪',
    onClick: () => navigate(`/${lang}/store`),
  }));

  return (
    <div className="mb-6">
      <CategoryRowStore
        title={t.home.nearYouTitle}
        titleHe={t.home.nearYouTitle}
        items={items}
        accentColor="#1c1c1c"
        bgVideo="/near-you-category.mp4"
        bgVideoRate={2}
        titleInMedia
        topTitle={t.home.nearYouTitle}
        mediaPosition="center"
        aspectRatio="2 / 3"
        blurItems={showTeaser}
        cta={showTeaser ? { label: t.home.nearYouShareLocation, onClick: requestLocation } : undefined}
        onSeeAll={() => navigate(`/${lang}/near-you-map`)}
      />
      <LocationDeniedSheet
        isOpen={showDeniedSheet}
        onClose={() => setShowDeniedSheet(false)}
        onRetry={requestLocation}
        isHe={isHe}
        t={t}
      />
    </div>
  );
}
