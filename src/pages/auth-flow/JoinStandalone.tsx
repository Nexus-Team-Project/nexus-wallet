/**
 * Returning-non-member standalone screen. A logged-in user who arrives via
 * ?tenant=X they do not belong to lands here (routed by resolvePostLogin).
 * Renders the stories-styled SlideJoinPrompt; any choice ends on the
 * ecosystem catalog. New users get the same slide INSIDE the stories chain.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPublicTenant } from '../../services/publicTenant.service';
import SlideJoinPrompt from '../../components/auth-flow/SlideJoinPrompt';

/**
 * Standalone wrapper around SlideJoinPrompt for returning non-members.
 * Resolves the org name (membership first, else public tenant lookup) and
 * routes to the ecosystem catalog on resolve.
 * @returns the join-prompt screen element.
 */
export default function JoinStandalone() {
  const { lang = 'he' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const tenantId = params.get('tenant');
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const fromMembership = (me?.memberships ?? []).find((m) => m.tenantId === tenantId);
    if (fromMembership) { setOrgName(fromMembership.tenantName); return; }
    let active = true;
    fetchPublicTenant(tenantId).then((info) => {
      if (active) setOrgName(info?.organizationName ?? null);
    });
    return () => { active = false; };
  }, [tenantId, me]);

  /**
   * Resolve the branch: confirm a sent join request via a toast, then
   * route to the ecosystem catalog.
   */
  const finish = (result: { joinedRequested: boolean }): void => {
    if (result.joinedRequested) {
      const isHe = lang === 'he';
      toast.success(
        isHe ? 'הבקשה נשלחה — ממתינה לאישור מנהל' : 'Request sent — pending admin approval',
      );
    }
    void navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  };

  return <SlideJoinPrompt tenantId={tenantId} orgName={orgName} mode="returning" onResolve={finish} />;
}
