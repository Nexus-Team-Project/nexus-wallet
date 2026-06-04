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
import { sendJoinRequest } from '../services/walletTenants.service';

/** What the user ended up affiliated with by the end of the stories. */
export type AffiliationKind = 'join' | 'joined' | 'pending' | 'member' | 'none';

export interface RegistrationAffiliation {
  /**
   * - join    : a NEW join the user CHOSE but that is sent at completion (so the
   *             collected phone + profile travel to the tenant). Resolved to
   *             joined/pending by finishWalletRegistration.
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

// Module-level once-guard for the end-of-registration navigation. `finish()` is
// wired to both the X button and the reveal's auto-onReveal, and dev StrictMode
// re-mounts reset component refs — so it can fire several times. The FIRST call
// consumes the affiliation and navigates; later calls would read an empty stash
// and clobber the landing with the ecosystem catalog. This survives re-mounts
// (a ref does not) and is reset when a fresh registration's stories start.
let registrationFinished = false;

// True from the moment finish() begins routing to the destination until a new
// stories run starts. While set, RegistrationGuard must NOT redirect to /:lang
// even though completeRegistration() has flipped isRegistering=false — that
// redirect (a render-time <Navigate>) would otherwise interrupt the in-flight
// transition to the joined org's catalog and send the user to the ecosystem.
let registrationCompleting = false;

/** Reset the guards at the start of a new-user stories flow. */
export function resetRegistrationFinish(): void {
  registrationFinished = false;
  registrationCompleting = false;
}

/** Mark that the end-of-registration navigation is in flight. */
export function setRegistrationCompleting(v: boolean): void {
  registrationCompleting = v;
}

/** Whether a registration completion navigation is in flight. */
export function isRegistrationCompleting(): boolean {
  return registrationCompleting;
}

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
 * @param opts.navigate     react-router navigate.
 * @param opts.lang         active language code for the URL.
 * @param opts.t            the active translation bundle (for the toast strings).
 * @param opts.overridePath when set (e.g. a stashed gated-action return), the
 *                          user lands here instead of the affiliation default,
 *                          but the welcome toast still fires.
 */
export async function finishWalletRegistration(opts: {
  navigate: NavigateFunction;
  lang: string;
  t: TranslationKeys;
  overridePath?: string;
  /** Refreshes /api/me — needed to read a freshly-joined org's name. */
  reload?: () => Promise<{ memberships?: Array<{ tenantId: string; tenantName: string }> } | null>;
}): Promise<void> {
  const { navigate, lang, t, overridePath, reload } = opts;
  // Run exactly once per registration — ignore repeat calls (double-fire /
  // StrictMode re-mount) so they don't re-navigate to the ecosystem catalog.
  if (registrationFinished) return;
  registrationFinished = true;

  let aff = getAffiliation();

  // A 'join' intent is sent NOW (end of registration) so the phone + profile are
  // already saved and travel to the tenant. Resolve it to joined / pending /
  // none, then fall through to the shared routing below.
  if (aff?.kind === 'join' && aff.tenantId) {
    try {
      const outcome = await sendJoinRequest(aff.tenantId, { reload });
      aff = { kind: outcome.kind, tenantId: outcome.tenantId, orgName: outcome.orgName ?? aff.orgName };
    } catch (e) {
      console.error('[wallet-finish] join request failed (non-fatal):', e);
      aff = { kind: 'none' };
    }
  }

  const name = aff?.orgName ?? '';
  let path = `/${lang}/store?ecosystem=1`;
  let message: string | null = null;
  // An org context (joined / existing member) is the user's destination and
  // must win over any return-stash override — you just chose/joined it.
  let orgWins = false;

  if (aff?.kind === 'joined' && aff.tenantId) {
    path = `/${lang}/store?tenant=${encodeURIComponent(aff.tenantId)}`;
    message = t.authFlow.welcomeJoinedToast.replace('{{orgName}}', name);
    orgWins = true;
  } else if (aff?.kind === 'pending') {
    message = t.authFlow.welcomePendingToast.replace('{{orgName}}', name);
  } else if (aff?.kind === 'member' && aff.tenantId) {
    path = `/${lang}/store?tenant=${encodeURIComponent(aff.tenantId)}`;
    orgWins = true;
  }

  const target = orgWins ? path : (overridePath ?? path);
  clearAffiliation();
  if (message) toast.success(message);
  navigate(target, { replace: true });
}
