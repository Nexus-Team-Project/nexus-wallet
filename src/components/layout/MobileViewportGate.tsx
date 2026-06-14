/**
 * MobileViewportGate
 * -------------------------------------------------------------------------
 * The wallet is mobile-first and only meant to be used at phone widths. When
 * the viewport is too wide (>= 768px) this component renders a full-screen,
 * branded "open on your phone" overlay on top of the entire app, on every page.
 *
 * It is mounted ONCE at the app root (App.tsx) as a sibling overlay - not a
 * per-page wrapper and not part of AppLayout - so it can never be forgotten on
 * a new route and adds no size pressure to the layout shell.
 *
 * The app keeps rendering underneath the overlay, so when the user narrows the
 * window back below 768px the gate simply disappears with no remount and no
 * loss of in-progress state.
 *
 * Bilingual copy lives locally here on purpose: the gate is mounted outside the
 * `:lang` LanguageProvider, so it reads the language from the URL itself rather
 * than depending on router context.
 */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileGateArt from './MobileGateArt';
import { useViewportGate } from '../../hooks/useViewportGate';

/** Supported gate languages. */
type GateLang = 'he' | 'en';

/** Localized strings for the gate, keyed by language. */
const GATE_COPY: Record<GateLang, { heading: string; subtext: string }> = {
  he: {
    heading: 'פתחו את הארנק בנייד',
    subtext: 'חוויית הארנק בנויה למסך נייד. פתחו את הכתובת בטלפון כדי להמשיך.',
  },
  en: {
    heading: 'Open Nexus Wallet on your phone',
    subtext:
      'The wallet experience is built for mobile. Open the address on your phone to continue.',
  },
};

/** The address hint shown in both languages. */
const WALLET_HOST = 'wallet.nexus-payment.com';

/**
 * Read the active language from the URL first path segment (`/he/...` or
 * `/en/...`). Defaults to Hebrew, matching the app's `/` -> `/he` redirect.
 *
 * @returns `'he'` or `'en'`.
 */
function readLangFromPath(): GateLang {
  if (typeof window === 'undefined') return 'he';
  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  return segment === 'en' ? 'en' : 'he';
}

/**
 * Full-screen viewport gate overlay.
 *
 * @returns The overlay when the viewport is too wide, otherwise `null`.
 */
export default function MobileViewportGate() {
  const { blocked } = useViewportGate();

  // Lock background scroll while the gate is shown; always restore on cleanup.
  useEffect(() => {
    if (!blocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [blocked]);

  if (!blocked) return null;

  const lang = readLangFromPath();
  const isRTL = lang === 'he';
  const copy = GATE_COPY[lang];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-gate-heading"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-bg-light px-8 text-center ${
        isRTL ? 'font-hebrew' : 'font-sans'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Decorative lava gradient wash - same family as the home backdrop. */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]">
        <div
          className="h-full w-full animate-lava-flow"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
            backgroundSize: '220% 220%',
          }}
        />
      </div>

      {/* Content. */}
      <div className="relative z-10 flex max-w-sm flex-col items-center">
        <MobileGateArt />

        <img
          src="/nexus-logo.png"
          alt="Nexus"
          className="mt-10 h-7 w-auto object-contain"
          draggable={false}
        />

        <h1
          id="mobile-gate-heading"
          className="mt-6 text-2xl font-bold leading-snug text-text-primary"
        >
          {copy.heading}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {copy.subtext}
        </p>

        <div className="mt-7 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium tracking-wide text-text-muted">
          {WALLET_HOST}
        </div>
      </div>
    </motion.div>
  );
}
