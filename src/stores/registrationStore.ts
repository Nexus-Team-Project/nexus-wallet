import { create } from 'zustand';
import type { RegistrationPath } from '../types/registration.types';

// ── sessionStorage persistence ────────────────────────────────────────────────
//
// Two flags are persisted so that:
//   • Refreshing mid-flow keeps the user on the current onboarding slide
//     instead of redirecting to home (RegistrationGuard checks isRegistering).
//   • The "org/tenant flow is active" flag survives navigations so that
//     OnboardingSlideLayout always renders the match-screen leading segment.
//
// sessionStorage is intentionally used (not localStorage) — the data is
// cleared automatically when the browser tab is closed, which is the
// appropriate lifetime for an in-progress registration session.

const ORG_FLOW_SESSION_KEY  = 'nexus_is_org_flow';
const IS_REGISTERING_KEY    = 'nexus_is_registering';
// missingFields gates the conditional onboarding slides (verify-phone, etc.).
// It must survive a full-page reload — the Google login does a hard
// window.location.replace into the stories, which would otherwise reset it to
// [] in memory and silently drop the phone slide.
const MISSING_FIELDS_KEY    = 'nexus_missing_fields';
// Marks that a brand-new phone number has verified OTP but has not yet
// provided an email address or minted a session. Used by later tasks to:
//   (a) run promo stories before the email step
//   (b) route email-OTP to the questionnaire slide chain
const PENDING_EMAIL_SIGNUP_KEY = 'nexus_pending_email_signup';

function loadIsOrgFlow(): boolean {
  try { return sessionStorage.getItem(ORG_FLOW_SESSION_KEY) === '1'; }
  catch { return false; }
}

function persistIsOrgFlow(value: boolean) {
  try {
    if (value) sessionStorage.setItem(ORG_FLOW_SESSION_KEY, '1');
    else        sessionStorage.removeItem(ORG_FLOW_SESSION_KEY);
  } catch { /* silently fail */ }
}

function loadIsRegistering(): boolean {
  try { return sessionStorage.getItem(IS_REGISTERING_KEY) === '1'; }
  catch { return false; }
}

function persistIsRegistering(value: boolean) {
  try {
    if (value) sessionStorage.setItem(IS_REGISTERING_KEY, '1');
    else        sessionStorage.removeItem(IS_REGISTERING_KEY);
  } catch { /* silently fail */ }
}

function loadMissingFields(): string[] {
  try {
    const raw = sessionStorage.getItem(MISSING_FIELDS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

function persistMissingFields(value: string[]) {
  try {
    if (value.length > 0) sessionStorage.setItem(MISSING_FIELDS_KEY, JSON.stringify(value));
    else                   sessionStorage.removeItem(MISSING_FIELDS_KEY);
  } catch { /* silently fail */ }
}

/**
 * Reads the pendingEmailSignup flag from sessionStorage.
 * Returns true only when the stored value is the sentinel string '1'.
 */
function loadPendingEmailSignup(): boolean {
  try { return sessionStorage.getItem(PENDING_EMAIL_SIGNUP_KEY) === '1'; } catch { return false; }
}

/**
 * Persists or clears the pendingEmailSignup flag in sessionStorage.
 * @param value - true to set the flag, false to remove it
 */
function persistPendingEmailSignup(value: boolean) {
  try {
    if (value) sessionStorage.setItem(PENDING_EMAIL_SIGNUP_KEY, '1');
    else        sessionStorage.removeItem(PENDING_EMAIL_SIGNUP_KEY);
  } catch { /* silently fail */ }
}

interface OrgMemberInfo {
  organizationId: string;
  organizationName: string;
  firstName?: string;
  lastName?: string;
}

export interface OnboardingData {
  purpose: string[];           // PurposeSlide — multi-select
  lifeStage: string | null;    // LifeStageSlide — single-select (null = skipped)
  birthday: string;            // BirthdaySlide — ISO date string ('' = skipped)
  gender: string | null;       // GenderSlide — single-select (null = skipped)
}

export interface ConsentData {
  marketing: boolean;          // Required toggle — must be true to continue
  pushNotifications: boolean;  // Optional
  analytics: boolean;          // Optional
}

interface RegistrationState {
  // Flow tracking
  isRegistering: boolean;
  registrationPath: RegistrationPath | null;
  returnTo: string | null;

  // True when the user entered onboarding via an org/tenant match-screen.
  // Persisted to sessionStorage so it survives React-Router navigations and
  // hard page refreshes — used by OnboardingSlideLayout to render the
  // leading match-screen segment in the progress bar.
  isOrgFlow: boolean;

  // Pre-filled data from OTP step
  phone: string | null;
  orgMember: OrgMemberInfo | null;
  missingFields: string[];

  // Profile form data (accumulated across steps)
  profileData: {
    firstName: string;
    lastName: string;
    email: string;
    birthday: string;
  };

  // Questionnaire responses
  preferences: Record<string, string> | null;

  // Membership fee
  membershipFeePaid: boolean;

  // Onboarding enrichment data (collected in onboarding slides)
  onboardingData: OnboardingData | null;

  // Consent choices (collected in ConsentsSlide — mandatory step)
  consents: ConsentData | null;

  // True after a new phone verifies OTP but before the user provides an email
  // or receives a session. Persisted so a hard refresh (e.g. Google bounce)
  // does not lose the "we are mid-signup" signal.
  pendingEmailSignup: boolean;

  // Actions
  startRegistration: (params: {
    path: RegistrationPath;
    phone: string;
    orgMember?: OrgMemberInfo | null;
    missingFields?: string[];
    returnTo?: string;
  }) => void;
  setProfileData: (data: Partial<RegistrationState['profileData']>) => void;
  setPreferences: (prefs: Record<string, string>) => void;
  setMembershipFeePaid: (paid: boolean) => void;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  setConsents: (consents: ConsentData) => void;
  setPendingEmailSignup: (v: boolean) => void;
  completeRegistration: () => void;
  resetRegistration: () => void;
}

const DEFAULT_PROFILE_DATA = { firstName: '', lastName: '', email: '', birthday: '' };

export const useRegistrationStore = create<RegistrationState>((set) => ({
  isRegistering: loadIsRegistering(),
  registrationPath: null,
  returnTo: null,
  isOrgFlow: loadIsOrgFlow(),
  phone: null,
  orgMember: null,
  missingFields: loadMissingFields(),
  pendingEmailSignup: loadPendingEmailSignup(),
  profileData: DEFAULT_PROFILE_DATA,
  preferences: null,
  membershipFeePaid: false,
  onboardingData: null,
  consents: null,

  startRegistration: ({ path, phone, orgMember, missingFields, returnTo }) => {
    // isOrgFlow is true when an orgMember is present (PATH B).
    // For tenant-only flows (PATH D) there is no orgMember, but tenantStore.config
    // persists to localStorage and handles the extraLeading independently.
    const isOrgFlow = !!(orgMember);
    persistIsOrgFlow(isOrgFlow);
    persistIsRegistering(true);
    persistMissingFields(missingFields ?? []);
    set({
      isRegistering: true,
      registrationPath: path,
      phone,
      orgMember: orgMember ?? null,
      isOrgFlow,
      missingFields: missingFields ?? [],
      returnTo: returnTo ?? null,
      // Pre-fill profile data from org member if available
      profileData: {
        firstName: orgMember?.firstName ?? '',
        lastName: orgMember?.lastName ?? '',
        email: '',
        birthday: '',
      },
      onboardingData: null,
      consents: null,
    });
  },

  setProfileData: (data) =>
    set((state) => ({
      profileData: { ...state.profileData, ...data },
    })),

  setPreferences: (prefs) => set({ preferences: prefs }),

  setMembershipFeePaid: (paid) => set({ membershipFeePaid: paid }),

  setOnboardingData: (data) =>
    set((state) => ({
      onboardingData: {
        purpose: [],
        lifeStage: null,
        birthday: '',
        gender: null,
        ...(state.onboardingData ?? {}),
        ...data,
      },
    })),

  setConsents: (consents) => set({ consents }),

  /**
   * Sets the pendingEmailSignup flag and persists it to sessionStorage.
   * @param v - true to mark mid-signup (phone verified, no email yet), false to clear
   */
  setPendingEmailSignup: (v) => { persistPendingEmailSignup(v); set({ pendingEmailSignup: v }); },

  completeRegistration: () => {
    persistIsOrgFlow(false);
    persistIsRegistering(false);
    persistMissingFields([]);
    persistPendingEmailSignup(false);
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      isOrgFlow: false,
      phone: null,
      orgMember: null,
      missingFields: [],
      pendingEmailSignup: false,
      profileData: DEFAULT_PROFILE_DATA,
      preferences: null,
      membershipFeePaid: false,
      onboardingData: null,
      consents: null,
    });
  },

  resetRegistration: () => {
    persistIsOrgFlow(false);
    persistIsRegistering(false);
    persistMissingFields([]);
    persistPendingEmailSignup(false);
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      isOrgFlow: false,
      phone: null,
      orgMember: null,
      missingFields: [],
      pendingEmailSignup: false,
      profileData: DEFAULT_PROFILE_DATA,
      preferences: null,
      membershipFeePaid: false,
      onboardingData: null,
      consents: null,
    });
  },
}));
