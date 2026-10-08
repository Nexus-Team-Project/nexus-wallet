import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import PaymentBrandMark from './PaymentBrandMark';
import type { PaymentMethod } from '../../hooks/usePaymentMethods';

/**
 * Amount per payment method, keyed by method id. The Nexus method is one
 * plain key here too — WHAT inside Nexus pays (cashback / credits / gifts,
 * in what order) is the Nexus balance sheet's job, not this sheet's.
 */
export type SplitAmounts = Record<string, number>;

/** What the split sheet needs to know about the Nexus row. */
export interface NexusSplitInfo {
  /** Most Nexus can pay for THIS purchase — after gift conditions, not the raw balance. */
  max: number;
  /** Read-only composition for a given Nexus amount, e.g. "מתנות ₪200 · קאשבק ₪40". */
  describe: (amount: number) => string;
  /** Opens the Nexus balance sheet ("what's included"). */
  onManage: () => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface SplitPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  /** Cash due for the order — the amounts must add up to this. */
  total: number;
  /** How much of `total` a non-Nexus method can absorb. Omitted / Infinity
   *  means uncapped, like a regular card. */
  availableFor: (method: PaymentMethod) => number;
  nexus?: NexusSplitInfo;
  /** Current plan — seeds the sheet when it adds up to `total`. */
  initial?: SplitAmounts;
  onConfirm: (amounts: SplitAmounts) => void;
}

/**
 * Waterfall seed: each method (in the given order) takes as much of the
 * remaining total as it can hold, and the remainder rolls onto the next.
 * Re-run on reorder, but never once the holder has typed their own numbers
 * (see `touched` in the component).
 */
function seedAmounts(
  order: PaymentMethod[],
  total: number,
  capFor: (m: PaymentMethod) => number,
): SplitAmounts {
  let remaining = total;
  const amounts: SplitAmounts = {};
  for (const m of order) {
    const take = Math.max(0, Math.min(remaining, capFor(m)));
    amounts[m.id] = round2(take);
    remaining = round2(remaining - take);
  }
  return amounts;
}

function SplitPaymentRow({
  method,
  value,
  cap,
  onChange,
  nexus,
}: {
  method: PaymentMethod;
  value: number;
  cap: number;
  onChange: (value: number) => void;
  nexus?: NexusSplitInfo;
}) {
  const { language, isRTL } = useLanguage();
  const dragControls = useDragControls();
  const isNexus = method.brand === 'nexus' && !!nexus;
  const composition = isNexus && value > 0 ? nexus!.describe(value) : '';

  return (
    <Reorder.Item value={method} dragListener={false} dragControls={dragControls} className="relative bg-white">
      <div className="py-3.5">
        <div className="flex items-center gap-3">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
            aria-label={language === 'he' ? 'שינוי סדר' : 'Reorder'}
          >
            <GripVertical size={16} />
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <PaymentBrandMark brand={method.brand} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {language === 'he' ? method.labelHe : method.label}
              </p>
              {method.last4 && (
                <p className="text-xs text-text-muted" dir="ltr">···· {method.last4}</p>
              )}
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1 border border-border rounded-xl px-2.5 py-2 flex-shrink-0" dir="ltr">
            <span className="text-sm text-text-muted">₪</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={Number.isFinite(cap) ? cap : undefined}
              value={value === 0 ? '' : value}
              placeholder="0"
              onChange={(e) => onChange(Math.max(0, Math.min(cap, Number(e.target.value) || 0)))}
              className="w-12 bg-transparent outline-none text-sm font-bold text-text-primary"
            />
            {isNexus && <span className="text-sm text-text-muted flex-shrink-0">/ {round2(cap)}</span>}
          </div>
        </div>

        {/* Nexus: read-only composition + link to manage it. The cap is what
            can actually be used here, so it can be far below the balance. */}
        {isNexus && (
          <button
            type="button"
            onClick={nexus!.onManage}
            className="ms-9 mt-2 flex w-[calc(100%-2.25rem)] items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-start active:bg-border/60 transition-colors"
          >
            <span className="min-w-0 text-[12px] text-text-secondary truncate">
              {nexus!.max <= 0
                ? (isRTL ? 'יתרת נקסוס לא זמינה בעסקה הזו' : 'Nexus balance not available for this purchase')
                : composition || (isRTL ? 'לא נכלל בעסקה' : 'Not used in this purchase')}
            </span>
            <span className="flex items-center text-[12px] font-semibold text-primary flex-shrink-0">
              {isRTL ? 'מה נכלל' : "What's included"}
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                {isRTL ? 'chevron_left' : 'chevron_right'}
              </span>
            </span>
          </button>
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
  nexus,
  initial,
  onConfirm,
}: SplitPaymentSheetProps) {
  const { isRTL } = useLanguage();
  const [order, setOrder] = useState<PaymentMethod[]>(methods);
  const [amounts, setAmounts] = useState<SplitAmounts>({});
  // Once the holder edits a number by hand, reordering must stop silently
  // re-seeding over their input — only the initial layout (and its own
  // reorders, before any manual edit) auto-fills the waterfall.
  const [touched, setTouched] = useState(false);

  const capFor = (m: PaymentMethod) => (m.brand === 'nexus' && nexus ? nexus.max : availableFor(m));

  useEffect(() => {
    if (!isOpen) return;
    setOrder(methods);
    const initialSum = initial ? round2(Object.values(initial).reduce((s, v) => s + v, 0)) : 0;
    setAmounts(initial && Math.abs(initialSum - total) < 0.01 ? initial : seedAmounts(methods, total, capFor));
    setTouched(false);
    // Re-seed every time the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleReorder = (next: PaymentMethod[]) => {
    setOrder(next);
    if (!touched) setAmounts(seedAmounts(next, total, capFor));
  };

  const handleAmountChange = (id: string, value: number) => {
    setTouched(true);
    setAmounts((prev) => ({ ...prev, [id]: round2(value) }));
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
                ? 'גררו לשינוי הסדר — הסכום המלא מוקצה תמיד לראשון, ועובר הלאה אם אין בו מספיק. אפשר לערוך כל סכום ידנית.'
                : 'Drag to reorder — the full amount goes to the first method, and rolls onto the next if it can’t cover it. Edit any amount by hand.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <Reorder.Group axis="y" values={order} onReorder={handleReorder} className="divide-y divide-border">
              {order.map((m) => (
                <SplitPaymentRow
                  key={m.id}
                  method={m}
                  value={amounts[m.id] ?? 0}
                  cap={capFor(m)}
                  onChange={(v) => handleAmountChange(m.id, v)}
                  nexus={m.brand === 'nexus' ? nexus : undefined}
                />
              ))}
            </Reorder.Group>
          </div>

          <div className="flex-shrink-0 px-6 pt-4 pb-8 border-t border-border">
            <button
              onClick={() => onConfirm(amounts)}
              data-story-tap="split-confirm"
              disabled={!balanced}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-colors active:scale-[0.98] ${
                balanced
                  ? 'bg-bg-dark text-white'
                  : 'bg-surface text-text-muted cursor-not-allowed'
              }`}
            >
              {/* The button carries the status: disabled with what's missing,
                  black "Confirm" once the amounts add up. */}
              {balanced
                ? (isRTL ? 'אישור' : 'Confirm')
                : remaining > 0
                  ? (isRTL ? `חסר לך עוד ₪${remaining}` : `₪${remaining} still missing`)
                  : (isRTL ? `הוקצו ₪${Math.abs(remaining)} יותר מדי` : `₪${Math.abs(remaining)} over the total`)}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
