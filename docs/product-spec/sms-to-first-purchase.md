# NEXUS — SMS to First Voucher

## Current-State Flow (as built)

> What a new member actually does today, from the marketing SMS to holding their first voucher.

| | |
| :-- | :-- |
| **Document** | SMS → First Voucher — Current-State Flow |
| **Version** | Draft v0.1 |
| **Date** | July 2026 |
| **Status** | Descriptive. Records the flow **as implemented in `nexus-wallet`** — not a target design. |
| **Purpose** | Establish the baseline step count for the acquisition funnel, so proposed shortcuts can be measured against something real. |
| **Method** | Read from the code: router, `LoginSheet`, the onboarding slide machine, `VoucherPurchasePage`. |
| **Companion** | [`voucher-and-balance-flows.md`](./voucher-and-balance-flows.md) — what happens to the money once the voucher is purchased. |

---

## 1. The Headline

| Path | User actions | Screens |
| :-- | --: | --: |
| **Minimum** — every skip taken, every default accepted | **17** | 12 |
| **Full** — member answers everything shown to them | **~30** | 21 |

"User action" = one tap or one typed field. The gap between the two rows is almost entirely the onboarding questionnaire (section 4).

---

## 2. The Seven Segments

| | Segment | Actions (min) | Anchor |
| :-- | :-- | --: | :-- |
| **A** | **Landing.** Tap the SMS link → home. Tap a gated element (masked price, balance card) → the login sheet opens. Nothing opens it automatically. | 2 | `useAuthGate.ts`, `MaskedPrice.tsx` |
| **B** | **Authentication.** "המשך עם SMS" → type phone → "שלח קוד" → type 4 digits. Verifies on the 4th digit, no submit button. | 4 | `LoginSheet.tsx:178` |
| **C** | **Stories.** 5 slides that auto-advance (6s each, 10s for insights). They **loop** rather than exit — one tap on "קליק להמשך" is mandatory. | 1 | `StoryCTABar.tsx:44` |
| **D** | **Onboarding.** First + last name (3) → email, skipped (1) → consents (1) → motivation, skipping all 5 preference questions (1). | 6 | `onboardingNavigation.ts:5` |
| **E** | **Reveal.** PremiumReveal — a drag gesture, then back to home. | 1 | `RegistrationCompletePage.tsx` |
| **F** | **Discovery.** Home → store tab or brand tile → voucher tile. No home tile links straight to a voucher. | 2 | `VoucherSearch.tsx:144` |
| **G** | **Purchase.** "צור כרטיס עם Nexus". ₪300 and the first payment method are pre-selected, so amount, stacking, online/outlets, quantity, gifting and round-up all need zero taps. | 1 | `VoucherPurchasePage.tsx:1623` |

Registration state lives in `registrationStore` and persists to `sessionStorage`, so a mid-flow refresh resumes on the same slide instead of dropping to home.

---

## 3. Where the Flow Branches

`LoginSheet` resolves the post-OTP route by a fixed priority ladder. The 17-action count above is **Priority 5** — the plain new user.

| Priority | Condition | Route |
| :-- | :-- | :-- |
| 1 | Org member, profile already complete | Success animation → requested page. **No onboarding.** |
| 2 | Returning user, profile complete | Straight to the requested page. |
| 3 | `?tenant=` in the URL — wins even over an org match | Org stories → match screen → (membership fee, if the tenant charges one) → onboarding |
| 4 | Org member, incomplete profile, no tenant | Nexus stories → match screen → onboarding |
| 5 | New user, no tenant, no org | Nexus stories → onboarding |

A tenant that sets `requiresMembershipFee` inserts a paywall screen between the match screen and onboarding — one extra screen and one extra tap (`RegisterMembershipPage.tsx:36`).

---

## 4. Why Segment D Is the Expensive One

The onboarding machine holds 10 slides in a fixed order and filters them per user:

| Slide | Shown when | Skippable |
| :-- | :-- | :-- |
| `verify-phone` | phone is in `missingFields` | no |
| `first-name` | first **or** last name missing (collects both) | no |
| `verify-email` | email missing | yes |
| `consents` | always, except the preferences-completion path | "אחר כך" |
| `motivation` | always | secondary CTA skips **all 5 slides below** |
| `purpose` · `life-stage` · `birthday` · `gender` · `benefit-categories` | always | yes, each |

Phone authentication hard-codes `missingFields` to `['firstName', 'lastName', 'email', 'birthday']` (`LoginSheet.tsx:273`). That single line is what forces the name and email slides. Together with the two mandatory slides (`consents`, `motivation`), four screens and **6 of the 17 actions** are structural rather than chosen.

The one existing escape hatch is the `preferences-completion` path: entered from the home-screen personalization teaser (`ActiveOffers.tsx:30`), it starts at `motivation`, skips consents, and returns straight home without the reveal. It already proves preference data can be collected *after* the funnel.

---

## 5. Gaps Worth Recording

1. **The purchase CTA is not authenticated.** `VoucherPurchasePage.tsx:1623` pushes a voucher into the wallet and navigates to the success page with no `requireAuth` call, and `business/:businessId/voucher/:voucherId` is a public route (`router/index.tsx:161`). Nothing in the code requires registration to precede a purchase — the ordering is a product convention, not a constraint.

2. **The SMS can deep-link past segments A and F.** `/he/business/:businessId/voucher/:voucherId?tenant=xxx` already resolves, tenant branding included. Landing there removes 4 actions.

3. **The stories segment cannot complete itself.** `goNext` loops back to slide 0 when it reaches the interactive slide, so the flow depends entirely on the CTA tap. A member who reads the stories passively never advances.

4. **`birthday` in `missingFields` is inert.** `BirthdaySlide` is always active regardless, so listing it changes nothing.

5. **Implied shortest viable path: ~7 actions.** SMS → voucher page → amount → "צור כרטיס" → login sheet *at that moment* (phone + OTP) → voucher in wallet, with name, email, consents and preferences collected afterwards via the existing `preferences-completion` path. Not built; recorded here as the measured alternative to the 17.

---

## 6. Not Covered Here

- The org / tenant flows are summarized in section 3 but not counted end to end.
- Google and Apple sign-in shorten segment B and change `missingFields`; not measured.
- What happens after purchase — issuance, redemption, cashback, settlement — belongs to [`voucher-and-balance-flows.md`](./voucher-and-balance-flows.md).
