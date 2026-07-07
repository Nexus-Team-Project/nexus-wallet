/**
 * AddToHomeScreenCard — the "add to home screen" promo card shown at the top
 * of the home feed (home page + store front door). The avatar logo is passed
 * in by the caller so each surface can show the right brand:
 *   - Nexus catalog / anonymous → the Nexus logo.
 *   - A tenant context           → that tenant's logo, with a small Nexus
 *                                  badge overlay (showNexusBadge).
 *
 * Extracted from HomePage so the store page can render the identical card
 * without duplicating its markup.
 */
import { useLanguage } from '../../i18n/LanguageContext';

interface AddToHomeScreenCardProps {
  /** Logo URL shown in the card's app-icon tile. */
  logoSrc: string;
  /** Display name interpolated into the subtitle ("add {app} to…"). */
  appName: string;
  /** Show the small Nexus badge over the icon (only in a tenant context). */
  showNexusBadge: boolean;
  /** Dismiss handler — hides the card and persists the dismissal. */
  onDismiss: () => void;
}

/**
 * Render the add-to-home-screen card.
 * @param logoSrc icon logo URL.
 * @param appName name used in the subtitle copy.
 * @param showNexusBadge whether to overlay the Nexus badge (tenant context).
 * @param onDismiss called when the user closes / cancels the card.
 * @returns the card element.
 */
export default function AddToHomeScreenCard({
  logoSrc,
  appName,
  showNexusBadge,
  onDismiss,
}: AddToHomeScreenCardProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-5 mt-3 mb-1 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
        aria-label="Close"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
      </button>

      <div className="flex items-start gap-4 mb-6">
        {/* App icon with decorative glow */}
        <div className="relative flex-shrink-0">
          <div className="absolute -top-3 -left-3 w-16 h-16 bg-purple-500/20 rounded-full blur-xl" />
          <div className="absolute top-1 left-0 w-12 h-12 bg-indigo-500/15 rounded-full blur-lg" />
          <div className="relative w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/60 overflow-hidden flex items-center justify-center -rotate-[10deg]">
            <img
              src={logoSrc}
              alt={appName}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className = 'text-2xl font-bold text-primary';
                  fallback.textContent = 'N';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          {/* Nexus badge overlay — shown when a tenant logo is displayed */}
          {showNexusBadge && (
            <div className="absolute -bottom-1 -start-1.5 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center z-10">
              <img src="/nexus-logo.png" alt="Nexus" className="w-4 h-4 object-contain rounded-full" />
            </div>
          )}
        </div>
        {/* Text */}
        <div className="flex-1 pe-6">
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
            {t.home.addToHomeScreen}
          </h2>
          <p className="text-[15px] text-gray-500 leading-snug">
            {t.home.addToHomeScreenSubtitle.replace('{app}', appName)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onDismiss}
          className="flex-1 py-3.5 bg-[#e5e7eb] text-slate-900 font-semibold rounded-full text-base active:scale-95 transition-transform"
        >
          {t.home.addToHomeScreenCancel}
        </button>
        <button className="flex-1 py-3.5 bg-[#0a0a0b] text-white font-semibold rounded-full text-base active:scale-95 transition-transform">
          {t.home.addToHomeScreenCta}
        </button>
      </div>
    </div>
  );
}
