# Nexus Wallet — Project Context

## What is this project?

nexus-wallet is a mobile-web wallet PWA built with React 19 + Vite + TypeScript + Tailwind CSS. It allows end-users (consumers) to browse vouchers, make purchases, earn cashback/bonuses, and manage their wallet within a multi-tenant system.

## Multi-Repo Architecture

Nexus is split across separate GitHub repos under the `Nexus-Team-Project` organization:

| Repo | Role | Tech |
|------|------|------|
| **nexus-wallet** (this repo) | Consumer-facing wallet PWA | React 19 + Vite + TS + Tailwind |
| **nexus-website** | Marketing site + **shared backend** | React + Vite frontend; Express + Prisma + PostgreSQL backend |
| **nexus-dashboard** | Tenant admin/management UI | React + Vite + TS + Tailwind |
| **nexus-agents** | AI agents | Private |
| **Nexus-API-Docs** | API documentation | Private |
| **NEXUS-BluePrint-Architecture** | Architecture blueprint | WIP |

**Shared backend** lives in `nexus-website/backend/` — Express 4 + Prisma ORM + PostgreSQL on Railway. All projects connect to this backend. It provides JWT auth, Stripe payments, OpenAI integration, Socket.io, and the shared database.

## Current State (nexus-wallet)

- **Frontend:** Complete UI with mock data — all API calls go to local mock handlers, not to a real backend
- **Auth:** Firebase Auth (phone OTP, Google, Apple sign-in) — planned migration to JWT via shared backend
- **API client:** `src/api/client.ts` with `VITE_API_BASE_URL` — currently unused, each API module imports mocks directly
- **State:** Zustand stores (auth, tenant, cart, registration, etc.) + TanStack React Query
- **Deployment:** Railway (Nixpacks)
- **i18n:** Hebrew + English

## User/Tenant Architecture

### Multi-Tenant, Multi-Membership Model

Users can belong to **multiple tenants** simultaneously with different roles in each.

### Two Registration Systems

- **Wallet (this repo):** End-user/consumer registration — buy vouchers, earn points, use wallet
- **Website (nexus-website):** Tenant/business registration + admin/management users

### Data Model: Account + Profile Split

```
Account (shared identity - one per person, shared DB)
+-- id, email, phone, passwordHash, createdAt
+-- WalletProfile (consumer-specific: preferences, language, avatar)
+-- AdminProfile (management-specific: dashboard settings)
+-- TenantMembership[] (join table)
     +-- role -> Role, permissions[] (RBAC per tenant)
```

**Why this split:**
- Security: admin data isolated from consumer data
- Flexibility: one person can be both consumer + admin (same account, different profiles)
- Auth: single login identity, context switches via active tenant

### Contact vs Member

**TenantContact** — Pre-matching data, imported by tenant BEFORE user registers:
- Tenant uploads contact lists (emails/phones) via CSV, manual entry, or API
- Fields: tenantId, email?, phone?, firstName?, lastName?, metadata, importedAt, source, matchedAccountId?
- Used to suggest tenant affiliation during registration

**TenantMembership** — Active member, person registered and accepted:
- Fields: accountId, tenantId, role, permissions[], joinedAt, status, sourceContactId?
- Created when user accepts a tenant suggestion or joins via invite
- sourceContactId links back to TenantContact for audit trail

**Flow:**
1. Tenant uploads Contacts (pre-matching list)
2. User arrives at wallet (via tenant link `?tenant=X` or generic)
3. User registers -> system matches email/phone against TenantContact
4. If match found -> suggest tenant affiliation
5. User chooses to join (not forced)
6. TenantMembership created, TenantContact.matchedAccountId updated

### RBAC

Full role-based access control with custom roles per tenant. Not just admin/member — tenants can define custom roles with granular permissions.

### Tenant Routing

- Tenant-specific wallet link: `?tenant=<slug>` URL parameter
- Auto-suggests that tenant during registration
- Generic wallet: matches against contact lists and suggests matching tenants
- `tenantStore` holds active tenant context, supports switching between tenants

## Auth Strategy (Planned)

**Current:** Firebase Auth (phone OTP, Google, Apple sign-in) — legacy, to be migrated
**Target:** JWT auth through nexus-website backend

Migration plan:
1. `VITE_AUTH_PROVIDER=nexus|firebase` env var to gate between old and new auth
2. New `nexusAuth.service.ts` calls backend: `/api/auth/otp/send`, `/api/auth/otp/verify`, `/api/auth/google`, `/api/auth/apple`, `/api/auth/refresh`, `/api/auth/logout`
3. `authStore` changes from single `token` to `accessToken` + `refreshToken` (JWT dual-token)
4. `FirebaseAuthSync.tsx` replaced with `JwtAuthSync.tsx` (auto-refresh, 401 handling)
5. Firebase removed entirely once JWT auth is stable

## API Architecture

### Current (Mock)

Each API module in `src/api/` imports mock handlers directly:
```
src/api/vouchers.api.ts -> src/mock/handlers/vouchers.handler.ts -> src/mock/data/vouchers.ts
```

### Target (Real Backend)

API modules will call `apiGet`/`apiPost` from `client.ts` with:
- `Authorization: Bearer <accessToken>` header
- `X-Tenant-Id` header for active tenant context
- Auto token refresh on 401
- `VITE_USE_MOCKS=true|false` toggle to switch between mock and real

### Wallet API Endpoints (planned, prefixed `/api/wallet/`)

| Domain | Endpoint | Method |
|--------|----------|--------|
| User | `/me` | GET, PATCH |
| Wallet | `/me/wallet` | GET |
| Vouchers | `/vouchers`, `/vouchers/:id` | GET |
| Vouchers | `/me/vouchers`, `/me/vouchers/purchase` | GET, POST |
| Transactions | `/me/transactions?type=X` | GET |
| Offers | `/offers`, `/offers/active`, `/offers/:id/claim` | GET, POST |
| Search | `/search?q=X` | GET |
| Tenants | `/tenants/match?phone=X&email=Y` | GET |
| Tenants | `/tenants/:id/join` | POST |
| Memberships | `/me/memberships`, `/me/active-tenant` | GET, PUT |

## Key Directories

```
src/
  api/           -- API modules (currently mock-backed)
  assets/        -- Images, logos, animations
  components/    -- React components by feature
  features/      -- Feature modules (stories)
  hooks/         -- Custom React hooks (useUser, useVouchers, etc.)
  i18n/          -- Internationalization (en/he)
  lib/           -- Firebase initialization (legacy)
  mock/          -- Mock handlers and data (kept for development)
  pages/         -- Page components (route targets)
  router/        -- React Router configuration
  services/      -- Business logic (auth, contacts, orgMember)
  stores/        -- Zustand state management
  types/         -- TypeScript type definitions
  utils/         -- Utility functions
```

## Environment Variables

```
# Backend
VITE_API_BASE_URL=http://localhost:3001/api/wallet  # Shared backend URL
VITE_USE_MOCKS=true                                  # true=mock handlers, false=real API
VITE_AUTH_PROVIDER=nexus                             # nexus (JWT) or firebase (legacy)

# Firebase (legacy, remove after auth migration)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=false
```

## Development

```bash
npm run dev      # Dev server on port 3001 (with mocks)
npm run build    # TypeScript check + Vite build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Integration Roadmap

See `/root/.claude/plans/ethereal-marinating-finch.md` for the full 4-phase integration plan:
1. **Phase 1:** Foundation — enhanced client.ts, types update, mock/real toggle, env config
2. **Phase 2:** Auth migration — Firebase to JWT, tenant matching, registration flow
3. **Phase 3:** Connect real API — all modules hit backend endpoints
4. **Phase 4:** Cleanup — remove Firebase, legacy code
