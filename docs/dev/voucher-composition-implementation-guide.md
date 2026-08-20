# NEXUS — Voucher Denomination Composition · Implementation Guide

## Developer Porting Instructions

> Step-by-step instructions for copying the "custom amount → fixed-denomination composition" component into an identical project. Written against the reference implementation in this repo (branch `raz`, commits `efbec8d` → `5832b23`).

| | |
| :-- | :-- |
| **Document** | Voucher Denomination Composition — Implementation Guide |
| **Version** | v1.0 |
| **Date** | August 2026 |
| **Status** | Matches production behavior at commit `5832b23` |
| **Audience** | Engineering (porting the component) |
| **Companion** | `docs/product-spec/voucher-denomination-composition.md` (the WHY and full UX rules) — read it first |
| **Live demo** | `/he/business/biz_001/voucher/v_001?tenant=spar` — type 633; qty +1; qty +2 for the cap warning |

---

## 1. What you are copying

The "או הזן סכום משלך" input no longer sells arbitrary-value vouchers. The member types the amount they need; the system composes the **smallest combination of fixed-denomination vouchers whose sum covers it** (633 with {100, 200, 300, 500} → 700 = 500 + 200), shows the composition **in the card gallery itself** with prominent ×N marks, explains the jump in a banner + info sheet, itemizes it in the order summary, and carries it to the success screen. A per-chain redemption cap ("up to N vouchers per transaction") is surfaced as a reminder and a terms line, never a block.

## 2. Product rationale — the problem, the logic, the solution

**The problem.** The UI offered a free-form "enter your own amount" field, which implies the system can issue a voucher at any arbitrary value. It cannot: there is no sequential-number issuance system. The operator holds **inventory** of pre-created vouchers at fixed face values, and the mix differs per chain (one merchant stocks 100/200/300/500, another 25/50/100). Meanwhile the member's real scenario is exact by nature — they are standing at the register and the bill says ₪633. A free-amount field that silently sells a fiction breaks at the exact moment it matters most: at the checkout counter.

**The logic.** Three ways to bridge a continuous request onto discrete inventory were considered:

- *Round to nearest* — a ₪600 card leaves the member ₪33 short at the register; defeats the purpose.
- *Block non-achievable amounts* — forces the member to do denomination arithmetic; hostile.
- ***Cover*** — smallest combination whose sum ≥ the request. The card always pays the bill; the difference stays with the member. This is the only policy that never fails at the register, so it wins.

Covering creates a **trust gap**: the member typed one number and is charged another. The entire UX is built to close that gap where it happens, not at the receipt: the composition is shown as the real physical vouchers (full-size original cards with ×N marks), the banner states the loaded total and the delta in plain words next to the input, the question-mark explains the mechanics, and the remainder is framed as value kept ("היתרה תישאר בשובר לקנייה הבאה") — because it literally is. The math guarantees the gap is small: the delta is always less than the merchant's smallest denomination.

**The solution in one sentence.** Treat the typed amount as a *request*, fulfill it as the cheapest covering batch of real inventory vouchers, and be radically transparent about the batch — its cards, its total, its delta, its uniform terms, and its redemption constraints.

## 3. Implications and derivatives of this capability

Porting this component imports more than a UI — it commits the target project to a set of downstream consequences:

**Inventory & operations**
- The denomination mix becomes a **product lever**: the worst-case delta equals the smallest denomination minus 1. A chain whose members absorb large deltas needs a smaller denomination added to inventory — the delta distribution per merchant is the quantified case for it.
- Consumption is now observable **per denomination** (composition parts), not per preset tier — feed it into inventory forecasting and reorder points.

**Finance & liability**
- One order now creates **N prepaid vouchers**, not one. Refunds, expiry, and breakage accounting must route per voucher; the remainder (delta) is deliberate member overpayment that becomes outstanding prepaid liability — decide who owns it on expiry (Open Decision 1 in the product spec).
- Regulatory prepaid caps apply to the composed total, not the typed amount — the ₪10,000 cap placeholder must be aligned with the real limit.

**POS & redemption**
- The member-facing model is *one card*; the POS reality is N vouchers. Operator-side aggregation (one scan draining the batch) is strongly preferred — and it must respect `maxVouchersPerRedemption` when batching.
- Partial redemption needs a **drain order** policy (which voucher empties first affects where the remainder sits and which expiry it inherits).

**Support & trust**
- The predictable ticket is "typed 633, charged 700." Every surface (banner, receipt breakdown, success-screen composition row) exists so support can point at what the member already saw. Keep them in sync or the ticket becomes a dispute.

**Analytics**
- Log `requested / composed / delta / parts / capExceeded` per order. Beyond merchant health (above), delta size vs. conversion is the natural A/B for denomination granularity.

**Derivative capabilities this unlocks**
- **Exact-bill flows**: the request-driven model generalizes to "pay this bill" — typed amount fed from a scanned bill or open POS ticket.
- **Arbitrary-amount gifting**: gift any sum, delivered as a composed batch — no gift-card denominations to pick from.
- **Budget allocations (B2B)**: employers loading per-employee welfare budgets of arbitrary size become bulk composition jobs over the same engine — one pure function, thousands of orders.
- **A2/JIT migration path**: where a merchant later supports just-in-time issuance (Multipass load), composition collapses to a pass-through — the UX (request → confirmation) survives unchanged, only `parts` becomes a single exact part. Design integrations against the `VoucherComposition` shape and this migration is free.

**Risks to watch**
- Perceived forced overspend at coarse-denomination merchants (the 633 → 700 jump is ₪67 there) — mitigated by copy and by fixing the mix, not by hiding the delta.
- Never let a future "optimization" round down or block: both re-break the register moment this feature exists to fix.

## 4. Files — what to copy and what to adapt

| File | Action | Notes |
| :-- | :-- | :-- |
| `src/utils/voucherComposition.ts` | **Copy verbatim** | Pure, dependency-free. Do not modify the algorithm. |
| `src/types/voucher.types.ts` | Add 2 fields | `denominations?: number[]`, `maxVouchersPerRedemption?: number` on the voucher entity (top level, NOT in conditions — they are merchant-inventory facts) |
| `src/mock/data/vouchers.mock.ts` | Adapt | In a real project these come from the inventory system per merchant. Absent `denominations` ⇒ fallback to preset tier amounts. Absent cap ⇒ no cap. |
| `src/pages/VoucherPurchasePage.tsx` | Port by section | All integration points listed in §7. House style keeps sub-components inline in this file. |
| `src/pages/VoucherSuccessPage.tsx` | Add 2 fields + 1 row | §7.8 |

## 5. The pure util — contract you must preserve

```ts
composeVoucherAmount(target: number, denominations: number[]): VoucherComposition | null

interface VoucherComposition {
  total: number;                              // sum purchased, ALWAYS >= target
  parts: { denom: number; count: number }[];  // descending by denomination
  delta: number;                              // total - ceil(target), >= 0
  exact: boolean;                             // delta === 0
}
export const MAX_COMPOSE_TARGET = 10_000;
```

**Guarantees** (tested; keep them):

| Guarantee | Meaning |
| :-- | :-- |
| Cover policy | smallest achievable sum ≥ target — never rounds down, never blocks |
| Min-count tie-break | among equal sums, fewest vouchers (900 → 500+300+100, never 200×4+100) |
| Bounded delta | `delta < min(denominations)` always |
| Decimal safety | `Math.ceil(target)` internally — 632.5 covers 633, never truncates to 632 |
| Null cases | non-finite / ≤ 0 / > 10,000 target, or empty valid denomination set |
| Below min denom | target 40 with min 100 → `[100 ×1]`, delta 60 |
| Performance | DP bounded at `target + minDenom − 1`; sub-millisecond at the cap — safe to run per keystroke, **no debounce** |

Spot-check script (no test runner in this repo): assert `633,[100,200,300,500] → 700 = 500+200`; `250,[100,200,500] → 300 = 200+100`; `30,[25,50,100] → 50` (single 50 beats 25×2); `300 → exact single`; `10001 → null`.

## 6. State and derivations — exact wiring

All in the purchase page component, in this order (composition is derived **in the hooks section**, before the loading early-returns, because deck hooks depend on it):

```ts
const [customAmount, setCustomAmount] = useState<string>('');      // raw input string
const customAmountNumForEffect = Number(customAmount);              // Number, NOT parseInt (see §7)
const isCustomForEffect = Number.isFinite(n) && n > 0;
const denominations = voucher?.denominations ?? AMOUNT_TIERS.map(t => t.amount);
const composition = isCustomForEffect ? composeVoucherAmount(n, denominations) : null;
const compositionCount = composition ? composition.parts.reduce((s, p) => s + p.count, 0) : 0;  // per unit, qty NOT included
const [customIdx, setCustomIdx] = useState(0);                      // deck index in composition mode
const compositionKey = parts.map(p => `${p.denom}x${p.count}`).join('+');
useEffect(() => { setCustomIdx(0); }, [compositionKey]);            // reset deck to biggest card on every recompute
const lastTierIdxRef = useRef(DEFAULT_TIER);                        // remembers the preset tier for snap-back
// existing auto-advance layout effect: while custom, selectedTierIdx is forced past the
// preset range (keeps currentTier undefined → summary shows the "מותאם" badge);
// on clear it restores lastTierIdxRef.current.
```

Render-scope: `displayAmount = isCustom ? (composition?.total ?? 0) : currentTier.amount`.

**`displayAmount` is the single integration seam.** Everything downstream — subtotal, opening-gift minimum, cashback, installments, split payment, CTA totals — already flows from it. If your target project has the same `computeOrderTotals({unitAmount, qty, cashbackRate, giftAmount})` shape, you change NOTHING downstream. Do not touch the order-math util.

## 7. UI integration points (top of page → bottom)

### 7.1 Card gallery (dual-mode deck)
The SAME deck renders either the presets or the composition's cards:

```tsx
{(isCustom && composition ? composition.parts.map((_, i) => i) : AMOUNT_TIERS.map((_, i) => i)).map(cardIdx => {
  const composedPart = isCustom && composition ? composition.parts[cardIdx] : null;
  const rel = cardIdx - (composedPart ? customIdx : selectedTierIdx);
  const tier = composedPart ? (AMOUNT_TIERS.find(t => t.amount === composedPart.denom) ?? null) : AMOUNT_TIERS[cardIdx];
  const amount = composedPart ? composedPart.denom : tier.amount;
  // key: composedPart ? `c${cardIdx}` : `t${cardIdx}` — separate keys per mode, forces clean remount
  // VoucherCardPreview gets voucherCount={composedPart ? composedPart.count * qty : (qty > 1 ? qty : 0)}
```

- Composition cards are **full size, original card design** (tier gradient/pattern resolved by denomination; unknown denomination falls back to the purple custom face).
- Swipe handler and dot indicators branch the same way: composition mode moves `customIdx` within `parts.length`; preset mode moves `selectedTierIdx`.
- **×N mark** (inside the card component): rendered when `voucherCount > 0`, prominent — left edge, vertically centered, `h-11 min-w-11 rounded-full bg-white/30 backdrop-blur-md border border-white/50`, text `×{N}` at `text-2xl font-black text-white`. Shown even for ×1 in composition mode.
- **qty multiplies the marks**: the mark is `count × qty` (total physical vouchers of that denomination in the order). Preset cards show `×qty` only when qty > 1.

### 7.2 Composition banner — below the gallery, ABOVE the amount input
Rendered whenever `isCustom && composition` (including exact hits). Surface pill: icon chip (`confirmation_number`), content, 20px question-mark button (opens the info sheet). Headline logic:

| Case | Hebrew (verbatim) | English |
| :-- | :-- | :-- |
| `compositionCount > 1` | `נטענים לך שוברים בסך ₪{total.toLocaleString()}` + ` ✓` if exact | `We'll load vouchers totaling ₪{total}` |
| single, exact | `הסכום זמין במלואו — ₪{total} ✓` | `Available in full — ₪{total} ✓` |
| single, covered | `נטען לך שובר של ₪{total}` | `We'll load a ₪{total} voucher` |

Sub-line when not exact: `₪{delta} יותר מהסכום שהזנת — היתרה תישאר בשובר לקנייה הבאה` / `₪{delta} more than you entered — the remainder stays on the voucher`. **Terminology rule: the remainder lives on the voucher (בשובר), never "on the card".**

Amber cap reminder (inside the banner) when `compositionCount * qty > maxVouchersPerRedemption`:
`שימו לב: ברשת זו ניתן לממש עד {N} שוברים בעסקה אחת — ההזמנה כוללת {M} שוברים, וייתכן שהמימוש יפוצל לכמה עסקאות`. Reminder only — **never disable the CTA**.

### 7.3 Amount input
- Label: `או הזן את הסכום שאתה צריך` / `Or enter the amount you need` (a request, not a face value).
- onChange clamps to `MAX_COMPOSE_TARGET` (empty string passes through); `max` attribute set; live recompute per keystroke.

### 7.4 Qty stepper
No changes to the stepper itself. Below the qty/gift row, preset-mode cap reminder when `!isCustom && qty > maxVouchersPerRedemption` (same amber copy with `{qty}`).

### 7.5 Deal terms section
Two muted lines under the heading:
- When `isCustom && compositionCount * qty > 1`: `התנאים שתבחר כאן חלים באופן אחיד על כל {compositionCount * qty} השוברים בצירוף` — terms are a property of the **order/batch**, not of individual inventory vouchers.
- Whenever the cap field is defined (always visible): `ברשת זו ניתן לממש עד {N} שוברים בעסקה אחת`.

### 7.6 Denominations info sheet
Bottom sheet (reuse the project's sheet primitive), title `למה הסכום שונה ממה שהזנתי?` / `Why is the amount different?`. **Text-only — no icons, no live-example line.** Four sections (Hebrew verbatim in the reference; keep both locales):
1. שוברים בערכים קבועים — merchants issue fixed values; we build a combination.
2. תמיד מכסים את הקנייה — smallest combination equal to or just above the request.
3. היתרה לא הולכת לאיבוד — the difference stays as voucher balance at this merchant.
4. תנאים אחידים לכל הצירוף — chosen terms apply to every voucher in the batch.

### 7.7 Order summary
- Product row: add the `מותאם` / `Custom` badge when `!currentTier && isCustom`; row amount is `displayAmount * qty` (already correct via the seam).
- Line items, FIRST in the receipt (before unit-price/qty rows): one row per part showing **total counts** so rows sum exactly to the subtotal — value `₪{denom * count * qty}`, label `שובר ₪{denom} ×{count * qty}` (suffix omitted when 1).
- Delta footnote below the breakdown: `₪{delta} מעל הסכום שביקשת — היתרה נשמרת בשובר`.

### 7.8 Success screen
CTA nav state adds `requestedAmount: Math.ceil(customAmountNum)` and `composition: composition.parts` (both only when custom). Success page: two optional fields on its state interface + one optional details row `הרכב הכרטיס` / `Card composition` with value `formatCompositionParts(parts)` (e.g. `₪500 + ₪200`). All other entry paths keep working via defaults.

## 8. Business-rule interactions (intentional — do not "fix")

| Mechanic | Rule |
| :-- | :-- |
| Opening-gift minimum | measured on the **composed** total × qty — a typed ₪90 composing to ₪100 can newly qualify |
| Cashback | computed on the composed subtotal (pre-gift), per the existing invariant |
| Installments / split payment | derive from cash due → from `displayAmount`; zero special handling |
| qty semantics | qty multiplies the **whole combination**; never re-composes |
| Redemption cap | reminder + terms line only; purchase is never blocked |

## 9. Pitfalls we already hit — read before porting

1. **RTL scale/overflow**: any string like `₪500 + ₪200` needs a `dir="ltr"` island. Any scaled-down preview must be absolutely anchored to the **physical** top-left before applying `transform: scale()` — in RTL flow a wide block aligns right and the scale origin lands off-screen.
2. **Do not change the measured height of the deck card.** The gallery's container height comes from a JS `offsetHeight` measurement of the center card; wrapping the card in anything that adds height creates a re-measure race that clips content asymmetrically (the clip box has slack below — the dots row — and none above). That is WHY the composition renders as normal full-size gallery cards.
3. **`Number`, not `parseInt`**: parseInt truncates decimals; the util ceils. Keep the effect copy and render copy of `customAmountNum` identical or the deck flips modes while derivations disagree.
4. **Snap-back on clear**: clearing the input must return to the tier the user was on (`lastTierIdxRef`), not a hardcoded tier.
5. **Deck keys**: prefix keys per mode (`c${i}` / `t${i}`) so framer-motion remounts cleanly instead of morphing a preset card into a composition card.
6. **Story/walkthrough hooks**: `data-story-tap="amount"` (and the other `data-story*` anchors) must survive; walkthrough mode never enters custom mode, so the preset gallery is always there for it.
7. **Grep the production bundle correctly**: the purchase page is code-split — verify deploys against the `VoucherPurchasePage-*.js` chunk, not the index bundle; Hebrew literals may be `\uXXXX`-escaped, so grep an English string.

## 10. QA checklist

- [ ] 633 → banner `נטענים לך שוברים בסך ₪700`, delta 67, gallery shows ₪500 ×1 + ₪200 ×1, two dots, swipe works
- [ ] 950 → 1,000 = one ₪500 card with ×2 (min-count beats 500+300+200)
- [ ] 300 → `הסכום זמין במלואו — ₪300 ✓`, single card, no delta line
- [ ] 40 (min denom 100) → one ₪100 card, delta 60
- [ ] 632.5 → treated as 633
- [ ] Typing 10001+ clamps to 10,000
- [ ] qty +1 → all ×N marks double; summary breakdown rows double and still sum to subtotal
- [ ] Cap: 633 at qty 2 (4 vouchers, cap 5) → no warning; qty 3 (6) → amber warning in banner; preset qty 6 → amber note under stepper
- [ ] Terms section: uniform-terms note counts composition × qty; cap line always present when the field is set
- [ ] Info sheet: 4 text sections, no icons, no example line
- [ ] Clear the input → preset gallery returns at the previous tier
- [ ] Success screen shows `הרכב הכרטיס ₪500 + ₪200`; all non-custom purchase paths unaffected
- [ ] Both `/he/` and `/en/`; breakdown strings read correctly in RTL
- [ ] Walkthrough/story mode renders identically to before the change

## 11. Reference commits (branch `raz`)

| Commit | What |
| :-- | :-- |
| `efbec8d` | Core: util, data fields, derivations, banner, summary, success screen, spec |
| `686a5fc` | Terminology: remainder stays on the voucher (בשובר) |
| `ba9abbb` → `afe7131` | UX iterations landing on: composition cards in the gallery, prominent ×N, qty multiplication, redemption cap |
| `5832b23` | Info sheet: text-only |

---

*Implementation guide v1.0 — Nexus Engineering. Reference implementation: `src/utils/voucherComposition.ts`, `src/pages/VoucherPurchasePage.tsx`, `src/pages/VoucherSuccessPage.tsx`.*
