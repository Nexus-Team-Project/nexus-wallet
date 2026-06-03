import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { isRegistrationCompleting } from '../../lib/registrationAffiliation';

/**
 * Route guard for registration pages.
 * Redirects to home if the user is not in an active registration flow — UNLESS
 * a registration is finishing (completeRegistration flipped isRegistering off
 * but the navigation to the final destination is still committing). Redirecting
 * during that window would clobber the joined-org landing with the ecosystem
 * catalog.
 */
export default function RegistrationGuard() {
  const { lang = 'he' } = useParams();
  const isRegistering = useRegistrationStore((s) => s.isRegistering);

  if (!isRegistering && !isRegistrationCompleting()) {
    return <Navigate to={`/${lang ?? 'he'}`} replace />;
  }

  return <Outlet />;
}
