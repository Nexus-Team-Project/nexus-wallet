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
}

/**
 * The Nexus digital card — the real Isracard corporate card artwork.
 * Shared between the wallet deck and the card-detail page so the card
 * the user taps matches the one that opens. The shadow uses drop-shadow
 * so it follows the card's rounded silhouette instead of a box.
 */
export default function DigitalCard({ className = '', style, children, heightPx }: DigitalCardProps) {
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
      {children}
    </div>
  );
}
