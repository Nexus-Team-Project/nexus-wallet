import { formatDate } from '../../utils/formatDate';
import type { GiftConditions } from '../../types/giftConditions.types';

/**
 * Builds the advanced-conditions list rows for a gift. Display rule (spec): a
 * condition yields a row only if it was defined, so a gift with no conditions
 * returns [] and the section isn't rendered at all.
 */

export type ConditionKey = 'unlock' | 'brands' | 'validity' | 'more';

export interface ConditionRow {
  key: ConditionKey;
  title: string;
  /** One or more muted summary lines under the title. */
  summary: string[];
}

/** "א, ב ו-ג" / "a, b and c" */
export function joinList(items: string[], isRTL: boolean): string {
  if (items.length <= 1) return items.join('');
  const head = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return isRTL ? `${head} ו${last}` : `${head} and ${last}`;
}

/** The "more terms" items that were defined, as short labels. */
function moreTermLabels(c: GiftConditions, isRTL: boolean): string[] {
  const labels: string[] = [];
  if (c.transfer) labels.push(isRTL ? 'שליחה לארנקים אחרים' : 'sending to other wallets');
  if (c.minTransaction != null) labels.push(isRTL ? 'מינימום לעסקה' : 'minimum per purchase');
  if (c.maxSharePercent != null) labels.push(isRTL ? 'תקרה לתשלום במתנה' : 'gift share cap');
  if (c.singleUse) labels.push(isRTL ? 'ניצול בבת אחת' : 'single use');
  if (c.onLeavingOrg) labels.push(isRTL ? 'עזיבת הארגון' : 'leaving the organisation');
  if (c.onRefund) labels.push(isRTL ? 'החזרת עסקה' : 'refunds');
  if (c.termsUrl) labels.push(isRTL ? 'תקנון' : 'full terms');
  return labels;
}

export function buildConditionRows(c: GiftConditions | undefined, isRTL: boolean, locale: string): ConditionRow[] {
  if (!c) return [];
  const rows: ConditionRow[] = [];

  if (c.brands?.length) {
    // Dedicated cashback rates are shown per chain inside this list.
    rows.push({
      key: 'brands',
      title: isRTL ? 'רשתות משתתפות' : 'Participating chains',
      summary: [
        isRTL
          ? `${c.brands.length} רשתות${c.dedicatedCashback ? ' · עם שיעור קאשבק ייעודי' : ''}`
          : `${c.brands.length} chains${c.dedicatedCashback ? ' · with dedicated cashback rates' : ''}`,
      ],
    });
  }
  if (c.validity) {
    const v = c.validity;
    rows.push({
      key: 'validity',
      title: isRTL ? 'תוקף' : 'Validity',
      summary: v.unlockBy
        ? [
            isRTL ? `לפתיחה עד ${formatDate(v.unlockBy, locale)}` : `Unlock by ${formatDate(v.unlockBy, locale)}`,
            isRTL
              ? `לשימוש אחרי הפתיחה עד ${formatDate(v.expiresAt, locale)}`
              : `Use after unlocking by ${formatDate(v.expiresAt, locale)}`,
          ]
        : [isRTL ? `עד ${formatDate(v.expiresAt, locale)}` : `Until ${formatDate(v.expiresAt, locale)}`],
    });
  }
  const more = moreTermLabels(c, isRTL);
  if (more.length) {
    rows.push({
      key: 'more',
      title: isRTL ? 'תנאים נוספים' : 'More terms',
      summary: [joinList(more, isRTL)],
    });
  }
  return rows;
}
