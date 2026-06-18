import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTenantStore } from '../stores/tenantStore';
import { mockBusinesses } from '../mock/data/businesses.mock';
import BusinessHero from '../components/business/BusinessHero';
import BusinessCardContent from '../components/business/BusinessCardContent';
import ClubInfoSection from '../components/business/ClubInfoSection';
import type { Business } from '../types/search.types';

// Lifestyle covers for the club hero carousel (no per-tenant cover asset yet).
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80',
  'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=900&q=80',
];

// Headline club stats (no per-tenant figures yet). `cashback` is the total
// amount (₪) accumulated so far — it animates / ticks up in the UI.
const CLUB_STATS = { members: 12450, cashback: 248320, rating: 4.8 };

// Club social links (no per-tenant links yet).
const CLUB_LINKS = {
  website: 'https://example.com',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
};

// "About us" copy (no per-tenant text yet).
const CLUB_ABOUT =
  'Our members club brings together leading partner brands under one roof. ' +
  'Join to unlock exclusive cashback, members-only benefits, and early access ' +
  'to the best deals across food, fashion, travel, and more.\n\n' +
  'Every purchase you make earns you cashback that goes straight back into your ' +
  'wallet — the more you shop with our partners, the more you save.';
const CLUB_ABOUT_HE =
  'מועדון החברים שלנו מאגד יחד מותגי שותפים מובילים תחת קורת גג אחת. ' +
  'הצטרפו כדי לפתוח קאשבק בלעדי, הטבות לחברי מועדון בלבד וגישה מוקדמת ' +
  'למבצעים הטובים ביותר — אוכל, אופנה, נסיעות ועוד.\n\n' +
  'כל רכישה שתבצעו מזכה אתכם בקאשבק שחוזר ישירות לארנק שלכם — ' +
  'ככל שתקנו יותר אצל השותפים שלנו, כך תחסכו יותר.';

/**
 * TenantPage ("מועדון <tenant>") — the tenant club page. As a first version it
 * reuses the business-page design (BusinessHero + BusinessCardContent) fed with
 * a synthetic "business" built from the active tenant config: the club brand,
 * a lifestyle hero, and its partner businesses' products as the club's offers.
 */
export default function TenantPage() {
  const { lang = 'he' } = useParams();
  const config = useTenantStore((s) => s.config);

  const business = useMemo<Business | null>(() => {
    if (!config) return null;
    // The club's "offers" = a sample product from each partner business.
    const products = mockBusinesses
      .flatMap((b) => (b.products ?? []).filter((p) => p.image).slice(0, 1))
      .slice(0, 12);
    return {
      id: `club-${config.id}`,
      name: config.name,
      nameHe: config.nameHe,
      category: 'Members Club',
      categoryHe: 'מועדון חברים',
      logo: '🏢',
      rating: 4.8,
      reviewCount: 1240,
      location: 'Nationwide',
      locationHe: 'ארצי',
      hasVouchers: true,
      description:
        config.flowOverrides?.customWelcomeMessage ?? `Welcome to the ${config.name} members club.`,
      descriptionHe:
        config.flowOverrides?.customWelcomeMessageHe ?? `ברוכים הבאים למועדון ${config.nameHe}.`,
      logoUrl: config.logo,
      heroImages: HERO_IMAGES,
      products,
    };
  }, [config]);

  if (!config || !business) {
    return <Navigate to={`/${lang}`} replace />;
  }

  return (
    <div className="bg-white animate-fade-in">
      <BusinessHero business={business} club />

      {/* Main content with rounded top — same treatment as the business page. */}
      <div
        className="relative z-20 bg-white"
        style={{ marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
      >
        {/* Club header — stats, social links, and "about" all in the white section. */}
        <ClubInfoSection
          stats={CLUB_STATS}
          links={CLUB_LINKS}
          about={CLUB_ABOUT}
          aboutHe={CLUB_ABOUT_HE}
          clubName={lang === 'he' ? business.nameHe : business.name}
        />

        <BusinessCardContent business={business} club />
      </div>
    </div>
  );
}
