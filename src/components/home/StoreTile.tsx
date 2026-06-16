import type { ReactNode } from 'react';

interface StoreTileProps {
  /** Background image (a single colourful item works best). */
  image?: string;
  /** Brand logo — cut-out, centered over the visible image area. */
  logoUrl?: string;
  /** Fallback background colour when there's no image. */
  bg?: string;
  onClick?: () => void;
  /** Optional ⋮ actions button (top corner). */
  onMenu?: () => void;
  menuLabel?: string;
  disabled?: boolean;
  /** Bottom content rendered over the faded foot. */
  children: ReactNode;
}

/**
 * StoreTile — the shared "brand card" tile used across the home sliders: a
 * portrait image card with the brand logo cut-out and centered over the image,
 * a faded white foot, and free-form bottom content (name + rating, or a deal's
 * price). Optionally shows a ⋮ actions button.
 */
export default function StoreTile({
  image,
  logoUrl,
  bg,
  onClick,
  onMenu,
  menuLabel = 'Actions',
  disabled,
  children,
}: StoreTileProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={0}
      className={`relative w-[176px] h-[200px] shrink-0 rounded-2xl overflow-hidden shadow-sm text-start transition-transform ${
        disabled ? 'opacity-60' : 'active:scale-[0.97] cursor-pointer'
      }`}
      style={{ backgroundColor: bg ?? '#f0f0f0' }}
    >
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {/* Brand logo — cut-out, centered over the visible image area */}
      {logoUrl && (
        <div className="absolute inset-x-0 top-0 bottom-[40%] flex items-center justify-center px-3">
          <img
            src={logoUrl}
            alt=""
            aria-hidden
            className="max-h-[46px] max-w-[80%] object-contain"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))' }}
          />
        </div>
      )}

      {/* ⋮ actions button — top corner */}
      {onMenu && (
        <button
          onClick={(e) => { e.stopPropagation(); onMenu(); }}
          aria-label={menuLabel}
          className="absolute top-2 z-10 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white flex items-center justify-center active:scale-90 transition-transform"
          style={{ insetInlineStart: 8 }}
        >
          <span className="material-symbols-outlined block" style={{ fontSize: 18 }}>more_vert</span>
        </button>
      )}

      {/* Faded (white) bottom of the image */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            'linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.75) 38%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-3">{children}</div>
    </div>
  );
}

/** Name + rating foot — matches the reviews page rating style. */
export function StoreNameRating({
  name,
  rating,
  reviewCount,
}: {
  name: string;
  rating: number;
  reviewCount: number;
}) {
  return (
    <>
      <p className="text-[14px] font-bold text-text-primary leading-tight truncate">{name}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <span
          className="material-symbols-rounded text-black"
          style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
        <span className="text-[13px] font-bold text-text-primary">{rating.toFixed(1)}</span>
        <span className="text-[11px] text-text-muted">({reviewCount.toLocaleString()})</span>
      </div>
    </>
  );
}
