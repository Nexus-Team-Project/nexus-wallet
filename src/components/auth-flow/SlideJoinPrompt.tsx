/**
 * Non-member "join?" branch, styled to match the first story page
 * (SlideNexusHero): a full-bleed colored gradient + soft blur blobs + a big
 * white headline, tinted with the ORGANIZATION'S brand color. Same three
 * actions as before (request to join / find another org / continue).
 *
 * Used in two places:
 *  - inside the new-user stories chain (mode="new") when the URL tenant is
 *    one the logged-in user does not belong to;
 *  - as the returning-non-member standalone screen (mode="returning").
 * Fills its parent via min-h-dvh so it works both inside the stories'
 * absolute-positioned slide and as a standalone page.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createJoinRequests } from '../../services/walletTenants.service';
import { useLanguage } from '../../i18n/LanguageContext';
import { joinResultToast } from '../../lib/joinToast';
import TenantDiscoverySheet from '../wallet/TenantDiscoverySheet';

interface SlideJoinPromptProps {
  tenantId: string | null;
  orgName: string | null;
  /** Organization brand color - tints the hero gradient + primary button. */
  orgColor?: string;
  /** Optional organization logo URL shown in the top badge. */
  orgLogo?: string;
  /** 'new' = mid-onboarding (continue keeps onboarding); 'returning' = exit to catalog. */
  mode: 'new' | 'returning';
  /** Called after a join request is sent, or when the user picks "continue". */
  onResolve: (result: { joinedRequested: boolean }) => void;
}

/** The default brand color real backend tenants fall back to (no color field). */
const FALLBACK_COLOR = '#635bff';

/**
 * Derive a stable, pleasant brand color from a seed string (tenant id/name).
 * Deterministic so the same organization always gets the same color (never
 * flickers), while different orgs get visually distinct hues. Fixed
 * saturation/lightness keep white text readable on the result.
 * @param seed tenant id or name
 * @returns an `hsl(...)` color string
 */
function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 62%, 45%)`;
}

export default function SlideJoinPrompt({
  tenantId,
  orgName,
  orgColor,
  orgLogo,
  mode,
  onResolve,
}: SlideJoinPromptProps) {
  // Use a real brand color when the org has one; otherwise derive a stable
  // per-organization color so each org reads distinctly instead of all
  // showing the same default purple.
  const color =
    orgColor && orgColor.toLowerCase() !== FALLBACK_COLOR
      ? orgColor
      : colorFromSeed(tenantId ?? orgName ?? 'nexus');
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayName = orgName ?? 'הארגון';
  const initials = (orgName ?? 'N').trim().slice(0, 2).toUpperCase();

  /** Send a join request, toast the outcome (joined vs pending), then resolve. */
  const requestJoin = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      const result = await createJoinRequests(ids);
      joinResultToast(result, isHe);
      onResolve({ joinedRequested: true });
    } catch (e) {
      console.error('[wallet-join] createJoinRequests failed:', e);
      toast.error(isHe ? 'שליחת הבקשה נכשלה' : 'Could not send request');
      onResolve({ joinedRequested: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      // absolute inset-0 fills both contexts exactly (the stories slide area
      // AND the standalone page) so it never scrolls; no rounded corners so
      // the gradient reaches the edges (the stories container clips its own
      // rounded top). A subtle dark→light sheen over the solid org color
      // reproduces the hero's depth for any brand color without hex math.
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 42%, rgba(255,255,255,0.18) 100%), ${color}`,
      }}
    >
      {/* Soft blur blobs - same treatment as SlideNexusHero. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.25)', top: '-15%', right: '-10%', filter: 'blur(48px)' }}
        />
        <div
          className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.2)', bottom: '-5%', left: '-5%', filter: 'blur(40px)' }}
        />
      </div>

      {/* TOP: organization badge (logo or initials). */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1 relative z-10 flex justify-start items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="h-16 w-16 rounded-2xl bg-white/95 flex items-center justify-center overflow-hidden shadow-lg"
        >
          {orgLogo ? (
            <img src={orgLogo} alt={displayName} className="h-12 w-12 object-contain" />
          ) : (
            <span className="font-black text-2xl" style={{ color }}>{initials}</span>
          )}
        </motion.div>
      </div>

      {/* Headline + subline. */}
      <div className="flex-shrink-0 pt-4 relative z-10 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="text-white font-extrabold text-[32px] leading-tight"
        >
          רוצה להצטרף ל{displayName}?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
          className="text-white/85 text-base mt-3 max-w-[90%] leading-relaxed"
        >
          זיהינו שאינך חבר/ה ב{displayName}. אפשר לבקש להצטרף, לבחור ארגון אחר, או להמשיך לקטלוג Nexus המלא.
        </motion.p>
      </div>

      {/* Actions - anchored to the lower area like the hero's content. */}
      <div className="flex-1 flex flex-col justify-end relative z-10 px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          {tenantId && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void requestJoin([tenantId])}
              className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.96)', color }}
            >
              בקש להצטרף ל{displayName}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDiscovery(true)}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white border border-white/60 bg-white/10 active:scale-[0.98] transition-all"
          >
            בחר ארגון אחר
          </button>
          <button
            type="button"
            onClick={() => onResolve({ joinedRequested: false })}
            className="w-full py-2 text-sm font-medium text-white/85 active:scale-95"
          >
            {mode === 'new' ? 'המשיכו בלי להצטרף' : 'המשיכו לקטלוג נקסוס'}
          </button>
        </motion.div>
      </div>

      {showDiscovery && (
        <TenantDiscoverySheet
          onClose={() => setShowDiscovery(false)}
          onSubmit={(ids) => {
            setShowDiscovery(false);
            void requestJoin(ids);
          }}
        />
      )}
    </div>
  );
}
