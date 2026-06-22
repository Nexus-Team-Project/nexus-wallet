import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { PAY_SESSION_SECONDS } from '../../hooks/usePaySession';
import PayCodesPanel from './PayCodesPanel';
import type { UserVoucher } from '../../types/voucher.types';

interface VoucherCardProps {
  userVoucher: UserVoucher;
  /** Whether this card is flipped to its redemption (code) side. */
  flipped: boolean;
  /** Called when the redemption session times out, to flip back. */
  onExpire: () => void;
  /** Overrides the displayed balance (e.g. ₪0 once the gift has been spent). */
  balanceOverride?: number;
}

/** Perceived-luminance check so we pick readable ink on the brand colour. */
function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

/**
 * Whether a voucher stacks with other promotions ("כפל מבצעים"). It's a
 * fixed property of the voucher; with no field in the mock data we derive a
 * stable value from the id so each voucher reads consistently.
 */
export function voucherStacks(id: string): boolean {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 2 === 0;
}

/**
 * A purchased voucher as a deck card. The front is the brand (colour +
 * logo) with the voucher's balance and the Nexus mark; tapping flips it to
 * the SAME structure as the balance pay side (shared PayCodesPanel + 30s
 * session ring) wired to this voucher's code + QR.
 */
export default function VoucherCard({ userVoucher, flipped, onExpire, balanceOverride }: VoucherCardProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { voucher, redemptionCode, qrCode } = userVoucher;
  const bg = voucher.brandColor || '#0a2540';
  const dark = isDarkColor(bg);
  // A full-bleed artwork card (e.g. the SPAR gift): the photo *is* the card,
  // so we drop the centred logo / pills and read everything in white over a
  // bottom scrim.
  const imageCard = !!voucher.cardImage;
  const ink = imageCard ? '#ffffff' : dark ? '#ffffff' : '#0a2540';
  // Promotion-stacking is a fixed fact of the voucher, shown as a
  // translucent label on the card front (same style as the discount pill).
  const stacks = voucherStacks(userVoucher.id);

  // Fall back to the merchant name when the brand logo can't load.
  const [logoError, setLogoError] = useState(false);

  // Redemption session — counts down while flipped, then flips back.
  const [secondsLeft, setSecondsLeft] = useState(PAY_SESSION_SECONDS);
  useEffect(() => {
    if (!flipped) {
      setSecondsLeft(PAY_SESSION_SECONDS);
      return;
    }
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [flipped, secondsLeft, onExpire]);

  const ringC = 2 * Math.PI * 16;
  const ringOffset = ringC * (secondsLeft / PAY_SESSION_SECONDS);

  return (
    <div className="flip-perspective w-full">
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
        {/* FRONT — brand card + balance + Nexus mark (floats centred) */}
        <div className="flip-face w-full flex items-center justify-center" style={{ minHeight: 264 }}>
          <div
            className="relative w-full rounded-xl shadow-xl overflow-hidden p-5"
            style={{ aspectRatio: '1.586 / 1', backgroundColor: bg }}
          >
            {/* Full-bleed artwork — the card *is* the image (e.g. SPAR gift).
                A bottom scrim keeps the Nexus mark + balance legible. */}
            {imageCard && (
              <>
                <img
                  src={voucher.cardImage}
                  alt={voucher.merchantName}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ objectPosition: voucher.cardImagePosition || 'center' }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}
                />
              </>
            )}

            {/* Nexus mark — top-left on brand cards, bottom-left on artwork cards
                (keeping the top clear for the artwork's own logo). */}
            <img
              src="/nexus-white-wide-logo.png"
              alt="Nexus"
              draggable={false}
              className={`absolute left-4 h-9 w-auto opacity-95 pointer-events-none ${imageCard ? 'bottom-4' : 'top-4'}`}
              style={{ filter: imageCard || dark ? undefined : 'brightness(0)' }}
            />

            {/* Brand logo / name — centred (brand cards only; artwork cards
                carry their own logo). Falls back to the name text. */}
            {!imageCard && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                {voucher.brandLogo && !logoError ? (
                  <img
                    src={voucher.brandLogo}
                    alt={voucher.merchantName}
                    className="h-20 w-auto max-w-[64%] object-contain"
                    draggable={false}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-center leading-tight" style={{ color: ink }}>
                    {voucher.merchantName}
                  </span>
                )}
              </div>
            )}

            {/* Discount pill — bottom-left (brand cards only) */}
            {!imageCard && voucher.discountPercent ? (
              <span
                className="absolute bottom-4 left-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: ink }}
              >
                {`-${voucher.discountPercent}%`}
              </span>
            ) : null}

            {/* Stacking fact — translucent pill, top-right (brand cards only). */}
            {!imageCard && (
              <span
                className="absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: ink }}
              >
                {stacks ? t.wallet.includesStacking : t.wallet.excludesStacking}
              </span>
            )}

            {/* Voucher balance — bottom-right, styled like the Nexus card */}
            <div className="absolute bottom-4 right-4 text-right leading-none">
              <span
                className="block text-[11px] font-medium mb-1"
                style={{ color: ink, opacity: 0.7 }}
              >
                {language === 'he' ? 'יתרה' : 'Balance'}
              </span>
              <span className="font-bold tracking-tight text-4xl" style={{ color: ink }}>
                {formatCurrency(balanceOverride ?? voucher.originalPrice ?? 0, 'ILS', locale)
                  .split(/(₪)/)
                  .map((part, i) =>
                    part === '₪' ? (
                      <span key={i} className="text-[0.6em] font-semibold">
                        ₪
                      </span>
                    ) : (
                      <span key={i} className="tabular-nums">
                        {part}
                      </span>
                    ),
                  )}
              </span>
            </div>
          </div>
        </div>

        {/* BACK — identical structure to the balance pay side */}
        <div className="flip-face flip-face-back">
          <PayCodesPanel
            compact
            code={redemptionCode}
            qrSrc={qrCode}
            roundedClass="rounded-xl"
            stacking={voucherStacks(userVoucher.id)}
          />

          {/* Session clock — top-left corner, fills over the 30s */}
          <div className="absolute top-2 left-2 z-20 w-11 h-11">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(10,37,64,0.12)" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-text-primary"
              dir="ltr"
            >
              {secondsLeft}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
