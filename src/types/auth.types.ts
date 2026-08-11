import type { GiftResolution } from './gift.types';

export type AuthMethod = 'phone' | 'google' | 'apple';

export interface AuthSession {
  token: string;
  userId: string;
  method: AuthMethod;
  isOrgMember: boolean;
  marketingConsent: boolean;
}

export interface OtpRequest {
  phone: string;
}

export interface OtpVerify {
  phone: string;
  code: string;
}

export interface GoogleAuthResult {
  email: string;
  name: string;
  avatar?: string;
}

export interface OrgMember {
  phone: string;
  email?: string;
  organizationId: string;
  organizationName: string;
  firstName?: string;
  lastName?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  session?: AuthSession;
  registrationContext?: {
    orgMember: OrgMember | null;
    profileComplete: boolean;
    missingFields: string[];
  };
  /**
   * Launch-gift eligibility, resolved at the same moment identity is.
   *
   * A sibling of registrationContext rather than a member of it: that shape is
   * duplicated as RegistrationContext in registration.types.ts, and the
   * returning-user branches in LoginSheet return before registration ever
   * starts — the gift still has to reach them.
   */
  gift?: GiftResolution;
}
