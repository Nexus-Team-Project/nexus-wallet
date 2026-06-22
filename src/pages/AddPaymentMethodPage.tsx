import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useUser } from '../hooks/useUser';

type CardBrand = 'visa' | 'mastercard' | 'maestro' | 'unknown';

/**
 * Trigger an OS-level biometric verification via WebAuthn (Touch ID,
 * Face ID, Windows Hello, Android biometric).
 *
 * Returns:
 *   'verified'    → user authenticated successfully
 *   'denied'      → user cancelled / prompt timed out
 *   'unavailable' → platform has no authenticator at all (silent fallback)
 *
 * IMPORTANT: We call `navigator.credentials.create()` immediately, WITHOUT
 * awaiting `isUserVerifyingPlatformAuthenticatorAvailable()` first — that
 * pre-check consumes the user-activation flag in some browsers and causes
 * the OS prompt to never appear. The browser itself rejects with a clear
 * error if no authenticator exists, which we handle below.
 *
 * Production note: this uses `credentials.create()` to *trigger* the OS
 * prompt without a backend. In a real flow you register a credential once
 * (server-issued challenge) and use `credentials.get()` on subsequent
 * payments to cryptographically prove the same user + device.
 */
async function requireBiometricApproval(): Promise<
  'verified' | 'denied' | 'unavailable'
> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return 'unavailable';
  }

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = window.crypto.getRandomValues(new Uint8Array(16));

  try {
    await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Nexus Wallet', id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: `payment-${Date.now()}`,
          displayName: 'Payment verification',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    return 'verified';
  } catch (e) {
    const err = e as { name?: string; message?: string };
    console.warn('[WebAuthn] verification failed:', err.name, err.message);
    // NotSupportedError → no platform authenticator at all
    if (err.name === 'NotSupportedError') return 'unavailable';
    // NotAllowedError → user cancelled or browser blocked
    return 'denied';
  }
}

/**
 * Israeli ID checksum (Luhn-style, alternating ×1/×2 with digit sum).
 * Only flagged "valid" once exactly 9 digits + checksum passes — so
 * partial values keep the field neutral instead of flashing red.
 */
function isValidIsraeliId(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(id[i]) * ((i % 2) + 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

/** BIN-prefix sniffing — good enough for the input chip + card-preview logo. */
function detectBrand(digits: string): CardBrand {
  if (!digits) return 'unknown';
  if (/^4/.test(digits)) return 'visa';
  // Mastercard: 51-55, plus the 2221-2720 BIN range.
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (/^2(?:2[2-9]\d|[3-6]\d{2}|7(?:[01]\d|20))/.test(digits)) return 'mastercard';
  // Maestro: classic ranges.
  if (/^(?:5018|5020|5038|6304|6759|676[1-3])/.test(digits)) return 'maestro';
  return 'unknown';
}

/** Brand logo used both inside the card input chip and on the card preview. */
function CardBrandMark({ brand, variant }: { brand: CardBrand; variant: 'chip' | 'preview' }) {
  // "chip" is the small mark sitting inside the card-number input.
  if (variant === 'chip') {
    if (brand === 'visa') {
      return (
        <div className="px-1.5 py-0.5 border border-border rounded text-[10px] font-black text-primary italic bg-white leading-none">
          VISA
        </div>
      );
    }
    if (brand === 'mastercard' || brand === 'maestro') {
      const left = brand === 'mastercard' ? '#eb001b' : '#0099df';
      const right = brand === 'mastercard' ? '#f79e1b' : '#eb001b';
      return (
        <div className="px-1 py-0.5 border border-border rounded bg-white leading-none">
          <svg width={28} height={16} viewBox="0 0 32 20" aria-hidden>
            <circle cx={12} cy={10} r={8} fill={left} opacity={0.9} />
            <circle cx={20} cy={10} r={8} fill={right} opacity={0.9} />
          </svg>
        </div>
      );
    }
    return (
      <div className="px-1 py-0.5 border border-border rounded bg-white leading-none text-text-muted">
        <CreditCard size={16} />
      </div>
    );
  }

  // "preview" is the larger mark on the card-preview face.
  if (brand === 'visa') {
    return <span className="italic font-black text-2xl tracking-tight">VISA</span>;
  }
  if (brand === 'mastercard' || brand === 'maestro') {
    const left = brand === 'mastercard' ? '#eb001b' : '#0099df';
    const right = brand === 'mastercard' ? '#f79e1b' : '#eb001b';
    return (
      <svg width={44} height={28} viewBox="0 0 32 20" aria-hidden>
        <circle cx={12} cy={10} r={9} fill={left} />
        <circle cx={20} cy={10} r={9} fill={right} />
      </svg>
    );
  }
  return <CreditCard size={28} className="opacity-80" />;
}

/** Contactless wave glyph, like real payment cards. */
function ContactlessIcon({ className = '' }: { className?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M7 8.5c2.2 1.8 2.2 5.2 0 7" />
        <path d="M10.5 6c3.5 2.8 3.5 9.2 0 12" />
        <path d="M14 3.5c4.7 3.8 4.7 13.2 0 17" />
      </g>
    </svg>
  );
}

/**
 * Card preview that gains colour as the user fills in the form.
 * - fillProgress 0 → fully desaturated + dim
 * - fillProgress 1 → full colour, sharp
 * - celebrate → one-shot pulse + diagonal shine when the form goes valid
 */
function CardPreview({
  cardNumber,
  expiryMonth,
  expiryYear,
  cardholderName,
  cardholderPlaceholder,
  fillProgress,
  celebrate,
}: {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  /** Shown faintly when the cardholder name field is empty. */
  cardholderPlaceholder: string;
  fillProgress: number;
  celebrate: boolean;
}) {
  // Format the number into 4×4 groups, padding unfilled slots with bullets.
  const digits = cardNumber.replace(/\s/g, '');
  const padded = (digits + '••••••••••••••••').slice(0, 16);
  const grouped = padded.match(/.{1,4}/g)?.join('  ') ?? '';

  const expiry =
    expiryMonth.length || expiryYear.length
      ? `${expiryMonth.padEnd(2, '•')}/${expiryYear.padEnd(2, '•')}`
      : '••/••';

  // Interpolated visual state driven by fillProgress in [0, 1].
  const saturate = 0.15 + 0.85 * fillProgress;
  const contrast = 0.85 + 0.15 * fillProgress;
  const opacity = 0.55 + 0.45 * fillProgress;

  return (
    <div
      className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden text-white shadow-xl transition-[filter,opacity] duration-500 ring-[1.5px] ring-accent-green/70 ${
        celebrate ? 'animate-card-pulse' : ''
      }`}
      style={{
        filter: `saturate(${saturate}) contrast(${contrast})`,
        opacity,
      }}
      dir="ltr"
    >
      {/* Layered background — base gradient + soft top-left highlight +
          deep bottom-right shadow → reads as a real plastic card under light. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #1b1f47 0%, #2a2d6e 30%, #4a3fa8 65%, #635bff 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 82% 90%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 55%)',
        }}
      />
      {/* Faint diagonal sheen — always present, very subtle */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%)',
        }}
      />

      {/* One-shot celebration shine when the form goes valid */}
      {celebrate && (
        <div
          className="absolute inset-y-0 -inset-x-1/2 pointer-events-none animate-card-shine"
          style={{
            background:
              'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
          }}
        />
      )}

      {/* Content — minimalist: contactless glyph + number + name/expiry. */}
      <div className="relative h-full p-5 flex flex-col justify-between">
        <div className="flex justify-end items-start">
          <ContactlessIcon className="text-white/85" />
        </div>

        <div className="space-y-3">
          <div
            className="text-[1.35rem] tracking-[0.14em] font-mono font-medium"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
          >
            {grouped}
          </div>
          <div className="flex justify-between items-end uppercase gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="text-[9px] tracking-wider opacity-70">Card holder</div>
              <div
                className={`text-xs font-semibold tracking-wider truncate ${
                  cardholderName ? '' : 'opacity-50'
                }`}
              >
                {cardholderName || cardholderPlaceholder}
              </div>
            </div>
            <div className="space-y-0.5 text-right flex-shrink-0">
              <div className="text-[9px] tracking-wider opacity-70">Expires</div>
              <div className="text-xs font-semibold tracking-wider font-mono">{expiry}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Google Pay button — white "outlined" variant. Logo sits on the side
    opposite the text: in LTR the text is on the left and logo on the right;
    in RTL it mirrors so the logo ends up on the left of the Hebrew text. */
function GooglePayButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const Logo = (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-14 bg-white border border-border rounded-2xl font-medium flex items-center justify-center gap-3 active:scale-[0.98] hover:bg-surface transition-all"
    >
      <span className="text-base text-text-primary">{label}</span>
      {Logo}
    </button>
  );
}

/**
 * AddPaymentMethodPage
 *
 * Standalone payment-method form. The AppLayout suppresses its own TopBar
 * + bottom-nav for this route (see AppLayout.tsx → isFullScreenForm) so the
 * page reads as a single full-bleed form with its own back button.
 *
 * The page can run standalone or inside the add-money flow. With
 * location.state.amount, the footer shows "including {fee} ₪" + a "Pay X ₪"
 * CTA; otherwise the CTA reads "Add payment method".
 */
export default function AddPaymentMethodPage() {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state =
    (location.state as { amount?: number; fee?: number; entry?: string } | null) ?? null;
  const amount = state?.amount;
  const fee = state?.fee ?? (amount ? Math.round(amount * 0.05 * 100) / 100 : undefined);
  const isPaymentFlow = typeof amount === 'number' && amount > 0;

  // Slide-down "curtain" only plays when we arrive from the wallet's
  // "Add card details" CTA. Captured once on mount via useState so the
  // animation doesn't re-trigger on every re-render or HMR refresh.
  const [showEntryCurtain] = useState(() => state?.entry === 'wallet-cta');

  // Pre-fill the cardholder name from the canonical current-user record
  // (the same query the rest of the app uses — useUser → userApi). This
  // resolves both in real auth flows and in mock/dev where mockUser is
  // returned. The field stays editable; we only hydrate when the user
  // hasn't typed anything themselves.
  const { data: user } = useUser();
  const profileName = useMemo(() => {
    const first = (user?.firstName ?? '').trim();
    const last = (user?.lastName ?? '').trim();
    return [first, last].filter(Boolean).join(' ');
  }, [user?.firstName, user?.lastName]);

  const [cardholderName, setCardholderName] = useState(profileName);
  const [userEditedName, setUserEditedName] = useState(false);
  useEffect(() => {
    if (userEditedName) return;
    if (profileName && profileName !== cardholderName) {
      setCardholderName(profileName);
    }
    // cardholderName is intentionally excluded — it's a gate, not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileName, userEditedName]);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 19);
    const grouped = d.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(grouped);
  };
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2));
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2));
  };
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
  };
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 9));
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow letters (Hebrew + Latin), spaces, hyphen, apostrophe. Cap at 26
    // chars so it fits the card line.
    setCardholderName(e.target.value.replace(/[^\p{L}\s'-]/gu, '').slice(0, 26));
    setUserEditedName(true);
  };

  const digits = cardNumber.replace(/\s/g, '');
  const brand = useMemo(() => detectBrand(digits), [digits]);

  // 0 → empty; 1 → all fields fully filled. Weighted toward the card number
  // since that's the most visually expressive field on the preview.
  const fillProgress = useMemo(() => {
    const numScore = Math.min(digits.length / 16, 1) * 0.4;
    const monScore = (expiryMonth.length === 2 ? 1 : expiryMonth.length / 2) * 0.1;
    const yrScore = (expiryYear.length === 2 ? 1 : expiryYear.length / 2) * 0.1;
    const cvvScore = Math.min(cvv.length / 3, 1) * 0.15;
    const idScore = Math.min(idNumber.length / 9, 1) * 0.12;
    const nameScore = Math.min(cardholderName.trim().length / 5, 1) * 0.13;
    return numScore + monScore + yrScore + cvvScore + idScore + nameScore;
  }, [digits.length, expiryMonth, expiryYear, cvv, idNumber, cardholderName]);

  // Strict checksum result — used for inline UX feedback, not gating.
  const idChecksumOk = isValidIsraeliId(idNumber);

  // We only gate the CTA on length (9 digits) so the button doesn't stay
  // stuck on plausibly-real but checksum-failing test IDs. The checksum
  // result still feeds a subtle red border on the field below.
  const isValid = useMemo(() => {
    return (
      digits.length >= 13 &&
      expiryMonth.length === 2 &&
      Number(expiryMonth) >= 1 &&
      Number(expiryMonth) <= 12 &&
      expiryYear.length === 2 &&
      cvv.length >= 3 &&
      idNumber.length === 9
    );
  }, [digits, expiryMonth, expiryYear, cvv, idNumber]);

  // One-shot celebration when the form first becomes valid (and again if
  // the user invalidates → revalidates). The animation duration matches
  // the keyframe duration in index.css.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!isValid) return;
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 1400);
    return () => clearTimeout(t);
  }, [isValid]);

  // Biometric verification step (Touch ID / Face ID / Windows Hello) gates
  // the actual submission. `verifying` keeps the CTA in a loading state
  // while the OS prompt is open; `verifyError` shows a transient failure.
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  const handleSubmit = async () => {
    if (!isValid || verifying) return;

    // Biometric gate ONLY for actual payments (Pay X ₪). For just adding a
    // card to the wallet there's no money movement, so we skip verification.
    if (!isPaymentFlow) {
      // Onboarding flow (pay-intro → add card): land back on the wallet with
      // the balance card's pay-code "how it works" sheet open. Any other entry
      // just goes back.
      if (state?.entry === 'pay-intro') {
        navigate(`/${lang}/wallet`, { state: { openPayCodeHelp: true } });
      } else {
        navigate(-1);
      }
      return;
    }

    setVerifying(true);
    setVerifyError(false);
    // Fire the WebAuthn prompt IMMEDIATELY — no awaits between the click
    // and credentials.create(). This preserves the user-activation flag.
    const result = await requireBiometricApproval();
    setVerifying(false);

    if (result === 'denied') {
      setVerifyError(true);
      setTimeout(() => setVerifyError(false), 3000);
      return;
    }
    // 'verified' or 'unavailable' (desktop without biometric) → proceed.
    navigate(`/${lang}/wallet/add-money/loading`, { state: { amount } });
  };

  const total = isPaymentFlow ? Number(amount) + (fee ?? 0) : undefined;
  const ctaLabel = isPaymentFlow
    ? t.wallet.payAmount.replace('{amount}', (total ?? 0).toFixed(2))
    : t.wallet.addPaymentMethodBtn;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Entrance "curtain" — only rendered when arriving via the wallet's
          "Add card details" CTA (state.entry === 'wallet-cta'). The dark
          wallet backdrop covers the whole page on mount and slides down
          off-screen, revealing the white card-details form behind it.
          Direct URL access / HMR refresh / sub-sheet returns skip this. */}
      {showEntryCurtain && (
        <motion.div
          aria-hidden
          initial={{ y: 0 }}
          animate={{ y: '100%' }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-[200] bg-bg-dark pointer-events-none max-w-md mx-auto"
        />
      )}
      {/* Header — own back button (AppLayout suppresses its overlay for this route) */}
      <header className="flex items-center px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-2 text-text-secondary hover:bg-surface rounded-full transition-colors"
        >
          {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
      </header>

      <main className="flex-grow px-6 pb-36 overflow-y-auto">
        <h1 className="text-3xl font-bold text-text-primary leading-tight mb-1">
          {t.wallet.addPaymentTitle}
        </h1>
        <p className="text-text-secondary mb-6">{t.wallet.addPaymentSubtitle}</p>

        {/* Google Pay + divider */}
        <div className="mb-6 space-y-4">
          <GooglePayButton label={t.wallet.payWithGooglePay} />

          {/* Why we ask — short reassurance line, prefixed with a help (?) icon */}
          <div className="flex items-start gap-1.5 text-text-muted">
            <span
              className="material-symbols-outlined flex-shrink-0 mt-0.5"
              style={{ fontSize: '18px' }}
              aria-hidden
            >
              help
            </span>
            <p className="text-sm leading-relaxed">{t.wallet.addPaymentWhy}</p>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
            <span className="flex-1 h-px bg-border" />
            <span className="px-1">{t.wallet.orPayWithCard}</span>
            <span className="flex-1 h-px bg-border" />
          </div>
        </div>

        {/* Card preview with multi-colour soft halo + benefit copy below. */}
        <div className="mb-6">
          <div className="relative">
            {/* Soft halo — blurred multi-colour bloom behind the card.
                Opacity tracks fillProgress so the bloom intensifies as the
                user completes the form, but stays present from the start
                as a decorative frame. */}
            <div
              aria-hidden
              className="absolute -inset-1 rounded-[1.25rem] pointer-events-none transition-opacity duration-500"
              style={{
                background:
                  'linear-gradient(135deg, #7dd3a8 0%, #00d4ff 35%, #635bff 70%, #7c6cff 100%)',
                filter: 'blur(10px)',
                opacity: 0.3 + 0.35 * fillProgress,
              }}
            />
            <div className="relative">
              <CardPreview
                cardNumber={cardNumber}
                expiryMonth={expiryMonth}
                expiryYear={expiryYear}
                cardholderName={cardholderName}
                cardholderPlaceholder={t.wallet.cardholderPlaceholder}
                fillProgress={fillProgress}
                celebrate={celebrate}
              />
            </div>
          </div>
          <p className="text-center text-sm text-text-secondary mt-5 leading-snug px-4">
            {t.wallet.addPaymentBenefit}
          </p>
        </div>

        {/* Real <form> with cc-* autocomplete attributes so browsers
            (Chrome / Safari / Google Pay) recognise it as a payment form
            and surface saved-card autofill suggestions. The fixed footer
            button outside the form binds to it via `form="payment-form"`
            below. */}
        <form
          id="payment-form"
          autoComplete="on"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Card number */}
          <div className="space-y-2">
            <label htmlFor="card-number" className="block text-sm font-bold text-text-primary">
              {t.wallet.cardNumberLabel}
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 ${
                  isRTL ? 'right-0 pr-3' : 'left-0 pl-3'
                } flex items-center pointer-events-none`}
              >
                <CardBrandMark brand={brand} variant="chip" />
              </div>
              <input
                id="card-number"
                name="cardnumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                dir="ltr"
                placeholder={t.wallet.cardNumberPlaceholder}
                value={cardNumber}
                onChange={handleCardNumberChange}
                className={`block w-full py-4 h-14 border border-border rounded-2xl bg-white text-text-primary tracking-widest focus:outline-none focus:border-primary transition-colors ${
                  isRTL ? 'pr-14 pl-3 text-right' : 'pl-14 pr-3 text-left'
                }`}
              />
            </div>
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text-primary">
                {t.wallet.expiryDateLabel}
              </label>
              <div className="flex gap-2" dir="ltr">
                <input
                  name="cc-exp-month"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  placeholder={t.wallet.monthPlaceholder}
                  value={expiryMonth}
                  onChange={handleMonthChange}
                  className="w-full px-3 py-3 h-12 border border-border rounded-2xl bg-white text-text-primary text-center focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  name="cc-exp-year"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  placeholder={t.wallet.yearPlaceholder}
                  value={expiryYear}
                  onChange={handleYearChange}
                  className="w-full px-3 py-3 h-12 border border-border rounded-2xl bg-white text-text-primary text-center focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cvv" className="block text-sm font-bold text-text-primary">
                {t.wallet.securityCodeLabel}
              </label>
              <div className="relative">
                <input
                  id="cvv"
                  name="cvc"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  dir="ltr"
                  placeholder={t.wallet.cvvPlaceholder}
                  value={cvv}
                  onChange={handleCvvChange}
                  style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                  className={`block w-full px-3 py-3 h-12 border border-border rounded-2xl bg-white text-text-primary text-center tracking-[0.3em] focus:outline-none focus:border-primary transition-colors ${
                    isRTL ? 'pl-10' : 'pr-10'
                  }`}
                />
                <div
                  className={`absolute inset-y-0 ${
                    isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
                  } flex items-center pointer-events-none text-text-muted`}
                >
                  <CreditCard size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* PCI DSS reassurance — official PCI Security Standards Council
              logo (downloaded from vectorlogo.zone, served from /public). */}
          <div className="flex items-center gap-3 text-text-secondary">
            <img
              src="/pci-dss-logo.svg"
              alt="PCI Security Standards Council"
              className="flex-shrink-0 h-5 w-auto object-contain"
            />
            <p className="text-xs leading-snug">
              <span className="font-semibold text-text-primary">
                {t.wallet.pciSecureTitle}
              </span>
              <span className="block text-text-secondary">
                {t.wallet.pciSecureBody}
              </span>
            </p>
          </div>

          {/* Full name — pre-filled from auth profile when available, editable. */}
          <div className="space-y-2">
            <label htmlFor="cc-name" className="block text-sm font-bold text-text-primary">
              {t.wallet.nameOnCardLabel}
            </label>
            <input
              id="cc-name"
              name="ccname"
              type="text"
              autoComplete="cc-name"
              placeholder={t.wallet.nameOnCardPlaceholder}
              value={cardholderName}
              onChange={handleNameChange}
              className={`block w-full px-3 py-3 h-12 border border-border rounded-2xl bg-white text-text-primary focus:outline-none focus:border-primary transition-colors ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          {/* Israeli ID number — required for cardholder verification. */}
          <div className="space-y-2">
            <label htmlFor="id-number" className="block text-sm font-bold text-text-primary">
              {t.wallet.idNumberLabel}
            </label>
            <input
              id="id-number"
              name="id-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              placeholder={t.wallet.idNumberPlaceholder}
              value={idNumber}
              onChange={handleIdChange}
              aria-invalid={idNumber.length === 9 && !idChecksumOk}
              className={`block w-full px-3 py-3 h-12 border rounded-2xl bg-white text-text-primary tracking-widest focus:outline-none transition-colors ${
                idNumber.length === 9 && !idChecksumOk
                  ? 'border-error/70 focus:border-error'
                  : 'border-border focus:border-primary'
              } ${isRTL ? 'text-right' : 'text-left'}`}
            />
            {idNumber.length === 9 && !idChecksumOk && (
              <p className="text-xs text-error pt-1">{t.wallet.idNumberInvalid}</p>
            )}
          </div>
        </form>
      </main>

      {/* Footer — fixed CTA */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-border/60 px-6 pt-4 pb-6 space-y-3">
        {isPaymentFlow && fee !== undefined && (
          <p className="text-center text-sm text-text-secondary">
            {t.wallet.includingFee.replace('{fee}', fee.toFixed(2))}
          </p>
        )}
        {verifyError && (
          <p className="text-center text-sm text-error animate-fade-in">
            {t.wallet.biometricFailed}
          </p>
        )}
        <button
          type="submit"
          form="payment-form"
          disabled={!isValid || verifying}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
            isValid && !verifying
              ? 'bg-bg-dark text-white shadow-lg shadow-bg-dark/20 active:scale-[0.98] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {verifying ? (
            <>
              <span
                className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
              <span>{t.wallet.verifying}</span>
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </footer>
    </div>
  );
}
