import { useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { handleGoogleRedirectResult } from '../services/auth.service';

/**
 * Keeps the Zustand auth store in sync with Firebase Auth state.
 * - Handles Google OAuth redirect result on app startup.
 * - Refreshes the idToken when Firebase detects a token change.
 * - Logs the user out if the Firebase session expires.
 */
export default function FirebaseAuthSync({ children }: { children: ReactNode }) {
  // Handle OAuth redirect result (if user was redirected for Google sign-in)
  useEffect(() => {
    handleGoogleRedirectResult().then((result) => {
      if (result.success && result.session) {
        const store = useAuthStore.getState();
        if (!store.isAuthenticated) {
          store.login({
            token: result.session.token,
            userId: result.session.userId,
            method: 'google',
            isOrgMember: result.session.isOrgMember,
            avatarUrl: result.profile?.picture,
            firstName: result.profile?.firstName,
          });
        }
      }
    });
  }, []);

  // Sync Firebase auth state with Zustand store
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const store = useAuthStore.getState();

      if (!user && store.isAuthenticated) {
        // Firebase session ended but Zustand still thinks we're logged in
        store.logout();
      } else if (user && store.isAuthenticated) {
        // Refresh the token (Firebase tokens expire after 1 hour)
        try {
          const token = await user.getIdToken(/* forceRefresh */ false);
          store.setToken(token);
        } catch {
          // Token refresh failed — force logout
          store.logout();
        }
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
