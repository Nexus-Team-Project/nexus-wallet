/**
 * Shared stories-styled tenant-discovery bottom sheet. Used by the
 * non-member join branch and the WalletTenantSwitcher "Join an
 * organization" entry. Searches discoverTenants; returns the selected
 * tenantIds via onSubmit.
 *
 * Self-contained: it owns its own debounced discoverTenants fetch and
 * its own multi-select state, so a caller only has to wire onSubmit +
 * onClose. Mobile = bottom-anchored sheet; desktop (lg+) = centered
 * modal.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  discoverTenants,
  listMyJoinRequests,
  type DiscoverableTenant,
} from '../../services/walletTenants.service';

/** One organization the user already belongs to, shown badged at the top. */
export interface MemberOrgOption {
  tenantId: string;
  tenantName: string;
  logoUrl?: string;
  /** Org brand color ("#rrggbb"), when set; the first-login accent. */
  brandColor?: string;
}

interface TenantDiscoverySheetProps {
  /** Fires with the selected domain tenantIds when the user confirms. */
  onSubmit: (tenantIds: string[]) => void;
  /** Closes the sheet without submitting. */
  onClose: () => void;
  /**
   * Organizations the user is already a member of. When provided together
   * with onPickMember, they render at the top of the list with a "Member"
   * badge so the user can jump straight into one. Only the stories flow
   * passes these; the switcher leaves them undefined (it already lists
   * member orgs in its own dropdown).
   */
  memberOrgs?: MemberOrgOption[];
  /** Called with the tenantId when the user taps one of their member orgs. */
  onPickMember?: (tenantId: string) => void;
  /**
   * A tenant to hide from the joinable list - typically the org whose promos
   * the user is currently viewing. Without this, a non-member who arrived via
   * a tenant link would see that same org listed under "find another org".
   */
  excludeTenantId?: string;
}

/** Two-letter initials fallback when a tenant has no logo. */
function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return [...trimmed].slice(0, 2).join('').toUpperCase();
}

/** Stable hash -> color so the same tenant always renders the same tile. */
function colorFor(name: string): string {
  const PALETTE = [
    '#1e40af', '#059669', '#F97316', '#DC2626', '#2563EB',
    '#16A34A', '#CA8A04', '#0D9488', '#7C3AED', '#0284C7',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

/**
 * Self-contained tenant-discovery sheet.
 * @param onSubmit receives the selected tenantIds[] on confirm.
 * @param onClose closes the sheet without submitting.
 * @returns the animated bottom-sheet / modal element.
 */
export default function TenantDiscoverySheet({ onSubmit, onClose, memberOrgs, onPickMember, excludeTenantId }: TenantDiscoverySheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Backdrop drag-to-dismiss tracking for the bottom-sheet variant (mobile).
  const dragY = useRef(0);

  // ── Own debounced discoverTenants search (lifted in, self-contained) ──
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<DiscoverableTenant[]>([]);
  const [loading, setLoading] = useState(false);
  // Single-select: the user joins one organization at a time. Tapping a
  // different row replaces the selection; tapping the selected row clears it.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tenants the user already has a request for (pending / approved / auto-
  // accepted) — these must NOT appear as joinable, since you can't request to
  // join an org you already asked to join.
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let active = true;
    listMyJoinRequests()
      .then((reqs) => {
        if (!active) return;
        setRequestedIds(
          new Set(
            reqs
              .filter((r) => r.status === 'pending' || r.status === 'approved' || r.status === 'auto_accepted')
              .map((r) => r.tenantId),
          ),
        );
      })
      .catch((e) => console.error('[wallet-discover] load my join requests failed:', e));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const handle = setTimeout(() => {
      discoverTenants(search)
        .then((list) => { if (active) setTenants(list); })
        .catch((err) => {
          // Non-fatal: a failed search just shows the empty state. Log so it
          // is not silently swallowed (per repo error-handling rules).
          if (active) {
            setTenants([]);
            console.error('[wallet-discover] discoverTenants failed:', err);
          }
        })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(handle); };
  }, [search]);

  /**
   * Select a tenant (single-select); tapping the selected one clears it.
   * Tenants without an active catalog ("soon") are not joinable, so taps on
   * them are ignored — a UX guard that mirrors the backend rejection.
   */
  const toggle = (tenantId: string): void => {
    const t = tenants.find((x) => x.tenantId === tenantId);
    if (t && !t.catalogActive) return;
    setSelectedId((prev) => (prev === tenantId ? null : tenantId));
  };

  const canSubmit = selectedId !== null;

  // ── Member orgs shown at the top (stories flow only) ──────────────────────
  // The user's own organizations, matched against the same search box, so they
  // can jump straight into one instead of only seeing joinable orgs. The
  // backend discoverTenants already excludes orgs the user has a role in, but
  // we also filter them out defensively to guarantee no duplicate row.
  const memberIds = new Set((memberOrgs ?? []).map((m) => m.tenantId));
  const query = search.trim().toLowerCase();
  const memberMatches = (memberOrgs ?? []).filter((m) =>
    m.tenantName.toLowerCase().includes(query),
  );
  // Joinable (active catalog) tenants first, then the "soon" ones. The backend
  // already sorts alphabetically and JS sort is stable, so names stay ordered
  // within each group.
  const discovered = tenants
    .filter((t) => !memberIds.has(t.tenantId) && !requestedIds.has(t.tenantId) && t.tenantId !== excludeTenantId)
    .sort((a, b) => Number(b.catalogActive) - Number(a.catalogActive));
  const showMemberSection = !!onPickMember && memberMatches.length > 0;
  const showMoreHeader = showMemberSection && (discovered.length > 0 || loading);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onPointerDown={(e) => { dragY.current = e.clientY; }}
        onPointerUp={(e) => { if (e.clientY - dragY.current > 40) onClose(); }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <motion.div
        key="sheet"
        dir={isHe ? 'rtl' : 'ltr'}
        className="fixed bottom-0 left-0 right-0 z-[210] mx-auto flex w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-xl lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
        style={{ maxHeight: '82vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_e, info) => { if (info.offset.y > 60) onClose(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="flex-shrink-0 px-5 pb-3 sm:px-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">
            {isHe ? 'בחר ארגון' : 'Choose an organization'}
          </h2>
          <div className="relative">
            <span
              className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                fontSize: 18,
                color: 'var(--color-text-muted)',
                [isHe ? 'right' : 'left']: 12,
              } as React.CSSProperties}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={isHe ? 'חיפוש ארגון...' : 'Search organization...'}
              className="w-full rounded-2xl border-2 border-border bg-surface py-3 text-sm outline-none transition-colors focus:border-primary sm:py-4 sm:text-base"
              style={{
                [isHe ? 'paddingRight' : 'paddingLeft']: 40,
                [isHe ? 'paddingLeft' : 'paddingRight']: 16,
                color: 'var(--color-text-primary)',
              } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
          <div className="space-y-2 pb-4 sm:space-y-3">
            {/* ── Your organizations (member orgs) — stories flow only ── */}
            {showMemberSection && (
              <>
                <p className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {isHe ? 'הארגונים שלך' : 'Your organizations'}
                </p>
                {memberMatches.map((m, i) => (
                  <motion.button
                    key={m.tenantId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => onPickMember?.(m.tenantId)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-white px-4 py-3 text-start transition-all hover:border-primary sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                      style={{
                        // Real logo -> white tile so it shows in its true colors.
                        // No logo -> colored tile with initials.
                        background: m.logoUrl ? '#fff' : colorFor(m.tenantName),
                        border: m.logoUrl ? '1px solid #e5e7eb' : undefined,
                      }}
                    >
                      {m.logoUrl ? (
                        <img
                          src={m.logoUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        deriveInitials(m.tenantName)
                      )}
                    </div>
                    <span className="flex-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                      {m.tenantName}
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {isHe ? 'חבר/ה' : 'Member'}
                    </span>
                    <span
                      className="material-symbols-outlined flex-shrink-0 text-text-muted"
                      style={{ fontSize: 18 }}
                    >
                      {isHe ? 'chevron_left' : 'chevron_right'}
                    </span>
                  </motion.button>
                ))}
              </>
            )}

            {/* ── Subheader for joinable orgs, only when a member section sits above ── */}
            {showMoreHeader && (
              <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {isHe ? 'ארגונים נוספים' : 'More organizations'}
              </p>
            )}

            {/* ── Joinable orgs (discoverTenants) ── */}
            {loading && discovered.length === 0 ? (
              !showMemberSection && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                  {isHe ? 'טוען...' : 'Loading...'}
                </p>
              )
            ) : discovered.length === 0 ? (
              !showMemberSection && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                  {isHe ? 'לא נמצאו ארגונים' : 'No organizations found'}
                </p>
              )
            ) : (
              discovered.map((t, i) => {
                const isPicked = selectedId === t.tenantId;
                // "soon" = catalog not activated yet: shown but not joinable.
                const isSoon = !t.catalogActive;
                return (
                  <motion.button
                    key={t.tenantId}
                    type="button"
                    disabled={isSoon}
                    aria-disabled={isSoon}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => toggle(t.tenantId)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all sm:gap-4 sm:px-5 sm:py-4 ${
                      isSoon ? 'cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: isSoon
                        ? '#f1f5f9'
                        : isPicked
                          ? 'rgba(15,23,42,0.04)'
                          : '#fff',
                      border: isSoon
                        ? '2px solid #e2e8f0'
                        : isPicked
                          ? '2px solid #0f172a'
                          : '2px solid #ebebf0',
                    }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                      style={{
                        // Real logo -> white tile so it shows in its true colors
                        // (greyed a touch when the org is "soon"). No logo ->
                        // colored tile (or grey when soon) with initials.
                        background: t.logoUrl ? '#fff' : (isSoon ? '#cbd5e1' : colorFor(t.tenantName)),
                        border: t.logoUrl ? '1px solid #e5e7eb' : undefined,
                      }}
                    >
                      {t.logoUrl ? (
                        <img
                          src={t.logoUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          style={isSoon ? { filter: 'grayscale(1)', opacity: 0.7 } : undefined}
                        />
                      ) : (
                        deriveInitials(t.tenantName)
                      )}
                    </div>
                    <span
                      className="flex-1 text-sm font-semibold sm:text-base"
                      style={{ color: isSoon ? '#94a3b8' : 'var(--color-text-primary)' }}
                    >
                      {t.tenantName}
                    </span>
                    {isSoon ? (
                      <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {isHe ? 'בקרוב' : 'Soon'}
                      </span>
                    ) : isPicked ? (
                      <span
                        className="material-symbols-outlined flex-shrink-0 text-slate-900"
                        style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    ) : (
                      <span
                        className="material-symbols-outlined flex-shrink-0 text-text-muted"
                        style={{ fontSize: 18 }}
                      >
                        {isHe ? 'chevron_left' : 'chevron_right'}
                      </span>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Confirm bar - submits the selected tenantIds via onSubmit. */}
        <div className="flex-shrink-0 px-5 pb-6 pt-2 sm:px-8">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(selectedId ? [selectedId] : [])}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40 sm:py-4 sm:text-base"
          >
            {isHe ? 'המשך' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
