/**
 * ProtectedRoute - blocks anonymous users from rendering authenticated
 * pages. Reads AuthContext rather than the legacy Zustand authStore so
 * the gate respects the post-login bootstrap window: during the
 * refresh-cookie + /api/me round-trip we render nothing instead of
 * redirecting, otherwise the user would briefly bounce back to /:lang
 * mid-login.
 *
 * Use as a wrapper route around any tree that must require a session,
 * e.g. /wallet, /activity, /profile, /router, /wallet/join-tenant.
 */
import { Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { me, loading } = useAuth();
  const { lang = 'he' } = useParams();
  const location = useLocation();

  // Still resolving the session - render nothing so AppLayout can keep
  // its own loading skeleton up. Never redirect mid-bootstrap.
  if (loading) return null;

  if (!me) {
    // Anonymous - bounce to the single anonymous landing URL.
    // location.state.from lets the login flow optionally return the
    // user here after they sign in (not wired yet, but cheap to carry).
    return (
      <Navigate
        to={`/${lang || 'he'}`}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}
