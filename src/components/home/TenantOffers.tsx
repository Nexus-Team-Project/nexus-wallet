import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';

// Benefit icons cycling through a set (used when a benefit has no image).
const BENEFIT_ICONS = ['⭐', '🎁', '💳', '🎫', '🏆', '🎉', '🛍️', '🎊'];

const DEFAULT_BENEFITS_HE = [
  'הנחות בלעדיות לחברים',
  'מתנות ופרסים מיוחדים',
  'יתרונות מיוחדים לחברים',
];
const DEFAULT_BENEFITS_EN = [
  'Exclusive member discounts',
  'Special gifts and prizes',
  'Special member perks',
];

/**
 * TenantOffers ("הטבות הטננט") — the tenant's member benefits, presented as the
 * big CategoryRowStore card (same structure as the other home sections). The
 * title, the animated gradient background and the benefit list all derive from
 * the active tenant config, so the whole section is dynamic per tenant.
 */
export default function TenantOffers() {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const config = useTenantStore((s) => s.config);
  const isHe = language === 'he';

  // Only render when there is an active tenant affiliation
  if (!config) return null;

  const tenantName = isHe ? config.nameHe : config.name;

  const benefits = isHe
    ? (config.membershipBenefitsHe?.length ? config.membershipBenefitsHe : DEFAULT_BENEFITS_HE)
    : (config.membershipBenefits?.length ? config.membershipBenefits : DEFAULT_BENEFITS_EN);

  const items: CategoryRowItem[] = benefits.map((label, idx) => ({
    id: `benefit-${idx}`,
    name: label,
    nameHe: label,
    emoji: BENEFIT_ICONS[idx % BENEFIT_ICONS.length],
    onClick: () => navigate(`/${lang}/store`),
  }));

  // Animated gradient built from the tenant's brand colour → dynamic per tenant.
  const c = config.primaryColor;
  const bgGradient = `linear-gradient(135deg, ${c} 0%, ${c}cc 28%, #1c1c1c 64%, ${c} 100%)`;

  return (
    <div className="mb-6">
      <CategoryRowStore
        title={isHe ? `הטבות ${tenantName}` : `${tenantName} Benefits`}
        titleHe={isHe ? `הטבות ${tenantName}` : `${tenantName} Benefits`}
        items={items}
        accentColor={c}
        bgGradient={bgGradient}
        aspectRatio="2 / 3"
        onSeeAll={() => navigate(`/${lang}/store`)}
      />
    </div>
  );
}
