/**
 * TenantSwitchSheet - bottom sheet for switching the CURRENT view between the
 * organizations the user is a member of and the Nexus catalog, plus a "join
 * another organization" entry. Opened from the org-name chip under the TopBar
 * avatar (it replaces the old top-left WalletTenantSwitcher pill and the mock
 * TenantSheet).
 *
 * Switching only updates the ?tenant / ?ecosystem URL state - it does not
 * persist a default landing (that is DefaultTenantSheet's job). Styled like the
 * other wallet bottom sheets (DefaultTenantSheet / LoginSheet): mobile =
 * bottom-anchored sheet, desktop (lg+) = centered modal. Portaled to <body> so
 * the fixed sheet escapes the sticky TopBar stacking context.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { createJoinRequests } from '../../services/walletTenants.service';
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
  const { requireAuth } = useAuthGate();
  const dragY = useRef(0);
  const [showJoin, setShowJoin] = useState(false);

  // Member-facing: only tenants where the user is a 'member' are switchable
  // views (privileged/admin tenants belong in the dashboard).
  const memberships = (me?.memberships ?? []).filter((m) => m.isMember);
  const isEcosystem = searchParams.get('ecosystem') === '1';
  const activeTenantId = !isEcosystem ? searchParams.get('tenant') : null;

  // Options: each org the user belongs to, plus the Nexus catalog (tenantId null).
  const options: Array<{ key: string; label: string; tenantId: string | null; logoUrl?: string }> = [
    ...memberships.map((m) => ({ key: m.tenantId, label: m.tenantName, tenantId: m.tenantId, logoUrl: m.logoUrl })),
    { key: 'ecosystem', label: isHe ? 'קטלוג Nexus' : 'Nexus catalog', tenantId: null },
  ];

  /** Switch the current view. tenantId null -> the Nexus (ecosystem) catalog. */
  const pick = (tenantId: string | null): void => {
    const next = new URLSearchParams(searchParams);
    if (tenantId) {
      next.set('tenant', tenantId);
      next.delete('ecosystem');
    } else {
      next.set('ecosystem', '1');
      next.delete('tenant');
    }
    navigate({ search: next.toString() }, { replace: true });
    onClose();
  };

  /** Open the join picker (gated: anonymous visitors are asked to log in first). */
  const openJoin = async (): Promise<void> => {
    const authed = await requireAuth({ promptMessage: t.auth.genericPrompt });
    if (authed) setShowJoin(true);
  };

  /**
   * Send the chosen join request and toast the outcome:
   *   - auto-accepted: "you joined {org}" + refresh /api/me + switch into it.
   *   - pending (created / already pending): "the org will review your request
   *     and you'll be notified".
   * @param ids selected tenantIds (single-select picker -> length 0 or 1).
   */
  const submitJoin = async (ids: string[]): Promise<void> => {
    setShowJoin(false);
    if (ids.length === 0) return;
    try {
      const result = await createJoinRequests(ids);

      if (result.autoAccepted.length > 0) {
        const tid = result.autoAccepted[0]!;
        // reload() returns the refreshed /api/me, which now includes the joined
        // org - read the name from there (the closure `me` is still stale).
        const updated = await reload();
        const name = (updated?.memberships ?? []).find((m) => m.tenantId === tid)?.tenantName;
        toast.success(isHe ? `הצטרפת ל${name ?? 'הארגון'}!` : `You joined ${name ?? 'the organization'}!`);
        pick(tid); // switch into the joined org + close
        return;
      }

      const pending =
        result.created.length > 0 || result.skipped.some((s) => s.reason === 'already_pending');
      if (pending) {
        toast.info(
          isHe
            ? 'הבקשה נשלחה. הארגון יבחן אותה ותקבלו עדכון בהמשך.'
            : "Request sent. The organization will review it and you'll be notified.",
        );
        return;
      }

      toast.error(isHe ? 'שליחת הבקשה נכשלה' : 'Could not send request');
    } catch (e) {
      console.error('[wallet-join] switch-sheet join failed:', e);
      toast.error(isHe ? 'שליחת הבקשה נכשלה' : 'Could not send request');
    }
  };

  // The join picker replaces the switch sheet while open (one sheet at a time).
  if (showJoin) {
    return createPortal(
      <TenantDiscoverySheet onClose={() => setShowJoin(false)} onSubmit={(ids) => { void submitJoin(ids); }} />,
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
        className="fixed bottom-0 left-0 right-0 z-[210] mx-auto flex w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-xl lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
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
                    style={{ background: isNexus ? '#0f172a' : colorFor(opt.label) }}
                  >
                    {isNexus ? (
                      <img src="/nexus-logo.png" alt="" className="h-6 w-6 object-contain sm:h-8 sm:w-8" style={{ filter: 'brightness(0) invert(1)' }} />
                    ) : opt.logoUrl ? (
                      <img src={opt.logoUrl} alt="" className="h-6 w-6 object-contain sm:h-8 sm:w-8" style={{ filter: 'brightness(0) invert(1)' }} />
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
