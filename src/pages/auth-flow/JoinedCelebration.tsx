/**
 * JoinedCelebration — stories-styled "you're in!" screen shown after a new
 * user, mid-onboarding, picks an organization that AUTO-ACCEPTS join requests
 * (so they became a member instantly). It congratulates them on joining and
 * offers two ways forward:
 *   - fill the onboarding questions (personalize their Nexus experience), or
 *   - skip straight to the organization's catalog.
 *
 * Reached at /:lang/auth-flow/joined?tenant=<tenantId>, navigated to by the
 * shared useStoryMemberOrgs().submitJoin when result.autoAccepted is non-empty.
 * Pending (non-auto-accept) joins never land here — they just toast.
 *
 * Design mirrors the stories family (SlideDiscoverOrg / SlideNexusHero): a
 * vivid gradient, soft blur blobs, drifting confetti, a white badge, a big
 * headline, and staggered framer-motion entrances. Bilingual (HE + EN).
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';
import { fetchPublicTenant } from '../../services/publicTenant.service';
import { useStoryMemberOrgs } from '../../hooks/useStoryMemberOrgs';

/** Fixed confetti pieces (deterministic positions so they don't reshuffle). */
const CONFETTI = [
  { left: '8%', color: '#fbbf24', delay: 0.0, size: 10, rot: 18 },
  { left: '20%', color: '#34d399', delay: 0.5, size: 8, rot: -24 },
  { left: '33%', color: '#f472b6', delay: 0.2, size: 12, rot: 40 },
  { left: '47%', color: '#60a5fa', delay: 0.8, size: 9, rot: -12 },
  { left: '61%', color: '#fbbf24', delay: 0.35, size: 11, rot: 30 },
  { left: '74%', color: '#a78bfa', delay: 0.65, size: 8, rot: -36 },
  { left: '86%', color: '#34d399', delay: 0.15, size: 10, rot: 22 },
  { left: '92%', color: '#f472b6', delay: 0.9, size: 9, rot: -18 },
];

/**
 * Render the post-auto-join celebration screen.
 * @returns the full-screen celebration element with two CTAs.
 */
export default function JoinedCelebration() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { me } = useAuth();
  const { enterOrg } = useStoryMemberOrgs();

  const tenantId = sp.get('tenant');

  // ── Resolve the org name/logo: prefer the freshly-reloaded membership, fall
  //    back to the public tenant endpoint if /api/me hasn't caught up. ───────
  const membership = (me?.memberships ?? []).find((m) => m.tenantId === tenantId);
  const [publicName, setPublicName] = useState<string | null>(null);
  useEffect(() => {
    if (tenantId && !membership) {
      let active = true;
      fetchPublicTenant(tenantId).then((i) => {
        if (active) setPublicName(i?.organizationName ?? null);
      });
      return () => { active = false; };
    }
  }, [tenantId, membership]);

  // ── No tenant in the URL → nothing to celebrate; bounce to the catalog. ───
  useEffect(() => {
    if (!tenantId) navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  }, [tenantId, lang, navigate]);
  if (!tenantId) return null;

  const orgName = membership?.tenantName ?? publicName ?? (isHe ? 'הארגון' : 'the organization');
  const orgLogo = membership?.logoUrl;

  /** Go fill the onboarding questions. Onboarding stamps completedAt at its end. */
  const handleFill = (): void => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  /** Skip onboarding and open the joined org's catalog (marks profile complete). */
  const handleSkip = (): void => {
    void enterOrg(tenantId);
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 52%, #ec4899 100%)' }}
    >
      {/* Soft ambient blur blobs. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)', top: '-12%', right: '-10%', filter: 'blur(48px)' }}
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.25)', bottom: '-6%', left: '-6%', filter: 'blur(40px)' }}
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut' }}
        />
      </div>

      {/* Drifting confetti pieces. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            className="absolute rounded-[2px]"
            style={{ left: c.left, top: '-6%', width: c.size, height: c.size * 1.6, background: c.color }}
            initial={{ y: '-10%', opacity: 0, rotate: 0 }}
            animate={{ y: '115vh', opacity: [0, 1, 1, 0.8], rotate: c.rot * 8 }}
            transition={{ repeat: Infinity, duration: 6 + (i % 3), delay: c.delay, ease: 'easeIn' }}
          />
        ))}
      </div>

      {/* Badge: org logo when available, otherwise a celebratory check mark. */}
      <div className="flex-shrink-0 px-6 pt-14 pb-1 relative z-10 flex justify-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
          className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center overflow-hidden shadow-xl"
        >
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="h-14 w-14 object-contain" />
          ) : (
            <CelebrationCheck />
          )}
        </motion.div>
      </div>

      {/* Headline + subline. */}
      <div className="flex-shrink-0 pt-5 relative z-10 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="text-white font-extrabold text-[34px] leading-tight"
        >
          {isHe ? `ברכות! הצטרפתם ל${orgName}` : `Congratulations! You joined ${orgName}`}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38, ease: 'easeOut' }}
          className="text-white/90 text-base mt-4 max-w-[92%] leading-relaxed"
        >
          {isHe
            ? 'מלאו כמה פרטים חשובים שיעזרו לנו להכיר אתכם ולהתאים את חוויית Nexus באופן אישי עבורכם.'
            : 'Fill in a few important details that help us get to know you and personalize your Nexus experience.'}
        </motion.p>
      </div>

      {/* Actions, anchored low like the hero. */}
      <div className="flex-1 flex flex-col justify-end relative z-10 px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={handleFill}
            className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
            style={{ background: '#ffffff', color: '#6d28d9' }}
          >
            {isHe ? 'מלאו את הפרטים' : 'Fill in the details'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2.5 text-sm font-semibold text-white/90 active:scale-95"
          >
            {isHe ? `דלגו ישירות לקטלוג של ${orgName}` : `Skip straight to ${orgName}'s catalog`}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * White-on-gradient celebratory check badge used when the org has no logo.
 * @returns an inline SVG check mark inside a soft violet disc.
 */
function CelebrationCheck() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="#7c3aed" />
      <path
        d="M15 24.5l6 6 12-13"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
