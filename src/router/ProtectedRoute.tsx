/**
 * ProtectedRoute - blocks anonymous users from authenticated pages. Reads
 * AuthContext (not the legacy authStore) so the gate respects the
 * refresh-cookie bootstrap window. On an anonymous direct hit it stashes
 * the intended path, opens the LoginSheet, and redirects to the public
 * ecosystem catalog as the backdrop.
 */
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLoginSheetStore } from '../stores/loginSheetStore';
import { stashPostLoginReturn } from '../lib/postLogin';

export default function ProtectedRoute() {
  const { me, loading } = useAuth();
  const { lang = 'he' } = useParams();
  const openLoginSheet = useLoginSheetStore((s) => s.open);
  const blocked = !loading && !me;

  useEffect(() => {
    if (blocked) {
      stashPostLoginReturn(window.location.pathname + window.location.search);
      void openLoginSheet().catch(() => { /* dismissed - user stays on catalog */ });
    }
  }, [blocked, openLoginSheet]);

  if (loading) return null;
  if (!me) return <Navigate to={`/${lang}/store?ecosystem=1`} replace />;
  return <Outlet />;
}
