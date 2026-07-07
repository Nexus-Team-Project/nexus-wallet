export interface TenantConfig {
  id: string;
  name: string;
  nameHe: string;
  /** Logo URL. Optional — a real tenant with no logo shows name initials. */
  logo?: string;
  backgroundImage?: string;
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
