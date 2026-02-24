import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface OnboardingSlideLayoutProps {
  totalSlides: number;
  currentSlideIndex: number;
  canSkip?: boolean;
  canContinue?: boolean;
  onSkip?: () => void;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  skipLabel?: string;
  footerNote?: string;
  footerExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Keyboard avoidance strategy:
 * Everything — content AND button — lives inside one overflow-y-auto
 * scroll container. The button is placed immediately after the children
 * in the natural document flow. When the iOS/Android keyboard opens and
 * scrolls to reveal the focused input, the button travels with it because
 * it's part of the same flow — exactly like a native app.
 * Zero JS, zero polling, zero jank.
 */
export default function OnboardingSlideLayout({
  totalSlides,
  currentSlideIndex,
  canSkip = false,
  canContinue = true,
  onSkip,
  onBack,
  onContinue,
  continueLabel,
  skipLabel: skipLabelProp,
  footerNote,
  footerExtra,
  children,
}: OnboardingSlideLayoutProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const ctaLabel = continueLabel ?? t.registration.onboardingContinue;
  const skipLabel = skipLabelProp ?? t.registration.onboardingSkip;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      dir={isHe ? 'rtl' : 'ltr'}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-60%', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* ── Progress bars ── */}
      <div className="flex-shrink-0 flex gap-1 px-3 pt-3 pb-2 z-50">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <motion.div
              className="h-full rounded-full bg-white"
              initial={false}
              animate={{ width: i < currentSlideIndex ? '100%' : '0%' }}
              transition={{ duration: i < currentSlideIndex ? 0 : 0.3, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>

      {/* ── Single scrollable white card ── */}
      {/* scroll-padding-bottom tells iOS's auto-scroll to keep the button visible */}
      <div className="flex-1 bg-white rounded-t-2xl overflow-y-auto" style={{ scrollPaddingBottom: 80 }}>

        {/* Top nav */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-90 transition-transform"
            >
              <span
                className="material-symbols-outlined text-text-primary"
                style={{ fontSize: '22px', fontVariationSettings: "'wght' 500" }}
              >
                {isHe ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}

          {canSkip && onSkip ? (
            <button
              onClick={onSkip}
              className="text-xs font-semibold text-text-muted px-3 py-1.5 rounded-xl hover:bg-surface active:scale-95 transition-all"
            >
              {skipLabel}
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Slide content */}
        <div className="px-5 py-2">
          {children}
        </div>

        {/* CTA — in flow, immediately after content.
            When keyboard opens iOS scrolls to show the focused input;
            this button is right below it and comes along naturally. */}
        <div className="px-5 pt-4 pb-8 space-y-2">
          {footerNote && (
            <p className="text-xs text-error text-center animate-fade-in">{footerNote}</p>
          )}
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {ctaLabel}
          </button>
          {footerExtra}
        </div>
      </div>
    </motion.div>
  );
}
