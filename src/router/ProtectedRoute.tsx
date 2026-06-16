import { useEffect } from 'react';
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { lang = 'he' } = useParams();
  const [searchParams] = useSearchParams();

  // A gift deep-link (`?focus=<userVoucherId>`) is shareable: the recipient may
  // open it — or refresh it — without ever signing in. Keep them in the gift
  // flow by auto-signing-in the demo user (this persists, so later navigations
  // and refreshes stay authenticated) instead of bouncing them to the home page.
  const isGiftDeepLink = searchParams.has('focus');

  useEffect(() => {
    if (!isAuthenticated && isGiftDeepLink) {
      useAuthStore.getState().login({
        token: 'gift-demo',
        userId: 'gift-demo',
        method: 'phone',
        isOrgMember: false,
      });
    }
  }, [isAuthenticated, isGiftDeepLink]);

  if (!isAuthenticated) {
    // Logging in via the effect above — render nothing this frame (rather than
    // redirecting) so the gift deep-link isn't lost to a bounce.
    if (isGiftDeepLink) return null;
    // Not authenticated — redirect back to home (LoginSheet opens from action buttons)
    return <Navigate to={`/${lang || 'he'}`} replace />;
  }

  return <Outlet />;
}
