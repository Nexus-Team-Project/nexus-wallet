/**
 * HomeFeed — the shared showcase feed rendered on both the home page and the
 * store front door: Nexus picks, hero banner, brand slider, top stores,
 * personalized offers, the category sliders, referral + tenant offers,
 * near-you, and the card-issuance banner.
 *
 * Extracted so the store page can present the identical experience without
 * duplicating the section list (and so changes stay in sync across both).
 * The slider rows call `onSelectFilter` — the home page navigates to the
 * store with that filter, while the store page applies it in place.
 */
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import DevPlaygroundSheet from '../dev/DevPlaygroundSheet';
import NexusPicksRow from './NexusPicksRow';
import HeroBanner from './HeroBanner';
import BrandSlider from './BrandSlider';
import TopStores from './TopStores';
import ActiveOffers from './ActiveOffers';
import ReferralBanner from './ReferralBanner';
import TenantOffers from './TenantOffers';
import NearYou from './NearYou';
import CardIssuanceBanner from './CardIssuanceBanner';
import {
  PopularSlider,
  RecommendedSlider,
  NewSlider,
  OnlineSlider,
  ComingSoonSlider,
} from '../store/StoreSliders';
import type { StoreFilter } from '../../types/voucher.types';

interface HomeFeedProps {
  /** Invoked when a slider's "see all" / filter chip is chosen. */
  onSelectFilter: (filter: StoreFilter) => void;
}

/**
 * Render the home showcase feed.
 * @param onSelectFilter handler for slider filter selections.
 * @returns the ordered set of home sections.
 */
export default function HomeFeed({ onSelectFilter }: HomeFeedProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);

  // "במיוחד בשבילך" (ActiveOffers) position:
  //   hasProfile  → right after TopStores (real personalized recommendations)
  //   !hasProfile → after PopularSlider  (shows teaser card only)
  const hasProfile = isAuthenticated && profileCompleted;

  const [showDevSheet, setShowDevSheet] = useState(false);

  return (
    <>
      {/* ההמלצות של Nexus עבורך — synced with last chat-sheet picks */}
      <NexusPicksRow />

      <HeroBanner />
      <BrandSlider />

      {/* הזמנות חוזרות */}
      <TopStores />

      {/* במיוחד בשבילך — 2nd when questionnaire is filled */}
      {hasProfile && <ActiveOffers />}

      {/* הכי פופולרים */}
      <PopularSlider onSelectFilter={onSelectFilter} />

      {/* במיוחד בשבילך — 3rd (teaser) when questionnaire is not yet filled */}
      {!hasProfile && <ActiveOffers />}

      <ReferralBanner />

      {/* הטבות הטננט */}
      <TenantOffers />

      {/* קרוב אליך */}
      <NearYou />

      {/* באנר כרטיס אשראי — מעל הסליידרים */}
      <CardIssuanceBanner />

      {/* מומלץ */}
      <RecommendedSlider onSelectFilter={onSelectFilter} />

      {/* חדש */}
      <NewSlider onSelectFilter={onSelectFilter} />

      {/* הטבות אונליין */}
      <OnlineSlider onSelectFilter={onSelectFilter} />

      {/* בקרוב */}
      <ComingSoonSlider onSelectFilter={onSelectFilter} />

      {/* DEV PLAYGROUND — auth-flow + live-notification test panels. Dev-only:
          `import.meta.env.DEV` is true under `npm run dev` and compiled to
          false in production builds, so this is stripped from shipped bundles.
          Lives in the shared feed so it shows on both home and store. */}
      {import.meta.env.DEV && (
        <>
          <div className="px-6 py-4">
            <button
              onClick={() => setShowDevSheet(true)}
              className="w-full py-3 rounded-2xl bg-warning/10 text-warning text-xs font-semibold border border-warning/20 active:scale-[0.98] transition-all"
            >
              🧪 Dev Playground
            </button>
          </div>
          {showDevSheet && <DevPlaygroundSheet onClose={() => setShowDevSheet(false)} />}
        </>
      )}
    </>
  );
}
