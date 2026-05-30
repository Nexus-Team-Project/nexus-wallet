import type { PaymentMethod } from '../../hooks/usePaymentMethods';

/**
 * Brand mark used inside payment-method rows — Nexus card gets the
 * project's own logo chip (cyan sky-300 pill with the wide black Nexus
 * logo, matching the "יתרת נקסוס" treatment); everything else uses the
 * small Mastercard / Visa / Maestro / Google Pay / generic tile.
 *
 * Shared by PaymentMethodsPage and the add-money source picker so the
 * brand reads consistently across the app.
 */
export default function PaymentBrandMark({ brand }: { brand: PaymentMethod['brand'] }) {
  if (brand === 'nexus') {
    return (
      <div className="bg-sky-300 rounded-lg px-2.5 py-1.5 flex items-center justify-center">
        <img
          src="/nexus-logo-black.png"
          alt="Nexus"
          className="h-5 w-auto object-contain"
        />
      </div>
    );
  }
  if (brand === 'visa') {
    return (
      <div className="border border-border rounded-lg px-2 py-1.5 bg-white">
        <span className="text-xs font-black italic text-primary leading-none">
          VISA
        </span>
      </div>
    );
  }
  if (brand === 'mastercard') {
    return (
      <div className="border border-border rounded-lg p-2 bg-white">
        <svg height={20} viewBox="0 0 32 20" width={32} aria-hidden>
          <circle cx={10} cy={10} r={9} fill="#eb001b" opacity={0.85} />
          <circle cx={22} cy={10} r={9} fill="#f79e1b" opacity={0.85} />
        </svg>
      </div>
    );
  }
  if (brand === 'maestro') {
    return (
      <div className="border border-border rounded-lg p-2 bg-white">
        <svg height={20} viewBox="0 0 32 20" width={32} aria-hidden>
          <circle cx={10} cy={10} r={9} fill="#0099df" opacity={0.85} />
          <circle cx={22} cy={10} r={9} fill="#eb001b" opacity={0.85} />
        </svg>
      </div>
    );
  }
  if (brand === 'googlepay') {
    return (
      <div className="border border-border rounded-lg p-1.5 bg-white flex items-center justify-center">
        <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
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
      </div>
    );
  }
  return (
    <div className="border border-border rounded-lg px-2 py-1.5 bg-white text-xs font-bold text-text-secondary">
      ••••
    </div>
  );
}
