/**
 * JoinedCelebration — stories-styled "you're in!" screen shown after a new
 * user, mid-onboarding, picks an organization that AUTO-ACCEPTS join requests
 * (so they became a member instantly). It congratulates them and offers two
 * ways forward: fill the onboarding questions, or skip straight to the joined
 * org's catalog.
 *
 * Reached at /:lang/auth-flow/joined?tenant=<tenantId>, navigated to by
 * useStoryMemberOrgs().submitJoin when result.autoAccepted is non-empty. The
 * shared StoryResultLayout supplies the gradient, confetti, and the org-logo
 * (Nexus-logo fallback) avatar badge.
 */
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useStoryMemberOrgs } from '../../hooks/useStoryMemberOrgs';
import { useJoinedOrgInfo } from '../../hooks/useJoinedOrgInfo';
import StoryResultLayout from '../../components/auth-flow/StoryResultLayout';

/**
 * Render the post-auto-join celebration screen.
 * @returns the celebration element with two CTAs.
 */
export default function JoinedCelebration() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { enterOrg, fillOnboarding } = useStoryMemberOrgs();

  const tenantId = sp.get('tenant');
  const { orgName, orgLogo } = useJoinedOrgInfo(tenantId, isHe ? 'הארגון' : 'the organization');

  // No tenant in the URL → nothing to celebrate; bounce to the catalog.
  useEffect(() => {
    if (!tenantId) navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  }, [tenantId, lang, navigate]);
  if (!tenantId) return null;

  return (
    <StoryResultLayout
      dir={isHe ? 'rtl' : 'ltr'}
      orgName={orgName}
      orgLogo={orgLogo}
      confetti
      headline={isHe ? `ברכות! הצטרפתם ל${orgName}` : `Congratulations! You joined ${orgName}`}
      subline={
        isHe
          ? 'מלאו כמה פרטים חשובים שיעזרו לנו להכיר אתכם ולהתאים את חוויית Nexus באופן אישי עבורכם.'
          : 'Fill in a few important details that help us get to know you and personalize your Nexus experience.'
      }
    >
      <button
        type="button"
        onClick={fillOnboarding}
        className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        style={{ background: '#ffffff', color: '#6d28d9' }}
      >
        {isHe ? 'מלאו את הפרטים' : 'Fill in the details'}
      </button>
      <button
        type="button"
        onClick={() => { void enterOrg(tenantId); }}
        className="w-full py-2.5 text-sm font-semibold text-white/90 active:scale-95"
      >
        {isHe ? `דלגו ישירות לקטלוג של ${orgName}` : `Skip straight to ${orgName}'s catalog`}
      </button>
    </StoryResultLayout>
  );
}
