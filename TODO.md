# Nexus Wallet — TODO

## Google OAuth Verification
- [ ] Submit app for Google OAuth verification to enable `contacts.readonly` scope for all users
  - Requires: privacy policy page, homepage URL, domain verification
  - Until verified: only test users (added in Google Cloud Console → OAuth consent screen) can approve the contacts scope
  - Workaround: add team emails as test users for development/QA
  - Timeline: Google review typically takes 2-4 weeks

## Referral Program Implementation
- [ ] **Phase 1 — MVP:** Backend referral code generation + tracking + deep link handling (`?ref=CODE`)
- [ ] **Phase 2 — Rewards:** Dual-sided ₪25+₪25 signup reward, wallet integration, push notifications
- [ ] **Phase 3 — Value Actions:** Rewards for insurance, credit card, premium, financial products
- [ ] **Phase 4 — Chain & Tiers:** Exponential referral (3 generations), Ambassador tiers, custom codes, QR
- [ ] **Phase 5 — Optimization:** A/B testing, fraud detection, analytics dashboard
- See full plan: `REFERRAL_PROGRAM.md`
