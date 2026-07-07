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
   * Wallet Plan #2: set when the phone was verified but no NexusIdentity
   * owns it yet. Caller (LoginSheet) routes to /:lang/auth/email-required
   * with this ticket id so the user can supply email and finish signup.
   */
  needsEmail?: {
    signupTicketId: string;
    phone: string;
  };
}
