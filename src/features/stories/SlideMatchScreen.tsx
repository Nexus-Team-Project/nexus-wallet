/**
 * SlideMatchScreen — the story-styled "we found your organization(s)" step,
 * reached when the user taps "קליק להמשך" and we matched him (by member role)
 * to one or more organizations. Sourced from props (his real memberships /
 * the URL tenant), not from stores.
 *
 * - Single match: confirm "continue with {org}" or "continue without an
 *   organization".
 * - Multiple matches: a SINGLE-SELECT list (pick exactly one org, logos shown)
 *   plus "continue without an organization".
 *
 * Visual language matches the other story slides (gradient, blur blobs,
 * framer-motion). The bottom "continue with another organization" link is
 * present, like every story step.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { StoryJoinOtherLink } from './StoryJoinOtherLink';
import type { MemberOrgOption } from '../../components/wallet/TenantDiscoverySheet';

interface SlideMatchScreenProps {
  /** Matched organizations (member role). 1 = single, >1 = select one. */
  orgs: MemberOrgOption[];
  /** Continue with an existing membership (existing member, no new join). */
  onContinueWith: (tenantId: string) => void;
  /** Continue with no organization affiliation (Nexus catalog). */
  onContinueNoAffiliation: () => void;
  /** Open the join picker (the bottom "another organization" link). */
  onJoinOther: () => void;
}

const ACCENT = '#7c3aed';

/** Two-letter initials fallback when an org has no logo. */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

/** Stable hash -> color so the same org always renders the same tile. */
function colorFor(name: string): string {
  const PALETTE = ['#1e40af', '#059669', '#F97316', '#DC2626', '#2563EB', '#7C3AED', '#0D9488', '#CA8A04'];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

/** A small org tile (logo or initials). */
function OrgTile({ org, size = 44 }: { org: MemberOrgOption; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
      style={{ width: size, height: size, background: colorFor(org.tenantName) }}
    >
      {org.logoUrl ? (
        <img src={org.logoUrl} alt="" className="object-contain" style={{ width: size * 0.62, height: size * 0.62, filter: 'brightness(0) invert(1)' }} />
      ) : (
        deriveInitials(org.tenantName)
      )}
    </div>
  );
}

/**
 * @returns the match-screen story slide.
 */
export function SlideMatchScreen({ orgs, onContinueWith, onContinueNoAffiliation, onJoinOther }: SlideMatchScreenProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const multiple = orgs.length > 1;
  const [selectedId, setSelectedId] = useState<string | null>(orgs.length === 1 ? orgs[0]!.tenantId : null);

  const title = multiple
    ? t.authFlow.matchTitleMultiple.replace('{{count}}', String(orgs.length))
    : t.authFlow.matchTitleSingle.replace('{{orgName}}', orgs[0]?.tenantName ?? '');

  const primaryLabel = multiple
    ? t.authFlow.matchContinue
    : t.authFlow.matchContinueWithOrg.replace('{{orgName}}', orgs[0]?.tenantName ?? '');

  const handlePrimary = () => {
    const id = selectedId ?? orgs[0]?.tenantId;
    if (id) onContinueWith(id);
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating blur blobs. */}
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

      {/* Badge: the single org's logo, or a match mark for multiple. */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1 relative z-10 flex justify-start">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="h-16 w-16 rounded-2xl bg-white/95 flex items-center justify-center overflow-hidden shadow-lg"
        >
          {!multiple && orgs[0] ? (
            <OrgTile org={orgs[0]} size={40} />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill={ACCENT} />
              <path d="M8 12.5l2.5 2.5L16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Headline. */}
      <div className="flex-shrink-0 pt-4 relative z-10 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="text-white font-extrabold text-[30px] leading-tight"
        >
          {title}
        </motion.h2>
      </div>

      {/* Content: single org card, or single-select list for multiple. */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10 px-6 pt-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
          className="space-y-2.5"
        >
          {orgs.map((org) => {
            const selected = selectedId === org.tenantId;
            return (
              <button
                key={org.tenantId}
                type="button"
                onClick={() => setSelectedId(org.tenantId)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-start transition-all"
                style={{ border: selected ? `2px solid ${ACCENT}` : '2px solid transparent', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
              >
                <OrgTile org={org} />
                <span className="flex-1 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {org.tenantName}
                </span>
                {(multiple || selected) && (
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: selected ? ACCENT : '#e5e7eb' }}
                  >
                    {selected && (
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Actions. */}
      <div className="flex-shrink-0 relative z-10 px-6 pb-8 pt-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            disabled={multiple && !selectedId}
            onClick={handlePrimary}
            className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.96)', color: ACCENT }}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onContinueNoAffiliation}
            className="w-full py-2 text-sm font-medium text-white/85 active:scale-95"
          >
            {t.authFlow.matchContinueNoAffiliation}
          </button>
          <StoryJoinOtherLink onClick={onJoinOther} />
        </motion.div>
      </div>
    </div>
  );
}
