# Nexus Wallet Agent Guide

> **Writing rule - no em-dashes.** Never use an em-dash (—) or en-dash (–) anywhere: not in code, comments, documentation, commit messages, UI/i18n text, or chat replies. Use a regular hyphen (-) instead (optionally spaced as " - "). This applies to all generated output in this repo.

`nexus-wallet` is the member-facing Nexus app at `wallet.nexus-payment.com`. It is the canonical "what tenant members see after they log in". This file is the source of truth for agents working in this repo. Treat the code itself as final authority when behavior differs.

## Workspace Context

- This is the **end-user / member** entry point. Tenant admins live in `nexus-dashboard`.
- All backend lives in `nexus-website/backend`. This repo is **frontend only** - never call MongoDB directly, never store secrets here, never duplicate Prisma models.
- `nexus-website` handles email + password login, signup, email verification, OAuth bounce-out, and the SSO handoff machinery. The wallet handles Google id-token + SMS-OTP login natively and receives website-issued sessions via the existing refresh cookie on `.nexus-payment.com`.

Related repos at `C:\Nexus`:
- `nexus-website/` - login site + the single backend
- `nexus-website/backend/` - **the only backend, the only database, the only secret store**
- `nexus-dashboard/` - admin app
- `docs/superpowers/specs/` + `docs/superpowers/plans/` - canonical specs and plans
- Root-level docs: `progress.md`, `nexus-wallet-auth.md`, `test-guide-wallet.md`, `phone-otp.md`, `inforu-sms-api.md`

## Architecture

Stack: React 19, Vite, TypeScript strict, Tailwind, Zustand, React Router 7, `@tanstack/react-query`, `framer-motion`, `react-hook-form` + `zod`.

```
wallet.nexus-payment.com  --(HTTPS, credentials:include)-->  api.nexus-payment.com
                                                              (nexus-website/backend)
```

The wallet never speaks to Mongo, never speaks to Postgres, never signs JWTs. All state changes go through `/api/v1/*` endpoints.

Cookie sharing: refresh cookie `nexus_refresh` is set by the backend on `.nexus-payment.com` and is shared across `nexus-website`, `wallet.nexus-payment.com`, and `dashboard.nexus-payment.com`. Logging in on any one of the three hydrates a session that the others recognize.

## Auth Subsystem (Plans #1 - #4 implemented)

Plan docs in `C:\Nexus\docs\superpowers\plans\`. Spec in `C:\Nexus\docs\superpowers\specs\2026-05-25-nexus-wallet-auth-design.md`. Read these before changing anything in `src/contexts/AuthContext.tsx`, `src/services/auth.service.ts`, `src/lib/api.ts`, `src/pages/auth/*`, `src/pages/router/RouterScreen.tsx`, `src/components/auth/LoginSheet.tsx`, `src/components/wallet/WalletTenantSwitcher.tsx`, or anything under `src/services/walletProfile.service.ts` / `walletTenants.service.ts`.

Login providers:
- **Google** - via Google Identity Services on the wallet domain. Same `GOOGLE_CLIENT_ID` as backend. Wallet POSTs the id-token to `/api/v1/auth/google/wallet`.
- **SMS (phone-OTP)** - via InforU (`POST /api/v1/auth/phone/{start,verify,resend}`). Needs backend `INFORU_USER` + `INFORU_TOKEN` env vars; otherwise the backend returns 503 `sms_unavailable`.
- **Email-OTP** - second-step branch when phone verifies but no identity owns the phone yet. The user types an email, gets a 6-digit code, verifies. Backend creates or attaches the identity. (`POST /api/v1/auth/email-otp/{start,verify}`)
- **Apple + WhatsApp** - placeholder stubs. `firebaseAppleSignIn()` always returns `{ notAvailable: true }`; WhatsApp button just shows a toast. Both visibly carry a `בקרוב` / `Soon` badge and disabled styling.

Auto-accept of pending invitations: every successful wallet login runs `reconcilePendingInvitations` (Plan #1.5) which accepts every `pending` non-expired `tenantMemberInvitations` for that email, promotes `NexusIdentity.status` from `invited` to `active`, and surfaces `acceptedTenantIds[]` in the response.

Returning-user gate: `me.profile.completedAt` controls whether the slide chain runs after login. Set => skip slides + go to `/:lang/router`. Unset => slide chain runs and flushes profile data to `/api/v1/wallet/profile` on completion.

RouterScreen lives at `/:lang/router` and is shown after every login. Drives off `me.router.{showMemberTenants, showAdminEntry, showEveryonesCatalog, showJoinRequest}`. Admin entry uses `/api/auth/create-code` to SSO-hand-off to the dashboard.

## Important Files

```
src/
  lib/
    api.ts                          # fetch wrapper + access token + 401 retry + concurrent-refresh dedupe
    walletAuth.ts                   # normalizeIsraeliPhone + requestGoogleIdToken (GIS)
    utils.ts / cn.ts                # tailwind class helpers
  contexts/
    AuthContext.tsx                 # /api/me, refresh-cookie bootstrap, bridges to authStore
  services/
    auth.service.ts                 # phone-OTP / email-OTP / Google wrappers (legacy "firebase" prefix kept)
    walletProfile.service.ts        # GET/PATCH /api/v1/wallet/profile + saveMarketingConsent
    walletTenants.service.ts        # /api/v1/wallet/tenants/discover + /join-requests + /ecosystem-offers
    contacts.service.ts             # device contact picker + share helpers (Google People stub)
    orgMember.service.ts            # stub - org match now comes from /api/me.memberships
  stores/
    authStore.ts                    # legacy Zustand auth state - bridged from AuthContext
    tenantStore.tsx                 # active tenant theme/config
    loginSheetStore.ts              # LoginSheet open/close state
    registrationStore.ts            # in-progress onboarding slide data
  pages/
    auth/EmailRequiredPage.tsx      # phone verified, please enter email
    auth/EmailOtpPage.tsx           # 6-digit email verification
    router/RouterScreen.tsx         # post-login chooser
    wallet/JoinTenantPage.tsx       # tenant discovery + multi-select submit
    wallet/JoinSubmittedPage.tsx    # confirmation page
    register/ + register/onboarding/  # existing slide chain (FirstName, Birthday, Gender, etc.)
    StorePage.tsx, HomePage.tsx, WalletPage.tsx, ActivityPage.tsx, ProfilePage.tsx
  components/
    auth/
      LoginSheet.tsx                # bottom-sheet login with Google + SMS + Apple/WhatsApp stubs
      AnonymousSplash.tsx           # logged-out splash screen (renders inside AppLayout)
    layout/
      AppLayout.tsx                 # mobile-style centered column; gates Outlet on me
      TopBar.tsx                    # greeting + avatar + tenant button + (auth-gated) chat/bell
      UserMenu.tsx                  # avatar-anchored dropdown with Logout
      FloatingActions.tsx           # search + wallet + home FABs (auth-gated)
      TenantSheet.tsx               # bottom-sheet single-tenant info (clicks the tenant name)
    wallet/
      WalletTenantSwitcher.tsx      # top-left pill that switches ?tenant=X / ?ecosystem=1
  router/
    index.tsx                       # createBrowserRouter, route tree, lazy chunks
    LanguageRouter.tsx              # :lang segment, tenant theme effect, mounts LoginSheet + switcher
    ProtectedRoute.tsx              # auth gate for protected routes (/wallet, /activity, /profile)
```

## Routes + Anonymous Middleware

- `/` -> redirect to `/he`
- `/:lang` index - logged-in users redirect to `/store`; anonymous users see `AnonymousSplash`
- `/:lang/store` - StorePage (logged-in only; anonymous bounces to `/:lang`)
- `/:lang/auth/email-required` + `/:lang/auth/email-otp` - mid-signup, anonymous-reachable
- `/:lang/auth-flow/{new-user,org-user}` - onboarding stories (post-login)
- `/:lang/register/onboarding/*` - slide chain (post-login)
- `/:lang/wallet/{join-tenant,join-submitted}` - Plan #4 join flow
- `/:lang/router` - RouterScreen post-login chooser
- `/:lang/*` - NotFound

**`LanguageRouter` enforces a single anonymous-allowlist via `useEffect`.** Any path outside `ANONYMOUS_ALLOW_PATTERNS` (`/:lang` + the two mid-signup pages) gets `navigate(/:lang, { replace: true })` when `me` is null after auth bootstrap. This is the single source of truth for "where an anonymous user can be" - don't add per-route anonymous logic. To allow a new anonymous path, append a regex to that array.

**Authenticated route gates:** `/router` and `/wallet/{join-tenant,join-submitted}` sit under `<ProtectedRoute>` so anonymous direct hits redirect at route-resolve time (not after a render flash). `ProtectedRoute` reads `useAuth()` (not the legacy `authStore`) so it respects the refresh-cookie bootstrap window. `/store` is additionally gated on a router selection: `StoreRoute` requires `?tenant=<id>` OR `?ecosystem=1` in the URL; manual typing of `/store` without either bounces to `/:lang/router` so users never land in an undefined catalog context.

**Switcher visibility:** `WalletTenantSwitcher` is hidden on the screens that ARE pickers (`/router`, `/wallet/join-tenant`, `/wallet/join-submitted`) - showing the top-left chip there would be redundant.

**Auth-loading splash:** `AppLayout` short-circuits to a full-viewport `<WalletLoadingScreen />` while `authLoading` is true. No TopBar, no max-w column, no outlet renders until `/api/me` resolves - users typing protected URLs directly never see a half-loaded page flash before the redirect.

**Full-bleed routes:** `AppLayout` ALSO short-circuits the phone-style `max-w-md` shadow column when the path matches `/:lang` (anonymous) or `/:lang/router`. Those pages own their own desktop layouts. Every other route keeps the phone column. Add new full-bleed routes by appending regex checks in `AppLayout` next to `isAnonymousLanding` / `isRouterPage`.

**Google new-user gate:** `AuthContext.bootstrap` Google branch fetches `/api/me` inline after the code exchange and branches on `profile.completedAt`. Returning users hard-nav to `/:lang/router`. New users (no `completedAt`) get a seeded `useRegistrationStore.startRegistration({ path: 'new-user', ... })` with profileData prefilled from `me.user.name` + `me.user.email`, then hard-nav to `/:lang/auth-flow/new-user` so they run the same nexus-hero → smart-stories → select-org → match-screen → register/onboarding chain phone-OTP signups see. `/api/me` failure falls back to `/router`. Phone-OTP keeps its own `completedAt` branch in `LoginSheet` - this only affects Google.

**TopBar active-tenant resolution:** The chip name comes from intersecting `?tenant=<id>` with `me.memberships` (`activeMembership.tenantName`). Falls back to `tenantStore.config` (themed mock tenants only) then `authStore.organizationName` (first membership at login). Never read `organizationName` alone - it's a login snapshot and won't track switcher changes. Ecosystem mode (`?ecosystem=1`) deliberately ignores both stores and renders "קטלוג נקסוס" / "Nexus-Catalog".

**RouterScreen admin-entry promotion:** Two render paths depending on the user's memberships shape:
- **Pure admin/owner** (`showAdminEntry && showMemberTenants.length === 0`) - the picker only contains Nexus-Catalog so the dashboard is the user's primary surface, not the wallet. Renders a prominent "חזרה ללוח הבקרה שלך" / "Return to your dashboard" button card in the right column (same visual weight as the picker / Continue / can't-find rows).
- **Admin + member-of-other-tenants** - keeps the small inline "פתח לוח בקרה לאדמין" link in the hero. The picker has real choices and the dashboard is genuinely secondary.

Both paths use the same `/api/auth/create-code` + `${VITE_DASHBOARD_URL}/auth/callback?code=...` SSO handoff.

`AnonymousSplash` renders inside `AppLayout` for the `/:lang` index when anonymous. The TopBar's chat + notifications icons and the `FloatingActions` FABs are also auth-gated so the splash stays clean.

## Environment

```
VITE_API_URL=http://localhost:3001                # backend
VITE_WEBSITE_URL=http://localhost:3000            # marketing/login site
VITE_DASHBOARD_URL=http://localhost:5174          # admin dashboard
VITE_GOOGLE_CLIENT_ID=<same value as backend GOOGLE_CLIENT_ID>
```

Local dev port: `8080`. Production: `wallet.nexus-payment.com`.

`.env.local` is gitignored. `.env.example` is the documented template.

## Backend Endpoints This Wallet Calls

All under `api.nexus-payment.com`:

| Endpoint | Used by |
|---|---|
| `POST /api/auth/refresh` | AuthContext bootstrap |
| `POST /api/auth/logout` | UserMenu logout |
| `POST /api/auth/code-exchange` | (future) wallet SSO callback page (Plan #5) |
| `POST /api/auth/create-code` | RouterScreen "Open admin dashboard" handoff |
| `GET /api/me` | AuthContext bootstrap + reload |
| `POST /api/v1/auth/phone/{start,verify,resend}` | LoginSheet SMS flow |
| `POST /api/v1/auth/email-otp/{start,verify}` | EmailRequiredPage + EmailOtpPage |
| `POST /api/v1/auth/google/wallet` | LoginSheet Google flow |
| `GET /api/v1/wallet/profile` | walletProfile.service |
| `PATCH /api/v1/wallet/profile` | RegistrationCompletePage flush |
| `PATCH /api/v1/wallet/marketing-consent` | LoginSheet consent toggle |
| `GET /api/v1/wallet/tenants/discover` | JoinTenantPage search |
| `POST /api/v1/wallet/join-requests` | JoinTenantPage submit |
| `GET /api/v1/wallet/join-requests/mine` | walletTenants.service.listMyJoinRequests |
| `GET /api/v1/wallet/ecosystem-offers` | (not yet wired into StorePage; planned follow-up) |

## Branching

Integration branch: `development`. Never work directly on `main`. Never commit, push, or merge without explicit user approval.

Workflow:
```powershell
git -c safe.directory='C:/Nexus/nexus-wallet' checkout development
git -c safe.directory='C:/Nexus/nexus-wallet' pull origin development
git -c safe.directory='C:/Nexus/nexus-wallet' checkout -b feature/<short-name>
```

Branch types: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`. For changes that touch both wallet and backend (or dashboard), use matching branch names across repos.

Windows note: always pass `-c safe.directory='C:/Nexus/nexus-wallet'` to git commands.

## Coding Standards

These are absolute. Read once, apply everywhere.

### Backend boundary

**Backend is `nexus-website/backend`**. There is no backend in this repo. Every persistent state change goes through `/api/v1/*`. Never duplicate Prisma or Mongo schemas in this repo - the wallet types either come from API responses or are local UI shapes only. Secrets (Google client secret, InforU token, Mongo URI, JWT secrets) never appear in this repo.

### File size

**350 lines per file, maximum.** When a file approaches the limit, split it into helpers, hooks, sub-components, or a folder of focused modules. Long files are a smell - they bury intent. Prefer many small focused files over a few large ones.

### Modular structure

- Each file does one thing. If you describe what a file does and find yourself using "and" repeatedly, split it.
- Keep React components, hooks, services, and stores separated. A page composes pieces; it doesn't fetch + transform + render in one blob.
- API wrappers live in `src/services/*` or `src/api/*`. UI never calls `fetch` directly - it calls `api()` from `src/lib/api.ts` via a typed service wrapper.
- Stores are minimal state holders. Side effects go in services or page-level effects, never inside the store's setters.

### TypeScript

**Never use `any`.** Prefer `unknown` and narrow at the boundary, prefer discriminated unions for state, prefer interfaces over inline object types in shared signatures. Strict mode is on; do not weaken it.

If you find yourself reaching for `any`, the right answer is usually: import the right shared type, define a new typed interface, or use `unknown` + a Zod parse / a type guard. Casts via `as` are a last resort and need a one-line comment explaining why.

### React

- Functional components only. Hooks for state and effects.
- Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for any conditional class string.
- Semantic HTML, ARIA labels, keyboard navigation. The wallet must be fully responsive (mobile-first is the design).
- Skeleton loading for every API-dependent page. No blank screens during fetch.

### Tailwind

Mobile-first (no media-query prefix = mobile; add `sm:`, `md:`, `lg:` as needed). Use design tokens (`bg-primary`, `text-text-primary`, `border-border`, etc.) - do not hardcode hex unless it's a third-party brand color (Google blue, Apple black, WhatsApp green).

### Security

- Access token in memory only. Never localStorage, never cookies set by JS.
- Refresh cookie is httpOnly + SameSite=Lax; the JS layer never reads it.
- Frontend guards are UX only - every business rule must also be enforced server-side. A frontend check with no matching backend check is not a guard; it is a hint.
- Sanitize / escape any user-supplied HTML. The existing `RichTextDisplay` in nexus-dashboard uses DOMPurify; if the wallet ever renders rich text, do the same.

### Documentation

- Every file starts with a short purpose comment explaining what it does and why it exists.
- Every exported function documents inputs and outputs in a JSDoc-style block.
- Document non-obvious state, security decisions, and the "why" behind tricky code. The "what" is usually clear from the code; the "why" is not.

### Errors and logging

- No silent failures. `try { ... } catch { /* swallow */ }` is a bug unless followed by a comment that explains why this specific failure must not bubble.
- Never log raw phone numbers or OTP codes. Hash phones (SHA-256) before logging if they must appear at all. The wallet generally should not log either - that is the backend's job.
- Best-effort calls (like reconciliation after a session is minted) should `console.error('[wallet-auth] xxx failed:', err)` and continue, never block the user.

### Tests

When test infrastructure lands in this repo, behavior, security, and data contracts get tested. Until then, manual smoke through `test-guide-wallet.md` is the verification mechanism.

### Commits, push, merge

**Never commit, push, or merge without explicit user approval.** Workflow:

1. Stage the specific files (avoid `git add -A`).
2. Show a diff summary.
3. Generate a commit message via `caveman-commit` skill or following the existing style.
4. Wait for the user to say "yes" / "go ahead" / "commit".
5. Then run `git commit`. Pushes and merges are separate approvals - a commit approval does not imply a push approval.

No exceptions for "small" changes.

### UI changes

Always invoke `ui-ux-pro-max` or `frontend-design` skill before non-trivial UI work. Read at least two existing pages before adding a new one to match patterns. For an existing UI flow (LoginSheet, OnboardingSlides), prefer surgical edits over rewrites - the wallet has a lot of polished mock UX that should not regress.

### Verification

- Do NOT take screenshots or use preview tools on your own initiative.
- All verification should be done through code (logs, tests, code inspection, type-checks, builds).
- If a screenshot is needed, the user will provide it.

## Test Workflow

`test-guide-wallet.md` at the workspace root has six end-to-end scenarios with concrete network-tab expectations. Use it to verify auth changes.

To reset a user during testing, run the wallet-aware delete script:
```powershell
cd C:\Nexus\nexus-website\backend
npx tsx scripts/delete-login-user.ts --email=user@example.com --apply
```

This now wipes every wallet auth collection too (phone/email OTP challenges, signup tickets, rate-limit markers, join requests).

## Known Open Items

These are intentional deferrals tracked in `nexus-wallet-auth.md`:

- StorePage does not yet read `?ecosystem=1` to call `fetchEcosystemOffers()`. RouterScreen sets the query param; StorePage still uses its mock data source.
- Plan #5 (member-routing): invite emails for plain members still land in dashboard. The fix is documented at `docs/superpowers/plans/2026-05-25-nexus-wallet-auth-5-member-routing.md` and ships when the user approves.
- Apple + WhatsApp providers are stubs.
- No frontend test framework installed yet.
- Member-screen migration out of nexus-dashboard into nexus-wallet is partial - the wallet's RouterScreen + tenant store are the entry, but full feature parity (transactions, support, etc.) is ongoing.

## Unbreakable Rules

- All backend = `nexus-website/backend`. Never duplicate it here.
- File size cap is 350 lines.
- Never `any` in TypeScript.
- Never commit, push, or merge without explicit user approval.
- Never store secrets in this repo.
- Frontend guards are UX-only - back every guard with a server-side check.
- Update `progress.md` / `nexus-wallet-auth.md` when meaningful auth or domain changes ship.
- Read the spec + plan docs in `C:\Nexus\docs\superpowers\` before changing auth behavior.
