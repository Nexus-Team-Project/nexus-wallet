import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../../utils/cn';
import PaymentBrandMark from './PaymentBrandMark';
import { AmountField, CoverageSummary, NexusSourcesEditor } from './NexusBalanceSheet';
import { computeNexusPlan, getNexusSources, type NexusPrefs } from './nexusPlan';
import type { PaymentMethod } from '../../hooks/usePaymentMethods';
import type { SplitAmounts } from './SplitPaymentSheet';

/**
 * Unified payment sheet — the "one sheet" variant (`?pay=unified`).
 *
 * The split between payment methods and the Nexus balance management live
 * in a single sheet: the Nexus row expands in place into its sources
 * (cashback / credits / gifts → each gift), with the same drag-to-reorder
 * and amount fields as the standalone Nexus balance sheet.
 *
 * - Nexus collapsed: one editable amount (auto-filled in source order).
 * - Nexus expanded: its amount is the read-only sum of the sources below;
 *   typing a source amount switches Nexus to a manual split.
 * - Other methods take the remainder automatically (first in order) until
 *   the holder types an amount of their own.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Bar colours for non-Nexus methods, by position — clear of the Nexus source colours. */
const EXTERNAL_HEX = ['#f59e0b', '#ec4899', '#14b8a6'];

interface UnifiedPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  /** Cash due — the amounts must add up to this. */
  total: number;
  businessId?: string;
  businessName: string;
  prefs: NexusPrefs;
  /** Current plan per method id (Nexus as one key) — seeds the sheet. */
  initial?: SplitAmounts;
  onConfirm: (result: { prefs: NexusPrefs; amounts: SplitAmounts }) => void;
}

function MethodIdentity({ method }: { method: PaymentMethod }) {
  const { language } = useLanguage();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <PaymentBrandMark brand={method.brand} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">{language === 'he' ? method.labelHe : method.label}</p>
        {method.last4 && <p className="text-xs text-text-muted" dir="ltr">···· {method.last4}</p>}
      </div>
    </div>
  );
}

function MethodRow({
  method,
  isRTL,
  right,
  onPointerDownGrip,
  children,
}: {
  method: PaymentMethod;
  isRTL: boolean;
  right: React.ReactNode;
  onPointerDownGrip?: () => void;
  children?: React.ReactNode;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={method} dragListener={false} dragControls={dragControls} className="relative bg-white">
      <div className="py-3.5">
        <div className="flex items-center gap-3">
          <div
            onPointerDown={(e) => {
              onPointerDownGrip?.();
              dragControls.start(e);
            }}
            className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
            aria-label={isRTL ? 'שינוי סדר' : 'Reorder'}
          >
            <GripVertical size={16} />
          </div>
          {right}
        </div>
        {children}
      </div>
    </Reorder.Item>
  );
}

export default function UnifiedPaymentSheet({
  isOpen,
  onClose,
  methods,
  total,
  businessId,
  businessName,
  prefs,
  initial,
  onConfirm,
}: UnifiedPaymentSheetProps) {
  const { isRTL, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n, 'ILS', locale);
  const { data: wallet } = useWallet();

  const nexusMethod = methods.find((m) => m.brand === 'nexus');
  const sources = getNexusSources(wallet?.totalEarned ?? 0);
  const ctx = { total, businessId, businessName, isRTL, money };

  const [order, setOrder] = useState<PaymentMethod[]>(methods);
  const [draft, setDraft] = useState<NexusPrefs>(prefs);
  const [nexusAmount, setNexusAmount] = useState(0);
  const [external, setExternal] = useState<SplitAmounts>({});
  // Once another method's amount is typed, stop auto-filling the remainder.
  const [externalTouched, setExternalTouched] = useState(false);
  const [nexusOpen, setNexusOpen] = useState(false);

  const maxCoverable = computeNexusPlan(total, prefs, sources, ctx).maxCoverable;

  useEffect(() => {
    if (!isOpen) return;
    setOrder(methods);
    setDraft(prefs);
    const seeded = initial && nexusMethod ? initial[nexusMethod.id] : undefined;
    setNexusAmount(seeded ?? maxCoverable);
    const ext: SplitAmounts = {};
    if (initial) for (const [id, v] of Object.entries(initial)) if (id !== nexusMethod?.id) ext[id] = v;
    setExternal(ext);
    setExternalTouched(!!initial && Object.keys(ext).length > 1);
    setNexusOpen(false);
    // Re-seed every time the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // A manual split inside Nexus defines the Nexus total itself.
  const plan = computeNexusPlan(draft.manual ? total : nexusAmount, draft, sources, ctx);
  const nexusTotal = plan.covered;

  // Other methods: remainder to the first one in order, unless typed by hand.
  const externalMethods = order.filter((m) => m.brand !== 'nexus');
  const externalAmounts: SplitAmounts = externalTouched
    ? external
    : Object.fromEntries(externalMethods.map((m, i) => [m.id, i === 0 ? round2(Math.max(0, total - nexusTotal)) : 0]));
  const externalSum = Object.values(externalAmounts).reduce((sum, v) => sum + v, 0);

  if (!isOpen) return null;

  const allocated = round2(nexusTotal + externalSum);
  const remaining = round2(total - allocated);
  const balanced = Math.abs(remaining) < 0.01;

  const handleConfirm = () => {
    const amounts: SplitAmounts = { ...externalAmounts };
    if (nexusMethod) amounts[nexusMethod.id] = nexusTotal;
    onConfirm({ prefs: draft, amounts });
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[88dvh]"
        >
          <div className="flex-shrink-0 px-6 pt-3 pb-2">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">{isRTL ? 'איך משלמים' : 'How to pay'}</h2>
              <button
                onClick={onClose}
                aria-label={isRTL ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <X size={18} className="text-text-primary" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            {/* Whole purchase: Nexus sources, then each other method in its own
                colour; anything not yet allocated is the grey tail. */}
            <CoverageSummary
              title={null}
              order={draft.order}
              used={plan.usedSection}
              extraParts={externalMethods.map((m, i) => ({
                key: m.id,
                label: isRTL ? m.labelHe : m.label,
                hex: EXTERNAL_HEX[i % EXTERNAL_HEX.length],
                amount: externalAmounts[m.id] ?? 0,
              }))}
              covered={Math.min(allocated, total)}
              total={total}
              rest={Math.max(0, remaining)}
              restLabel={isRTL ? 'חסר' : 'Missing'}
              isRTL={isRTL}
              money={money}
            />

            <Reorder.Group axis="y" values={order} onReorder={setOrder} className="mt-4 divide-y divide-border">
              {order.map((m) =>
                m.brand === 'nexus' ? (
                  <MethodRow
                    key={m.id}
                    method={m}
                    isRTL={isRTL}
                    // The open hierarchy has no meaning mid-drag.
                    onPointerDownGrip={() => setNexusOpen(false)}
                    right={
                      <>
                        <button
                          type="button"
                          onClick={() => setNexusOpen((o) => !o)}
                          aria-expanded={nexusOpen}
                          className="flex items-center gap-1 min-w-0 text-start"
                        >
                          <MethodIdentity method={m} />
                          <span
                            className={cn('material-symbols-rounded text-text-muted transition-transform duration-200', nexusOpen && 'rotate-180')}
                            style={{ fontSize: 20 }}
                          >
                            expand_more
                          </span>
                        </button>
                        <div className="flex-1" />
                        {nexusOpen ? (
                          <span className="text-sm font-bold text-text-primary flex-shrink-0 tabular-nums" dir="ltr">
                            ₪{nexusTotal} <span className="font-normal text-text-muted">/ {round2(maxCoverable)}</span>
                          </span>
                        ) : (
                          <AmountField
                            value={nexusTotal}
                            cap={maxCoverable}
                            label={isRTL ? m.labelHe : m.label}
                            onChange={(v) => {
                              setNexusAmount(v);
                              // A typed Nexus total re-fills its sources automatically.
                              setDraft((d) => ({ ...d, manual: null }));
                            }}
                          />
                        )}
                      </>
                    }
                  >
                    {/* Nexus sources — opens in place */}
                    <AnimatePresence initial={false}>
                      {nexusOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ps-2.5 border-s-2 border-border">
                            {maxCoverable <= 0 ? (
                              <p className="py-2 text-[13px] text-text-muted">
                                {isRTL ? 'יתרת נקסוס לא זמינה בעסקה הזו' : 'Nexus balance not available for this purchase'}
                              </p>
                            ) : null}
                            <NexusSourcesEditor
                              draft={draft}
                              setDraft={setDraft}
                              plan={plan}
                              sources={sources}
                              isRTL={isRTL}
                              money={money}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </MethodRow>
                ) : (
                  <MethodRow
                    key={m.id}
                    method={m}
                    isRTL={isRTL}
                    right={
                      <>
                        <MethodIdentity method={m} />
                        <div className="flex-1" />
                        <AmountField
                          value={externalAmounts[m.id] ?? 0}
                          cap={total}
                          label={isRTL ? m.labelHe : m.label}
                          onChange={(v) => {
                            setExternal({ ...externalAmounts, [m.id]: v });
                            setExternalTouched(true);
                          }}
                        />
                      </>
                    }
                  />
                ),
              )}
            </Reorder.Group>
          </div>

          <div className="flex-shrink-0 px-6 pt-4 pb-8 border-t border-border">
            <button
              onClick={handleConfirm}
              disabled={!balanced}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-colors active:scale-[0.98] ${
                balanced ? 'bg-bg-dark text-white' : 'bg-surface text-text-muted cursor-not-allowed'
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
