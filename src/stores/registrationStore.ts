import { create } from 'zustand';
import type { RegistrationPath } from '../types/registration.types';

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
  isRegistering: false,
  registrationPath: null,
  returnTo: null,
  phone: null,
  orgMember: null,
  missingFields: [],
  profileData: DEFAULT_PROFILE_DATA,
  preferences: null,
  membershipFeePaid: false,
  onboardingData: null,
  consents: null,

  startRegistration: ({ path, phone, orgMember, missingFields, returnTo }) =>
    set({
      isRegistering: true,
      registrationPath: path,
      phone,
      orgMember: orgMember ?? null,
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
    }),

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

  completeRegistration: () =>
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      phone: null,
      orgMember: null,
      missingFields: [],
      profileData: DEFAULT_PROFILE_DATA,
      preferences: null,
      membershipFeePaid: false,
      onboardingData: null,
      consents: null,
    }),

  resetRegistration: () =>
    set({
      isRegistering: false,
      registrationPath: null,
      returnTo: null,
      phone: null,
      orgMember: null,
      missingFields: [],
      profileData: DEFAULT_PROFILE_DATA,
      preferences: null,
      membershipFeePaid: false,
      onboardingData: null,
      consents: null,
    }),
}));
