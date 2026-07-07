/**
 * TenantSwitchSheet - bottom sheet for switching the CURRENT view between the
 * organizations the user is a member of and the Nexus catalog, plus a "join
 * another organization" entry. Opened from the org-name chip under the TopBar
 * avatar (it replaces the old top-left WalletTenantSwitcher pill and the mock
 * TenantSheet).
 *
 * Switching updates the ?tenant / ?ecosystem URL state AND persists the choice
 * as the member's default landing context (so the next visit reopens on it) —
 * this is the single place a default is chosen now; the old DefaultTenantSheet
 * was removed. Styled like the other wallet bottom sheets (LoginSheet): mobile =
 * bottom-anchored sheet, desktop (lg+) = centered modal. Portaled to <body> so
 * the fixed sheet escapes the sticky TopBar stacking context.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { appToast, tenantSender } from '../../lib/appToast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { createJoinRequests, listMyJoinRequests, setDefaultTenant } from '../../services/walletTenants.service';
import { useActiveContextStore } from '../../stores/activeContextStore';
import TenantDiscoverySheet from './TenantDiscoverySheet';

interface TenantSwitchSheetProps {
  /** Closes the sheet. */
  onClose: () => void;
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
 * @param onClose closes the sheet.
 * @returns the animated bottom-sheet / modal element (or the join picker).
 */
export default function TenantSwitchSheet({ onClose }: TenantSwitchSheetProps) {
  const { me, reload } = useAuth();
  const { language, t } = useLanguage();
  const isHe = language === 'he';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const dragY = useRef(0);
  const [showJoin, setShowJoin] = useState(false);
  // True while a join request is in flight — the picker shows a "Joining…"
  // spinner and stays open until the result, so the ~1-2s round-trip isn't a
  // blank wait before the result toast appears.
  const [joining, setJoining] = useState(false);

  // Member-facing: only tenants where the user is a 'member' are switchable
  // views (privileged/admin tenants belong in the dashboard).
  const memberships = (me?.memberships ?? []).filter((m) => m.isMember);
  const isEcosystem = searchParams.get('ecosystem') === '1';
  const activeTenantId = !isEcosystem ? searchParams.get('tenant') : null;

  // Orgs the user has a PENDING join request for — shown badged + non-clickable
  // (can't switch into an org you haven't joined yet). Excludes orgs already a
  // member of (those are in the switchable list).
  const [pendingOrgs, setPendingOrgs] = useState<Array<{ tenantId: string; tenantName: string }>>([]);
  useEffect(() => {
    // Pending join requests are a per-user, authenticated lookup. Anonymous
    // visitors have none and the endpoint requires a token, so skip the call
    // entirely when not signed in — otherwise it 401s with "Missing or invalid
    // authorization header" on every open of the switcher.
    if (!isAuthenticated) {
      setPendingOrgs([]);
      return;
    }
    let active = true;
    listMyJoinRequests()
      .then((reqs) => {
        if (!active) return;
        const memberIds = new Set(memberships.map((m) => m.tenantId));
        setPendingOrgs(
          reqs
            .filter((r) => r.status === 'pending' && !memberIds.has(r.tenantId))
            .map((r) => ({ tenantId: r.tenantId, tenantName: r.tenantName ?? r.tenantId })),
        );
      })
      .catch((e) => console.error('[wallet] load pending join requests failed:', e));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Options: each org the user belongs to, plus the Nexus catalog (tenantId null).
  const options: Array<{ key: string; label: string; tenantId: string | null; logoUrl?: string }> = [
    ...memberships.map((m) => ({ key: m.tenantId, label: m.tenantName, tenantId: m.tenantId, logoUrl: m.logoUrl })),
    { key: 'ecosystem', label: isHe ? 'קטלוג Nexus' : 'Nexus catalog', tenantId: null },
  ];

  /**
   * Switch the current view. tenantId null -> the Nexus (ecosystem) catalog.
   * Picking here also persists the choice as the member's DEFAULT landing
   * context, so the next visit (with no ?tenant in the URL) reopens on it —
   * this replaces the removed "default view on login" menu entry.
   */
  const pick = (tenantId: string | null): void => {
    const next = new URLSearchParams(searchParams);
    if (tenantId) {
      next.set('tenant', tenantId);
      next.delete('ecosystem');
    } else {
      next.set('ecosystem', '1');
      next.delete('tenant');
    }
    // Record the pick as the durable active context so it survives back/forward
    // navigation (the LanguageRouter reconciles the URL to it on POP).
    useActiveContextStore.getState().setContext(
      tenantId ? { kind: 'tenant', tenantId } : { kind: 'ecosystem' },
    );
    // Persist as the default landing context. Fire-and-forget: a failure here
    // must not block the view switch (the URL change is the user-visible part).
    void setDefaultTenant(tenantId).catch((e) =>
      console.error('[wallet-switch] persist default tenant failed (non-fatal):', e),
    );
    navigate({ search: next.toString() }, { replace: true });
    onClose();
  };

  /** Open the join picker. Anonymous visitors must log in first — close this
   *  sheet so the login sheet isn't stuck behind it. */
  const openJoin = (): void => {
    if (!isAuthenticated) {
      onClose();
      void requireAuth({ promptMessage: t.auth.genericPrompt });
      return;
    }
    setShowJoin(true);
  };

  /**
   * Send the chosen join request and toast the outcome:
   *   - auto-accepted: "you joined {org}" + refresh /api/me + switch into it.
   *   - pending (created / already pending): "the org will review your request
   *     and you'll be notified".
   * @param ids selected tenantIds (single-select picker -> length 0 or 1).
   */
  const submitJoin = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    // Keep the picker open with a "Joining…" spinner during the request so the
    // user gets immediate feedback; the sheet closes + the result toast fires
    // when it resolves (the finally block). The spinner overlay means there is
    // no flash back to the switch list.
    setJoining(true);
    try {
      const result = await createJoinRequests(ids);

      if (result.autoAccepted.length > 0) {
        const tid = result.autoAccepted[0]!;
        // reload() returns the refreshed /api/me, which now includes the joined
        // org - read the name + real logo from there (the closure `me` is stale).
        const updated = await reload();
        const joinedOrg = (updated?.memberships ?? []).find((m) => m.tenantId === tid);
        const orgLabel = joinedOrg?.tenantName ?? (isHe ? 'הארגון' : 'the organization');
        // Branded toast: the tenant's real logo as the avatar, deep-links into
        // the org's catalog when tapped.
        appToast.success(
          isHe ? `הצטרפת ל${orgLabel}!` : `You joined ${orgLabel}!`,
          {
            category: 'social',
            sender: tenantSender(tid, orgLabel, joinedOrg?.logoUrl),
            deepLink: `/store?tenant=${encodeURIComponent(tid)}`,
          },
        );
        // Switch into the joined org and make it the default landing context.
        useActiveContextStore.getState().setContext({ kind: 'tenant', tenantId: tid });
        void setDefaultTenant(tid).catch((e) =>
          console.error('[wallet-switch] persist default tenant failed (non-fatal):', e),
        );
        const next = new URLSearchParams(searchParams);
        next.set('tenant', tid);
        next.delete('ecosystem');
        navigate({ search: next.toString() }, { replace: true });
        return;
      }

      const pending =
        result.created.length > 0 || result.skipped.some((s) => s.reason === 'already_pending');
      if (pending) {
        appToast.info(
          isHe
            ? 'הבקשה נשלחה. הארגון יבחן אותה ותקבלו עדכון בהמשך.'
            : "Request sent. The organization will review it and you'll be notified.",
          { category: 'social' },
        );
        return;
      }

      appToast.error(isHe ? 'שליחת הבקשה נכשלה' : 'Could not send request');
    } catch (e) {
      console.error('[wallet-join] switch-sheet join failed:', e);
      appToast.error(isHe ? 'שליחת הבקשה נכשלה' : 'Could not send request');
    } finally {
      // Resolve the loading state and close both the picker and the switch
      // sheet — the result toast (success / pending / error) is already queued.
      setJoining(false);
      setShowJoin(false);
      onClose();
    }
  };

  // The join picker replaces the switch sheet while open (one sheet at a time).
  if (showJoin) {
    return createPortal(
      <TenantDiscoverySheet onClose={() => setShowJoin(false)} onSubmit={(ids) => { void submitJoin(ids); }} submitting={joining} />,
      document.body,
    );
  }

  return createPortal(
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
        className="fixed bottom-4 inset-x-3 z-[210] mx-auto flex max-w-xl flex-col rounded-3xl bg-white shadow-2xl sm:max-w-xl lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
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
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {isHe ? 'מעבר בין ארגונים' : 'Switch organization'}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {isHe ? 'בחרו ארגון או את קטלוג Nexus' : 'Choose an organization or the Nexus catalog'}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
          <div className="space-y-2 pb-4 sm:space-y-3">
            {options.map((opt, i) => {
              const active = opt.tenantId === null ? isEcosystem : activeTenantId === opt.tenantId;
              const isNexus = opt.tenantId === null;
              return (
                <motion.button
                  key={opt.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  type="button"
                  onClick={() => pick(opt.tenantId)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all sm:gap-4 sm:px-5 sm:py-4"
                  style={{
                    background: active ? 'rgba(15,23,42,0.04)' : '#fff',
                    border: active ? '2px solid #0f172a' : '2px solid #ebebf0',
                  }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                    style={{
                      // Nexus ecosystem -> dark tile with white Nexus mark.
                      // Real tenant logo -> white tile so it shows its true colors.
                      // No logo -> colored tile with initials.
                      background: isNexus ? '#0f172a' : opt.logoUrl ? '#fff' : colorFor(opt.label),
                      border: !isNexus && opt.logoUrl ? '1px solid #e5e7eb' : undefined,
                    }}
                  >
                    {isNexus ? (
                      <img src="/nexus-logo.png" alt="" className="h-6 w-6 object-contain sm:h-8 sm:w-8" style={{ filter: 'brightness(0) invert(1)' }} />
                    ) : opt.logoUrl ? (
                      <img src={opt.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      deriveInitials(opt.label)
                    )}
                  </div>
                  <span className="flex-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  {active && (
                    <span className="material-symbols-outlined flex-shrink-0 text-slate-900" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </motion.button>
              );
            })}

            {/* Pending-approval orgs — non-clickable, badged. */}
            {pendingOrgs.map((org) => (
              <div
                key={`pending-${org.tenantId}`}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start sm:gap-4 sm:px-5 sm:py-4"
                style={{ background: '#fff', border: '2px solid #ebebf0', opacity: 0.75 }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                  style={{ background: colorFor(org.tenantName) }}
                >
                  {deriveInitials(org.tenantName)}
                </div>
                <span className="flex-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                  {org.tenantName}
                </span>
                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {t.authFlow.pendingApprovalBadge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Join another organization. */}
        <div className="flex-shrink-0 px-5 pb-6 pt-2 sm:px-8">
          <button
            type="button"
            onClick={() => { void openJoin(); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface sm:py-3.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
            {isHe ? 'הצטרפות לארגון' : 'Join an organization'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
