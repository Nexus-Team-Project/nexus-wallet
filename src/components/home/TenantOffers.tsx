import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';

/**
 * TenantOffers ("מועדון <tenant>") — the tenant's member club, presented as the
 * big CategoryRowStore card. The row shows the tenant's partner businesses (the
 * stores its members can use), with the tenant brand lockup in the corner. The
 * gradient derives from the tenant's brand colour, so the section is dynamic
 * per tenant.
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
  const clubTitle = isHe ? `מועדון ${tenantName}` : `${tenantName} Club`;

  // The tenant's partner businesses — prefer a product/atmosphere photo for the
  // tile, falling back to the brand emoji.
  const items: CategoryRowItem[] = mockBusinesses.map((biz) => {
    const image =
      biz.products?.find((p) => p.image)?.image ?? biz.heroImageUrl ?? biz.heroImages?.[0];
    return {
      id: biz.id,
      name: biz.name,
      nameHe: biz.nameHe,
      image,
      emoji: image ? undefined : biz.logo,
      onClick: () => navigate(`/${lang}/business/${biz.id}`),
    };
  });

  // Animated gradient built from the tenant's brand colour → dynamic per tenant.
  const c = config.primaryColor;
  const bgGradient = `linear-gradient(135deg, ${c} 0%, ${c}cc 28%, #1c1c1c 64%, ${c} 100%)`;

  return (
    <div className="mb-6">
      <CategoryRowStore
        title={clubTitle}
        titleHe={clubTitle}
        items={items}
        accentColor={c}
        bgVideo="/tenant-sky.mp4"
        bgGradient={bgGradient}
        titleInMedia
        topLogo={config.logo}
        topTitle={clubTitle}
        topBadge={{ label: isHe ? 'למד עוד' : 'Learn more', onClick: () => navigate(`/${lang}/club`) }}
        onTopClick={() => navigate(`/${lang}/club`)}
        aspectRatio="2 / 3"
        onSeeAll={() => navigate(`/${lang}/store`)}
      />
    </div>
  );
}
