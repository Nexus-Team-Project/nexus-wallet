/**
 * Full-viewport Nexus-branded splash shown while the auth bootstrap
 * (refresh-cookie -> /api/me) is in flight. Renders BEFORE any page
 * chrome or content so the user never sees a half-loaded TopBar with
 * a small spinner in the middle of an empty column. Used by AppLayout
 * as a short-circuit during authLoading.
 *
 * Visual cues borrowed from the stories palette so the splash feels
 * like part of the wallet brand: white background, a soft warm gradient
 * wash, big centered Nexus logo with a subtle pulse, and a thin
 * spinning ring under the logo. No router or auth coupling - pure
 * presentational, caller decides when to show.
 */
import { useLanguage } from '../../i18n/LanguageContext';

interface WalletLoadingScreenProps {
  /** Optional override; defaults to a bilingual "Loading..." string. */
  label?: string;
}

export default function WalletLoadingScreen({ label }: WalletLoadingScreenProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const text = label ?? (isHe ? 'טוען...' : 'Loading...');

  return (
    <div
      // Fixed full-viewport overlay so no page chrome leaks through
      // while we wait for auth. z-[200] sits above TopBar (z-50) and
      // any mobile sidebar (z-[90]) per the wallet's z-index ladder.
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,183,77,0.08) 0%, rgba(255,145,184,0.08) 50%, rgba(156,136,255,0.08) 100%), #ffffff',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Pulse halo behind the logo - soft warm radial that breathes
          in sync with the logo's pulse, drawn from the same palette
          the stories page uses for its gradient backdrop. */}
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className="absolute h-44 w-44 rounded-full opacity-50 blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,145,184,0.35) 0%, rgba(255,183,77,0.2) 60%, transparent 80%)',
          }}
          aria-hidden="true"
        />
        <img
          src="/nexus-logo.png"
          alt="Nexus"
          className="relative h-28 w-28 object-contain animate-pulse drop-shadow-lg sm:h-32 sm:w-32"
        />
      </div>

      {/* Spinner ring - slate-coded to match the router page CTAs. */}
      <div
        className="mb-4 h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin"
        aria-hidden="true"
      />

      <p className="text-sm font-medium text-slate-600 sm:text-base">{text}</p>
    </div>
  );
}
