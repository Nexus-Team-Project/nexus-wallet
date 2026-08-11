/**
 * The wallet as an anonymous visitor sees it — the first screen a marketing SMS
 * lands on.
 *
 * ── The framing rule, which is the whole point ───────────────────────────────
 * Pre-auth the launch gift is an OFFER, never a balance. A balance is a fact
 * about an account, and a visitor who has not signed in has no account. So:
 *   • no "your" / "שלך"
 *   • no padlock — a lock implies you already own the thing behind it
 *   • no number rendered inside a balance component
 * The padlock arrives only after sign-in, when the money genuinely is theirs
 * and the remaining condition (≥ minimum, at a launch brand) is real. Building
 * it the other way round is the common mistake: it promises ownership first and
 * takes it back later.
 *
 * When the campaign is closed or its cap is exhausted, the gift is not
 * mentioned at all.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useGiftAvailability } from '../../hooks/useOpeningGift';
import { useTenantStore } from '../../stores/tenantStore';

export default function WalletAnonymousView() {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const { requireAuth } = useAuthGate();
  const { data: availability } = useGiftAvailability();
  const tenantConfig = useTenantStore((s) => s.config);

  const giftOpen = !!availability?.open;
  const amount = availability?.amount ?? 0;
  const minPurchase = availability?.minPurchase ?? 0;

  const join = () =>
    requireAuth({
      promptMessage: giftOpen
        ? isHe
          ? `הרשמה כדי לקבל מתנת פתיחה של ₪${amount}`
          : `Sign up to receive a ₪${amount} opening gift`
        : t.auth.eligibilityPrompt,
    });

  return (
    <div className="min-h-dvh bg-white max-w-md mx-auto flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>
      <div className="h-24 shrink-0" />

      <div className="px-5">
        {tenantConfig?.logo && (
          <img
            src={tenantConfig.logo}
            alt={isHe ? tenantConfig.nameHe : tenantConfig.name}
            className="h-8 object-contain mb-6"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        <h1 className="text-2xl font-extrabold text-text-primary mb-1">
          {isHe ? 'ארנק נקסוס' : 'Nexus wallet'}
        </h1>
        <p className="text-sm text-text-muted mb-6 leading-snug">
          {isHe
            ? 'שוברים במותגים שאתם קונים בהם, עם קאשבק שחוזר לארנק.'
            : 'Vouchers at the brands you already shop, with cashback back into your wallet.'}
        </p>

        {/* The offer slot. Ghosted and impersonal — it is not a balance card,
            and it deliberately does not look like one. */}
        {giftOpen && (
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.04] p-5 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary mb-2">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
              >
                card_giftcard
              </span>
              {isHe ? 'מתנת פתיחה' : 'Opening gift'}
            </span>

            <p className="text-[15px] font-bold text-text-primary leading-snug">
              {isHe
                ? `נרשמים חדשים מקבלים ₪${amount} לארנק`
                : `New members receive ₪${amount} in their wallet`}
            </p>
            <p className="text-[13px] text-text-secondary mt-1 leading-snug">
              {isHe
                ? `למימוש בקנייה מעל ₪${minPurchase} במותגי ההשקה, בתוקף 30 יום.`
                : `Redeemable on an order over ₪${minPurchase} at launch brands, valid 30 days.`}
            </p>

            {/* Scarcity is genuine here — the cap is a real budget ceiling. */}
            {availability && availability.remainingSlots <= 50 && (
              <p className="text-[12px] font-semibold text-primary mt-2">
                {isHe
                  ? `נותרו ${availability.remainingSlots} מקומות`
                  : `${availability.remainingSlots} places left`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={join}
          className="w-full bg-bg-dark text-white py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
        >
          {giftOpen
            ? isHe
              ? 'הרשמה וקבלת המתנה'
              : 'Sign up and claim it'
            : isHe
              ? 'הרשמה'
              : 'Sign up'}
        </button>

        <p className="text-[11px] text-text-muted/70 text-center mt-3 leading-relaxed">
          {t.auth.termsNotice}
        </p>
      </div>
    </div>
  );
}
