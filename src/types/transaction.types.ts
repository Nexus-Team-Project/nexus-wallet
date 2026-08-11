export interface Transaction {
  id: string;
  type: 'purchase' | 'redemption' | 'refund' | 'bonus' | 'cashback';
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  /**
   * Where the money came from — the distinction the whole risk model rests on.
   *
   *  'promotional' — created by Nexus for a campaign, with no cash behind it.
   *                  If it expires unused it costs nothing.
   *  'earned'      — backed by cash already collected (cashback, refunds).
   *
   * Absent means unclassified; treat as 'earned'. Kept as a separate field
   * rather than a new `type` value so no filter, icon map or i18n key changes.
   */
  funding?: 'promotional' | 'earned';
  merchantName?: string;
  merchantLogo?: string;
  voucherId?: string;
  createdAt: string;
}
