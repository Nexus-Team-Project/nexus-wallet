# NEXUS — Voucher & Nexus Balance

## Product Flow Specification

> Two value-delivery processes, characterized end to end at the product level.

| | |
| :-- | :-- |
| **Document** | Voucher & Nexus Balance — Product Flow Specification |
| **Version** | Draft v0.1 |
| **Date** | June 2026 |
| **Status** | Product-level. Technical layer (Multipass integration, backend orchestration) to be specified in a follow-up. |
| **Purpose** | Describe, in product terms, how the two core value processes work end to end — including all edge cases — and what happens *after* each scenario (analytics & control per persona). |
| **Audience** | Product · Business · Engineering (as the anchor for the technical spec). |

---

## 1. Two Separate Processes

NEXUS delivers value to a member through **two distinct processes** with **two different money mechanics**. They are not stages of one chain — they are parallel products.

| | **Process A — Voucher** | **Process B — Nexus Balance** |
| :-- | :-- | :-- |
| Money mechanic | **Prepaid** — value loaded up front | **Credit** — authorize → poll → settle |
| When money moves | At purchase | *After* Multipass confirms a transaction |
| What carries the value | The voucher itself | The member's account (a credit line vs. their payment method) |
| Core operation | Issue/assign **or** load → draw down | Authorize framework → confirm → settle (collect) |
| NEXUS financial posture | Holds prepaid value | **Extends credit / fronts money — must collect** |

The guiding distinction is **the timing of the money movement.**

---

## 2. Participants — Four Personas

Earlier "tenant" conflated two functionally distinct roles. There are **four personas** in the analytics & control layer.

| Persona | Role | One-line |
| :-- | :-- | :-- |
| **Member** (end user) | Consumes value | Creates vouchers, holds a Nexus Balance, redeems and spends. |
| **Tenant — Benefits Club** | Affiliation / demand side | The organization a member belongs to *through the products they consume*. Today the central one is the benefits club. **Curates and funds** value for its members; does **not** own supply. |
| **Provider** (supplier) | Supply side | The owner of the voucher/offer. Every Provider is also a Tenant, but acting in a supply capacity. |
| **NEXUS Admin** | Platform operator | Runs the platform; owns exposure, collection, reconciliation, and correction. |

> **The distinction that matters:** the Benefits Club asks *"what did my members receive and consume, and what did it cost me?"* — the Provider asks *"how many of my offers sold and redeemed, and how much did I earn?"*

---

## 3. Prerequisites (one-time, before the processes)

### 3.1 Agreement
The Provider / organization joins NEXUS: onboarding + KYC + financial model (L1 exposure / L2 hold-and-settle / L3 real-time split). This is the frame inside which everything else is permitted. Without an agreement there is no framework to create vouchers or extend balance.

### 3.2 Voucher Configuration (required for Process A)
How a voucher comes to exist. **Two sourcing models, chosen per Provider:**

- **Preferred — JIT issuance via Multipass.** If a Multipass integration exists for that Provider, NEXUS **generates the voucher on demand at purchase time, through the integration** — *no inventory is held in advance.*
- **Fallback — manual inventory.** If no integration exists (or there is a specific need to pre-hold even when one does), NEXUS uses a **manually managed inventory** of codes.

Manual configuration (as built today, supplier/admin via the dashboard):
- **Offer**: type (voucher / coupon / gift card / product / service), title, category, description, background (image or brand color).
- **Pricing**: `face_value` (nominal) → `nexus_cost` (cost to NEXUS) → `member_price` (derived; per-tenant adjustable). *Constraint:* `0 < nexus_cost < face_value`.
- **"Your terms"**: stackable with promotions (yes/no, mandatory), redemption validity (duration from purchase: days/months/years, or never), free-text terms, tags.
- **Inventory** (the manual core): a pool of codes in **one of two mutually exclusive kinds** — **barcodes** (paste; comma/newline/tab separated; auto-dedup; CODE128 + QR preview) or **links** (URL + optional code per row; dedup by URL). Cap **10,000 per batch**. Kind is **locked** after first add. Can also **skip** (0 stock). **CSV bulk** mode for many vouchers at once.
- **Visibility & approval**: `tenant_only` (immediate, active) or `ecosystem` (requires completed Business Setup + Platform Operator approval → `pending_approval`).

### 3.3 Valid Payment Method (required for Process B)
The member must **add a valid payment method**. This is the act of "opening" the Nexus Balance.

### 3.4 Multipass Integration for the Nexus Balance — Percentage-Based
The Nexus Balance is a **continuous amount**, not a fixed denomination. For the Multipass integration to support it, the configuration must be **percentage-based**, not built-in / fixed amounts — a fixed-denomination model cannot represent an arbitrary, continuous balance.

---

## 4. "Your Terms" — Whose Terms

**The Provider sets the frame; the member chooses within it.**
The Provider defines *what is possible* (where valid, which discount, validity, stock/integration). The member, when creating a voucher, chooses *what within that*. This framing holds throughout the spec.

---

## 5. Process A — Voucher (Prepaid)

### 5.1 Two sub-scenarios

"Create voucher on your terms" resolves to one of two sub-scenarios, chosen per Provider:

- **A1 — Assignment (manual, no Multipass, no loading).** The voucher **already exists** — pre-created in a list of discounted vouchers (the inventory). Purchase **does not load** anything; it simply **assigns** an existing voucher from the pool to the member. The discount is already baked into the pre-created voucher.
- **A2 — JIT issuance & loading (Multipass).** The voucher is **created and loaded at purchase**, at a discount, through the Multipass integration. This is the only path where loading actually happens.

> **Key correction:** loading exists **only in A2**. In A1 there is no load — only *assignment* of an already-created voucher.

### 5.2 End to end
1. **Purchase** — the member creates a voucher on their terms: amount, stacking (on/off), online / outlets, quantity. Optionally **send as a gift**, optionally **round-up & donate** (Nexus Cares).
2. **Issue / assign** — immediately upon purchase, no intermediate step or manual approval:
   - **A1:** an existing discounted voucher is **assigned** from inventory.
   - **A2:** a voucher is **created and loaded** via Multipass.
3. **Hold** — the voucher sits in the wallet with its own value and status (active / used / expired).
4. **Redemption** — the member pays at the merchant; the voucher value is drawn down (full or partial).
5. **Cashback** — returns to the Nexus Balance.

### 5.3 Terms → cashback & price
Choosing terms changes the cashback rate and the price. The displayed price is **locked at purchase (price guarantee)** and does not change afterward.

### 5.4 Gifting
When sent as a gift, the voucher lands in the **recipient's** wallet. **The cashback goes to the buyer** (the gifter), not the recipient.

### 5.5 Edge cases
- **Out of stock / "coming soon" / sold out** → cannot purchase. *(A1 depends on a non-empty inventory; A2 depends on a healthy Multipass integration.)*
- **Payment succeeded but issue/assign failed** → recovery scenario: the member was charged but holds no voucher → requires automatic compensation/refund.
- **Partial redemption** → remaining value is preserved for next time.
- **Voucher expired before redemption** → not usable; value originating from an organization allocation returns to the organization.
- **Refund** → the value on the voucher is reversed/returned.
- **JIT issuance failure (integrated provider)** → must not leave the member paid-but-empty; fall back / retry / compensate.

---

## 6. Process B — Nexus Balance (Credit: Authorize → Poll → Settle)

The Nexus Balance is effectively a **credit line against the member's payment method.** NEXUS fronts the money to the merchant; **its existential interest is to collect from the member.**

### 6.1 End to end
1. **Open** — the member adds a valid payment method. This activates the balance.
2. **Press to pay** — NEXUS **opens a framework** (hold / authorization) against the payment method, sized to the transaction.
3. **Poll Multipass** — the **NEXUS backend** polls Multipass to determine whether a transaction actually occurred.
4. **Settle** — **only** once Multipass confirms a transaction → NEXUS **collects** from the payment method.
5. **Update** — balance and history are updated.

> Money moves **only after** Multipass confirms a transaction. The actual spend happens on the Multipass instrument; NEXUS's role is to back it with credit and collect afterward.

### 6.2 Collection integrity — the heart of Process B
Failing to collect = **NEXUS goes into debt.** Therefore:

**Continuous validity monitoring (not only at transaction time).**
A **background mechanism periodically verifies** the payment method is valid and working. On expiry — or any reason the method stops working — **halt immediately**: freeze the balance / block new transactions, *before* a transaction even arrives.

**Collection philosophy (precise):**
- **Default:** do not charge if not needed.
- **On failure / ambiguity:** prefer to charge rather than not (debt is worse than over-charge).
- **Mandatory:** a mechanism to (a) **self-detect our own mistakes** (proactive audit) and (b) **correct / refund simply.**

### 6.3 Chargebacks & refunds (to be characterized as first-class)
- **Chargebacks** — representment / evidence to the card network, **reconciliation against Multipass** (did the transaction really happen?), freeze the member, reserve/exposure policy.
- **Refunds / credits** — a **card refund incurs a fee that NEXUS pays.** Refund policy must price this in: prefer refunding **to the Nexus Balance** over the card, support partial refunds, and define who bears the fee.

### 6.4 Edge cases (all measured by: *did we secure collection?*)
- **First line of defense** — no transaction is allowed on Multipass without an **approved, sufficient framework** against a valid payment method. No framework → no transaction.
- **Multipass confirmed but collection failed** (card declined / expired / hold released) → **the debt scenario.** Required: retry / dunning, **immediate block** of further use, alert, exposure/capital policy.
- **Polling timeout** → never "release and forget." If a transaction *may* have occurred → proactive **reconciliation** with Multipass, and collect if it did.
- **Actual amount exceeds the hold** → the hold must be sufficient up front, or NEXUS must be able to collect the difference (else exposure).
- **Duplication** (double poll / double transaction) → idempotency — biased toward **not missing a collection**, not merely "not charging twice."
- **Payment method expired/canceled between framework and settlement** → block use until replaced with a valid method.
- **Concurrent transactions** → the aggregate framework must cover all of them, else exposure.

---

## 7. Where Multipass Fits

| | Process A — Voucher | Process B — Nexus Balance |
| :-- | :-- | :-- |
| Today | Manual where no integration; **JIT via Multipass where integrated** | **Multipass is the source of truth that a transaction occurred** (backend polls it) |
| Multipass role | Issuance / loading engine (when integrated) | Confirms *that a transaction happened* → the trigger to settle |
| Who talks to Multipass | **The NEXUS backend only** — not the wallet, not the dashboard | **The NEXUS backend only** |

---

## 8. The Ledger — NEXUS Shadow Ledger

Multipass is the source of truth for *whether a transaction occurred*. NEXUS must nonetheless keep its **own shadow ledger** — a parallel, immutable record of every financial movement on our side.

**Why a shadow ledger:**
- **Exposure & collection truth (Process B)** — track what was authorized, confirmed, settled, collected, and still outstanding (the debt position) independently of Multipass.
- **Reconciliation** — continuously match our ledger against Multipass and surface mismatches (confirmed-but-not-collected, collected-but-not-confirmed, timeouts) for the NEXUS Admin to resolve.
- **Self-audit & correction** — the ledger is what lets us *detect our own mistakes* and correct / refund simply (see §6.2).
- **Both processes** — voucher issue/assign/draw-down (A) and balance authorize→settle (B) both post entries.

**Principles:**
- **Immutable / append-only** — nothing is modified or deleted; corrections are new entries that reference the original.
- **Single financial source of truth on the NEXUS side** — analytics, exposure dashboards, and settlement all read from it.
- **Shadow, not replacement** — it mirrors and reconciles against Multipass; it does not take over Multipass's role as the transaction-of-record.

---

## 9. Analytics & Control — Four Personas × Two Processes

For each cell: *what they see* + *what they control*.

| Persona | Process A — Voucher | Process B — Nexus Balance |
| :-- | :-- | :-- |
| **Member** | My vouchers (active/used/expired), remaining value, redemption history, cashback. **Control:** redeem, gift, archive. | Balance & framework status, transactions (authorized/settled), payment-method status, statements. **Control:** add/replace payment method, dispute a charge, view holds. |
| **Tenant — Benefits Club** (affiliation / demand) | What *my members* bought/redeemed, engagement, value delivered, **consumption of the budget/subsidy/allocation I fund**, cashback footprint. **Control:** curate the members' catalog, pricing/subsidy rules, allocations, member management. | Aggregate balance usage by my members, spend patterns. **Control:** member-level limits / eligibility. |
| **Provider** (supply) | My offers' performance **across all clubs**: issuance volume, redemption rate, revenue, settlement (L2/L3), JIT vs. inventory, Multipass integration health, stock. **Control:** configuration, pricing (`face_value`/`nexus_cost`), terms, inventory/integration, fulfillment. | Pending balance & settlement for transactions paid via the balance. **Control:** limited. |
| **NEXUS Admin** ❗ | Cross-everyone issuance volume, JIT vs. inventory, Multipass issuance success/failure, integration health, stock depletion. **Control:** approve offers, manage providers, force-issue, reconciliation, intervene on failed loads. | **The core:** exposure/debt dashboard, collection success/failure rates, outstanding holds, settlement status, chargebacks, refunds & their cost, validity-monitoring alerts, reconciliation with Multipass. **Control:** freeze a member, force-collect, refund, write off debt, correct mistakes, manage dunning. |

---

## 10. Open Decisions

1. **B funding presentation** — is the balance presented to the merchant as a Multipass instrument (card/token) on which the transaction runs, with NEXUS settling afterward? (Working assumption: yes — to confirm.)
2. **Cashback nature** — does cashback land as **monetary balance** or as a **dedicated benefit**? (Distinct entities in Multipass.)
3. **Online vs. outlets terms** — block up front per the Provider's terms, or allow and warn?
4. **Refund routing default** — default to Nexus Balance (no card fee) vs. card; who bears the fee when card refund is required.
5. **Pricing terminology** — align dashboard `face_value` / `nexus_cost` / `member_price` with the official spec's `nexus_price` / tenant rule / member final price.

---

## 11. Next: Technical Layer (follow-up spec)

To be specified on top of this product model, per process:
- **Backend ↔ Multipass** call map: `CreateCards` (issuance/load — A2), `GetCardInfo` (balance/benefits), `AddTransaction` (spend), `Refund`, `ActivateCard`, plus the **polling** loop that confirms a transaction in Process B. Percentage-based config for the continuous Nexus Balance (see §3.4).
- Assignment path (A1): how a pre-created discounted voucher is selected and linked from inventory (no load).
- Framework (authorization) lifecycle: open → poll → settle / release, with timeouts, idempotency keys, and reconciliation jobs.
- Collection-integrity machinery: periodic validity checks, dunning/retry, exposure tracking, self-audit & correction tooling.
- **Shadow ledger**: schema, entry types per process, and the reconciliation job against Multipass.
- Chargeback & refund handling flows and their accounting.

---

*Draft v0.1 — June 2026 — for internal alignment. Edit freely; technical layer to follow.*
