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

  // Gift-teaser demo link (`?gift-teaser=demo`): a shareable wallet URL that
  // always shows the SPAR opening-gift teaser peeking from the bottom. Same
  // treatment as a gift deep-link — auto-sign-in the demo user so the link
  // works cold, without an existing session.
  const isGiftTeaserDemo = searchParams.get('gift-teaser') === 'demo';

  // Story frames (`?story=1`) embed real screens inside the how-to-create-a-
  // voucher stories, which are reachable while signed out. Let them render
  // read-only rather than bouncing mid-story. Deliberately NOT a login: no auth
  // state is written, so nothing leaks into the surrounding app session. The
  // pages behind this guard are mock-data surfaces with no per-user content.
  const isStoryFrame = searchParams.get('story') === '1';

  useEffect(() => {
    if (!isAuthenticated && (isGiftDeepLink || isGiftTeaserDemo)) {
      useAuthStore.getState().login({
        token: 'gift-demo',
        userId: 'gift-demo',
        method: 'phone',
        isOrgMember: false,
      });
    }
  }, [isAuthenticated, isGiftDeepLink, isGiftTeaserDemo]);

  if (!isAuthenticated) {
    // Logging in via the effect above — render nothing this frame (rather than
    // redirecting) so the gift deep-link isn't lost to a bounce.
    if (isGiftDeepLink || isGiftTeaserDemo) return null;
    if (isStoryFrame) return <Outlet />;
    // Not authenticated — redirect back to home (LoginSheet opens from action buttons)
    return <Navigate to={`/${lang || 'he'}`} replace />;
  }

  return <Outlet />;
}
