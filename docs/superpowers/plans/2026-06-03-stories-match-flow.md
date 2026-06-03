# Stories Match-Screen + Silent-Join Flow — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task.
> Steps use `- [ ]`. Spec: `docs/superpowers/specs/2026-06-03-stories-match-flow-design.md`.

**Goal:** Memberships-driven match-screen (single + multiple), silent in-stories joins with a
single end-of-registration toast, remove `discover-org` and the two interstitial screens, and a
pending-approval badge in the switch sheet.

**Tech:** React 19 + TS strict, Zustand, React Router 7, framer-motion, sonner. nexus-wallet only.

**Branch:** `feature/wallet-stories-match-flow` (already created off `development`).

---

## File structure

- Create `src/lib/registrationAffiliation.ts` — affiliation stash + `finishWalletRegistration`.
- Create `src/features/stories/StoryJoinOtherLink.tsx` — reusable bottom link.
- Rewrite `src/features/stories/SlideMatchScreen.tsx` — story-styled, props-driven, single+multi.
- Edit `src/hooks/useStoryMemberOrgs.ts` — silent join (stash, no nav/toast).
- Edit `src/pages/auth-flow/AuthFlowStories.tsx` — match detection, steps, link precedence.
- Edit `src/components/auth-flow/SlideJoinPrompt.tsx` — silent join.
- Edit `src/features/stories/StoryCTABar.tsx` — use `StoryJoinOtherLink`, link-join precedence.
- Edit `src/pages/register/RegistrationCompletePage.tsx` — finish via helper.
- Edit `src/components/wallet/TenantSwitchSheet.tsx` — pending-approval rows.
- Edit `src/i18n/translations/*` + `src/i18n/types.ts` — new keys.
- Edit `src/router/index.tsx` — remove `/auth-flow/joined`, `/auth-flow/join-pending`.
- Delete `src/pages/auth-flow/JoinedCelebration.tsx`, `src/pages/auth-flow/JoinPendingScreen.tsx`,
  `src/components/auth-flow/StoryResultLayout.tsx`, `src/hooks/useJoinedOrgInfo.ts`,
  `src/components/auth-flow/SlideDiscoverOrg.tsx`.

---

### Task 1: Affiliation stash + finish helper

**Files:** Create `src/lib/registrationAffiliation.ts`.

- [ ] **Step 1: Implement the module**

```ts
/** Outcome chosen during the first-run stories, consumed once at registration end. */
export type AffiliationKind = 'joined' | 'pending' | 'member' | 'none';
export interface RegistrationAffiliation {
  kind: AffiliationKind;
  tenantId?: string;
  orgName?: string;
}
const KEY = 'wallet_registration_affiliation';

export function setAffiliation(a: RegistrationAffiliation): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch { /* non-fatal */ }
}
export function getAffiliation(): RegistrationAffiliation | null {
  try { const v = sessionStorage.getItem(KEY); return v ? JSON.parse(v) as RegistrationAffiliation : null; }
  catch { return null; }
}
export function clearAffiliation(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* non-fatal */ }
}
```

- [ ] **Step 2: Add `finishWalletRegistration`** (in the same file)

Signature: `finishWalletRegistration(opts: { navigate: NavigateFunction; lang: string; isHe: boolean; t: TranslationKeys }): void`.
Behavior: read stash; pick `{ path, toastFn? }` per the spec table; `toast` if present; `navigate(path, { replace: true })`; `clearAffiliation()`. Uses `sonner` `toast.success`. Insert `orgName` into the two toast strings after "לארגון". Use new i18n keys from Task 2 for the strings.
Path: `joined`/`member` → `/${lang}/store?tenant=${id}`; `pending`/`none` → `/${lang}/store?ecosystem=1`.

- [ ] **Step 3: Commit** `feat(wallet): registration affiliation stash + finish helper`.

---

### Task 2: i18n keys (EN + HE) + types

**Files:** `src/i18n/translations/*` (the auth-flow block), `src/i18n/types.ts`.

- [ ] Add keys (EN + HE) and their `types.ts` declarations:
  - `matchTitleSingle` = "מצאנו לך התאמה ל{{orgName}}" / "We found a match: {{orgName}}"
  - `matchTitleMultiple` = "מצאנו שאתה חבר ב-{{count}} ארגונים" / "You're a member of {{count}} organizations"
  - `matchSelectHint` (multi) / `matchContinueWithOrg` (reuse if present) / `matchContinue` ("המשך")
  - `matchContinueNoAffiliation` = "המשך ללא שיוך ארגוני" / "Continue without an organization"
  - `joinOtherLink` = "לא מוצא את הארגון שלך? המשך עם ארגון אחר" / "Can't find your organization? Continue with another"
  - `welcomeJoinedToast` = "ברוך הבא! הצטרפת לארגון {{orgName}} בהצלחה. מוזמן להתרשם מההטבות המוצעות לך כאן!" / EN
  - `welcomePendingToast` = "ברוך הבא! בקשתך הועברה לארגון {{orgName}}, נעדכן אותך במייל בקרוב. בינתיים הינך מחובר ללא שיוך ארגוני" / EN
  - `pendingApprovalBadge` = "ממתין לאישור" / "Pending approval"
- [ ] **Commit** `feat(wallet): i18n for match-screen, end toasts, pending badge`.

---

### Task 3: Silent join in `useStoryMemberOrgs`

**Files:** `src/hooks/useStoryMemberOrgs.ts`.

- [ ] `submitJoin(ids)`: call `createJoinRequests`; if `autoAccepted` → `await reload()` and
  `setAffiliation({ kind: 'joined', tenantId, orgName })`; else if `created`/`already_pending` →
  `setAffiliation({ kind: 'pending', tenantId, orgName })`. **No navigation, no toast.** Resolve the
  org name from the picker's known list or `fetchPublicTenant` fallback. Return `true` when an
  affiliation was set (caller uses it as the "chosen via link" flag).
- [ ] `enterOrg(tenantId)` (tap an existing member org in the stories picker): set
  `setAffiliation({ kind: 'member', tenantId, orgName })` + `setDefaultTenant(tenantId)`; return
  (no navigation — the user stays in the stories and continues).
- [ ] Remove `/auth-flow/joined` + `/auth-flow/join-pending` navigation and `enterEcosystem`
  (folded into Task 1 helper) if now unused.
- [ ] **Commit** `refactor(wallet): silent in-stories joins via affiliation stash`.

---

### Task 4: Delete interstitial + discover-org screens

**Files:** delete the 5 files (see File structure); edit `src/router/index.tsx`.

- [ ] Delete `JoinedCelebration.tsx`, `JoinPendingScreen.tsx`, `StoryResultLayout.tsx`,
  `useJoinedOrgInfo.ts`, `SlideDiscoverOrg.tsx`.
- [ ] Remove the two routes + their lazy imports from `router/index.tsx`.
- [ ] Remove `SlideDiscoverOrg` import + the `discover-org` step branch from `AuthFlowStories.tsx`
  (full rewire is Task 7; here just delete dead references so the build passes).
- [ ] Run `npm run build` — expect failures only where Task 7 will rewire; otherwise green.
- [ ] **Commit** `chore(wallet): remove celebration/pending/discover-org screens`.

---

### Task 5: Rebuild `SlideMatchScreen` (story-styled, props)

**Files:** `src/features/stories/SlideMatchScreen.tsx` (rewrite); `src/features/stories/index.ts`.

- [ ] New props: `{ orgs: Array<{tenantId; tenantName; logoUrl?}>; onContinueWith: (id:string)=>void; onContinueNoAffiliation: ()=>void }`.
- [ ] Story visual language (gradient, blur blobs, framer-motion — mirror `SlideDiscoverOrg` that
  is being deleted; copy its scaffold). RTL-aware.
- [ ] Single (`orgs.length===1`): title `matchTitleSingle`, org card, primary
  `matchContinueWithOrg`→`onContinueWith(orgs[0].tenantId)`, secondary `matchContinueNoAffiliation`.
- [ ] Multiple: title `matchTitleMultiple`, **single-select** list — exactly ONE org selectable
  (local `selectedId: string | null`, NOT a Set; tapping a row replaces the selection). Each row
  shows the org **logo** (initials fallback) + name. Primary `matchContinue` (disabled until one
  selected) → `onContinueWith(selectedId)`; secondary `matchContinueNoAffiliation`.
- [ ] Render `<StoryJoinOtherLink/>` (Task 6) at the bottom.
- [ ] **Commit** `feat(wallet): story-styled match-screen, single + multiple`.

---

### Task 6: `StoryJoinOtherLink` + CTA bar

**Files:** Create `src/features/stories/StoryJoinOtherLink.tsx`; edit `StoryCTABar.tsx`.

- [ ] `StoryJoinOtherLink({ onClick })`: white text link, label `t.authFlow.joinOtherLink`,
  bottom-right (RTL). Extract from the current `StoryCTABar` secondary link.
- [ ] `StoryCTABar`: replace the inline "רוצה להמשיך עם ארגון אחר?" link with `StoryJoinOtherLink`
  (wired to `onJoinOtherOrg`). Keep the primary "קליק להמשך" button.
- [ ] **Commit** `refactor(wallet): reusable story join-other link, new wording`.

---

### Task 7: `AuthFlowStories` rewiring

**Files:** `src/pages/auth-flow/AuthFlowStories.tsx`.

- [ ] Compute `matchOrgs` (member role): `urlTenantId ? (membership ? [membership] : []) : memberOrgs`
  (from `useStoryMemberOrgs`). Synthesize `{tenantId,tenantName,logoUrl}` from `membership`/memberOrgs.
- [ ] `linkChosen` state (set true when the bottom-link `submitJoin` returns true, i.e. an
  affiliation was set via the picker).
- [ ] Terminal step:
  - `isNonMember` (URL tenant, no role) → `join-prompt`.
  - else `matchOrgs.length >= 1` → `match-screen`.
  - else → none (no terminal).
- [ ] `initialSteps = [...baseSteps, terminal?]`. Remove the `discover-org` branch.
- [ ] `StoryCTABar` continue: if `linkChosen` → `onNewUserContinue()` (skip match-screen, go to
  questions); else default (goTo terminal if present, else `onNewUserContinue`).
- [ ] Render `<SlideMatchScreen orgs={matchOrgs} onContinueWith={...} onContinueNoAffiliation={...}/>`:
  - `onContinueWith(id)` → `setAffiliation({kind:'member',tenantId:id,orgName})` +
    `setDefaultTenant(id)` → `handleNewUserContinue()`.
  - `onContinueNoAffiliation()` → `setAffiliation({kind:'none'})` + `clearTenant()` +
    `setDefaultTenant(null)` → `handleNewUserContinue()`.
- [ ] `handleClose` (stories X) → `finishWalletRegistration(...)` (instead of the current
  bespoke routing), so a skipped registration still routes+toasts from the stash.
- [ ] Keep the bottom-link discovery sheet (`showJoin` + `TenantDiscoverySheet`) on every step; on
  submit call `submitJoin` and set `linkChosen` from its return.
- [ ] `npm run build` green.
- [ ] **Commit** `feat(wallet): memberships-driven match step + link precedence`.

---

### Task 8: `SlideJoinPrompt` silent join

**Files:** `src/components/auth-flow/SlideJoinPrompt.tsx`.

- [ ] `requestJoin([tenantId])` → `createJoinRequests`; set affiliation stash (`joined`/`pending`)
  with org name; **no toast**; then `onResolve(...)` to continue. Its "find another org" picker
  routes through `submitJoin` (silent). Render `StoryJoinOtherLink` if not already covered.
- [ ] **Commit** `refactor(wallet): silent join from join-prompt`.

---

### Task 9: Registration exit → finish helper

**Files:** `src/pages/register/RegistrationCompletePage.tsx` (+ any questions "skip").

- [ ] On completion, after the profile PATCH, call `finishWalletRegistration({navigate,lang,isHe,t})`
  instead of the legacy navigate. Preserve the existing gated-action return precedence if present
  (a stashed actionable return still wins; affiliation drives the default).
- [ ] **Commit** `feat(wallet): registration completion routes+toasts via affiliation`.

---

### Task 10: Switch-sheet pending badge

**Files:** `src/components/wallet/TenantSwitchSheet.tsx`.

- [ ] On open, `listMyJoinRequests()` (effect), keep `status === 'pending'` whose tenant isn't
  already a member. Render them as **non-clickable** rows (logo + name + `pendingApprovalBadge`
  pill), in a "ממתין לאישור" subsection. Reuse the row styling; `disabled`/no onClick.
- [ ] **Commit** `feat(wallet): show pending-approval orgs in the switch sheet`.

---

### Task 11: Build + manual verification

- [ ] `npm run build` green.
- [ ] Manual matrix (document results): (1) no `?tenant`, 0 orgs → no match-screen → questions →
  ecosystem, no toast; (2) no `?tenant`, 1 member org → single match-screen; (3) no `?tenant`,
  2+ orgs → multi match-screen; (4) `?tenant=X` member → single match-screen X; (5) `?tenant=X`
  non-member → join-prompt; (6) bottom-link join (auto) → skip match-screen → questions → org
  catalog + joined toast; (7) bottom-link join (pending) → questions → ecosystem + pending toast;
  (8) switch-sheet shows a pending org badged; (9) home-page join toasts unchanged.
- [ ] **Final code review**, then `superpowers:finishing-a-development-branch`.

---

## Self-review notes

- Type consistency: `MatchOrg = {tenantId; tenantName; logoUrl?}` used by `SlideMatchScreen`,
  `useStoryMemberOrgs.memberOrgs` (`MemberOrgOption`), and `AuthFlowStories` — align names.
- `finishWalletRegistration` is the single exit; ensure it also marks `profile.completedAt`
  (via the existing completion PATCH / `saveWalletProfile({complete:true})` on the X path).
- No backend changes; verify `listMyJoinRequests` is reachable for a logged-in member.
