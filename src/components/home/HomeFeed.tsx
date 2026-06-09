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
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useAccessibilityStore } from '../../stores/accessibilityStore';
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
  const { t } = useLanguage();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);

  // "במיוחד בשבילך" (ActiveOffers) position:
  //   hasProfile  → right after TopStores (real personalized recommendations)
  //   !hasProfile → after PopularSlider  (shows teaser card only)
  const hasProfile = isAuthenticated && profileCompleted;

  // Accessibility widget is opt-in — prompt to add it until the user either
  // adds it or dismisses the card.
  const a11yEnabled = useAccessibilityStore((s) => s.enabled);
  const a11yCardDismissed = useAccessibilityStore((s) => s.cardDismissed);
  const enableA11y = useAccessibilityStore((s) => s.enableWidget);
  const dismissA11yCard = useAccessibilityStore((s) => s.dismissCard);
  const showA11yCard = !a11yEnabled && !a11yCardDismissed;

  const [showDevSheet, setShowDevSheet] = useState(false);

  return (
    <>
      {/* ══════ Add Accessibility Widget Card ══════ */}
      {showA11yCard && (
        <div className="mx-5 mt-3 mb-1 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
          {/* Close button */}
          <button
            onClick={dismissA11yCard}
            className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>

          <div className="flex items-start gap-4 mb-6">
            {/* Accessibility icon with decorative glow — echoes the FAB's teal/cyan */}
            <div className="relative flex-shrink-0">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-teal-500/20 rounded-full blur-xl" />
              <div className="absolute top-1 left-0 w-12 h-12 bg-cyan-500/15 rounded-full blur-lg" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#0d9488] to-[#00d4ff] shadow-sm flex items-center justify-center rotate-[10deg]">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '34px' }}>
                  accessibility_new
                </span>
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 pe-6">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {t.home.addAccessibility}
              </h2>
              <p className="text-[15px] text-gray-500 leading-snug">
                {t.home.addAccessibilitySubtitle}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={dismissA11yCard}
              className="flex-1 py-3.5 bg-[#e5e7eb] text-slate-900 font-semibold rounded-full text-base active:scale-95 transition-transform"
            >
              {t.home.addAccessibilityCancel}
            </button>
            <button
              onClick={enableA11y}
              className="flex-1 py-3.5 bg-[#0a0a0b] text-white font-semibold rounded-full text-base active:scale-95 transition-transform"
            >
              {t.home.addAccessibilityCta}
            </button>
          </div>
        </div>
      )}

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
