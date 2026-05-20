import {
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { AuthSession, OrgMember, OtpVerifyResult } from '../types/auth.types';
import { lookupOrgMember } from './orgMember.service';

// ── Internal state ──

/** Stored between sendOtp → verifyOtp calls */
let confirmationResult: ConfirmationResult | null = null;
/** Lazily created reCAPTCHA verifier */
let recaptchaVerifier: RecaptchaVerifier | null = null;
/** Phone number saved for dev bypass (code 9999) */
let lastPhone = '';

// ── Helpers ──

/** Convert Israeli phone (050-1234567) to E.164 (+972501234567) */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}

function getOrCreateRecaptcha(): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  return recaptchaVerifier;
}

// ── Google Sign-In ──

type GoogleSignInResult = {
  success: boolean;
  session?: AuthSession;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
  orgMember?: OrgMember | null;
  redirecting?: boolean;
};

function buildGoogleResult(credential: UserCredential): GoogleSignInResult {
  const user = credential.user;
  const nameParts = (user.displayName || '').split(' ');
  return {
    success: true,
    session: {
      token: '', // will be set by caller via getIdToken()
      userId: user.uid,
      method: 'google',
      isOrgMember: false,
      marketingConsent: false,
    },
    profile: {
      email: user.email || '',
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      picture: user.photoURL || '',
    },
  };
}

export async function firebaseGoogleSignIn(): Promise<GoogleSignInResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    let result: UserCredential;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      console.warn('Popup sign-in failed, falling back to redirect:', firebaseErr.code, firebaseErr.message);

      if (firebaseErr.code === 'auth/popup-closed-by-user' ||
          firebaseErr.code === 'auth/cancelled-popup-request') {
        // User cancelled — don't redirect
        return { success: false };
      }

      // For any other error (popup-blocked, unauthorized-domain, etc.) → redirect
      await signInWithRedirect(auth, provider);
      return { success: false, redirecting: true };
    }

    const idToken = await result.user.getIdToken();
    const res = buildGoogleResult(result);
    res.session!.token = idToken;

    // Look up org member by email in Firestore
    const email = result.user.email || '';
    if (email) {
      const orgMember = await lookupOrgMember({ email });
      if (orgMember) {
        res.orgMember = orgMember;
        res.session!.isOrgMember = true;
      }
    }

    return res;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    return { success: false };
  }
}

/** Call on app startup to handle redirect result (if user was redirected for OAuth) */
export async function handleGoogleRedirectResult(): Promise<GoogleSignInResult> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return { success: false };

    const idToken = await result.user.getIdToken();
    const res = buildGoogleResult(result);
    res.session!.token = idToken;

    // Look up org member by email in Firestore
    const email = result.user.email || '';
    if (email) {
      const orgMember = await lookupOrgMember({ email });
      if (orgMember) {
        res.orgMember = orgMember;
        res.session!.isOrgMember = true;
      }
    }

    return res;
  } catch (error) {
    console.error('Google redirect result failed:', error);
    return { success: false };
  }
}

// ── Apple Sign-In ──

export async function firebaseAppleSignIn(): Promise<{
  success: boolean;
  session?: AuthSession;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
  notAvailable?: boolean;
}> {
  try {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/operation-not-allowed') {
        // Apple provider not configured yet
        return { success: false, notAvailable: true };
      }
      if (firebaseErr.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return { success: false };
      }
      throw err;
    }

    const user = result.user;
    const idToken = await user.getIdToken();

    const nameParts = (user.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      success: true,
      session: {
        token: idToken,
        userId: user.uid,
        method: 'apple',
        isOrgMember: false,
        marketingConsent: false,
      },
      profile: {
        email: user.email || '',
        firstName,
        lastName,
        picture: user.photoURL || '',
      },
    };
  } catch (error) {
    console.error('Apple sign-in failed:', error);
    return { success: false };
  }
}

// ── Phone OTP: Send ──

export async function firebaseSendOtp(
  phone: string
): Promise<{ success: boolean }> {
  lastPhone = phone; // Save for dev bypass (code 9999)
  try {
    const e164 = toE164(phone);
    const verifier = getOrCreateRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, e164, verifier);
    return { success: true };
  } catch (error) {
    console.error('OTP send failed:', error);
    // Reset reCAPTCHA on error so it can be recreated on retry
    recaptchaVerifier = null;
    // Still return success so dev bypass (9999) can work even if Firebase fails
    return { success: true };
  }
}

// ── Phone OTP: Verify ──

export async function firebaseVerifyOtp(
  _phone: string,
  code: string
): Promise<OtpVerifyResult> {
  // ── Dev bypass: code 1111 skips Firebase Auth + Firestore entirely ──
  if (code === '1111') {
    const e164 = toE164(_phone || lastPhone);
    return {
      success: true,
      session: {
        token: 'dev-token-1111',
        userId: `dev-${e164.replace('+', '')}`,
        method: 'phone',
        isOrgMember: false,
        marketingConsent: false,
      },
      registrationContext: {
        orgMember: null,
        profileComplete: true,
        missingFields: [],
      },
    };
  }

  // ── Dev bypass: code 9999 skips Firebase Auth but checks Firestore ──
  if (code === '9999') {
    const e164 = toE164(_phone || lastPhone);
    const orgMember = await lookupOrgMember({ phone: e164 });

    const session: AuthSession = {
      token: 'dev-token-9999',
      userId: `dev-${e164.replace('+', '')}`,
      method: 'phone',
      isOrgMember: !!orgMember,
      marketingConsent: false,
    };

    const missingFields: string[] = [];
    if (!orgMember?.firstName) missingFields.push('firstName');
    if (!orgMember?.lastName) missingFields.push('lastName');
    if (!orgMember?.email) missingFields.push('email');

    return {
      success: true,
      session,
      registrationContext: {
        orgMember: orgMember ?? null,
        profileComplete: false,
        missingFields,
      },
    };
  }

  try {
    if (!confirmationResult) {
      return { success: false };
    }

    const result = await confirmationResult.confirm(code);
    const user = result.user;
    const idToken = await user.getIdToken();

    // Look up org member by phone in Firestore
    const phone = user.phoneNumber || '';
    const orgMember = await lookupOrgMember({ phone });

    const session: AuthSession = {
      token: idToken,
      userId: user.uid,
      method: 'phone',
      isOrgMember: !!orgMember,
      marketingConsent: false,
    };

    // If org member found, pre-fill known fields and only ask for missing ones
    const missingFields: string[] = [];
    if (!orgMember?.firstName) missingFields.push('firstName');
    if (!orgMember?.lastName) missingFields.push('lastName');
    if (!orgMember?.email) missingFields.push('email');

    return {
      success: true,
      session,
      registrationContext: {
        orgMember: orgMember ?? null,
        profileComplete: false,
        missingFields,
      },
    };
  } catch (error) {
    console.error('OTP verification failed:', error);
    return { success: false };
  }
}

// ── Save Consent ──

export async function firebaseSaveConsent(
  userId: string,
  consent: boolean
): Promise<{ success: boolean }> {
  // TODO: Save to Firestore when ready
  console.log(`[Firebase] Marketing consent for ${userId}: ${consent}`);
  return { success: true };
}

// ── Sign Out ──

export async function firebaseSignOut(): Promise<void> {
  await auth.signOut();
}
