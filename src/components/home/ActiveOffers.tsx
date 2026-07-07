import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import Skeleton from '../ui/Skeleton';
import SectionError from '../ui/SectionError';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';

/**
 * "Especially for you" — the personalised recommendations, presented as the
 * video category-row card. Verified users with a completed profile see their
 * real picks; everyone else gets the SAME card with the product images
 * glass-blurred and a CTA inviting them to personalise (a locked teaser).
 */
export default function ActiveOffers() {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const { recommendations, isLoading, isError, refetch } = useRecommendations({ maxResults: 8 });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);

  // Start a preferences-completion flow and navigate to the motivation slide.
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

  // Unverified / incomplete profile → identical card, but blurred + a CTA.
  const showTeaser = !isAuthenticated || !profileCompleted;

  const items: CategoryRowItem[] = recommendations
    .filter((s) => s.voucher.imageUrl)
    .map((scored) => {
      const v = scored.voucher;
      return {
        id: v.id,
        name: v.title,
        nameHe: v.titleHe,
        image: v.imageUrl as string,
        price: v.discountedPrice,
        currency: '₪',
        onClick: showTeaser ? handlePersonalizeNavigate : () => navigate(`/${lang}/store`),
      };
    });

  return (
    <div className="mb-6">
      <CategoryRowStore
        title="Especially for you"
        titleHe="במיוחד בשבילך"
        items={items}
        accentColor="#1c1c1c"
        bgVideo="/for-you-category.mp4"
        titleInMedia
        mediaPosition="bottom"
        aspectRatio="2 / 3"
        blurItems={showTeaser}
        cta={
          showTeaser
            ? {
                label: isHe
                  ? 'נגלה ביחד אלו הצעות הכי מתאימות לך'
                  : "Let's find which offers suit you best",
                onClick: handlePersonalizeNavigate,
              }
            : undefined
        }
        onSeeAll={showTeaser ? handlePersonalizeNavigate : () => navigate(`/${lang}/store`)}
      />
    </div>
  );
}
