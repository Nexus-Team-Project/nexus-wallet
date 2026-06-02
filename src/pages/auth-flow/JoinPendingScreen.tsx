/**
 * JoinPendingScreen — stories-styled "waiting for admin approval" screen shown
 * after a new user, mid-onboarding, requests to join an organization that does
 * NOT auto-accept (so a pending request was created). It tells them the request
 * is awaiting approval and offers three ways forward:
 *   - fill the important onboarding questions,
 *   - continue to the general Nexus catalog, or
 *   - try another organization (which re-runs the same auto-accept / pending
 *     branch and lands on the matching screen).
 *
 * Reached at /:lang/auth-flow/join-pending?tenant=<tenantId>, navigated to by
 * useStoryMemberOrgs().submitJoin when a request is created (or already pending).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useStoryMemberOrgs } from '../../hooks/useStoryMemberOrgs';
import { useJoinedOrgInfo } from '../../hooks/useJoinedOrgInfo';
import StoryResultLayout from '../../components/auth-flow/StoryResultLayout';
import TenantDiscoverySheet from '../../components/wallet/TenantDiscoverySheet';

/**
 * Render the pending-approval screen.
 * @returns the pending element with three CTAs.
 */
export default function JoinPendingScreen() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { memberOrgs, enterOrg, enterEcosystem, fillOnboarding, submitJoin } = useStoryMemberOrgs();
  const [showDiscovery, setShowDiscovery] = useState(false);

  const tenantId = sp.get('tenant');
  const { orgName, orgLogo } = useJoinedOrgInfo(tenantId, isHe ? 'הארגון' : 'the organization');

  // No tenant in the URL → nothing pending; bounce to the catalog.
  useEffect(() => {
    if (!tenantId) navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  }, [tenantId, lang, navigate]);
  if (!tenantId) return null;

  return (
    <>
      <StoryResultLayout
        dir={isHe ? 'rtl' : 'ltr'}
        orgName={orgName}
        orgLogo={orgLogo}
        headline={isHe ? `ביקשתם להצטרף ל${orgName}` : `You asked to join ${orgName}`}
        subline={
          isHe
            ? 'הבקשה נשלחה וממתינה לאישור מנהל הארגון. בינתיים אפשר להתקדם:'
            : "Your request was sent and is waiting for the organization admin's approval. Meanwhile, you can get going:"
        }
      >
        <button
          type="button"
          onClick={fillOnboarding}
          className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
          style={{ background: '#ffffff', color: '#6d28d9' }}
        >
          {isHe ? 'מלאו את הפרטים החשובים' : 'Fill in the important details'}
        </button>
        <button
          type="button"
          onClick={() => { void enterEcosystem(); }}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white border border-white/40 active:scale-[0.98] transition-all"
        >
          {isHe ? 'המשיכו לקטלוג Nexus' : 'Continue to the Nexus catalog'}
        </button>
        <button
          type="button"
          onClick={() => setShowDiscovery(true)}
          className="w-full py-2.5 text-sm font-semibold text-white/90 active:scale-95"
        >
          {isHe ? 'נסו ארגון אחר' : 'Try another organization'}
        </button>
      </StoryResultLayout>

      {showDiscovery && (
        <TenantDiscoverySheet
          onClose={() => setShowDiscovery(false)}
          onSubmit={(ids) => {
            setShowDiscovery(false);
            // Re-runs the same branch: auto-accept -> celebration, pending ->
            // this screen for the new org. submitJoin handles the navigation.
            void submitJoin(ids);
          }}
          memberOrgs={memberOrgs}
          onPickMember={(id) => { void enterOrg(id); }}
        />
      )}
    </>
  );
}
