/**
 * CardPreview — the payment-card face from the add-payment-method page,
 * extracted so marketing surfaces (e.g. the About page's phone mockup) can
 * render the exact same card. Moved verbatim from AddPaymentMethodPage.tsx.
 */

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
export default function CardPreview({
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
