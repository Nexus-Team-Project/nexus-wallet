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
  benefitCategories: string[]; // BenefitCategoriesSlide — multi-select
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
  missingFields: [],
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
        benefitCategories: [],
        ...(state.onboardingData ?? {}),
        ...data,
      },
    })),

  setConsents: (consents) => set({ consents }),

  completeRegistration: () => {
    persistIsOrgFlow(false);
    persistIsRegistering(false);
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      isOrgFlow: false,
      phone: null,
      orgMember: null,
      missingFields: [],
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
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      isOrgFlow: false,
      phone: null,
      orgMember: null,
      missingFields: [],
      profileData: DEFAULT_PROFILE_DATA,
      preferences: null,
      membershipFeePaid: false,
      onboardingData: null,
      consents: null,
    });
  },
}));
