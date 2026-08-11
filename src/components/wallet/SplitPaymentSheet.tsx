import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X, Banknote, Undo2, Gift, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import PaymentBrandMark from './PaymentBrandMark';
import type { PaymentMethod } from '../../hooks/usePaymentMethods';

/**
 * Keys are either a plain payment-method id ("pm_001"), or — for the Nexus
 * method, whose balance is itself a composition — `${methodId}:cashback` /
 * `:credits` / `:gifts`. The Nexus row's own total is never a key; it's
 * always the sum of its three bucket keys, shown read-only.
 */
export type SplitAmounts = Record<string, number>;

export interface NexusBreakdown {
  cashback: number;
  credits: number;
  gifts: number;
}

const NEXUS_BUCKETS = ['cashback', 'credits', 'gifts'] as const;
type NexusBucket = (typeof NEXUS_BUCKETS)[number];

const BUCKET_META: Record<NexusBucket, { labelHe: string; labelEn: string; Icon: LucideIcon; color: string }> = {
  cashback: { labelHe: 'קאשבק', labelEn: 'Cashback', Icon: Banknote, color: 'text-green-600' },
  credits: { labelHe: 'זיכויים', labelEn: 'Credits', Icon: Undo2, color: 'text-sky-500' },
  gifts: { labelHe: 'מתנות', labelEn: 'Gifts', Icon: Gift, color: 'text-sky-500' },
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const bucketKey = (methodId: string, bucket: NexusBucket) => `${methodId}:${bucket}`;

interface SplitPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  /** Cash due for the order — the amounts must add up to this. */
  total: number;
  /** How much of `total` a non-Nexus method can absorb. Omitted / Infinity
   *  means uncapped, like a regular card. */
  availableFor: (method: PaymentMethod) => number;
  /** The Nexus balance's own composition — cashback / credits / gift cards —
   *  each editable individually, same hierarchy as the balance-detail
   *  page's "sub-balances" tab. */
  nexusBreakdown?: NexusBreakdown;
  onConfirm: (amounts: SplitAmounts) => void;
}

/**
 * Waterfall seed: each row (in the given order) takes as much of the
 * remaining total as it can hold, and the remainder rolls onto the next.
 * The Nexus method isn't one row for this purpose — its three buckets are
 * filled in turn (cashback, then credits, then gifts) before moving on to
 * the next payment method. Re-run on reorder, but never once the holder
 * has typed their own numbers (see `touched` in the component).
 */
function seedAmounts(
  order: PaymentMethod[],
  total: number,
  availableFor: (m: PaymentMethod) => number,
  nexusBreakdown?: NexusBreakdown,
): SplitAmounts {
  let remaining = total;
  const amounts: SplitAmounts = {};
  for (const m of order) {
    if (m.brand === 'nexus' && nexusBreakdown) {
      for (const bucket of NEXUS_BUCKETS) {
        const cap = nexusBreakdown[bucket];
        const take = Math.max(0, Math.min(remaining, cap));
        amounts[bucketKey(m.id, bucket)] = round2(take);
        remaining = round2(remaining - take);
      }
      continue;
    }
    const take = Math.max(0, Math.min(remaining, availableFor(m)));
    amounts[m.id] = round2(take);
    remaining = round2(remaining - take);
  }
  return amounts;
}

function SplitPaymentRow({
  method,
  amounts,
  onAmountChange,
  onNexusTotalChange,
  nexusBreakdown,
  nexusExpanded,
  onToggleNexus,
  onCollapseNexus,
}: {
  method: PaymentMethod;
  amounts: SplitAmounts;
  onAmountChange: (key: string, value: number) => void;
  onNexusTotalChange: (methodId: string, value: number) => void;
  nexusBreakdown?: NexusBreakdown;
  nexusExpanded: boolean;
  onToggleNexus: () => void;
  onCollapseNexus: () => void;
}) {
  const { language, isRTL } = useLanguage();
  const dragControls = useDragControls();
  const isNexus = method.brand === 'nexus' && !!nexusBreakdown;
  const nexusTotal = isNexus
    ? NEXUS_BUCKETS.reduce((sum, b) => sum + (amounts[bucketKey(method.id, b)] ?? 0), 0)
    : 0;
  const nexusCap = isNexus
    ? NEXUS_BUCKETS.reduce((sum, b) => sum + nexusBreakdown![b], 0)
    : 0;

  return (
    <Reorder.Item value={method} dragListener={false} dragControls={dragControls} className="relative bg-white">
      <div className="py-3.5">
        <div className="flex items-center gap-3">
          <div
            onPointerDown={(e) => {
              // Dragging the Nexus row collapses it first — the hierarchy
              // underneath has no meaning mid-reorder.
              if (isNexus && nexusExpanded) onCollapseNexus();
              dragControls.start(e);
            }}
            className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
            aria-label={language === 'he' ? 'שינוי סדר' : 'Reorder'}
          >
            <GripVertical size={16} />
          </div>

          {/* Identity — right side (RTL start). Tapping it (Nexus only)
              toggles the hierarchy; the amount field below is exempt so
              typing a number never opens or closes it. */}
          <div
            className={`flex items-center gap-3 min-w-0 ${isNexus ? 'cursor-pointer' : ''}`}
            onClick={isNexus ? onToggleNexus : undefined}
          >
            <PaymentBrandMark brand={method.brand} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {language === 'he' ? method.labelHe : method.label}
              </p>
              {method.last4 && (
                <p className="text-xs text-text-muted" dir="ltr">···· {method.last4}</p>
              )}
            </div>
            {isNexus && (
              <span
                className="material-symbols-rounded text-text-muted flex-shrink-0 transition-transform"
                style={{ fontSize: 20, transform: nexusExpanded ? 'rotate(180deg)' : 'none' }}
              >
                expand_more
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Nexus, expanded: a plain, non-editable sum — no container —
              that tracks whatever the buckets below add up to. Nexus,
              collapsed, and every other method: a normal editable amount;
              editing the collapsed Nexus total re-waterfalls it across
              cashback → credits → gifts. */}
          {isNexus && nexusExpanded ? (
            <span className="text-sm font-bold text-text-primary flex-shrink-0" dir="ltr">
              ₪{nexusTotal} <span className="font-normal text-text-muted">/ {nexusCap}</span>
            </span>
          ) : (
            <div
              className="flex items-center gap-1 border border-border rounded-xl px-2.5 py-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              dir="ltr"
            >
              <span className="text-sm text-text-muted">₪</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={isNexus ? nexusCap : undefined}
                value={
                  isNexus
                    ? (nexusTotal === 0 ? '' : nexusTotal)
                    : (amounts[method.id] ?? 0) === 0 ? '' : amounts[method.id]
                }
                placeholder="0"
                onChange={(e) => {
                  const raw = Math.max(0, Number(e.target.value) || 0);
                  if (isNexus) {
                    onNexusTotalChange(method.id, Math.min(raw, nexusCap));
                  } else {
                    onAmountChange(method.id, raw);
                  }
                }}
                className="w-12 bg-transparent outline-none text-sm font-bold text-text-primary"
              />
              {isNexus && <span className="text-sm text-text-muted flex-shrink-0">/ {nexusCap}</span>}
            </div>
          )}
        </div>

        {/* Composition — same row shape, icons and colors as the
            balance-detail page's "sub-balances" tab, each with its own
            editable amount capped at what that bucket actually holds.
            Hidden until the holder taps into the Nexus amount above. */}
        {isNexus && nexusExpanded && (
          <div className="ms-9 mt-3 ps-4 border-s-2 border-border divide-y divide-border">
            {NEXUS_BUCKETS.map((bucket) => {
              const { labelHe, labelEn, Icon, color } = BUCKET_META[bucket];
              const cap = nexusBreakdown![bucket];
              const key = bucketKey(method.id, bucket);
              const value = amounts[key] ?? 0;
              return (
                <div key={bucket} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-semibold text-text-primary">
                      {isRTL ? labelHe : labelEn}
                    </span>
                    <Icon size={20} strokeWidth={1.5} className={`${color} flex-shrink-0`} />
                  </div>
                  <div className="flex items-center gap-1 border border-border rounded-xl px-2.5 py-1.5 flex-shrink-0" dir="ltr">
                    <span className="text-sm text-text-muted">₪</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={cap}
                      value={value === 0 ? '' : value}
                      placeholder="0"
                      onChange={(e) => onAmountChange(key, Math.max(0, Math.min(cap, Number(e.target.value) || 0)))}
                      className="w-12 bg-transparent outline-none text-sm font-bold text-text-primary"
                    />
                    <span className="text-sm text-text-muted flex-shrink-0">/ {cap}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

export default function SplitPaymentSheet({
  isOpen,
  onClose,
  methods,
  total,
  availableFor,
  nexusBreakdown,
  onConfirm,
}: SplitPaymentSheetProps) {
  const { isRTL } = useLanguage();
  const [order, setOrder] = useState<PaymentMethod[]>(methods);
  const [amounts, setAmounts] = useState<SplitAmounts>({});
  // Once the holder edits a number by hand, reordering must stop silently
  // re-seeding over their input — only the initial layout (and its own
  // reorders, before any manual edit) auto-fills the waterfall.
  const [touched, setTouched] = useState(false);
  // The Nexus hierarchy starts collapsed — it only opens once the holder
  // taps into its amount, even though it's already seeded underneath.
  const [nexusExpanded, setNexusExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOrder(methods);
    setAmounts(seedAmounts(methods, total, availableFor, nexusBreakdown));
    setTouched(false);
    setNexusExpanded(false);
    // Re-seed fresh every time the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleReorder = (next: PaymentMethod[]) => {
    setOrder(next);
    if (!touched) setAmounts(seedAmounts(next, total, availableFor, nexusBreakdown));
  };

  const handleAmountChange = (key: string, value: number) => {
    setTouched(true);
    setAmounts((prev) => ({ ...prev, [key]: value }));
  };

  // Editing the Nexus row's total re-waterfalls it across its own buckets
  // (cashback first, then credits, then gifts) — same shape as the initial
  // seed, just scoped to this one method and triggered by hand instead.
  const handleNexusTotalChange = (methodId: string, newTotal: number) => {
    if (!nexusBreakdown) return;
    setTouched(true);
    let remaining = Math.max(0, newTotal);
    const next: SplitAmounts = {};
    for (const bucket of NEXUS_BUCKETS) {
      const cap = nexusBreakdown[bucket];
      const take = Math.max(0, Math.min(remaining, cap));
      next[bucketKey(methodId, bucket)] = round2(take);
      remaining = round2(remaining - take);
    }
    setAmounts((prev) => ({ ...prev, ...next }));
  };

  if (!isOpen) return null;

  const allocated = round2(Object.values(amounts).reduce((sum, v) => sum + v, 0));
  const remaining = round2(total - allocated);
  const balanced = Math.abs(remaining) < 0.01;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[85vh]"
        >
          <div className="flex-shrink-0 px-6 pt-3 pb-4">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isRTL ? 'פצל בין אמצעי תשלום' : 'Split between payment methods'}
              </h2>
              <button
                onClick={onClose}
                aria-label={isRTL ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <X size={18} className="text-text-primary" />
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {isRTL
                ? 'גררו לשינוי הסדר — הסכום המלא מוקצה תמיד לראשון, ועובר הלאה אם אין בו מספיק. אפשר לערוך כל סכום, כולל כל תת-יתרה, ידנית.'
                : 'Drag to reorder — the full amount goes to the first method, and rolls onto the next if it can’t cover it. Edit any amount, including each sub-balance, by hand.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <Reorder.Group axis="y" values={order} onReorder={handleReorder} className="divide-y divide-border">
              {order.map((m) => (
                <SplitPaymentRow
                  key={m.id}
                  method={m}
                  amounts={amounts}
                  onAmountChange={handleAmountChange}
                  onNexusTotalChange={handleNexusTotalChange}
                  nexusBreakdown={nexusBreakdown}
                  nexusExpanded={nexusExpanded}
                  onToggleNexus={() => setNexusExpanded((v) => !v)}
                  onCollapseNexus={() => setNexusExpanded(false)}
                />
              ))}
            </Reorder.Group>
          </div>

          <div className="flex-shrink-0 px-6 pt-4 pb-8 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-semibold ${balanced ? 'text-text-secondary' : 'text-error'}`}>
                {balanced
                  ? (isRTL ? 'הסכום תואם' : 'Amounts match')
                  : remaining > 0
                    ? (isRTL ? `נותרו ₪${remaining} לא מוקצים` : `₪${remaining} left to allocate`)
                    : (isRTL ? `הוקצו ₪${Math.abs(remaining)} יותר מדי` : `₪${Math.abs(remaining)} over-allocated`)}
              </span>
              <span className="text-sm font-bold text-text-primary" dir="ltr">₪{allocated} / ₪{total}</span>
            </div>
            <button
              onClick={() => onConfirm(amounts)}
              disabled={!balanced}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-colors active:scale-[0.98] ${
                balanced
                  ? 'bg-bg-dark text-white'
                  : 'bg-surface text-text-muted cursor-not-allowed'
              }`}
            >
              {balanced
                ? (isRTL ? 'אישור' : 'Confirm')
                : (isRTL ? 'יש להזין סכומים המצטברים לשווי העלות' : 'Enter amounts that add up to the total cost')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
