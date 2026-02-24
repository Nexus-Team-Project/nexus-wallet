export interface TenantConfig {
  id: string;
  name: string;
  nameHe: string;
  logo: string;
  backgroundImage?: string;
  /** ח"פ (company registration number) — used for ?customerId= URL entry */
  customerId?: string;
  primaryColor: string;
  requiresMembershipFee: boolean;
  membershipFeeAmount?: number;
  membershipFeeCurrency?: string;
  membershipFeeLabel?: string;
  membershipFeeLabelHe?: string;
  membershipBenefits?: string[];
  membershipBenefitsHe?: string[];
  flowOverrides?: {
    skipQuestionnaire?: boolean;
    customWelcomeMessage?: string;
    customWelcomeMessageHe?: string;
  };
}
