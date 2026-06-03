/**
 * Registration affiliation — the org outcome a first-time user chose during the
 * auth-flow stories (join / match / none), carried through the onboarding
 * questions and consumed exactly once when registration finishes.
 *
 * Joining inside the stories is silent (no screen, no toast). Instead the
 * outcome is stashed here; `finishWalletRegistration` reads it at the end to
 * decide the landing page and the single welcome toast, then clears it (so the
 * toast never repeats on later logins).
 *
 * Stored in sessionStorage so it survives the in-app navigations of the
 * onboarding chain but not a new session.
 */
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import type { TranslationKeys } from '../i18n/types';

/** What the user ended up affiliated with by the end of the stories. */
export type AffiliationKind = 'joined' | 'pending' | 'member' | 'none';

export interface RegistrationAffiliation {
  /**
   * - joined  : a NEW join that auto-accepted (now a member).
   * - pending : a NEW join awaiting admin approval (not a member yet).
   * - member  : an EXISTING membership chosen on the match-screen.
   * - none    : no organization affiliation.
   */
  kind: AffiliationKind;
  tenantId?: string;
  orgName?: string;
}

const KEY = 'wallet_registration_affiliation';

/** Record the chosen affiliation (overwrites any prior one this session). */
export function setAffiliation(a: RegistrationAffiliation): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage disabled — non-fatal */
  }
}

/** Read the stashed affiliation, or null if none. */
export function getAffiliation(): RegistrationAffiliation | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v ? (JSON.parse(v) as RegistrationAffiliation) : null;
  } catch {
    return null;
  }
}

/** Clear the stash (called after the welcome toast fires). */
export function clearAffiliation(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}

/**
 * Finish a first-time registration: route to the right catalog and fire the
 * single welcome toast based on the stashed affiliation, then clear the stash.
 *
 * - joined  -> the joined org's catalog + "joined" toast.
 * - pending -> the Nexus catalog + "request sent" toast.
 * - member  -> the chosen org's catalog, no toast (not a new join).
 * - none    -> the Nexus catalog, no toast.
 *
 * @param opts.navigate react-router navigate.
 * @param opts.lang     active language code for the URL.
 * @param opts.t        the active translation bundle (for the toast strings).
 */
export function finishWalletRegistration(opts: {
  navigate: NavigateFunction;
  lang: string;
  t: TranslationKeys;
}): void {
  const { navigate, lang, t } = opts;
  const aff = getAffiliation();
  const name = aff?.orgName ?? '';

  let path = `/${lang}/store?ecosystem=1`;
  let message: string | null = null;

  if (aff?.kind === 'joined' && aff.tenantId) {
    path = `/${lang}/store?tenant=${encodeURIComponent(aff.tenantId)}`;
    message = t.authFlow.welcomeJoinedToast.replace('{{orgName}}', name);
  } else if (aff?.kind === 'pending') {
    message = t.authFlow.welcomePendingToast.replace('{{orgName}}', name);
  } else if (aff?.kind === 'member' && aff.tenantId) {
    path = `/${lang}/store?tenant=${encodeURIComponent(aff.tenantId)}`;
  }

  clearAffiliation();
  if (message) toast.success(message);
  navigate(path, { replace: true });
}
