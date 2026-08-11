import type { GiftVariant } from '../../pages/GiftSamplePage';

const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

/**
 * GiftCoverCard — the sender logo / hero illustration / headline / CTA
 * content of the gift cover, extracted out of GiftSamplePage so the
 * wallet-home teaser (GiftClaimTeaser) can peek the EXACT same card rather
 * than a redesigned lookalike. Callers own the outer sizing, background,
 * shadow and (in GiftSamplePage's case) the flip animation — this component
 * is just what sits inside that box.
 */
export default function GiftCoverCard({
  variant,
  onOpen,
}: {
  variant: GiftVariant;
  onOpen: () => void;
}) {
  return (
    <>
      {/* Soft scrim — keeps the white logo/title legible over the lighter
          end of the gradient. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,37,64,0.28) 0%, rgba(10,37,64,0.05) 35%, rgba(10,37,64,0.18) 75%, rgba(10,37,64,0.4) 100%)',
        }}
      />

      {/* Sender logo — rendered white over the wash. */}
      <img
        src={variant.logo}
        alt={variant.sender}
        className={`relative z-10 ${variant.logoClass} object-contain drop-shadow-lg`}
        style={variant.logoWhite ? { filter: 'brightness(0) invert(1)' } : undefined}
      />

      {/* Hero — a claim variant shows an approval badge; a gift variant
          shows its transparent illustration. */}
      <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
        {variant.claim ? (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 132,
              height: 132,
              background: 'rgba(255,255,255,0.14)',
              boxShadow: '0 0 0 14px rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="material-symbols-rounded text-white"
              style={{ fontSize: 76, fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>
        ) : (
          <img
            src={variant.heroImage}
            alt=""
            aria-hidden
            className={`${variant.heroMaxW} max-h-full object-contain drop-shadow-xl rounded-xl`}
          />
        )}
      </div>

      <div className="relative z-10 w-full space-y-4">
        <h2
          className="text-2xl font-extrabold text-center leading-tight"
          style={{ textShadow: '0 1px 14px rgba(10,37,64,0.5)' }}
        >
          {variant.coverTitle}
        </h2>
        {variant.coverSubtitle && (
          <p
            className="text-center text-sm font-semibold leading-relaxed text-white/90"
            style={{ textShadow: '0 1px 10px rgba(10,37,64,0.45)' }}
          >
            {variant.coverSubtitle}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpen}
            className="w-full bg-bg-dark text-white py-4 px-6 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
          >
            {variant.coverCta ?? 'גלה את המתנה'}
          </button>
          {/* Nexus wordmark — the platform mark, below the button. */}
          <img src={NEXUS_WIDE_WHITE} alt="Nexus" className="h-9 w-auto" />
        </div>
      </div>
    </>
  );
}
