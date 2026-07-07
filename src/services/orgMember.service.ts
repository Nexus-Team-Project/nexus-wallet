/**
 * orgMember.service.ts - org-member lookup.
 *
 * Plan #2: Firestore reads removed. The old behavior queried a top-level
 * `orgMembers` collection by phone or email. Membership context now
 * comes from /api/me.memberships (read via useAuth) on the backend
 * after the wallet identity is resolved.
 *
 * This stub preserves the lookupOrgMember(...) call-site contract by
 * always returning null. Callers in auth.service / LoginSheet handle
 * null as "no org match", which is the right default now that org
 * matching is the backend's responsibility.
 */
import type { OrgMember } from '../types/auth.types';

export async function lookupOrgMember(
  _identifier: { phone?: string; email?: string },
): Promise<OrgMember | null> {
  void _identifier;
  return null;
}
