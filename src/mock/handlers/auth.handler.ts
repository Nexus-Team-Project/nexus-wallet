import type { AuthSession, OrgMember, OtpVerifyResult } from '../../types/auth.types';
import { mockUser } from '../data/user.mock';


// Simulated org member list (pre-loaded from org admin)
const orgMembers: OrgMember[] = [
  {
    phone: '050-1234567',
    organizationId: 'org_001',
    organizationName: 'חברת הייטק בע"מ',
    firstName: 'ישראל',
    lastName: 'כהן',
  },
  {
    phone: '052-9876543',
    organizationId: 'org_001',
    organizationName: 'חברת הייטק בע"מ',
    firstName: 'שרה',
    lastName: 'לוי',
  },
  {
    phone: '054-5551234',
    organizationId: 'org_002',
    organizationName: 'סטארטאפ ישראלי',
    firstName: 'דוד',
    lastName: 'אברהם',
  },
  {
    // Incomplete profile — for testing path B (org member with missing fields)
    phone: '053-1112222',
    organizationId: 'org_001',
    organizationName: 'חברת הייטק בע"מ',
    firstName: 'משה',
    // lastName missing intentionally
  },
];

/** Normalize phone: strip dashes/spaces */
function normalizePhone(phone: string): string {
  return phone.replace(/[-\s]/g, '');
}

/** Check if phone belongs to an org member */
export function findOrgMember(phone: string): OrgMember | undefined {
  const normalized = normalizePhone(phone);
  return orgMembers.find((m) => normalizePhone(m.phone) === normalized);
}

/** Check which required profile fields are missing for an org member */
function getMissingFields(member: OrgMember | undefined): string[] {
  if (!member) return ['firstName', 'lastName', 'email'];
  const missing: string[] = [];
  if (!member.firstName) missing.push('firstName');
  if (!member.lastName) missing.push('lastName');
  // Email is never on OrgMember — always needs to be collected
  missing.push('email');
  return missing;
}

/** Send OTP to phone (mock — always succeeds) */
export async function mockSendOtp(phone: string): Promise<{ success: boolean }> {

  // In real app: send SMS via Twilio / Firebase etc.
  console.log(`[Mock] OTP sent to ${phone}: 1234`);
  return { success: true };
}

/** Verify OTP code (mock — code "1234" always works) */
export async function mockVerifyOtp(
  phone: string,
  code: string
): Promise<OtpVerifyResult> {


  if (code !== '1234') {
    return { success: false };
  }

  const member = findOrgMember(phone);
  const missingFields = getMissingFields(member);
  // Profile is complete if only email is missing (we always require email for new users)
  // For org members: complete if firstName and lastName are present
  const profileComplete = member
    ? !!(member.firstName && member.lastName)
    : false;

  const session: AuthSession = {
    token: `tok_${Date.now()}`,
    userId: member ? mockUser.id : `usr_free_${Date.now()}`,
    method: 'phone',
    isOrgMember: !!member,
    marketingConsent: false, // will be set separately
  };

  return {
    success: true,
    session,
    registrationContext: {
      orgMember: member ?? null,
      profileComplete,
      missingFields,
    },
  };
}

/** Google sign-in (mock — always succeeds, returns full profile from Google scopes) */
export async function mockGoogleSignIn(): Promise<{
  success: boolean;
  session?: AuthSession;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
}> {


  const session: AuthSession = {
    token: `tok_google_${Date.now()}`,
    userId: `usr_google_${Date.now()}`,
    method: 'google',
    isOrgMember: false, // Google users default to free; can match later via email
    marketingConsent: false,
  };

  return {
    success: true,
    session,
    profile: {
      email: 'user@gmail.com',
      firstName: 'ישראל',
      lastName: 'כהן',
      picture: 'https://ui-avatars.com/api/?name=Israel+Cohen&background=4285F4&color=fff&size=128',
    },
  };
}

/** Apple sign-in (mock — same pattern as Google) */
export async function mockAppleSignIn(): Promise<{
  success: boolean;
  session?: AuthSession;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
}> {


  const session: AuthSession = {
    token: `tok_apple_${Date.now()}`,
    userId: `usr_apple_${Date.now()}`,
    method: 'apple',
    isOrgMember: false,
    marketingConsent: false,
  };

  return {
    success: true,
    session,
    profile: {
      email: 'user@icloud.com',
      firstName: 'ישראל',
      lastName: 'כהן',
      picture: 'https://ui-avatars.com/api/?name=Israel+Cohen&background=000&color=fff&size=128',
    },
  };
}

/** Save marketing consent (mock) */
export async function mockSaveConsent(
  userId: string,
  consent: boolean
): Promise<{ success: boolean }> {

  console.log(`[Mock] Marketing consent for ${userId}: ${consent}`);
  return { success: true };
}
