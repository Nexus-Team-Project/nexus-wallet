// ─── Shared types for the Auth-Flow Stories feature ──────────────────────────

export type FlowType = 'new-user' | 'org-user';

export interface StoryStep {
  id: string;
  interactive?: boolean;
  /** ms override for auto-advance (default STORY_DURATION = 6000) */
  duration?: number;
}

export type OrgInfo = {
  id: string;
  name: string;
  initials: string;
  color: string;
  available: boolean;
  tenantId?: string;
  logo?: string;
};
