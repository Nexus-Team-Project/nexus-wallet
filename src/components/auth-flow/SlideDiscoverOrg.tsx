/**
 * Stories-styled "belong to an organization?" step shown to a brand-new user
 * who arrived with NO tenant context. A light, optional nudge: find your
 * organization (opens the discovery sheet to request to join) or continue to
 * the full Nexus catalog. Matches the hero/join visual language: a colored
 * gradient, floating blur blobs, a big white headline, and staggered
 * framer-motion entrances.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStoryMemberOrgs } from '../../hooks/useStoryMemberOrgs';
import TenantDiscoverySheet from '../wallet/TenantDiscoverySheet';

interface SlideDiscoverOrgProps {
  /** Continue into onboarding (after a join request is sent, or on skip). */
  onResolve: () => void;
}

const ACCENT = '#7c3aed';

export default function SlideDiscoverOrg({ onResolve }: SlideDiscoverOrgProps) {
  const [showDiscovery, setShowDiscovery] = useState(false);
  const { memberOrgs, enterOrg, submitJoin } = useStoryMemberOrgs();

  return (
    <div
      dir="rtl"
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)' }}
    >
      {/* Floating blur blobs with gentle ambient motion. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.25)', top: '-15%', right: '-10%', filter: 'blur(48px)' }}
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.2)', bottom: '-5%', left: '-5%', filter: 'blur(40px)' }}
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut' }}
        />
      </div>

      {/* Organization badge. */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1 relative z-10 flex justify-start items-center">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="h-16 w-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg"
        >
          <OrgBadgeIcon />
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
          שייכים לארגון?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
          className="text-white/85 text-base mt-3 max-w-[90%] leading-relaxed"
        >
          הצטרפו לארגון שלכם ותיהנו מההטבות הבלעדיות שלו, או המשיכו לקטלוג Nexus המלא.
        </motion.p>
      </div>

      {/* Actions, anchored low like the hero's content. */}
      <div className="flex-1 flex flex-col justify-end relative z-10 px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={() => setShowDiscovery(true)}
            className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
            style={{ background: 'rgba(255,255,255,0.96)', color: ACCENT }}
          >
            מצא את הארגון שלי
          </button>
          <button
            type="button"
            onClick={onResolve}
            className="w-full py-2 text-sm font-medium text-white/85 active:scale-95"
          >
            המשיכו לקטלוג Nexus
          </button>
        </motion.div>
      </div>

      {showDiscovery && (
        <TenantDiscoverySheet
          onClose={() => setShowDiscovery(false)}
          onSubmit={async (ids) => {
            setShowDiscovery(false);
            // Auto-accepted -> the hook navigates to the celebration screen, so
            // we must NOT also continue onboarding. Pending/empty -> continue.
            const navigated = await submitJoin(ids);
            if (!navigated) onResolve();
          }}
          memberOrgs={memberOrgs}
          onPickMember={(id) => { void enterOrg(id); }}
        />
      )}
    </div>
  );
}

/**
 * Detailed two-tone office-building mark for the badge. Richer than a single
 * line glyph: a violet tower with windows, an entrance, and a small adjacent
 * wing, drawn to read as a real organization at a glance.
 */
function OrgBadgeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Adjacent low wing */}
      <rect x="28" y="22" width="13" height="20" rx="2" fill="#a855f7" />
      <rect x="31" y="26" width="3" height="3" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="36" y="26" width="3" height="3" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="31" y="31" width="3" height="3" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="36" y="31" width="3" height="3" rx="0.5" fill="#fff" opacity="0.9" />
      {/* Main tower */}
      <rect x="7" y="9" width="24" height="33" rx="2.5" fill="#7c3aed" />
      <rect x="7" y="9" width="24" height="6" rx="2.5" fill="#6d28d9" />
      {/* Tower windows */}
      {[16, 22, 28].map((y) =>
        [11, 17, 23].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="0.8" fill="#fff" opacity="0.92" />
        )),
      )}
      {/* Entrance */}
      <rect x="16" y="34" width="6" height="8" rx="1" fill="#ede9fe" />
      {/* Ground line */}
      <rect x="5" y="42" width="38" height="2.5" rx="1.25" fill="#4c1d95" />
    </svg>
  );
}
