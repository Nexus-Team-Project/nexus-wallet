import { mockGiftConditions } from '../../mock/data/giftConditions.mock';
import { mockSubBalances } from '../../mock/data/subBalances.mock';
import { mockTransactions } from '../../mock/data/transactions.mock';
import { daysLeftLabel, daysUntil } from '../../utils/daysLeft';
import type { SubBalance } from '../../types/wallet.types';

/**
 * The Nexus payment plan for one purchase — the single source of truth
 * shared by the purchase page's summary row, the Nexus balance sheet
 * ("what's inside Nexus, in what order") and the split sheet ("how much from
 * Nexus vs. other methods").
 *
 * Two levels:
 * - `ceiling` — how much Nexus may contribute at most (the purchase total,
 *   or a lower amount the user set in the split sheet);
 * - `prefs`   — which Nexus sources fill that amount, and in what order.
 *
 * Gifts are checked against their advanced conditions first; only usable
 * gifts take part in the waterfall.
 */

export type SectionId = 'cashback' | 'credits' | 'gifts';

export const SECTION_LABELS: Record<SectionId, { he: string; en: string }> = {
  cashback: { he: 'קאשבק', en: 'Cashback' },
  credits: { he: 'זיכויים', en: 'Credits' },
  gifts: { he: 'מתנות', en: 'Gifts' },
};

export interface GiftRow {
  id: string;
  available: number;
  sb: SubBalance;
}

export interface GiftEvaluation {
  usable: boolean;
  /** Max this gift may contribute to this purchase (before the waterfall). */
  cap: number;
  /** Muted notes under the label (share cap, cashback rate…). */
  notes: string[];
  /** Why it can't be used here. */
  reason?: string;
  /** Locked gift: how far the member is from unlocking it. */
  lock?: { progress: number; threshold: number; remaining: number };
}

/** User's choices inside Nexus — persisted on the page across sheet opens. */
export interface NexusPrefs {
  order: SectionId[];
  giftOrder: string[];
  /**
   * Hand-typed amounts, keyed 'cashback' / 'credits' / gift id. null = the
   * automatic waterfall. Typed amounts are still clamped to each source's cap
   * and, in payment order, to the Nexus ceiling.
   */
  manual: Record<string, number> | null;
}

export interface NexusSources {
  cashback: number;
  credits: number;
  gifts: GiftRow[];
}

export interface PlanContext {
  /** Purchase total — gift rules (minimum, share cap) are measured on it. */
  total: number;
  businessId?: string;
  businessName: string;
  isRTL: boolean;
  money: (n: number) => string;
}

export interface NexusPlan {
  evals: Record<string, GiftEvaluation>;
  usableGifts: GiftRow[];
  unavailableGifts: GiftRow[];
  usedGift: Record<string, number>;
  usedSection: Record<SectionId, number>;
  /** What Nexus contributes under `ceiling`. */
  covered: number;
  /** What Nexus could contribute with no ceiling but the purchase total. */
  maxCoverable: number;
}

// Gifts first by default: they expire, cashback and credits don't.
export const defaultNexusPrefs = (): NexusPrefs => ({
  order: ['gifts', 'cashback', 'credits'],
  giftOrder: mockSubBalances.map((sb) => sb.id),
  manual: null,
});

export function getNexusSources(totalEarned: number): NexusSources {
  return {
    cashback: totalEarned,
    credits: mockTransactions
      .filter((t) => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    gifts: mockSubBalances.map((sb) => ({ id: sb.id, available: sb.amount, sb })),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

export function evaluateGift(row: GiftRow, ctx: PlanContext): GiftEvaluation {
  const { total, businessId, businessName, isRTL, money } = ctx;
  const lock = row.sb.lock;
  if (lock && lock.progress < lock.threshold) {
    const remaining = lock.threshold - lock.progress;
    return {
      usable: false,
      cap: 0,
      notes: [],
      reason: isRTL
        ? `עוד ${money(remaining)} קאשבק, והמתנה נפתחת · ${daysLeftLabel(daysUntil(lock.unlockBy), true)}`
        : `${money(remaining)} more cashback to unlock · ${daysLeftLabel(daysUntil(lock.unlockBy), false)}`,
      lock: { progress: lock.progress, threshold: lock.threshold, remaining },
    };
  }
  const c = row.sb.voucherId ? mockGiftConditions[row.sb.voucherId] : undefined;
  const expiresAt = c?.validity?.expiresAt ?? row.sb.validUntil;
  if (expiresAt && expiresAt < today()) {
    return { usable: false, cap: 0, notes: [], reason: isRTL ? 'פג התוקף' : 'Expired' };
  }
  if (!c) return { usable: true, cap: row.available, notes: [] };

  const brand = c.brands?.find((b) => b.businessId === businessId);
  if (c.brands?.length && !brand) {
    return { usable: false, cap: 0, notes: [], reason: isRTL ? `לא זמינה ב${businessName}` : `Not available at ${businessName}` };
  }
  if (c.environments?.length && !c.environments.includes('in_app')) {
    return { usable: false, cap: 0, notes: [], reason: isRTL ? 'לא לשימוש באפליקציה' : 'Not usable in the app' };
  }
  if (c.minTransaction != null && total < c.minTransaction) {
    const missing = c.minTransaction - total;
    return {
      usable: false,
      cap: 0,
      notes: [],
      reason: isRTL
        ? `מינימום ${money(c.minTransaction)} לעסקה · חסרים ${money(missing)}`
        : `${money(c.minTransaction)} minimum · ${money(missing)} to go`,
    };
  }
  if (c.singleUse && row.available > total) {
    return { usable: false, cap: 0, notes: [], reason: isRTL ? 'יש לנצל את כל היתרה בעסקה אחת' : 'Must be used in full in one purchase' };
  }

  let cap = row.available;
  const notes: string[] = [];
  if (c.maxSharePercent != null) {
    cap = Math.min(cap, (total * c.maxSharePercent) / 100);
    notes.push(isRTL ? `עד ${c.maxSharePercent}% מהעסקה` : `Up to ${c.maxSharePercent}% of the purchase`);
  }
  if (brand && c.dedicatedCashback) {
    notes.push(isRTL ? `${brand.giftRate}% קאשבק כאן` : `${brand.giftRate}% cashback here`);
  }
  return { usable: true, cap, notes };
}

function waterfall(
  ceiling: number,
  prefs: NexusPrefs,
  sources: NexusSources,
  usableGifts: GiftRow[],
  evals: Record<string, GiftEvaluation>,
) {
  const usedGift: Record<string, number> = {};
  const usedSection: Record<SectionId, number> = { cashback: 0, credits: 0, gifts: 0 };
  let remaining = Math.max(0, ceiling);
  const manual = prefs.manual;
  const take = (cap: number, key: string) => {
    const want = manual ? Math.min(cap, manual[key] ?? 0) : cap;
    const t = round2(Math.max(0, Math.min(want, remaining)));
    remaining = round2(remaining - t);
    return t;
  };
  for (const id of prefs.order) {
    if (id === 'cashback') usedSection.cashback = take(sources.cashback, 'cashback');
    else if (id === 'credits') usedSection.credits = take(sources.credits, 'credits');
    else {
      for (const g of usableGifts) {
        usedGift[g.id] = take(evals[g.id].cap, g.id);
        usedSection.gifts = round2(usedSection.gifts + usedGift[g.id]);
      }
    }
  }
  return { usedGift, usedSection, covered: round2(ceiling - remaining) };
}

export function computeNexusPlan(ceiling: number, prefs: NexusPrefs, sources: NexusSources, ctx: PlanContext): NexusPlan {
  const evals = Object.fromEntries(sources.gifts.map((g) => [g.id, evaluateGift(g, ctx)])) as Record<string, GiftEvaluation>;
  const ordered = prefs.giftOrder.flatMap((id) => sources.gifts.filter((g) => g.id === id));
  // Gifts missing from a stale giftOrder still show, at the end.
  const rest = sources.gifts.filter((g) => !prefs.giftOrder.includes(g.id));
  const all = [...ordered, ...rest];
  const usableGifts = all.filter((g) => evals[g.id].usable);
  const unavailableGifts = [
    ...all.filter((g) => evals[g.id].lock),
    ...all.filter((g) => !evals[g.id].usable && !evals[g.id].lock),
  ];

  const actual = waterfall(Math.min(ceiling, ctx.total), prefs, sources, usableGifts, evals);
  // The most Nexus could pay here — always the automatic fill, so a manual
  // split of Nexus doesn't shrink the cap the split sheet offers.
  const max = waterfall(ctx.total, { ...prefs, manual: null }, sources, usableGifts, evals);
  return { evals, usableGifts, unavailableGifts, ...actual, maxCoverable: max.covered };
}

/** "מתנות ₪200 · קאשבק ₪40" — the non-zero sections, in payment order. */
export function describeComposition(plan: NexusPlan, prefs: NexusPrefs, isRTL: boolean, money: (n: number) => string): string {
  return prefs.order
    .filter((id) => plan.usedSection[id] > 0)
    .map((id) => `${isRTL ? SECTION_LABELS[id].he : SECTION_LABELS[id].en} ${money(plan.usedSection[id])}`)
    .join(' · ');
}
