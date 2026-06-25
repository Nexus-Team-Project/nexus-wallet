# NEXUS — Customer Portal (`createuser`)

## Tenant Self-Service: Member Management

> A per-tenant portal where a Benefits Club representative logs in, sees their member base, and creates members — single or in bulk — feeding the existing member-creation automation.

| | |
| :-- | :-- |
| **Document** | Customer Portal (`createuser`) — Process & Interface Specification |
| **Version** | Draft v0.1 |
| **Date** | June 2026 |
| **Status** | Product + integration level. **Standalone app on Railway** (separate GitHub repo) that copies the required components from the other Nexus projects; reuses existing auth (website + dashboard) and the Make→Wix member-creation automation. |
| **Purpose** | Define the per-tenant entry link, the login/identity model, the screens, and how the portal drives the member-creation automation — end to end. |
| **Audience** | Product · Engineering. |

---

## 1. Goal

Each tenant (Benefits Club) gets a **dedicated link** carrying its slug. Through it, an authorized representative:

1. **Logs in by email** (so every action is attributable to a person).
2. Sees the tenant's **total member count** and **member list** — scoped to that tenant only.
3. **Adds members** — single (form) or in bulk (paste/CSV) — which flows into the existing automation that creates the members and tags them with the tenant's `customerId`.

---

## 2. Terminology alignment

This portal reuses the product model from [voucher-and-balance-flows.md](voucher-and-balance-flows.md).

| Portal word (informal) | Product term | Identity |
| :-- | :-- | :-- |
| "Customer" | **Tenant — Benefits Club** | `customerId` slug (e.g. `SayertNahalBenefits`) |
| "User" being created | **Member** (end user) | Wix member / backend member tagged with `customerId` |
| The person logging in | **Tenant admin** | A linked **Contact** in Monday with a verified email |

---

## 3. Entry & routing

```
https://www.nexus-online.net/createuser?customerId=<slug>
```

- `customerId` is the tenant's slug, sourced from the **Accounts** board in Monday (`text_mkm56caz`, "customerId").
- The slug is the branding/entry anchor. **Identity and scope are NOT trusted from the URL** — they come from the authenticated session (§4–5). The slug only pre-selects which tenant the visitor intends to act on; it is validated against the logged-in user's authorized tenants.

### 3.1 Slug inventory (state at spec time)
All 35 accounts now carry a `customerId` (the 4 previously-empty rows were filled — 3 with their Business ID, `אדוות` with `580798080` in both `customerId` and `Business ID`). Slugs are intentionally mixed: named (`HaruvBenefits`) or the business number as text (`580657492`) — both are valid.

---

## 4. Identity & authentication (reused, not rebuilt)

We **reuse the existing auth stack** rather than building a new one:

| Layer | Source project | Reused piece |
| :-- | :-- | :-- |
| Login form (email+password + Google OAuth) | `nexus-website` | `src/pages/Login.tsx`, `src/contexts/AuthContext.tsx`, `ProtectedRoute.tsx` |
| Session model | both | In-memory access token + httpOnly refresh cookie (`credentials: 'include'`) |
| SSO hand-off | website → dashboard | `/api/auth/create-code` → callback `/auth/callback?code=…` → `/api/auth/code-exchange` |
| Tenant context & permissions | `nexus-dashboard` | `DashboardMe.context` (`isTenant`, `tenantId`, `role`) + `authorization.canViewMembers` / `canManageMembers` |

**Flow:** unauthenticated visitor on `createuser?customerId=X` → redirected to website `/login` → after login, SSO code exchange → returns to portal with a session whose `me.context` identifies the tenant and permissions. Member-level reps land in the `MemberLayout` experience that already exists.

> No new login UI is needed. If a visitor is already authenticated, skip straight to §6.

---

## 5. Authorization model

**Who may log in for a given tenant = the Contacts linked to that Account in Monday.**

```
customerId slug
   → Accounts board (1767794601), row where text_mkm56caz == slug
   → linked Contacts via "Contacts" relation (connect_boards_mkm0scap → board 1767722179)
   → that Contact's Email (column `email`) must match the authenticated user's email
```

- **Contacts board** (`1767722179`, "My Contacts"): has `email`, `phone`, `שם פרטי`, and `Account` back-relation (`connect_boards_mkm37g76`), plus `Title` (role dropdown).
- Match on email → authorized. No match → access denied for that tenant.
- **v1 role model (decided):** any linked Contact = **full admin** (view + add). No view-only tier. The Contact's `Title` may add granularity in a later version.
- Every query and mutation is **filtered to the authenticated tenant's `customerId`** — strict isolation; one tenant can never see another's members.

> **To verify (backend):** how the Monday `customerId` slug resolves to the backend/dashboard `tenantId` (and `org.slug`). The portal must map slug → tenantId at the session/authorization layer; Monday is the source of truth for the slug↔account↔contacts mapping.

---

## 6. Interface & deployment

A **standalone application** in its own **GitHub repository**, deployed on **Railway** (same pattern as `nexus-wallet`). It does **not** live inside `nexus-dashboard` and is not a Wix Velo page. It **copies** the required pieces from the other Nexus projects into its own tree (vendored, not imported as a workspace), so it can be deployed and iterated independently.

- **Stack:** React 19 + Vite + TS + Tailwind v4, full RTL/Hebrew (`LanguageContext`).
- **Copied from `nexus-dashboard`:** `MemberLayout`, `Members.tsx` + `ContactsTable.tsx` / `RegisteredTable.tsx`, `PhoneInputField.tsx`, stat-card pattern, theme tokens, RTL/i18n.
- **Copied from `nexus-website`:** `AuthContext`, `Login.tsx`, `ProtectedRoute`, the `lib/api.ts` client + SSO code-exchange.
- **Talks to:** the existing backend (auth `code-exchange`, tenant `me`), the Make webhook (member create), and Wix `_functions` (member read — §8.2).

> Trade-off acknowledged: copying duplicates code across repos. Chosen deliberately for deployment independence. Keep the copied modules thin and clearly marked (e.g. a `vendored/` folder) so drift is visible.

### 6.1 Design language (from `nexus-dashboard`)
| Token | Value |
| :-- | :-- |
| Primary | `#635bff` · background `#edf1fc` · cards white · slate text |
| Font | Inter; icons Material Symbols |
| Shell | `MemberLayout.tsx` (narrow tenant sidebar) |
| Direction | RTL/Hebrew via `LanguageContext` |

### 6.2 Screens & component reuse
| Screen / element | Reuse from `nexus-dashboard` |
| :-- | :-- |
| **Total members** card | `stat-card` pattern (`Dashboard.css` / `Home.tsx`) — value 2rem bold |
| **Member list** | `Members.tsx` + `ContactsTable.tsx` / `RegisteredTable.tsx` (name, email, phone, status, joined) + status badges; search + 25/page pagination |
| **Add member — single** | form using `PhoneInputField.tsx` (E164 validation, IL preferred) |
| **Add members — bulk** | the existing **import CSV** toolbar in `Members.tsx` |
| **Login** | website `Login.tsx` (reused, §4) |

The full member-management *process* (toolbar, import/export, table actions) is lifted from the dashboard's existing Members experience.

---

## 7. Capabilities

1. **View** — total count card + paginated member list, scoped to the tenant.
2. **Sort** — by join date or name (server-side via Wix Contacts query sort).
3. **Search** — prefix match on name/email scoped to the tenant (`$startsWith`; `$contains` is unsupported by Wix).
4. **Add single** — form (first name, last name, email, phone, …) → one member created.
5. **Add bulk** — paste → batched (20 per request) → automation.
6. **Import** — `.xlsx` / `.csv` with column mapping (ported from `nexus-dashboard`; SheetJS lazy-loaded) → automation.

---

## 8. Member integration — write & read

### 8.1 Write path — the automation (the key change)

Today's automation (built in this engagement):

- **Make webhook scenario** `create wix members (webhook)` (id `9433951`), hook `4218429`, URL `https://hook.eu2.make.com/tmbej8uqpds06g9p61oay79egqyjgh8l`, auth header `x-make-apikey`.
- Flow: webhook → JS batch (20) → `POST https://nexus-online.net/_functions/bulkCreateMembersCSV` with `{ members: [...] }`.

**Good news — tagging already happens.** The `customerId` is stored on each member's **`company`** field (a Wix Members system field). The existing automation already sends `company` per member (the original hardcoded sample used `company: "580657492"`), and live data confirms `member.contact.company` holds the slug (e.g. `MaglanBenefits`). So **no schema change is required to tag members** — the portal must simply set `company = <authenticated tenant's customerId>` for every member it submits.

```jsonc
POST <webhook>
{
  "members": [
    { "firstName": "...", "lastName": "...", "email": "...", "phone": "...",
      "company": "SayertNahalBenefits",   // = customerId, from the authenticated tenant (NOT the URL)
      "position": "..." }
  ]
}
```

> Optional hardening: also pass a single top-level `customerId` and have the Make scenario stamp it onto every member's `company`, so the portal can't submit a mismatched row.

### 8.2 Read path — VERIFIED, available today

Tested against the live **Nexus-Online** site (`7fa6f005-…`, 13,678 members total):

- The **Members** query (`/members/v1/members/query`) **cannot** filter by company → `400 Unknown token contact.company`.
- The **Contacts** query **can**:

```jsonc
POST https://www.wixapis.com/contacts/v4/contacts/query
{ "query": { "filter": { "info.company": "MaglanBenefits" }, "paging": { "limit": 25, "offset": 0 } } }
→ contacts: [ … ],  pagingMetadata: { total: 294, count: 25, hasNext: true }
```

Verified: returns exactly the tenant's contacts **and** `pagingMetadata.total` (e.g. `MaglanBenefits` → **294**). This gives both the **list** and the **count card** in one call, with server-side paging.

**Implementation:** expose a thin endpoint `GET /_functions/membersByCustomer?customerId=<slug>&page=&pageSize=` (or call the Contacts query directly from the portal's backend) wrapping the query above. It must enforce that the caller is authorized for that `customerId` (§5).

> **Decided:** count/list = **all Contacts tagged to the org** (`info.company == customerId`), e.g. `MaglanBenefits` → 294 — not limited to login-enabled Members.

---

## 9. Data model & sources of truth

| Entity | System | Key |
| :-- | :-- | :-- |
| Tenant ↔ slug | Monday **Accounts** (`1767794601`) | `customerId` = `text_mkm56caz` |
| Authorized admins | Monday **Contacts** (`1767722179`) ↔ Account relation | `email` |
| Members (created users) | Wix members and/or backend | tagged `customerId` |
| Tenant session/permissions | dashboard backend | `me.context.tenantId`, `authorization.*` |

---

## 10. Audit / logging

Every action records: `actor email`, `customerId`, action type (`add_single` / `add_bulk`), member count, `timestamp`. Stored in a dedicated log (Wix collection or Monday). Enables "who did what" attribution — the explicit reason for requiring email login.

---

## 11. Open technical questions (to close before build)

1. ~~Read endpoint~~ **RESOLVED** — Wix Contacts query by `info.company` returns list + total (§8.2). Just wrap + authorize.
2. ~~Tagging on create~~ **RESOLVED** — members already carry `customerId` in `company`; no schema change (§8.1).
3. ~~Contacts vs Members denominator~~ **RESOLVED** — count = all Contacts with `info.company == customerId` (§8.2).
4. **Slug → tenantId mapping**: how the Monday `customerId` slug resolves to the backend `tenantId` / `org.slug` at the authorization layer. _Backend task — still open._
5. ~~Admin role granularity~~ **RESOLVED** — v1: every linked Contact = full admin (view + add); no view-only tier (§5).
6. **Login providers for tenant reps**: email+password, Google, or both (website already supports both).

---

## 12. Build plan (proposed)

1. Wrap the verified Contacts-query read into `membersByCustomer` + authorize by `customerId` (§8.2). _Read path already proven._
2. Resolve slug → tenant authorization (§5, §11.4).
3. Scaffold the **new GitHub repo + Railway deploy**; copy the needed components/auth from `nexus-dashboard` + `nexus-website` into a `vendored/` tree (§6).
4. Wire the portal: login (reused) → slug/tenant gate → `MemberLayout` shell.
5. Total-count card + member list from `membersByCustomer` (§7, §8.2).
6. Single-add form + bulk import → Make webhook, setting `company = customerId` per member (§7, §8.1).
7. Audit logging (§10).
