/**
 * Stories-styled non-member branch. Shown (a) inside the new-user stories
 * chain when the URL tenant is one the user does not belong to, and (b) as
 * the returning-non-member standalone screen (JoinStandalone). Visual
 * language matches the stories slides (SlideWelcomeOrg) - framer-motion
 * entrance, design tokens only - this is NOT a new design.
 *
 * CTAs:
 *  - Request to join {orgName}  -> createJoinRequests([tenantId])
 *  - Find another organization  -> opens TenantDiscoverySheet
 *  - Continue / Go to catalog   -> onResolve (meaning differs by mode)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { createJoinRequests } from '../../services/walletTenants.service';
import TenantDiscoverySheet from '../wallet/TenantDiscoverySheet';

interface SlideJoinPromptProps {
  /** Target tenant from ?tenant=X, or null when unknown. */
  tenantId: string | null;
  /** Resolved display name of the target org, or null while loading. */
  orgName: string | null;
  /** 'new' = mid-onboarding (continue keeps onboarding); 'returning' = exit to catalog. */
  mode: 'new' | 'returning';
  /** Called once the branch resolves; joinedRequested reflects whether a request was sent. */
  onResolve: (result: { joinedRequested: boolean }) => void;
}

/**
 * Renders the non-member join prompt with three CTAs.
 * @param tenantId target tenant id (enables the primary "request to join" CTA).
 * @param orgName resolved org display name for the copy.
 * @param mode controls the tertiary CTA label / intent ('new' vs 'returning').
 * @param onResolve fires with { joinedRequested } when the user picks a path.
 * @returns the stories-styled slide element.
 */
export default function SlideJoinPrompt({ tenantId, orgName, mode, onResolve }: SlideJoinPromptProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayName = orgName ?? (isHe ? 'הארגון' : 'this organization');

  /**
   * Send join requests for the given tenants, then resolve the branch.
   * Resolves with joinedRequested=false on error so the user is never stuck.
   */
  const requestJoin = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      await createJoinRequests(ids);
      onResolve({ joinedRequested: true });
    } catch (e) {
      console.error('[wallet-join] createJoinRequests failed:', e);
      onResolve({ joinedRequested: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-2 text-2xl font-bold text-text-primary sm:text-3xl"
      >
        {isHe ? `עדיין לא חבר/ה ב${displayName}` : `You're not part of ${displayName} yet`}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-8 max-w-xs text-sm text-text-muted sm:text-base"
      >
        {isHe
          ? 'אפשר לבקש להצטרף, לבחור ארגון אחר, או להמשיך לקטלוג Nexus המלא.'
          : 'You can request to join, pick another organization, or continue to the full Nexus catalog.'}
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.16 } } }}
        className="w-full max-w-xs space-y-3"
      >
        {tenantId && (
          <motion.button
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            type="button"
            disabled={submitting}
            onClick={() => { void requestJoin([tenantId]); }}
            className="w-full rounded-2xl bg-primary py-3 font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
          >
            {isHe ? `בקש להצטרף ל${displayName}` : `Request to join ${displayName}`}
          </motion.button>
        )}
        <motion.button
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          type="button"
          onClick={() => setShowDiscovery(true)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {isHe ? 'בחר ארגון אחר' : 'Find another organization'}
        </motion.button>
        <motion.button
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          type="button"
          onClick={() => onResolve({ joinedRequested: false })}
          className="w-full py-3 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          {mode === 'new'
            ? (isHe ? 'המשך' : 'Continue')
            : (isHe ? 'לקטלוג Nexus' : 'Go to Nexus catalog')}
        </motion.button>
      </motion.div>

      {showDiscovery && (
        <TenantDiscoverySheet
          onClose={() => setShowDiscovery(false)}
          onSubmit={(ids) => { setShowDiscovery(false); void requestJoin(ids); }}
        />
      )}
    </div>
  );
}
