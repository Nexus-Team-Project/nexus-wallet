import type { OrgMember } from './auth.types';

export type RegistrationPath =
  | 'org-member-complete'
  | 'org-member-incomplete'
  | 'new-user'
  | 'tenant-with-fee'
  | 'tenant-no-fee'
  | 'preferences-completion'; // returning user completing optional preference slides from banner

export interface RegistrationContext {
  orgMember: OrgMember | null;
  profileComplete: boolean;
  missingFields: string[];
}

export interface QuestionnaireOption {
  value: string;
  labelEn: string;
  labelHe: string;
  icon: string;
  emoji?: string;
}

export interface QuestionnaireQuestion {
  id: string;
  titleEn: string;
  titleHe: string;
  type: 'single-select-cards';
  options: QuestionnaireOption[];
}

export interface UserPreferences {
  spendingFocus?: string;
  dealPreference?: string;
  notificationFrequency?: string;
}
