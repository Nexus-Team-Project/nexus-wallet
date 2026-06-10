/**
 * SlideMatchScreen — the "we found your organization(s)" step, reached when the
 * user taps "קליק להמשך" and we matched him (by member role) to one or more
 * organizations. Sourced from props (his real memberships / the URL tenant),
 * NOT from stores — the parent (AuthFlowStories) owns the behavior + backend.
 *
 * Behavior (unchanged):
 * - Single match: confirm "continue with {org}" or "continue without an org".
 * - Multiple matches (and/or a join target): a SINGLE-SELECT list (pick one).
 * - The bottom "continue with another organization" link opens the join picker.
 *
 * Styling (ported from `main`): a clean, light app-surface screen — verified
 * header + subtitle + a "signed in as" identity chip, a brand-color org card for
 * the single case (or light selectable rows for many), and brand-color buttons.
 * The accent follows the selected org's brand color (falls back to the default).
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { StoryJoinOtherLink } from './StoryJoinOtherLink';
import type { MemberOrgOption } from '../../components/wallet/TenantDiscoverySheet';

interface SlideMatchScreenProps {
  /** Matched organizations (member role). 1 = single, >1 = select one. */
  orgs: MemberOrgOption[];
  /**
   * The URL tenant the user arrived through but is NOT a member of, offered as a
   * distinct "join" option (auto-selected). Only set when the user also has
   * member orgs to choose between. Undefined/null = no join option.
   */
  joinTarget?: MemberOrgOption | null;
  /** Continue with an existing membership (existing member, no new join). */
  onContinueWith: (tenantId: string) => void;
  /** Join the URL tenant (new join — a request is sent when the questions start). */
  onContinueJoin?: (tenantId: string) => void;
  /** Continue with no organization affiliation (Nexus catalog). */
  onContinueNoAffiliation: () => void;
  /** Open the join picker (the bottom "another organization" link). */
  onJoinOther: () => void;
}

/** Default accent when an org has no brand color (mirrors main's fallback). */
const DEFAULT_ACCENT = '#635bff';

/** Two-letter initials fallback when an org has no logo. */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

/** Stable hash -> color so the same org always renders the same initials tile. */
function colorFor(name: string): string {
  const PALETTE = ['#1e40af', '#059669', '#F97316', '#DC2626', '#2563EB', '#7C3AED', '#0D9488', '#CA8A04'];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

/** A small org tile (true-color logo on a white tile, or colored initials). */
function OrgTile({ org, size = 44 }: { org: MemberOrgOption; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
      style={{
        width: size,
        height: size,
        background: org.logoUrl ? '#fff' : colorFor(org.tenantName),
        border: org.logoUrl ? '1px solid #e5e7eb' : undefined,
      }}
    >
      {org.logoUrl ? (
        <img src={org.logoUrl} alt="" className="object-contain" style={{ width: size * 0.78, height: size * 0.78 }} />
      ) : (
        deriveInitials(org.tenantName)
      )}
    </div>
  );
}

/**
 * @returns the match-screen slide (light, brand-themed; behavior from props).
 */
export function SlideMatchScreen({ orgs, joinTarget, onContinueWith, onContinueJoin, onContinueNoAffiliation, onJoinOther }: SlideMatchScreenProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const hasJoin = !!joinTarget;
  // Total selectable rows = member orgs + the optional join target.
  const multiple = orgs.length + (hasJoin ? 1 : 0) > 1;
  // Auto-select the join target (the org the user arrived through) when present;
  // otherwise the single member org, or nothing for a multi-member select.
  const [selectedId, setSelectedId] = useState<string | null>(
    joinTarget ? joinTarget.tenantId : orgs.length === 1 ? orgs[0]!.tenantId : null,
  );
  const isJoinSelected = hasJoin && selectedId === joinTarget!.tenantId;
  const selectedOrg = orgs.find((o) => o.tenantId === selectedId);

  // Accent = the selected org's brand color (updates as the selection changes),
  // falling back to the first org's color, then the default.
  const selectedAny = isJoinSelected ? joinTarget : selectedOrg;
  const accent = selectedAny?.brandColor || orgs[0]?.brandColor || joinTarget?.brandColor || DEFAULT_ACCENT;

  // "Signed in as" identity (display-only — does not affect behavior).
  const authMethod = useAuthStore((s) => s.authMethod);
  const authFirstName = useAuthStore((s) => s.firstName);
  const phone = useRegistrationStore((s) => s.phone);
  const profileData = useRegistrationStore((s) => s.profileData);
  const userIdentifier =
    (authMethod === 'google' || authMethod === 'apple') && profileData.email
      ? profileData.email
      : authFirstName ?? phone ?? null;

  // When a join option is present the screen is a "where to continue?" chooser;
  // otherwise the existing single/multiple member-match titles.
  const title = hasJoin
    ? t.authFlow.matchTitleChoose
    : multiple
      ? t.authFlow.matchTitleMultiple.replace('{{count}}', String(orgs.length))
      : t.authFlow.matchTitleSingle.replace('{{orgName}}', orgs[0]?.tenantName ?? '');

  const subtitle = hasJoin || multiple
    ? t.authFlow.matchSubtitleMultiple
    : t.authFlow.matchSubtitleSingle.replace('{{orgName}}', orgs[0]?.tenantName ?? '');

  const primaryLabel = isJoinSelected
    ? t.authFlow.matchJoinWithOrg.replace('{{orgName}}', joinTarget!.tenantName)
    : selectedOrg
      ? t.authFlow.matchContinueWithOrg.replace('{{orgName}}', selectedOrg.tenantName)
      : t.authFlow.matchContinue;

  const handlePrimary = () => {
    const id = selectedId ?? orgs[0]?.tenantId;
    if (!id) return;
    if (isJoinSelected) onContinueJoin?.(id);
    else onContinueWith(id);
  };

  /** Small uppercase section label (only used in the mixed member+join view). */
  const sectionHeader = (label: string) => (
    <p className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
  );

  /** One selectable row (light theme) — a member "continue" row or the join row. */
  const renderRow = (org: MemberOrgOption, isJoin: boolean) => {
    const selected = selectedId === org.tenantId;
    return (
      <button
        key={org.tenantId}
        type="button"
        onClick={() => setSelectedId(org.tenantId)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-start transition-all"
        style={{
          border: `${selected ? 2 : 1}px solid ${selected ? accent : 'var(--color-border)'}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <OrgTile org={org} />
        <span className="flex-1 truncate text-sm font-bold text-text-primary">{org.tenantName}</span>
        {isJoin && (
          <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: accent }}>
            {t.authFlow.matchJoinRowLabel}
          </span>
        )}
        {(multiple || selected) && (
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: selected ? accent : '#e5e7eb' }}
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
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="absolute inset-0 flex flex-col overflow-y-auto"
      style={{ background: 'var(--color-surface)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex flex-col px-5 pb-8 pt-8 animate-fade-in">
        {/* ── Header ── */}
        <div className="mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${accent}1a` }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: accent, fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-primary mb-1">{title}</h1>
          <p className="text-sm text-text-muted leading-snug">{subtitle}</p>

          {userIdentifier && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
              {authMethod === 'google' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              ) : authMethod === 'apple' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '12px' }}>phone</span>
              )}
              <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                {t.authFlow.matchConnectedAs.replace('{{identifier}}', userIdentifier)}
              </span>
            </div>
          )}
        </div>

        {/* ── Org display: brand-color card (single) or selectable rows (many) ── */}
        <div className="mb-6">
          {!multiple && orgs[0] ? (
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}>
              <div className="flex items-center gap-3">
                <OrgTile org={orgs[0]} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base leading-tight truncate">{orgs[0].tenantName}</p>
                  <p className="text-white/70 text-xs mt-0.5">{isHe ? 'חבר ארגון' : 'Organization member'}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {hasJoin && orgs.length > 0 && sectionHeader(t.authFlow.matchYourOrgs)}
              {orgs.map((org) => renderRow(org, false))}
              {joinTarget && (
                <>
                  {sectionHeader(t.authFlow.matchArrivedVia)}
                  {renderRow(joinTarget, true)}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* ── Actions ── */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={multiple && !selectedId}
            onClick={handlePrimary}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: accent }}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onContinueNoAffiliation}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-border text-text-primary bg-white active:scale-[0.98] transition-all hover:bg-surface"
          >
            {t.authFlow.matchContinueNoAffiliation}
          </button>
          <div className="flex justify-center pt-0.5">
            <StoryJoinOtherLink onClick={onJoinOther} variant="onLight" />
          </div>
        </div>
      </div>
    </div>
  );
}
