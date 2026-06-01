/**
 * Bottom sheet for choosing the member's default landing context — the tenant
 * (with its logo) or the Nexus catalog they land on at login. Opened from the
 * avatar/UserMenu. Single-select; persists via setDefaultTenant and refreshes
 * /api/me. Styled like the other wallet bottom sheets (TenantDiscoverySheet /
 * LoginSheet): mobile = bottom-anchored sheet, desktop (lg+) = centered modal.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { setDefaultTenant } from '../../services/walletTenants.service';

interface DefaultTenantSheetProps {
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
 * @returns the animated bottom-sheet / modal element.
 */
export default function DefaultTenantSheet({ onClose }: DefaultTenantSheetProps) {
  const { me, reload } = useAuth();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const dragY = useRef(0);
  const [saving, setSaving] = useState<string | null>(null);

  const memberships = me?.memberships ?? [];
  const currentDefault: string | null = me?.defaultTenantId ?? null;

  // Options: each tenant the member belongs to, plus the Nexus catalog.
  const options: Array<{ key: string; label: string; tenantId: string | null; logoUrl?: string }> = [
    ...memberships.map((m) => ({ key: m.tenantId, label: m.tenantName, tenantId: m.tenantId, logoUrl: m.logoUrl })),
    { key: 'ecosystem', label: isHe ? 'קטלוג Nexus' : 'Nexus catalog', tenantId: null },
  ];

  /** Persist the chosen default, refresh /api/me, then close. */
  const pick = async (tenantId: string | null): Promise<void> => {
    setSaving(tenantId ?? 'ecosystem');
    try {
      await setDefaultTenant(tenantId);
      await reload();
      toast.success(isHe ? 'תצוגת ברירת המחדל עודכנה' : 'Default view updated');
      onClose();
    } catch (e) {
      console.error('[wallet] set default view failed:', e);
      toast.error(isHe ? 'העדכון נכשל' : 'Could not update');
      setSaving(null);
    }
  };

  // Portal to <body> so the fixed sheet escapes the sticky-header stacking
  // context it is rendered within (TopBar) - otherwise the FloatingActions
  // bar paints over the sheet's bottom rows.
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
            {isHe ? 'תצוגת ברירת מחדל בכניסה' : 'Default view on login'}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {isHe ? 'לאן להיכנס כשמתחברים מחדש' : 'Where to land when you log in again'}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
          <div className="space-y-2 pb-6 sm:space-y-3">
            {options.map((opt, i) => {
              const active = currentDefault === opt.tenantId;
              const isNexus = opt.tenantId === null;
              return (
                <motion.button
                  key={opt.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  type="button"
                  disabled={saving !== null}
                  onClick={() => void pick(opt.tenantId)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all disabled:opacity-60 sm:gap-4 sm:px-5 sm:py-4"
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
                      <img
                        src="/nexus-logo.png"
                        alt=""
                        className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    ) : opt.logoUrl ? (
                      <img
                        src={opt.logoUrl}
                        alt=""
                        className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    ) : (
                      deriveInitials(opt.label)
                    )}
                  </div>
                  <span className="flex-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  {active && (
                    <span
                      className="material-symbols-outlined flex-shrink-0 text-slate-900"
                      style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
