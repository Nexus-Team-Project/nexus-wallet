/**
 * TenantAvatar - renders a tenant's logo, or a deterministic placeholder
 * when the logo is missing. The onboarding schema does not yet collect a
 * logo upload (planned for a later iteration), so most tenants render
 * the placeholder for now.
 *
 * Placeholder design: a circle filled with a gradient derived from the
 * tenant name's hash, with the first character of the name centered.
 * Same name -> same gradient, so the UI feels stable across sessions.
 */
import { useMemo } from 'react';

interface TenantAvatarProps {
  /** Tenant display name. Used for the initial and to seed the gradient. */
  name: string;
  /** Optional logo URL. Falls back to the placeholder when missing. */
  logoUrl?: string;
  /** Outer size in pixels. Defaults to 40 (10rem in tailwind w-10/h-10). */
  size?: number;
  /** Extra classes applied to the outer circle. */
  className?: string;
}

/**
 * Stable string hash. We only need uniform distribution across small
 * inputs, not cryptographic strength.
 */
function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Curated palette of two-tone gradients that read well on light backgrounds. */
const GRADIENTS: ReadonlyArray<[string, string]> = [
  ['#8b5cf6', '#6366f1'], // violet -> indigo
  ['#06b6d4', '#3b82f6'], // cyan -> blue
  ['#f59e0b', '#ef4444'], // amber -> red
  ['#10b981', '#0ea5e9'], // emerald -> sky
  ['#ec4899', '#8b5cf6'], // pink -> violet
  ['#f97316', '#ec4899'], // orange -> pink
  ['#22c55e', '#14b8a6'], // green -> teal
  ['#a855f7', '#ec4899'], // purple -> pink
];

export default function TenantAvatar({
  name,
  logoUrl,
  size = 40,
  className = '',
}: TenantAvatarProps) {
  const initial = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    // Use the first code point so emoji/RTL initials render correctly.
    return [...trimmed][0]!.toUpperCase();
  }, [name]);

  const gradient = useMemo(() => {
    const idx = hashName(name) % GRADIENTS.length;
    return GRADIENTS[idx]!;
  }, [name]);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        style={{ width: size, height: size }}
        // object-contain (not cover) so a non-square logo uploaded with the
        // "use full image" option shows in full instead of being cropped.
        className={`rounded-full bg-white object-contain flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        // Initial size scales with the avatar.
        fontSize: Math.round(size * 0.42),
      }}
      className={`rounded-full flex items-center justify-center text-white font-bold select-none flex-shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
