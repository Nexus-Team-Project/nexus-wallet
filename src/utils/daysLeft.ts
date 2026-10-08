/** Whole days from today until `iso` (end of that day), never negative. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const end = new Date(iso);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000) - 1);
}

/**
 * "נשארו 23 יום" — Hebrew count agreement: יום אחד / יומיים / 3–10 ימים /
 * 11+ יום (the colloquial form after larger numbers).
 */
export function daysLeftLabel(days: number, isRTL: boolean): string {
  if (!isRTL) return days === 1 ? '1 day left' : `${days} days left`;
  if (days <= 0) return 'היום היום האחרון';
  if (days === 1) return 'נשאר יום אחד';
  if (days === 2) return 'נשארו יומיים';
  if (days <= 10) return `נשארו ${days} ימים`;
  return `נשארו ${days} יום`;
}
