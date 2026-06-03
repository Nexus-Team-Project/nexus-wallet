# Stories Match-Screen + Silent-Join Flow — Design

**Status:** approved for planning (2026-06-03)
**Scope:** nexus-wallet only. No backend changes (reuses existing `createJoinRequests`,
`setDefaultTenant`, `listMyJoinRequests`).

## Goal

Rework the first-time-user auth-flow stories so that:
1. The match-screen is sourced from the user's real memberships (not just the URL/invite),
   triggered by the "קליק להמשך" button, and supports single **and** multiple matches.
2. Joining an org from inside the stories is **silent** (no interstitial screen, no toast);
   the outcome surfaces once, as a toast, when registration finishes.
3. `discover-org` is removed; a no-match user just proceeds with no affiliation.
4. The switch-sheet shows orgs with a pending join request, badged.

## Definitions

- **New user**: `me.profile.completedAt` is null (onboarding not finished).
- **Match / member org**: a tenant where the user holds the `member` role
  (`me.memberships[].isMember`). Admin-only tenants are NOT matches.
- **Affiliation outcome** (drives the end-of-registration landing + toast), stored in a
  session stash:
  - `joined` — a NEW join that auto-accepted → land on that org's catalog + welcome toast.
  - `pending` — a NEW join awaiting approval → land on Nexus catalog + pending toast.
  - `member` — an EXISTING membership chosen on the match-screen → land on that org's
    catalog, **no** toast.
  - `none` — no affiliation → land on Nexus catalog, no toast.

## Flow (new user)

```
enter /auth-flow/new-user (or org-user)
  -> stories play ALWAYS (promos). ?tenant=X -> stories mention X's name (no design change).
  -> every story step shows the bottom link "לא מוצא את הארגון שלך? המשך עם ארגון אחר"
  -> user taps "קליק להמשך"  (the blue round CTA)
       MATCH CHECK:
         a) affiliation already chosen via the bottom link this session
              -> SKIP match-screen -> questions
         b) ?tenant=X present:
              - member of X        -> match-screen (single: X)
              - has no role in X    -> join-prompt (unchanged screen, silent join)
              - admin-only of X     -> no match -> questions (no affiliation)
         c) no ?tenant:
              - >=1 member org      -> match-screen (1 = single, >1 = multi-select)
              - 0 member orgs       -> no match -> questions (no affiliation)
  -> match-screen choice -> questions
  -> finish questions OR skip (stories X) -> END: route + toast from the affiliation stash
```

`discover-org` (`SlideDiscoverOrg`) is deleted.

## Bottom link — every step

- One reusable component, label **"לא מוצא את הארגון שלך? המשך עם ארגון אחר"**, opens the
  single-select join picker (`TenantDiscoverySheet`).
- Rendered on the promo slides (via `StoryCTABar`) **and** on the match-screen and join-prompt.
- Picking an org → **silent join** via `useStoryMemberOrgs.submitJoin`:
  - records the affiliation stash (`joined` if auto-accepted, else `pending`) with the org name,
  - sets a "chosen via link" flag so "קליק להמשך" skips the match-screen,
  - NO navigation, NO toast. The user stays on the current step and continues.

## Match-screen (rebuilt — `SlideMatchScreen`)

Restyled to the stories visual language (gradient, blur blobs, framer-motion entrances —
mirrors `SlideDiscoverOrg`/`StoryResultLayout`). Props-driven from `AuthFlowStories`:
`{ orgs: MatchOrg[], onContinueWith(tenantId), onContinueNoAffiliation() }`.

- **Single** (`orgs.length === 1`): "מצאנו לך התאמה ל{org}" + org card →
  primary **"המשך עם {org}"**, secondary **"המשך ללא שיוך ארגוני"**.
- **Multiple** (`orgs.length > 1`): "מצאנו שאתה חבר ב-{N} ארגונים" + a **single-select** list —
  the user picks **exactly ONE** org to continue with (NOT multi-select). Each row shows the
  org's **logo** (initials fallback) + name. Primary **"המשך"** (disabled until one is selected,
  continues with that single org), secondary **"המשך ללא שיוך ארגוני"**.
- Bottom link present (same component as the stories).
- `onContinueWith(tenantId)`: existing membership → stash `member` + `setDefaultTenant(tenantId)`
  → go to questions. **No toast** (not a new join).
- `onContinueNoAffiliation()`: stash `none` + `clearTenant()` + `setDefaultTenant(null)` →
  questions.

## End of registration — route + toast (once)

A shared helper `finishWalletRegistration({ navigate, lang, isHe })` is called from every exit
point — `RegistrationCompletePage` (questions done), the stories X (`handleClose`), and any
"skip questions". It reads the affiliation stash, marks onboarding complete, then:

| stash | land on | toast |
|---|---|---|
| `joined` {org} | `/store?tenant={org}` | `ברוך הבא! הצטרפת לארגון {org} בהצלחה. מוזמן להתרשם מההטבות המוצעות לך כאן!` |
| `pending` {org} | `/store?ecosystem=1` | `ברוך הבא! בקשתך הועברה לארגון {org}, נעדכן אותך במייל בקרוב. בינתיים הינך מחובר ללא שיוך ארגוני` |
| `member` {org} | `/store?tenant={org}` | (none) |
| `none` | `/store?ecosystem=1` | (none) |

English equivalents when the site is in English. The stash is cleared after firing, so the toast
shows **only** on the first registration, never on later logins. Org name is inserted into the
two toasts after "לארגון" (keeps the exact wording, adds the name).

## Silent join — remove interstitial screens

- Delete `JoinedCelebration.tsx`, `JoinPendingScreen.tsx`, their routes (`/auth-flow/joined`,
  `/auth-flow/join-pending`), and the now-unused `StoryResultLayout.tsx` + `useJoinedOrgInfo.ts`
  (used only by those screens).
- `useStoryMemberOrgs.submitJoin` no longer navigates or toasts; it writes the affiliation stash
  and returns. `enterOrg` (tap an existing member org in the stories picker) → stash `member` +
  context, continue. `enterEcosystem`/`fillOnboarding` helpers fold into the new flow as needed.

## Home-page joins (logged in) — unchanged

`TenantSwitchSheet.submitJoin` keeps its current toasts ("הצטרפת ל{org}!" / pending wording) and
still switches into an auto-accepted org. No change.

## Switch-sheet pending badge

`TenantSwitchSheet` fetches `listMyJoinRequests()`, filters `status === 'pending'`, and renders
those orgs as **non-clickable** rows with a **"ממתין לאישור / Pending approval"** badge, above or
below the switchable orgs. Member orgs already in the list are not duplicated.

## i18n

New EN+HE keys for: match-screen titles/subtitles/buttons (single + multiple), the
"continue without affiliation" button, the bottom-link label, the two end-of-registration toasts,
and the pending badge.

## Out of scope / preserved

- Backend behavior (auto-accept default, emails) unchanged.
- The join-prompt screen stays (silent join behavior).
- Home-page switch-sheet join toasts stay as-is.

## Open detail surfaced for review

- The user's message said the welcome toasts should also apply to home-page joins, but a later
  answer chose "keep current home wording" — this spec keeps **current** home wording. Reconcile
  if needed.
