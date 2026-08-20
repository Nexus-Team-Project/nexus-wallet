# NEXUS — Voucher Denomination Composition

## Product Flow Specification

> Replacing the free-amount "enter your own amount" input with a cover-the-bill composition built from fixed-denomination voucher inventory.

| | |
| :-- | :-- |
| **Document** | Voucher Denomination Composition — Product Flow Specification |
| **Version** | Draft v0.1 |
| **Date** | August 2026 |
| **Status** | Product-level. Realizes the Approach A1 (pre-created inventory) path of the companion spec. Reference implementation exists in the wallet demo. |
| **Purpose** | Define how a member-typed amount is fulfilled from fixed-denomination voucher inventory, and how the gap between the typed amount and the fulfilled amount is communicated. |
| **Audience** | Product · Business · Engineering |
| **Method** | Derived from the working demo implementation (`VoucherPurchasePage`, `voucherComposition` util) — every UI string and rule below is live in the demo. |
| **Companion** | `voucher-and-balance-flows.md` — §3.4 (fixed denominations cannot represent a continuous amount), §5.1 Approach A1 vs. A2. |

---

## 1. Background and Problem

The voucher purchase screen offers preset amount tiers (₪100 / ₪200 / ₪300 / ₪500) plus a free-form "enter your own amount" input. The free-form input implies that a voucher can be issued at any arbitrary value.

**That capability does not exist.** There is no sequential-number issuance system. The operator holds *inventory* of pre-created vouchers at fixed face values, and the mix differs per merchant. As the companion spec establishes (§3.4): a fixed-denomination model cannot represent an arbitrary, continuous amount — and per §5.1, arbitrary amounts are only realizable on the A2 (just-in-time issuance) path, which is a future capability.

The member's real-world scenario is concrete: they are standing at the register and the bill is, say, **₪633**. They need a card that pays that bill *now*.

**The change:** the member types the amount they need; the system composes the smallest combination of in-inventory denominations whose sum **covers** that amount, presents the composed value next to the typed value with an explicit explanation of the difference, and itemizes the combination in the order summary.

## 2. The Principle: Cover, Don't Round

| Policy | 633 with {100, 200, 300, 500} | At the register | Verdict |
| :-- | :-- | :-- | :-- |
| Round to nearest achievable | ₪600 | Card is short ₪33 — member must split payment at POS | ✗ Defeats the purpose |
| Block non-achievable amounts | Error state | Member must do denomination math themselves | ✗ Hostile |
| **Cover (smallest sum ≥ target)** | **₪700 (500 + 200)** | **Always pays the bill; ₪67 remains as voucher balance** | ✓ Adopted |

Worked example (live in the demo): typed **₪633** with denominations {100, 200, 300, 500} → composed **₪700** = ₪500 + ₪200, delta **₪67**, communicated as *"₪67 more than you entered — the remainder stays on the voucher for your next purchase."*

**Terminology rule:** the remainder lives **on the voucher** (בשובר), never "on the card" — vouchers are the value-bearing objects; "card" refers only to the wallet card face that presents the batch.

The delta is bounded: it is always **less than the smallest denomination** the merchant offers (otherwise one smallest voucher could be dropped and still cover). The denomination mix therefore directly controls the worst-case jump — a business lever, not just a UX detail (see §7).

## 3. Data: Per-Merchant Denominations

New optional field on the voucher entity:

```ts
// Voucher (voucher.types.ts)
/** Fixed denominations held in inventory for this merchant. A custom amount
 *  is fulfilled as the smallest combination with sum >= the requested amount.
 *  When absent, the UI falls back to the preset tier amounts. */
denominations?: number[];
```

| Rule | Behavior |
| :-- | :-- |
| Field present | Composition uses exactly this set |
| Field absent | Fallback to the preset tier amounts (100, 200, 300, 500) |
| Invalid entries (non-integer, ≤ 0) | Filtered out before composing; duplicates deduped |
| Demo data | v_001 McDonald's `[100, 200, 300, 500]` · v_002 Castro `[100, 200, 500]` · v_004 Aroma `[25, 50, 100]` · others exercise the fallback |

In production this set is per-merchant inventory truth and must come from the inventory system, not static config. Preset tier amounts are trusted as purchasable as-is (they are expected to be members of the denomination set — see Open Decisions).

## 4. Composition Algorithm

**Contract** (`composeVoucherAmount(target, denominations) → VoucherComposition | null`):

```ts
interface VoucherComposition {
  total: number;                              // actual sum purchased (>= target)
  parts: { denom: number; count: number }[];  // descending by denomination
  delta: number;                              // total - target (>= 0)
  exact: boolean;                             // delta === 0
}
```

**Selection rule:** smallest achievable sum ≥ target wins; among equal sums, the fewest vouchers win. (₪900 from {100, 200, 300, 500} → 500 + 300 + 100, three vouchers, never 200×4 + 100.)

Implementation: unbounded coin-change DP with parent pointers, bounded at `target + minDenom − 1` (the optimal covering sum provably lies in that window). Sub-millisecond at the cap; recomputed live on every keystroke, no debounce.

**Edge cases:**

| Input | Result |
| :-- | :-- |
| Empty / 0 / negative / non-numeric | No composition (`null`) — UI shows nothing, preset flow continues |
| Decimal (e.g. 632.5) | Ceiled before composing — covering never rounds down |
| Below smallest denomination (e.g. ₪40 vs. min ₪100) | One smallest voucher: ₪100, delta ₪60 |
| Exact hit (e.g. ₪300) | `exact: true`, single part, "available in full ✓" state |
| Above cap (**₪10,000**) | Input is clamped to the cap; cap itself composes normally |
| Quantity > 1 | Quantity multiplies the **whole combination** (2 × the ₪700 card = two identical cards), never re-composes |

## 5. UX Specification

**Input.** Label changes from "enter your own amount" to **"enter the amount you need"** (he: "או הזן את הסכום שאתה צריך") — the field now expresses a *request*, not a face value. Free typing preserved; values above ₪10,000 are clamped.

**Composition banner** — appears **above the input** (below the mini voucher chips), **always** while a valid amount is entered (per product decision: the member always sees the composition next to what they typed, including on exact hits). Anatomy:

| Element | Multi-voucher (633) | Single exact (300) | Single covered (40) |
| :-- | :-- | :-- | :-- |
| Headline (bold) | נטענים לך שוברים בסך ₪700 | הסכום זמין במלואו — ₪300 ✓ | נטען לך שובר של ₪100 |
| Sub-line | ₪67 יותר מהסכום שהזנת — היתרה תישאר בשובר לקנייה הבאה | — | ₪60 יותר מהסכום שהזנת… |
| Breakdown (muted, LTR island) | ₪500 + ₪200 | ₪300 | ₪100 |
| Question-mark micro-button | opens the info sheet | opens the info sheet | opens the info sheet |

The plural headline is deliberate — the copy never calls a multi-voucher composition "a card"; it says **vouchers totaling ₪X** (with a `✓` suffix when the multi-voucher sum is exact), and the breakdown line always sits directly beneath it. Amounts use thousands separators (₪1,200). English copy: "We'll load vouchers totaling ₪700" / "Available in full — ₪300 ✓" / "We'll load a ₪100 voucher" / "₪67 more than you entered — the remainder stays on the voucher".

**Info sheet** ("למה הסכום שונה ממה שהזנתי?" / "Why is the amount different?") — bottom sheet, four sections plus a live example of the member's own numbers:

1. **Fixed voucher values** — merchants issue vouchers at fixed values; an arbitrary-amount voucher cannot be issued, so a combination is built.
2. **Always covers your purchase** — the smallest combination equal to or just above the request, so the card always pays the bill at the register.
3. **The remainder is not lost** — any difference stays as voucher balance for the next purchase at this merchant.
4. **Uniform terms for the whole batch** — see "Uniform batch terms" below.
5. *Live example pill (when a jump is active):* "ביקשת ₪633 ← נטען ₪700 (₪500 + ₪200)".

**While a custom amount is entered, the SAME card gallery shows the composition's cards** — full size, the original card design (tier gradient, pattern, Nexus mark, tier label, merchant logo, balance readout), one card per denomination, swipeable with dot indicators exactly like the preset deck. No single "uniform card" for the composed total is ever shown.

- **Prominent ×N mark**: every composition card carries a large count circle on its **left edge** (`×1`, `×2`, …) — shown even for a count of 1.
- **The qty stepper multiplies the marks**: the ×N on each card is the TOTAL physical vouchers of that denomination in the order (`count × qty`). At qty 2, a 633 → 700 composition shows `×2` on the ₪500 card and `×2` on the ₪200 card. Preset cards also show `×qty` when qty > 1.
- **The composition banner** — "נטענים לך שוברים בסך ₪700" + the delta sub-line + the question-mark that opens the info sheet (text-only sections, no icons). Always **below the gallery and above the amount input**.
- Clearing the input returns the gallery to the preset deck at the tier the member was previously on. Single-voucher results render one card and the singular banner copy. Story-mode walkthroughs never enter custom mode, so the preset gallery and its story anchor are always present for them.

**Deck behavior while a composition is active:** the preset cards leave the gallery entirely — the composed stack is shown **alone**. Swiping the stack sideways (either direction) **resets the typed amount** and re-enters the preset gallery at the adjacent card; tapping a preset dot does the same. Clearing the input by hand returns to the tier the member was previously on.

**Uniform batch terms.** The deal terms the member chooses (promo stacking on/off, online use, outlets, etc.) apply **uniformly to every voucher in the composed batch** — no voucher in the batch can carry different terms from the rest. Stated in the UI in two places: a note directly under the "Deal terms" heading whenever a multi-voucher composition is active ("התנאים שתבחר כאן חלים באופן אחיד על כל N השוברים בצירוף", N = composition × qty), and as section 4 of the info sheet. Engineering implication: terms are a property of the **order/batch**, not of the individual inventory voucher rows it consumes.

**Chain redemption cap (`maxVouchersPerRedemption`).** Some chains cannot redeem more than N vouchers in a single POS transaction. This is a per-merchant data field alongside `denominations` (demo: McDonald's 5, Aroma 3; absent = no cap). Rules:

| Rule | Behavior |
| :-- | :-- |
| Purchases are **never blocked** by the cap | The composer already minimizes voucher count; exceeding the cap only happens when unavoidable or via qty |
| Consumer reminder | When total order vouchers (composition × qty, or qty for presets) exceed the cap, an amber note appears in the composition banner (or under the qty stepper for presets): "שימו לב: ברשת זו ניתן לממש עד N שוברים בעסקה אחת — ההזמנה כוללת M שוברים, וייתכן שהמימוש יפוצל לכמה עסקאות" |
| Deal terms | Whenever the field is defined, the terms section states it permanently: "ברשת זו ניתן לממש עד N שוברים בעסקה אחת" |
| Engineering | The cap is a redemption-time constraint, not an issuance constraint; POS aggregation (Open Decision 4) must respect it when batching vouchers into one scan |

## 6. Order Summary and Receipt

- **Product row** gains a "מותאם / Custom" badge for composed amounts (presets keep their tier badge); the row amount is `composed total × qty`.
- **Breakdown line items** open the receipt, one row per denomination with **total counts** (`count × qty`) so the itemized rows sum exactly to the subtotal — e.g. for 633 × qty 2: `שובר ₪500 ×2 — ₪1000`, `שובר ₪200 ×2 — ₪400`.
- **Delta footnote** under the breakdown (mirrors the existing cashback footnote): "₪67 מעל הסכום שביקשת — היתרה נשמרת בשובר".
- **Success screen** gains an optional "הרכב הכרטיס / Card composition" detail row (`₪500 + ₪200`) carried via navigation state (`requestedAmount`, `composition`).

**Interactions with existing mechanics** (both intentional, both follow from "the composed total *is* the order amount"):

| Mechanic | Rule |
| :-- | :-- |
| Opening gift minimum | Measured on the **composed** total × qty — a typed ₪90 that composes to ₪100 can newly qualify. Not a bug. |
| Cashback | Computed on the composed subtotal (pre-gift), per the existing invariant. |
| Installments / split payment | Derive from cash due, which derives from the composed total — no special handling. |

## 7. What Happens After

Per-order analytics should capture `requested`, `composed`, `delta`, and `parts`. The **delta distribution per merchant** is the health signal for the Provider persona: a merchant whose members consistently absorb large deltas has a denomination mix that is too coarse for their basket sizes — a direct, quantified case for adding a smaller denomination to inventory (or, eventually, for the A2/JIT path). Composition part counts also feed inventory forecasting: the mix members actually consume is now observable per denomination rather than per tier.

## Open Decisions

1. **Remainder ownership and expiry** — the delta stays on the voucher; does it share the voucher's expiry, and what happens to it on refund?
2. **Cap value** — ₪10,000 is a placeholder; align with regulatory prepaid limits and per-merchant maximums (`maxPerTransaction` exists on `VoucherConditions`, currently unused).
3. **Preset-vs-denominations validation** — should preset tiers be required to be members of the merchant's denomination set, or composed like any other amount when they are not?
4. **POS redemption UX** — a composed card is N inventory vouchers; does the member present one barcode (operator-side aggregation) or several? Operator-side aggregation is strongly preferred; the member-facing model is *one card*.
5. **A2/JIT future** — when just-in-time issuance (Multipass load) becomes available for a merchant, composition becomes unnecessary there; the suggestion panel should collapse to a pass-through. Field-level flag TBD.

---

*Draft for review — Nexus Product. Reference implementation: `src/utils/voucherComposition.ts`, `src/pages/VoucherPurchasePage.tsx`.*
