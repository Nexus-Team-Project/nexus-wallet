import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { Banknote, Gift, GripVertical, Undo2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../../utils/cn';
import { voucherForSubBalance } from '../../mock/data/subBalances.mock';
import MiniGiftCard from './MiniGiftCard';
import VoucherTermsSheet from './VoucherTermsSheet';
import {
  computeNexusPlan,
  getNexusSources,
  type GiftEvaluation,
  type GiftRow,
  type NexusPlan,
  type NexusPrefs,
  type NexusSources,
  type SectionId,
} from './nexusPlan';
import type { SubBalance } from '../../types/wallet.types';

/**
 * "Nexus balance for this purchase" — a purchase-tailored version of the
 * balance page's sub-balances tab: WHAT inside Nexus pays, and in what order.
 * (HOW MUCH comes from Nexus vs. other methods is the split sheet's job.)
 *
 * Three draggable sections — cashback, credits, gifts — filled in order
 * (a waterfall) up to `ceiling`. The gifts section expands into the
 * individual gift balances, each checked against its advanced conditions:
 * - usable gifts show what they cover here, can be reordered and switched off;
 * - gifts that don't work here stay listed, muted, with a one-line reason —
 *   "almost" cases (e.g. short of the minimum) say by how much.
 *
 * Edits are a draft until Confirm; the plan math lives in nexusPlan.ts.
 */

interface NexusBalanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Purchase total (cash due). */
  total: number;
  /** Most Nexus may contribute — the total, or less if set in the split sheet. */
  ceiling: number;
  prefs: NexusPrefs;
  businessId?: string;
  businessName: string;
  /** Where the remainder goes, e.g. "כרטיס 7526". */
  restLabel?: string;
  /** Opens the split sheet to change where the remainder goes. */
  onChangeRest?: () => void;
  onConfirm: (prefs: NexusPrefs) => void;
}

const SECTION_META: Record<SectionId, { he: string; en: string; Icon: typeof Banknote; color: string; fill: string; hex: string }> = {
  cashback: { he: 'קאשבק', en: 'Cashback', Icon: Banknote, color: 'text-green-600', fill: 'bg-green-400', hex: '#4ade80' },
  credits: { he: 'זיכויים', en: 'Credits', Icon: Undo2, color: 'text-sky-500', fill: 'bg-sky-400', hex: '#38bdf8' },
  gifts: { he: 'מתנות', en: 'Gifts', Icon: Gift, color: 'text-primary', fill: 'bg-primary', hex: '#635bff' },
};

/** Track colour for the part of the purchase the card pays. */
const REST_HEX = '#e6ebf1';

/**
 * One linear-gradient for the whole bar: each source holds its colour across
 * its share, and neighbours blend over a soft zone around each seam (wider
 * for bigger segments, never more than a third of the smaller one).
 */
function blendedBarGradient(parts: { color: string; amount: number }[], rest: number, isRTL: boolean): string {
  const all = [...parts, ...(rest > 0 ? [{ color: REST_HEX, amount: rest }] : [])].filter((p) => p.amount > 0);
  const sum = all.reduce((t, p) => t + p.amount, 0);
  if (sum <= 0) return REST_HEX;
  const BLEND = 6; // % of the bar on each side of a seam
  const stops: string[] = [];
  let at = 0;
  all.forEach((p, i) => {
    const width = (p.amount / sum) * 100;
    const pad = Math.min(BLEND, width / 3);
    const start = i === 0 ? 0 : at + pad;
    const end = i === all.length - 1 ? 100 : at + width - pad;
    stops.push(`${p.color} ${start.toFixed(2)}%`, `${p.color} ${Math.max(start, end).toFixed(2)}%`);
    at += width;
  });
  return `linear-gradient(${isRTL ? 'to left' : 'to right'}, ${stops.join(', ')})`;
}

/**
 * Coverage header — typography only, no container: the covered amount as a
 * large figure over the total, a hairline bar split by source in payment
 * order, and a single quiet legend line.
 */
export interface CoveragePart {
  key: string;
  label: string;
  hex: string;
  amount: number;
}

export function CoverageSummary({
  order,
  used,
  covered,
  total,
  rest,
  isRTL,
  money,
  title,
  extraParts = [],
  restLabel,
}: {
  order: SectionId[];
  used: Record<SectionId, number>;
  covered: number;
  total: number;
  rest: number;
  isRTL: boolean;
  money: (n: number) => string;
  /** Defaults to "covered by your balance"; null hides it. */
  title?: string | null;
  /** Other payment methods, after the Nexus sources (unified sheet). */
  extraParts?: CoveragePart[];
  /** Label for the grey tail — defaults to "card". */
  restLabel?: string;
}) {
  const segments = order.filter((id) => used[id] > 0);
  const extras = extraParts.filter((p) => p.amount > 0);

  return (
    <div className="mt-5">
      {title !== null && (
        <p className="mb-1 text-[12px] font-medium tracking-wide text-text-muted">
          {title ?? (isRTL ? 'מכוסה מהיתרה' : 'Covered by your balance')}
        </p>
      )}

      <p className="flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
        <span className="text-[30px] leading-none font-semibold tracking-tighter text-text-primary tabular-nums">
          {money(covered)}
        </span>
        <span className="text-sm font-normal text-text-muted tabular-nums">/ {money(total)}</span>
      </p>

      {/* Thick bar, sources blending softly into each other in payment order */}
      <div
        className="mt-4 h-3 rounded-[4px]"
        style={{
          background: blendedBarGradient(
            [
              ...segments.map((id) => ({ color: SECTION_META[id].hex, amount: used[id] })),
              ...extras.map((p) => ({ color: p.hex, amount: p.amount })),
            ],
            rest,
            isRTL,
          ),
        }}
      />

      {/* One quiet legend line */}
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-muted">
        {segments.map((id) => (
          <span key={id} className="inline-flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', SECTION_META[id].fill)} />
            {isRTL ? SECTION_META[id].he : SECTION_META[id].en}
            <span className="text-text-primary tabular-nums" dir="ltr">{money(used[id])}</span>
          </span>
        ))}
        {extras.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.hex }} />
            {p.label}
            <span className="text-text-primary tabular-nums" dir="ltr">{money(p.amount)}</span>
          </span>
        ))}
        {rest > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
            {restLabel ?? (isRTL ? 'בכרטיס' : 'Card')}
            <span className="text-text-primary tabular-nums" dir="ltr">{money(rest)}</span>
          </span>
        )}
      </p>
    </div>
  );
}

function GiftIcon({ sb, locked }: { sb: SubBalance; locked?: boolean }) {
  return <MiniGiftCard voucher={voucherForSubBalance(sb)} locked={locked} />;
}

function giftLabel(sb: SubBalance, isRTL: boolean): string {
  if (sb.source === 'nexus_gift') return isRTL ? 'מתנה מנקסוס' : 'Gift from Nexus';
  const v = voucherForSubBalance(sb);
  if (v) return v.merchantName;
  return sb.source === 'gift_card' ? (isRTL ? 'גיפט קארד' : 'Gift card') : (isRTL ? 'שובר' : 'Voucher');
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Editable amount — same field as the split sheet's: "₪ [ 120 ] / 150". */
export function AmountField({
  value,
  cap,
  onChange,
  label,
}: {
  value: number;
  cap: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1 border border-border rounded-xl px-2.5 py-2 flex-shrink-0 bg-white"
      onClick={(e) => e.stopPropagation()}
      dir="ltr"
    >
      <span className="text-sm text-text-muted">₪</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={cap}
        aria-label={label}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => onChange(round2(Math.max(0, Math.min(cap, Number(e.target.value) || 0))))}
        className="w-12 bg-transparent outline-none text-sm font-bold text-text-primary"
      />
      <span className="text-sm text-text-muted flex-shrink-0">/ {round2(cap)}</span>
    </div>
  );
}

/**
 * One gift balance, nested under the gifts section. Usable gifts are draggable
 * (their order is the order they're drawn on); unavailable ones are static.
 */
function GiftBalanceRow({
  row,
  ev,
  used,
  onAmountChange,
  onShowTerms,
  isRTL,
  money,
}: {
  row: GiftRow;
  ev: GiftEvaluation;
  used: number;
  onAmountChange: (value: number) => void;
  /** Opens the gift's benefit sheet with its advanced conditions. */
  onShowTerms: () => void;
  isRTL: boolean;
  money: (n: number) => string;
}) {
  const dragControls = useDragControls();
  const label = giftLabel(row.sb, isRTL);
  const termsLink = (
    <button
      type="button"
      onClick={onShowTerms}
      className="mt-0.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-sky-500"
    >
      <span className="underline">{isRTL ? 'לכל התנאים' : 'All terms'}</span>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {isRTL ? 'chevron_left' : 'chevron_right'}
      </span>
    </button>
  );
  if (ev.lock) {
    // Locked (Nexus joining gift): visible in the balance, greyed, with how
    // far the member is from opening it.
    const pct = Math.min(100, (ev.lock.progress / ev.lock.threshold) * 100);
    return (
      <div className="flex items-center gap-3 py-3">
        <span className="w-[14px] flex-shrink-0" />
        <GiftIcon sb={row.sb} locked />
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-text-muted">
            <span className="truncate">{label}</span>
            <span className="flex-shrink-0 rounded-full border border-border px-1.5 py-px text-[10px] font-semibold text-text-secondary">
              {isRTL ? 'נעולה' : 'Locked'}
            </span>
          </p>
          <div className="mt-1.5 h-1.5 rounded-[3px] bg-border/70 overflow-hidden">
            <div className="h-full rounded-[3px] bg-primary/70" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[12px] text-text-secondary leading-snug">{ev.reason}</p>
          {termsLink}
        </div>
        <span className="text-[13px] font-semibold text-text-muted tabular-nums flex-shrink-0" dir="ltr">{money(row.available)}</span>
      </div>
    );
  }
  if (!ev.usable) {
    return (
      <div className="flex items-center gap-3 py-3">
        <span className="w-[14px] flex-shrink-0" />
        <span className="opacity-50"><GiftIcon sb={row.sb} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-muted truncate">{label}</p>
          <p className="text-[12px] text-text-secondary leading-snug">{ev.reason}</p>
          {termsLink}
        </div>
        <span className="text-[13px] text-text-muted tabular-nums flex-shrink-0" dir="ltr">{money(row.available)}</span>
      </div>
    );
  }
  return (
    <Reorder.Item value={row.id} dragListener={false} dragControls={dragControls} className="relative bg-white">
    <div className="flex items-center gap-3 py-3">
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
        aria-label={isRTL ? 'שינוי סדר' : 'Reorder'}
      >
        <GripVertical size={14} />
      </div>
      <GiftIcon sb={row.sb} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold truncate', used > 0 ? 'text-text-primary' : 'text-text-muted')}>{label}</p>
        {ev.notes.length > 0 && (
          <p className="text-[12px] text-text-muted leading-snug">{ev.notes.join(' · ')}</p>
        )}
        {termsLink}
      </div>
      <AmountField value={used} cap={ev.cap} onChange={onAmountChange} label={label} />
    </div>
    </Reorder.Item>
  );
}

/** A top-level section row (cashback / credits / gifts), draggable. */
function SectionRow({
  id,
  subtitle,
  used,
  cap,
  onAmountChange,
  isRTL,
  expandable,
  expanded,
  onToggleExpand,
  children,
}: {
  id: SectionId;
  subtitle?: string;
  used: number;
  /** Most this section can pay here. */
  cap: number;
  /** Editable sections (cashback / credits); gifts sum their own rows. */
  onAmountChange?: (value: number) => void;
  isRTL: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}) {
  const dragControls = useDragControls();
  const { he, en, Icon, color } = SECTION_META[id];
  const head = (
    <>
      <Icon size={24} strokeWidth={1.5} className={cn(color, 'flex-shrink-0')} />
      <span className="flex-1 min-w-0 text-start">
        <span className="block text-[15px] font-bold text-text-primary">{isRTL ? he : en}</span>
        {subtitle && <span className="block text-[12px] text-text-muted leading-snug">{subtitle}</span>}
      </span>
      {onAmountChange ? (
        <AmountField value={used} cap={cap} onChange={onAmountChange} label={isRTL ? he : en} />
      ) : (
        // Gifts: a plain sum of the gift rows below, like the split sheet's
        // expanded Nexus row.
        <span className="text-sm font-bold text-text-primary flex-shrink-0 tabular-nums" dir="ltr">
          ₪{round2(used)} <span className="font-normal text-text-muted">/ {round2(cap)}</span>
        </span>
      )}
    </>
  );
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={dragControls} className="relative bg-white">
      <div className="flex items-center gap-3 py-3.5">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
          aria-label={isRTL ? 'שינוי סדר' : 'Reorder'}
        >
          <GripVertical size={16} />
        </div>
        {expandable ? (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="flex-1 min-w-0 flex items-center gap-3"
          >
            {head}
            <span
              className={cn('material-symbols-outlined text-text-muted transition-transform duration-200', expanded && 'rotate-180')}
              style={{ fontSize: 22 }}
            >
              expand_more
            </span>
          </button>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {head}
          </div>
        )}
      </div>
      {expandable && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="ms-2 mb-3 ps-2.5 border-s-2 border-border divide-y divide-border">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Reorder.Item>
  );
}

/**
 * The Nexus sources editor — cashback / credits / gifts sections, gifts
 * expanding into each gift balance; drag to reorder, type to set amounts.
 * Shared by the Nexus balance sheet and the unified payment sheet.
 */
export function NexusSourcesEditor({
  draft,
  setDraft,
  plan,
  sources,
  isRTL,
  money,
}: {
  draft: NexusPrefs;
  setDraft: React.Dispatch<React.SetStateAction<NexusPrefs>>;
  plan: NexusPlan;
  sources: NexusSources;
  isRTL: boolean;
  money: (n: number) => string;
}) {
  const [giftsOpen, setGiftsOpen] = useState(true);
  const [termsFor, setTermsFor] = useState<SubBalance | null>(null);
  const termsVoucher = termsFor ? voucherForSubBalance(termsFor) : undefined;
  const { evals, usableGifts, unavailableGifts, usedGift, usedSection } = plan;
  const giftsAvailableHere = usableGifts.reduce((sum, g) => sum + Math.min(g.available, evals[g.id].cap), 0);

  const setOrder = (order: SectionId[]) => setDraft((d) => ({ ...d, order }));
  const reorderUsableGifts = (nextUsable: string[]) =>
    setDraft((d) => ({ ...d, giftOrder: [...nextUsable, ...unavailableGifts.map((g) => g.id)] }));
  // First edit snapshots the current (automatic) amounts, so the other rows
  // keep what they showed; from then on the typed amounts rule.
  const setAmount = (key: string, value: number) =>
    setDraft((d) => ({
      ...d,
      manual: {
        ...(d.manual ?? { cashback: usedSection.cashback, credits: usedSection.credits, ...usedGift }),
        [key]: value,
      },
    }));
  const resetToAuto = () => setDraft((d) => ({ ...d, manual: null }));

  const giftsSubtitle = isRTL
    ? `${usableGifts.length} מתוך ${sources.gifts.length} זמינות כאן`
    : `${usableGifts.length} of ${sources.gifts.length} usable here`;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-[12px] text-text-muted">
          {draft.manual
            ? isRTL ? 'חלוקה ידנית לפי הסכומים שהזנת.' : 'Split by the amounts you entered.'
            : isRTL ? 'התשלום יורד לפי הסדר. אפשר לגרור או להזין סכומים.' : 'Paid in this order. Drag, or enter amounts.'}
        </p>
        {draft.manual && (
          <button type="button" onClick={resetToAuto} className="text-[12px] font-semibold text-primary flex-shrink-0">
            {isRTL ? 'חזרה לאוטומטי' : 'Back to automatic'}
          </button>
        )}
      </div>
      <Reorder.Group axis="y" values={draft.order} onReorder={setOrder} className="divide-y divide-border">
        {draft.order.map((id) =>
          id === 'gifts' ? (
            <SectionRow
              key={id}
              id={id}
              subtitle={giftsSubtitle}
              used={usedSection.gifts}
              cap={giftsAvailableHere}
              isRTL={isRTL}
              expandable
              expanded={giftsOpen}
              onToggleExpand={() => setGiftsOpen((o) => !o)}
            >
              {/* Usable gifts (draggable), then the ones that don't work here */}
              {usableGifts.length > 0 && (
                <Reorder.Group
                  axis="y"
                  values={usableGifts.map((g) => g.id)}
                  onReorder={reorderUsableGifts}
                  className="divide-y divide-border"
                >
                  {usableGifts.map((g) => (
                    <GiftBalanceRow
                      key={g.id}
                      row={g}
                      ev={evals[g.id]}
                      used={usedGift[g.id] ?? 0}
                      onAmountChange={(v) => setAmount(g.id, v)}
                      onShowTerms={() => setTermsFor(g.sb)}
                      isRTL={isRTL}
                      money={money}
                    />
                  ))}
                </Reorder.Group>
              )}
              {unavailableGifts.map((g) => (
                <GiftBalanceRow
                  key={g.id}
                  row={g}
                  ev={evals[g.id]}
                  used={0}
                  onAmountChange={() => {}}
                  onShowTerms={() => setTermsFor(g.sb)}
                  isRTL={isRTL}
                  money={money}
                />
              ))}
            </SectionRow>
          ) : (
            <SectionRow
              key={id}
              id={id}
              used={usedSection[id]}
              cap={id === 'cashback' ? sources.cashback : sources.credits}
              onAmountChange={(v) => setAmount(id, v)}
              isRTL={isRTL}
            />
          ),
        )}
      </Reorder.Group>

      {/* Gift's benefit sheet — details + advanced conditions */}
      {termsFor && termsVoucher && (
        <VoucherTermsSheet voucher={termsVoucher} subBalance={termsFor} onClose={() => setTermsFor(null)} />
      )}
    </>
  );
}

export default function NexusBalanceSheet({
  isOpen,
  onClose,
  total,
  ceiling,
  prefs,
  businessId,
  businessName,
  restLabel,
  onChangeRest,
  onConfirm,
}: NexusBalanceSheetProps) {
  const { isRTL, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n, 'ILS', locale);
  const { data: wallet } = useWallet();

  const [draft, setDraft] = useState<NexusPrefs>(prefs);
  // Start every open from the committed prefs.
  useEffect(() => {
    if (isOpen) setDraft(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sources = getNexusSources(wallet?.totalEarned ?? 0);
  const plan = computeNexusPlan(ceiling, draft, sources, { total, businessId, businessName, isRTL, money });
  const { usedSection, covered } = plan;
  const rest = Math.max(0, Math.round((total - covered) * 100) / 100);
  // Nexus could cover more, but the split sheet capped it.
  const limited = ceiling < plan.maxCoverable;

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* z-80: can open on top of the split sheet (z-70) via its "what's included" link */}
      <div className="fixed inset-0 z-[80] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[80] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[85dvh] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Header — same chrome as the page's other sheets */}
          <div className="flex-shrink-0 px-6 pt-3 pb-4">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isRTL ? 'יתרת נקסוס לעסקה הזו' : 'Nexus balance for this purchase'}
              </h2>
              <button
                onClick={onClose}
                aria-label={isRTL ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <CoverageSummary
              order={draft.order}
              used={usedSection}
              covered={covered}
              total={total}
              rest={rest}
              isRTL={isRTL}
              money={money}
            />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
            <NexusSourcesEditor draft={draft} setDraft={setDraft} plan={plan} sources={sources} isRTL={isRTL} money={money} />
          </div>

          {/* Footer — where the remainder goes (changeable via the split sheet), then confirm */}
          <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-border">
            {rest > 0 && (
              <div className="flex items-center justify-between gap-3 text-sm mb-3">
                <span className="min-w-0 text-text-secondary">
                  <span className="font-bold text-text-primary tabular-nums" dir="ltr">{money(rest)}</span>
                  {restLabel && <> ← {restLabel}</>}
                  {limited && (
                    <span className="block text-[12px] text-text-muted">
                      {isRTL
                        ? `נקסוס מוגבל ל-${money(ceiling)} בפיצול`
                        : `Nexus is limited to ${money(ceiling)} in the split`}
                    </span>
                  )}
                </span>
                {onChangeRest && (
                  <button
                    type="button"
                    onClick={onChangeRest}
                    className="text-sm font-semibold text-primary flex-shrink-0"
                  >
                    {isRTL ? 'שינוי' : 'Change'}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => onConfirm(draft)}
              className="w-full h-12 rounded-full bg-bg-dark text-white text-[15px] font-semibold active:opacity-80 transition-opacity"
            >
              {isRTL ? 'אישור' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
