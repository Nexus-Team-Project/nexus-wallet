/**
 * Centered Nexus-branded loading screen. Renders inside AppLayout's
 * main column whenever auth bootstrap is in flight. Replaces the bare
 * '...' placeholder that flashed before the splash or store loaded.
 *
 * Pure presentational: no auth state coupling, no router coupling.
 * The single source of truth for "should we show this" is the caller.
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
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
      {/* Animated logo - the existing nexus-logo.png is reused so we
          stay aligned with AnonymousSplash + LoginSheet branding. */}
      <div className="relative mb-6">
        <img
          src="/nexus-logo.png"
          alt="Nexus"
          className="w-16 h-16 object-contain animate-pulse"
        />
      </div>

      {/* Spinner ring */}
      <div
        className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin mb-4"
        aria-hidden="true"
      />

      <p className="text-sm text-text-muted font-medium">{text}</p>
    </div>
  );
}
