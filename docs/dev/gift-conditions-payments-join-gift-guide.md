# NEXUS — Gift Conditions, Nexus-Balance Payments & Joining-Gift Landing · Developer Guide

## How the new designs work, file by file

> What was built, how each piece behaves, and where the logic lives. Written against the working tree on branch `raz` (uncommitted at time of writing). Product source: *איפיון מתנת הצטרפות – Nexus Wallet* (spec HTML, sections "תנאים מתקדמים של מתנות", "מתנת הצטרפות מפוצלת לשתי מתנות נפרדות", "פלואו שליחת המתנות").

| | |
| :-- | :-- |
| **Document** | Gift conditions, Nexus-balance payments & joining-gift landing — Developer Guide |
| **Version** | v1.0 |
| **Date** | October 2026 |
| **Status** | Prototype on mock data — UI and client logic complete, no backend |
| **Audience** | Engineering |

### Live demo links

| Area | URL |
| :-- | :-- |
| Benefit sheet (gift + advanced conditions) | `/he/wallet/balance?tab=subBalances` → "לכל התנאים" on any gift |
| Payment — two-sheet version | `/he/business/biz_002/voucher/v_002` → tap the Nexus payment chip twice |
| Payment — unified one-sheet version | `/he/business/biz_002/voucher/v_002?pay=unified` → tap the Nexus chip twice |
| Joining-gift landing, with gift | `/he/tenant-about?tenant=isrotel` |
| Joining-gift landing, no gift (cap reached) | `/he/tenant-about?tenant=isrotel&gift=0` |
| Gift-receive flow copy (exploration) | `/he/join-gift?tenant=isrotel` · `&state=capped` |

---

## 1. Overview

Three connected features:

1. **Advanced gift conditions** — every gift carries optional conditions (participating chains, dedicated cashback, validity, transfer, minimum, cap, …). They render on the gift's benefit sheet, and they decide whether a gift can pay for a given purchase.
2. **Nexus-balance payments** — at checkout the member sees which gifts work *here*, how much each covers, can reorder sources and type amounts, and splits the rest across other payment methods. One shared plan object drives every surface.
3. **Joining-gift landing** — a white-labelled, tenant-branded landing page (the About page, without Nexus branding except a co-logo) that announces the joining gift, claims it into the wallet with a celebration, or — when gifts ran out — keeps the user with the wallet's own value.

### Global UX rules (apply everywhere below)

- **Display rule:** a condition renders only if it was defined. No "unlimited" / "n/a" rows. No conditions → no "תנאים מתקדמים" section at all.
- **No bottom sheet on top of a bottom sheet.** Drill-downs (condition details, "?" explainers, actions) replace the sheet's content in place, with a back arrow (`arrow_forward` in RTL) that returns to where they were opened from. Content slides in from the reading-direction "forward" side.
- **Neutral cashback wording.** A dedicated rate may be higher or lower than the brand's regular rate, so never "מופחת" / "בהסדר הארגון"; show the rate per payment source. The organisation's discount is never shown to the employee.
- **"?" buttons** match the one next to the sub-balances total: `w-7 h-7 rounded-full bg-white shadow-md` + Material Symbols Rounded `help`, 18px, `text-text-muted`.
- **Locked gift** (Nexus joining gift): visible in the balance from day one, greyed with a lock, never usable until the threshold — and never counted in "available to pay".

---

## 2. Data model

### 2.1 `src/types/giftConditions.types.ts` (new)

```ts
interface GiftConditions {
  brands?: GiftBrandRate[];          // participating chains; absent = any brand
  dedicatedCashback?: boolean;       // show per-chain gift rate vs card rate
  validity?: GiftValidity;           // expiresAt, unlockBy?, onExpiry*, remindersDaysBefore
  environments?: GiftUsageEnvironment[]; // 'in_store' | 'online' | 'in_app' | 'p2p'
  transfer?: 'whole' | 'partial';    // absent = not allowed (and not shown)
  minTransaction?: number;
  maxSharePercent?: number;          // max % of a purchase payable from the gift
  singleUse?: boolean;               // shown only when it differs from the default
  onLeavingOrg?: 'keeps' | 'expires';
  onRefund?: 'returns_to_gift' | 'absorbed';
  termsUrl?: string;
}
interface GiftBrandRate { businessId: string; cardRate: number; giftRate: number }
```

Payment order is deliberately **not** a condition — it's a wallet preference (spec: "סדר תשלום — לא מוצג כתנאי").

### 2.2 `SubBalance` additions — `src/types/wallet.types.ts`

| Field | Meaning |
| :-- | :-- |
| `source` | now `'gift_card' \| 'voucher' \| 'nexus_gift'` (`nexus_gift` = Nexus joining gift, no merchant voucher) |
| `event`, `eventHe` | the occasion ("אירוע" on the benefit sheet) |
| `originalAmount` | issued amount, shown as "יתרה / סכום מקורי" |
| `lock` | `{ threshold, progress, unlockBy }` — locked until `progress ≥ threshold` |

### 2.3 Mocks

- `src/mock/data/giftConditions.mock.ts` (new) — conditions **keyed by voucher id**. The set is built to demo every state on the Castro page (`biz_002`, default ₪300): SPAR = full case; Isrotel joining gift = no restrictions; H&M = fashion chains + dedicated cashback; Shufersal = wrong brand; Aroma = in-store only; KSP = ₪500 minimum (the "almost" case); IKEA = single-use with balance > purchase; McDonald's = expired; `v_nexus_join` = locked Nexus gift.
- `src/mock/data/subBalances.mock.ts` — 9 gift sub-balances, plus:
  - `nexusJoinGiftCard: Voucher` — card face for the Nexus gift, intentionally **not** in `mockVouchers` (it isn't a store product).
  - `voucherForSubBalance(sb)` — resolves a sub-balance's card face/terms (use this, not `mockVouchers.find`).

> ⚠️ The Nexus gift mock is ₪25 / ₪250 threshold, while the landing page promises ₪50 / ₪350 — see §8.

---

## 3. Advanced conditions on the benefit sheet

### 3.1 Files

| File | Role |
| :-- | :-- |
| `src/components/wallet/giftConditionRows.ts` | `buildConditionRows(conditions, isRTL, locale)` → list rows (pure, no JSX — kept out of the `.tsx` for react-refresh) |
| `src/components/wallet/GiftConditions.tsx` | list + every detail screen + explainer screen |
| `src/components/wallet/VoucherTermsSheet.tsx` | the benefit sheet itself (opened by "לכל התנאים") |
| `src/components/wallet/MiniGiftCard.tsx` | tiny card thumbnail; `locked` = greyscale + lock badge |

### 3.2 Benefit sheet layout (`VoucherTermsSheet`)

Overview screen, top to bottom:

1. Card face (greyed with a centered lock badge when locked).
2. Title (+ "נעולה" chip when locked). Locked gifts show the unlock progress bar ("עוד ₪X בכרטיס, והמתנה נפתחת", `progress / threshold`).
3. Details `dl` — **validity lives here, next to the balance, not as a condition row**:
   - אירוע
   - `יתרה / סכום מקורי` → `₪120 / ₪150` (locked: `תיפתח לניצול ₪25`)
   - `בתוקף עד` — or, for locked gifts, `לפתיחה עד` + `לשימוש עד`
4. "תנאים מתקדמים" list (`AdvancedConditionsList`), validity row filtered out.
5. ⋮ (top start corner, overview only) → **Actions** screen in place: "לצפייה במתנה" (navigates to `/wallet/voucher/:userVoucherId` when a user voucher exists), "שליחה לארנק אחר" (only if `transfer` and not locked), "שיתוף". Each row: round icon, bold label, muted hint, chevron.

In-sheet navigation is a small state machine — `help ? HelpView : actionsOpen ? Actions : openKey ? ConditionDetail : Overview` — inside one `AnimatePresence mode="wait"`.

### 3.3 Condition rows (`buildConditionRows`)

| Key | When | Title / summary |
| :-- | :-- | :-- |
| `unlock` | locked gift (added by the sheet, first) | "מה נספר לפתיחה" → chains that count |
| `brands` | `brands.length` | "רשתות משתתפות" · "N רשתות · עם שיעור קאשבק ייעודי" — **dedicated cashback is folded in here**, there is no separate row |
| `validity` | `validity` | built, but filtered out by the benefit sheet (shown in details) |
| `more` | any of transfer / min / cap / singleUse / onLeavingOrg / onRefund / termsUrl | "תנאים נוספים" · comma list of what's defined — **sending to other wallets lives here** |

"Where you can use it" (environments) was removed from the UI on request; `environments` is still enforced at payment time (§4).

### 3.4 Detail screens (`ConditionDetail`)

- **Chain lists** (`brands`, `unlock`) share `ChainList`: search field ("חיפוש עסק"), rows with a 56px round bordered logo, bold name, optional badge line. Header: title + `(count)` + "?" → explainer screen.
  - `brands`: emerald pill (`bg-emerald-50 text-emerald-700`) with the gift rate; with `dedicatedCashback`, muted "מיתרת המתנה · בכרטיס X%" beside it.
  - `unlock`: every Nexus chain (`UNLOCK_CHAINS`), lead line "כל תשלום בכרטיס נקסוס ברשתות האלה נספר לפתיחת המתנה", no badge.
- **More terms** (`MoreDetail`): open list of `FactRow`s — 40px round icon, small muted label, bold value, "?" on the side. Each "?" opens a plain-words explainer (`ConditionHelp { title, body }`) as its own screen (`HelpView`). Order: transfer, minimum, cap, single use, leaving the org, refunds; then a soft "לתקנון המלא" row.

---

## 4. Payment: the Nexus plan

### 4.1 `src/components/wallet/nexusPlan.ts` — single source of truth

```ts
computeNexusPlan(ceiling, prefs, sources, ctx) → NexusPlan
```

- `ceiling` — the most Nexus may pay (the purchase total, or less if set in the split).
- `prefs: NexusPrefs` — `{ order: SectionId[], giftOrder: string[], manual: Record<string, number> | null }`. Default (`defaultNexusPrefs`): **gifts first** (they expire; cashback doesn't), then cashback, credits; `manual: null` = automatic.
- `sources` — from `getNexusSources(totalEarned)`: cashback, credits, gift rows.
- `ctx: PlanContext` — `{ total, businessId, businessName, isRTL, money }`; gift rules are measured on the purchase **total**.

**Gift evaluation (`evaluateGift`), first match wins:**

1. Locked (`lock.progress < threshold`) → unusable, reason "עוד ₪X בכרטיס, והמתנה נפתחת", `lock` info.
2. Expired → "פג התוקף".
3. No conditions → usable, cap = balance.
4. `brands` set and this business not in it → "לא זמינה ב{business}".
5. `environments` set without `in_app` → "לא לשימוש באפליקציה".
6. `total < minTransaction` → "מינימום ₪X לעסקה · חסרים ₪Y" (the "almost" case).
7. `singleUse` and balance > total → "יש לנצל את כל היתרה בעסקה אחת".
8. Usable: cap = `min(balance, total × maxSharePercent)`; notes = "עד X% מהעסקה", "Y% קאשבק כאן".

**Waterfall:** sections in `prefs.order`; inside gifts, usable gifts in `giftOrder`. With `manual`, each source takes `min(typed, cap)`, still clamped by the remaining ceiling in order. `maxCoverable` is always computed **automatically** (manual ignored), so a manual choice never shrinks the cap the split sheet offers.

Unavailable gifts are listed locked-first, then the rest.

### 4.2 Two-sheet version (default)

| Surface | Job |
| :-- | :-- |
| `NexusBalanceSheet` — "יתרת נקסוס לעסקה הזו" | **what** inside Nexus pays, in which order |
| `SplitPaymentSheet` — "פצל בין אמצעי תשלום" | **how much** from Nexus vs other methods |

- `NexusBalanceSheet`: `CoverageSummary` on top, then `NexusSourcesEditor` (exported, shared): draggable sections (cashback / credits / gifts), gifts expand into each gift — usable ones draggable with an `AmountField` (`₪ [ 120 ] / 150`, cap = what it may pay here), unavailable ones muted with the reason, every gift with "לכל התנאים". First edit snapshots current amounts and switches to manual; "חזרה לאוטומטי" resets. Footer: "₪X ← {card} · שינוי" (opens the split). Edits are a draft until "אישור". `z-[80]` so it can open over the split sheet.
- `SplitPaymentSheet`: Nexus is **one row** with one amount, capped at `nexus.max` (= `maxCoverable`, i.e. after gift conditions — not the raw balance). Under it, a read-only composition chip ("מתנות ₪200 · קאשבק ₪40 · מה נכלל ›") that opens the Nexus sheet. The old per-bucket editing inside the split was removed (it ignored gift conditions).
- **Confirm button carries the status:** disabled grey with "חסר לך עוד ₪X" / "הוקצו ₪X יותר מדי"; black "אישור" when balanced. No status row above it.

**`CoverageSummary`** — typography only: optional title, `₪covered / ₪total` (30px), a 12px bar with `rounded-[4px]` built as **one `linear-gradient` whose colours blend softly at the seams** (`blendedBarGradient`: blend zone ≤ 6% each side, never more than a third of the smaller segment; direction follows RTL), then a one-line legend. Section colours: gifts `#635bff`, cashback `#4ade80`, credits `#38bdf8`, grey tail `#e6ebf1`. Optional `extraParts` (other methods) and `restLabel`.

### 4.3 Unified version — `?pay=unified` (`UnifiedPaymentSheet`)

One sheet, "איך משלמים":

- `CoverageSummary` with **no title**, showing the **whole purchase**: Nexus sources, then each other method in its own colour by position (`EXTERNAL_HEX = ['#f59e0b', '#ec4899', '#14b8a6']`), grey tail labelled "חסר".
- Method list (draggable). Nexus row: collapsed = one `AmountField` capped at `maxCoverable` (typing re-fills sources automatically); chevron expands **in place** into `NexusSourcesEditor` (Nexus amount becomes the read-only sum). Dragging the Nexus row collapses it.
- Other methods auto-take the remainder (first in order) until one is typed by hand.
- Same status-carrying confirm button. Returns `{ prefs, amounts }`.

### 4.4 Page wiring — `src/pages/VoucherPurchasePage.tsx`

State: `nexusPrefs`, `splitConfig: { total, amounts } | null` (a manual split is valid only for the total it was made for — changing the voucher value falls back to automatic), `nexusSheetOpen`, `unifiedSheetOpen`.

Derived (after `total`): `nexusActive`, `nexusCeiling`, `nexusPlan`, `externalAmounts` (shortfall goes to the first external method / first non-Nexus card), `planAmounts` (per-method, Nexus as one key — seeds the sheets), `splitAmounts` (chip badges: Nexus counts its used sections as `${id}:gifts` …).

Entry points: second tap on the selected Nexus chip (not in story mode) → `openNexusManagement()`; "פיצול" in payment options → `openSplitSheet()`. Both route to the unified sheet when `?pay=unified`. Tapping another chip clears a manual split. (A plan summary row under the chips was built and removed on request.)

---

## 5. Sub-balances on the balance page

`src/pages/BalanceDetailPage.tsx`, "יתרות משנה" tab:

- Gift rows use `MiniGiftCard` (the gift's own art or brand colour + logo) and the **merchant name** instead of "גיפט קארד/שוברים".
- Locked gift row: greyed name and amount with a lock, mini card locked, subtitle "נעולה · עוד ₪X ופותחים". It **is** counted in the sub-balances total (seen from day one), not in "available".
- "לכל התנאים" passes the `SubBalance` to `VoucherTermsSheet` (for event / amounts / lock).

---

## 6. Joining-gift landing — `/tenant-about` (`src/pages/TenantAboutPage.tsx`)

The single landing page for everyone joining a client's wallet. Same structure as `AboutWalletPage`, branded per tenant.

### 6.1 Branding

Resolved from `?tenant=` → active tenant store → `isrotel`. Base data from `mockTenants`; hand-tuned overrides in `BRANDS` (isrotel: wallet name, dark logo, palette, `joinGift: { amount: 50, threshold: 350 }`, `cardArt`). Any other tenant gets `paletteFrom(primaryColor)` (CSS `color-mix` shades), so every tenant renders with no extra work.

| Element | Tenant version |
| :-- | :-- |
| Top corner | tenant logo │ Nexus black wordmark (`/nexus-logo-black-trim.png`) |
| Hero gradient | `AnimatedGradient palette={brand.palette}` |
| Headline | "עד 60% בחזרה על הכסף שלך · {walletName} משלם לך בחזרה…" |
| "How it works" underline | tenant primary |
| Gift-cards card | "מתנות מ{tenant}, ישר לארנק" |
| People wall | "עובדי {tenant} כבר בפנים. מה איתך?" |
| FAQ | `tenantFaq(brand)` — 6 questions reworded around the tenant wallet |
| Footer | the About footer's look (white + slate-100 diagonal), tenant logo │ Nexus black wordmark, tenant links, © tenant |
| Bottom CTA | `bg-bg-dark`, identical to the About page |

### 6.2 With / without a gift

| | With gift | `?gift=0` (no gift / cap reached) |
| :-- | :-- | :-- |
| Landing notification (~1.2s, 9s on screen, sender = tenant) | "מתנת הצטרפות מחכה לך · ₪50 בתשלום ה-₪350 הראשונים שלך בארנק" → `focus=gift` | "מתנות ההצטרפות כבר חולקו · אבל הארנק עדיין מחזיר עד 60%…" → `focus=brands` |
| Gift section | About's dark coins card with the real amount ("בחינם. וגם ₪50 שמחכים לך") + strip "₪50 מתנה · בתשלום ה-₪350 הראשונים בארנק" in tenant colour | — |
| CTA | "למשיכת המתנה לארנק" | "כניסה לארנק" |

`?focus=gift|brands` scrolls the matching section into view (notification deep links land on the same page).

### 6.3 Claiming

CTA → auth gate (`useAuthGate`) → full-screen `PremiumRevealContent` celebration (balloons/confetti, "₪50 מחכים לך / מתנת ההצטרפות מ{tenant} נכנסה לארנק") with the **locked gift card rising to the centre** (tenant card art, Nexus mark, 🔒 ₪50, caption "נפתחת אחרי ₪350 בארנק") → "טוענים את המתנה לארנק שלך" for 1.6s → `/wallet/balance?tab=subBalances` + toast "מתנת ההצטרפות בסך ₪50 בארנק שלך".

### 6.4 `/join-gift` — exploration copy

`src/pages/JoinGiftFlowPage.tsx` is a working copy of `GiftSamplePage` (separate localStorage key `nexus_join_gift_claimed_*`, non-exported data). Isrotel variant: hug hero (`/gift-cards/welcome-hug-3d.png`, generated in Higgsfield, background removed), "רז, ברוכים הבאים לארנק של ישרוטל", `JoinGiftCard` (wallet-card look, 🔒 ₪50, one progress line under it), and `?state=capped` ("מתנות ההצטרפות נגמרו", "שמרו לי מקום" toggle, About-style savings block). It predates the landing page and may be retired.

---

## 7. Shared-component changes (backward compatible)

| Component | Change | Default |
| :-- | :-- | :-- |
| `AnimatedGradient` | `palette?: GradientPalette` (`base` + 5 blob pairs) | Nexus aurora, unchanged |
| `PeopleWall` | `headline?: ReactNode` | "אלפי אנשים כבר בפנים…" |
| `AboutFaq` | `items?: FaqItem[]` (`FaqItem` exported) | Nexus FAQ |
| `InfoSheet` | `zClass?: string` | `z-[60]` |
| `VoucherTermsSheet` | z-index `60 → 90` (opens over payment sheets) | — |
| Routes / `AppLayout` | `join-gift`, `tenant-about` registered as full-screen pages | — |

New assets: `public/gift-cards/welcome-hug-3d.png`, `public/nexus-logo-black-trim.png`, `public/nexus-white-wide-logo-trim.png` (trimmed copies — the originals carry large transparent margins).

---

## 8. Known gaps / TODO before production

1. **All data is mock.** Conditions, sub-balances, lock progress (fixed ₪42), the tenant's gift amount and threshold — all must come from the campaign / admin settings (B, threshold, ρ per tenant).
2. **Amount mismatch:** landing promises ₪50 / ₪350; the Nexus gift sub-balance mock is ₪25 / ₪250. Sync before demoing end to end.
3. **Claiming doesn't create a gift** — it navigates and toasts. The locked sub-balance shown is the static mock.
4. **`?gift=0` is a preview switch.** Real availability must come from the campaign (cap / budget).
5. **"שמרו לי מקום"** (join-gift capped state) is UI only — should register a waitlist and surface the count to the org dashboard as a top-up opportunity.
6. **Actions** "שליחה לארנק אחר" / "שיתוף" only close; "לצפייה במתנה" appears only when a user voucher exists.
7. **Unlock chain list** is every mock business; the real list is the chains where card payments count.
8. **Footer links** and FAQ claims ("ללא עלות, בלי עמלות") need the client's real pages and the agreed commercial terms.
9. Pre-existing ESLint findings in `VoucherPurchasePage.tsx` (6) and `BalanceDetailPage.tsx` (1) are unrelated to this work.
