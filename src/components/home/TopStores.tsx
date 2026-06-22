import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import CategoryRowStore, { type CategoryRowItem } from '../category/CategoryRowStore';

/**
 * TopStores ("הזמנות חוזרות") — presented as the big CategoryRowStore card (the
 * same structure as "Especially for you"): a tall card with an animated
 * gradient background, the title, and a horizontal row of store tiles inside.
 */
export default function TopStores() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Hide section if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Top stores by rating
  const topStores = [...mockBusinesses]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const items: CategoryRowItem[] = topStores
    .map((b) => ({
      id: b.id,
      name: b.name,
      nameHe: b.nameHe,
      image:
        b.products?.find((p) => p.image)?.image ??
        b.heroImageUrl ??
        b.heroImages?.[0] ??
        '',
      onClick: () => navigate(`/${lang}/business/${b.id}`),
    }))
    .filter((it) => it.image);

  return (
    <div className="mb-6">
      <CategoryRowStore
        title={t.home.reorder}
        titleHe={t.home.reorder}
        items={items}
        accentColor="#1c1c1c"
        bgVideo="/reorder-category-v2.mp4"
        titleInMedia
        topTitle={t.home.reorder}
        mediaPosition="center"
        aspectRatio="2 / 3"
        onSeeAll={() => navigate(`/${lang}/store`)}
      />
    </div>
  );
}
