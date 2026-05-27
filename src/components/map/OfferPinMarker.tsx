import type { OfferCategory } from '../../types/map';

/**
 * Simple circular brand pin — solid background tinted by the brand color
 * (or a category fallback), white ring, brand logo at the centre. Selected
 * state gets a soft glow halo + a pulse ring.
 *
 * Use `anchor="center"` on the parent <Marker> so the centre of the circle
 * lands exactly on the lat/lng.
 */

interface OfferPinMarkerProps {
  category: OfferCategory;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  /** Brand logo image URL. When omitted, the marker falls back to the
   *  first letter of `ariaLabel` (or a generic dot). */
  brandLogo?: string;
  /** Background fill for the circle. Defaults to the category colour. */
  brandColor?: string;
}

/** Fallback colours per category — used when a pin has no brandColor. */
const CATEGORY_FALLBACK: Record<OfferCategory, string> = {
  food: '#6366f1',          // indigo
  retail: '#a855f7',        // purple
  wellness: '#10b981',      // emerald
  entertainment: '#ec4899', // pink
  services: '#64748b',      // slate
};

export default function OfferPinMarker({
  category,
  selected = false,
  onClick,
  ariaLabel,
  brandLogo,
  brandColor,
}: OfferPinMarkerProps) {
  const fill = brandColor || CATEGORY_FALLBACK[category];
  const scaleClass = selected ? 'scale-110' : 'scale-100';
  const fallbackLetter = (ariaLabel || '').trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={ariaLabel}
      className={`relative cursor-pointer transition-transform duration-200 ease-out ${scaleClass} hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`}
      style={{ width: 36, height: 36 }}
    >
      {/* Soft glow halo behind the circle — fades in when selected */}
      <span
        aria-hidden="true"
        className="absolute pointer-events-none rounded-full transition-opacity duration-300"
        style={{
          inset: -8,
          background: `radial-gradient(circle, ${fill}55 0%, transparent 70%)`,
          opacity: selected ? 1 : 0,
          filter: 'blur(4px)',
        }}
      />

      {/* Circle body — brand color background, white ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border-[3px] border-white flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: fill,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {brandLogo ? (
          <img
            src={brandLogo}
            alt=""
            className="w-[78%] h-[78%] object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-white text-sm font-bold leading-none">
            {fallbackLetter || '·'}
          </span>
        )}
      </span>

      {/* Pulse ring on selected — single keyframe loop */}
      {selected && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${fill}`,
            animation: 'marker-pulse 1.8s ease-out infinite',
          }}
        />
      )}
    </button>
  );
}
