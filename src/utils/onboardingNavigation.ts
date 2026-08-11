import type { useRegistrationStore } from '../stores/registrationStore';

type RegistrationState = ReturnType<typeof useRegistrationStore.getState>;

export const ONBOARDING_SLIDE_ORDER = [
  'verify-phone',        // conditional — only when phone is in missingFields
  'first-name',          // conditional — shown when firstName OR lastName is missing (collects both)
  'verify-email',        // conditional — only when email is missing AND not already known
  'consents',            // retired from the flow — see buildActiveSlides
  'motivation',          // personalization — transitional slide before the preference questions
  'purpose',             // personalization — user can skip
  'life-stage',          // personalization — user can skip
  'birthday',            // personalization — user can skip
  'gender',              // personalization — user can skip
  'benefit-categories',  // personalization — user can skip (last onboarding slide)
] as const;

export type OnboardingSlideId = typeof ONBOARDING_SLIDE_ORDER[number];

/**
 * Slides that exist only to collect personalization data.
 *
 * These are shown exclusively on the 'preferences-completion' path — the one a
 * member opts into from the home-screen teaser (ActiveOffers) — and never
 * during registration. Personalization is something you choose, not a toll you
 * pay on the way in.
 *
 * `motivation` belongs here because its only job is to sell the five questions
 * below it; without them it is an empty slide.
 */
const PREFERENCE_SLIDES: readonly OnboardingSlideId[] = [
  'motivation',
  'purpose',
  'life-stage',
  'birthday',
  'gender',
  'benefit-categories',
];

/** Determines which slides should be included in the flow for this user */
function buildActiveSlides(state: RegistrationState): OnboardingSlideId[] {
  return ONBOARDING_SLIDE_ORDER.filter((slide) => {
    if (slide === 'verify-phone') {
      return state.missingFields.includes('phone');
    }
    if (slide === 'first-name') {
      return (
        (state.missingFields.includes('firstName') && !state.profileData.firstName.trim()) ||
        (state.missingFields.includes('lastName')  && !state.profileData.lastName.trim())
      );
    }
    if (slide === 'verify-email') {
      return state.missingFields.includes('email') && !state.profileData.email;
    }
    if (slide === 'consents') {
      // Never shown. Consent is already collected — and actually persisted — by
      // the marketing opt-in checkbox in LoginSheet, which calls
      // firebaseSaveConsent() + setMarketingConsent() the moment OTP succeeds.
      // This slide wrote to registrationStore.consents, which nothing ever read
      // and which completeRegistration() then nulled. Removing it loses no
      // consent. The route and ConsentsSlide stay for FlowTestPage.
      return false;
    }
    if (PREFERENCE_SLIDES.includes(slide)) {
      return state.registrationPath === 'preferences-completion';
    }
    return true;
  });
}

/**
 * Returns the ID of the first onboarding slide for this user.
 * Called after registration is started to determine the first slide to show.
 */
export function getFirstOnboardingSlide(state: RegistrationState): OnboardingSlideId {
  const slides = buildActiveSlides(state);
  // Fallback covers the degenerate case where nothing is missing. 'first-name'
  // is the only safe landing: it renders, and its Continue resolves next → null
  // → /register/complete. (It used to be 'consents', which is now never active.)
  return slides[0] ?? 'first-name';
}

/**
 * Returns the ID of the next onboarding slide after `currentSlide`.
 * Returns null when the flow is complete (last slide reached).
 */
export function getNextOnboardingSlide(
  currentSlide: OnboardingSlideId,
  state: RegistrationState,
): OnboardingSlideId | null {
  const slides = buildActiveSlides(state);
  const idx = slides.indexOf(currentSlide);
  if (idx >= 0) {
    // Slide found in active list — return next or null if last
    return idx < slides.length - 1 ? slides[idx + 1] : null;
  }
  // Slide no longer in active list (e.g. first-name after filling it in)
  // → find first active slide that comes AFTER currentSlide in the master order
  const masterIdx = ONBOARDING_SLIDE_ORDER.indexOf(currentSlide);
  for (let i = masterIdx + 1; i < ONBOARDING_SLIDE_ORDER.length; i++) {
    if (slides.includes(ONBOARDING_SLIDE_ORDER[i])) {
      return ONBOARDING_SLIDE_ORDER[i];
    }
  }
  return null;
}

/**
 * Returns the ID of the previous onboarding slide before `currentSlide`.
 * Returns null when already at the first slide.
 */
export function getPrevOnboardingSlide(
  currentSlide: OnboardingSlideId,
  state: RegistrationState,
): OnboardingSlideId | null {
  const slides = buildActiveSlides(state);
  const idx = slides.indexOf(currentSlide);
  if (idx <= 0) return null;
  return slides[idx - 1];
}

/**
 * Returns {current, total} for progress dots.
 * current is 1-based. total includes the final "complete" step.
 */
export function getOnboardingProgress(
  currentSlide: OnboardingSlideId,
  state: RegistrationState,
): { current: number; total: number } {
  const slides = buildActiveSlides(state);
  const idx = slides.indexOf(currentSlide);
  return {
    current: Math.max(0, idx) + 1,
    total: slides.length + 1, // +1 for the completion step
  };
}

/**
 * Returns true if the given slide is mandatory (cannot be skipped).
 *
 * `motivation` stays mandatory: it is only ever active on the
 * 'preferences-completion' path, where it is the entry slide.
 */
export function isMandatorySlide(slide: OnboardingSlideId): boolean {
  return (
    slide === 'verify-phone' ||
    slide === 'first-name' ||
    slide === 'motivation'
  );
}

/**
 * Total slide count including the "complete" step (PremiumReveal).
 * Used by RegistrationCompletePage to show the correct progress bar total.
 */
export function getOnboardingTotalWithComplete(state: RegistrationState): number {
  const slides = buildActiveSlides(state);
  return slides.length + 1; // +1 for the completion step
}
