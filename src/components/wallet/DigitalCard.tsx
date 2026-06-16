import type { CSSProperties, ReactNode } from 'react';

// The physical Isracard × Nexus corporate card artwork. Lives in /public
// so it can be swapped without a rebuild. The PNG carries its own rounded
// corners (transparent outside the card outline), so we don't clip or
// round it ourselves — that's what previously exposed white corners.
const CARD_IMAGE = '/cards/isracard-corporate.png';
// Natural aspect of the trimmed artwork (1555 × 984).
const CARD_ASPECT = 1555 / 984;

interface DigitalCardProps {
  /** Extra classes for the outer card (sizing — e.g. w-full). */
  className?: string;
  style?: CSSProperties;
  /** Overlay content rendered on top of the card (e.g. the tap ripple). */
  children?: ReactNode;
  /**
   * Fixed pixel height instead of the natural card aspect ratio. Used in
   * the wallet deck so the card matches the (taller) balance/pay card —
   * the artwork stays centred via object-contain.
   */
  heightPx?: number;
  /**
   * Optional co-brand logo overlaid on the card, just above the NEXUS mark
   * (bottom-left of the artwork). Used for tenant-branded gifts (e.g. SPAR).
   */
  brandLogo?: string;
  /** When set, renders a "?" help button (top-right) that opens a
   *  "how it works" explainer. */
  onHelp?: () => void;
}

/**
 * The Nexus digital card — the real Isracard corporate card artwork.
 * Shared between the wallet deck and the card-detail page so the card
 * the user taps matches the one that opens. The shadow uses drop-shadow
 * so it follows the card's rounded silhouette instead of a box.
 */
export default function DigitalCard({ className = '', style, children, heightPx, brandLogo, onHelp }: DigitalCardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        ...(heightPx ? { height: heightPx } : { aspectRatio: `${CARD_ASPECT}` }),
        ...style,
      }}
    >
      <img
        src={CARD_IMAGE}
        alt="Isracard Nexus card"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))' }}
        draggable={false}
      />
      {/* Co-brand logo — flush to the card's LEFT edge, just above the NEXUS
          mark. The slot always matches the card aspect (deck + detail), so
          there's no object-contain letterbox and a %-based position tracks the
          artwork. Pinned horizontally (left: 0) but free vertically. */}
      {brandLogo && (
        <img
          src={brandLogo}
          alt=""
          aria-hidden
          className="absolute object-contain pointer-events-none"
          style={{ left: '0%', bottom: '18%', width: '42%' }}
          draggable={false}
        />
      )}
      {/* Help — opens a "how it works" explainer. Same treatment as the help
          button on the card backs (white circle + Material "help" glyph), in
          the bottom-right corner. Stops pointer/click from reaching the deck
          (so it never starts a card drag or tap). */}
      {onHelp && (
        <button
          type="button"
          aria-label="איך זה עובד"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onHelp();
          }}
          className="absolute z-20 bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-colors"
        >
          <span className="material-symbols-rounded text-text-muted" style={{ fontSize: '22px' }}>
            help
          </span>
        </button>
      )}
      {children}
    </div>
  );
}
