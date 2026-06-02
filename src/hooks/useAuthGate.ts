import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLoginSheetStore } from '../stores/loginSheetStore';
import { stashPostLoginReturn } from '../lib/postLogin';

interface AuthGateOptions {
  promptMessage?: string;
  /** Optional explicit return path; defaults to the current location. */
  returnTo?: string;
}

export function useAuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOrgMember = useAuthStore((s) => s.isOrgMember);
  const openLoginSheet = useLoginSheetStore((s) => s.open);

  /**
   * Call when the user performs a gated action (buy, redeem, open wallet,
   * open the user menu). If not authenticated, stashes the return path,
   * opens the LoginSheet, and waits. Returns true once authenticated (the
   * sheet resolved in-place for a returning user), false if dismissed.
   * NOTE: new users get hard-navigated into the stories chain, so the
   * promise may not resolve here — the stash is what brings them back.
   */
  const requireAuth = useCallback(
    async (opts?: AuthGateOptions): Promise<boolean> => {
      if (isAuthenticated) return true;
      const returnTo =
        opts?.returnTo ?? window.location.pathname + window.location.search;
      stashPostLoginReturn(returnTo);
      try {
        await openLoginSheet({ promptMessage: opts?.promptMessage });
        return true;
      } catch {
        return false;
      }
    },
    [isAuthenticated, openLoginSheet],
  );

  return { isAuthenticated, isOrgMember, requireAuth };
}
