import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';

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
  /**
   * Optional hero element rendered in the dark region between the progress
   * bar and the white card.  Rendered inside a flex-shrink-0 container
   * (height: clamp(200px, 38vh, 280px)).  Intended for decorative animations
   * such as MotivationAnimation.
   */
  hero?: ReactNode;
  /**
   * When provided a secondary (less prominent) button is rendered beside the
   * primary CTA in a two-column row.  In RTL the primary button sits on the
   * right (start side) and the secondary on the left.
   */
  secondaryCta?: { label: string; onClick: () => void };
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
  hero,
  secondaryCta,
  children,
}: OnboardingSlideLayoutProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Org/tenant users: prepend one filled segment for match-screen (already completed).
  //   isOrgFlow  — persisted to sessionStorage, survives page refreshes for
  //               pure org-member users (who have no tenantConfig in localStorage).
  //   tenantConfig — persisted to localStorage, covers tenant flows.
  const isOrgFlow        = useRegistrationStore((s) => s.isOrgFlow);
  const registrationPath = useRegistrationStore((s) => s.registrationPath);
  const tenantConfig     = useTenantStore((s) => s.config);
  const extraLeading     = isOrgFlow || !!tenantConfig ? 1 : 0;

  // ── Sync ?flow= to URL so every onboarding slide is trackable ────────────
  const flowLabel: 'new-user' | 'pre-provisioned' =
    registrationPath === 'org-member-incomplete' ? 'pre-provisioned' : 'new-user';

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('flow', flowLabel);
    window.history.replaceState(null, '', url.toString());
  }, [flowLabel]);

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
      {/* For org users: first segment = match-screen (always filled). */}
      <div className="flex-shrink-0 flex gap-1 px-3 pt-3 pb-2 z-50">
        {Array.from({ length: totalSlides + extraLeading }).map((_, i) => {
          const filled = i < currentSlideIndex + extraLeading;
          return (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
            >
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: filled ? '100%' : '0%' }}
                transition={{ duration: filled ? 0 : 0.3, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Optional hero (dark area, between progress bar and white card) ── */}
      {hero && (
        <div
          className="flex-shrink-0 relative overflow-hidden"
          style={{ height: 'clamp(200px, 38vh, 280px)' }}
        >
          {hero}
        </div>
      )}

      {/* ── Single scrollable white card ── */}
      {/* scroll-padding-bottom tells iOS's auto-scroll to keep the button visible */}
      {/* min-h-0 prevents the card from overflowing when a hero is present    */}
      <div className="flex-1 min-h-0 bg-white rounded-t-2xl overflow-y-auto" style={{ scrollPaddingBottom: 80 }}>

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

          {secondaryCta ? (
            /* Two-column button row.
               DOM order: [primary, secondary].
               In RTL flex primary ends up on the RIGHT (start side) — the
               visually dominant position — secondary on the LEFT. */
            <div className="flex gap-3">
              <button
                onClick={onContinue}
                disabled={!canContinue}
                className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {ctaLabel}
              </button>
              <button
                onClick={secondaryCta.onClick}
                className="flex-1 py-4 rounded-2xl bg-surface text-text-muted font-semibold text-sm active:scale-[0.98] transition-all"
              >
                {secondaryCta.label}
              </button>
            </div>
          ) : (
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {ctaLabel}
            </button>
          )}

          {footerExtra}
        </div>
      </div>
    </motion.div>
  );
}
