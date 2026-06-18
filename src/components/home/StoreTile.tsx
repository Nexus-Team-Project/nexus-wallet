import { useEffect, useState, type ReactNode } from 'react';

/**
 * Samples the dominant colour of an image (downscaled to a tiny canvas,
 * averaging the non-white / non-black / opaque pixels) so the tile's foot can
 * fade into the image's own hue instead of a uniform white. Uses a detached
 * crossOrigin image so a CORS failure just leaves the fade white (the visible
 * <img> is unaffected). Returns a pale, text-safe tint mixed toward white.
 */
function useDominantTint(src?: string): { r: number; g: number; b: number } | null {
  const [tint, setTint] = useState<{ r: number; g: number; b: number } | null>(null);
  useEffect(() => {
    setTint(null);
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const S = 24;
        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, S, S);
        const { data } = ctx.getImageData(0, 0, S, S);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const R = data[i], G = data[i + 1], B = data[i + 2];
          const lum = (R * 299 + G * 587 + B * 114) / 1000;
          if (lum > 242 || lum < 12) continue; // skip near-white / near-black
          r += R; g += G; b += B; n++;
        }
        if (!n || cancelled) return;
        // Pale, text-safe: 30% dominant hue mixed into 70% white.
        const mix = (c: number) => Math.round((c / n) * 0.3 + 255 * 0.7);
        setTint({ r: mix(r), g: mix(g), b: mix(b) });
      } catch {
        /* tainted canvas (CORS) — keep the white fade */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return tint;
}

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
  const tint = useDominantTint(image);
  // Foot fade — the image's own dominant hue (pale, so dark foot text stays
  // readable) instead of a uniform white for every tile.
  const { r, g, b } = tint ?? { r: 240, g: 240, b: 240 };
  const footFade = `linear-gradient(to top, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},1) 65%, rgba(${r},${g},${b},0.75) 82%, rgba(${r},${g},${b},0) 100%)`;
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
        <div className="absolute inset-x-0 top-[15%] bottom-[35%] flex items-center justify-center px-3 z-10">
          <img
            src={logoUrl}
            alt=""
            aria-hidden
            className="max-h-[64px] max-w-[85%] object-contain"
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

      {/* Faded top — subtle vignette */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/3"
        style={{ background: `linear-gradient(to bottom, rgba(${r},${g},${b},0.45) 0%, rgba(${r},${g},${b},0) 100%)` }}
      />

      {/* Faded bottom — the image's dominant hue */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-4/5"
        style={{ background: footFade }}
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
