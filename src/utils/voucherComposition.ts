export interface CompositionPart {
  denom: number;
  count: number;
}

export interface VoucherComposition {
  /** Actual sum purchased (>= target). */
  total: number;
  /** Descending by denomination, counts >= 1, per single unit (qty = 1). */
  parts: CompositionPart[];
  /** total - target (>= 0). */
  delta: number;
  /** delta === 0 */
  exact: boolean;
}

export const MAX_COMPOSE_TARGET = 10_000;

/**
 * Compose the requested amount out of fixed voucher denominations.
 *
 * Policy: cover the bill — the smallest achievable sum >= target wins;
 * among equal sums, the combination with the fewest vouchers wins.
 * Decimal targets are ceiled (covering never rounds down).
 *
 * Returns null when the target is not a positive finite number, exceeds
 * MAX_COMPOSE_TARGET, or no valid denominations remain after filtering.
 */
export function composeVoucherAmount(
  target: number,
  denominations: number[],
): VoucherComposition | null {
  if (!Number.isFinite(target) || target <= 0) return null;
  const requested = Math.ceil(target);
  if (requested > MAX_COMPOSE_TARGET) return null;

  const denoms = [...new Set(
    denominations.filter((d) => Number.isFinite(d) && d > 0 && Number.isInteger(d)),
  )].sort((a, b) => a - b);
  if (denoms.length === 0) return null;

  const minDenom = denoms[0];
  // The optimal covering sum provably lies in [requested, requested + minDenom - 1]:
  // any sum >= requested + minDenom could drop one smallest voucher and still cover.
  const bound = requested + minDenom - 1;

  // Unbounded coin-change DP with parent pointers.
  const minCoins = new Int32Array(bound + 1).fill(-1);
  const parent = new Int32Array(bound + 1);
  minCoins[0] = 0;
  for (let s = 1; s <= bound; s++) {
    for (const d of denoms) {
      if (d > s || minCoins[s - d] < 0) continue;
      const candidate = minCoins[s - d] + 1;
      if (minCoins[s] < 0 || candidate < minCoins[s]) {
        minCoins[s] = candidate;
        parent[s] = d;
      }
    }
  }

  let total = -1;
  for (let s = requested; s <= bound; s++) {
    if (minCoins[s] >= 0) {
      total = s;
      break;
    }
  }
  if (total < 0) return null; // unreachable: multiples of minDenom always cover

  const counts = new Map<number, number>();
  for (let s = total; s > 0; s -= parent[s]) {
    const d = parent[s];
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const parts = [...counts.entries()]
    .map(([denom, count]) => ({ denom, count }))
    .sort((a, b) => b.denom - a.denom);

  return { total, parts, delta: total - requested, exact: total === requested };
}

/** "₪500 + ₪100×2" — LTR display string for a composition's parts. */
export function formatCompositionParts(parts: CompositionPart[]): string {
  return parts
    .map((p) => (p.count > 1 ? `₪${p.denom}×${p.count}` : `₪${p.denom}`))
    .join(' + ');
}
