/**
 * Tenant color helper.
 *
 * Public tenants resolved from the backend all carry the SAME default Nexus
 * brand color, so the auth-flow promo slides would look identical for every
 * organization. To give each tenant a recognisable identity we derive a STABLE
 * color from a hash of its tenantId — the same tenant always gets the same
 * color, on every render and every device, with no storage needed.
 *
 * A genuinely custom tenant color (one a tenant actually themed) is always
 * preferred; the hashed color is only a fallback for tenants still on the
 * default. See `resolveTenantColor`.
 *
 * All generated colors use a fixed saturation/lightness tuned to read well
 * behind the white promo text, so any hue on the wheel looks good.
 */

/**
 * The default Nexus brand color. A tenant config carrying exactly this value is
 * using the platform fallback (not a real custom theme), so it is treated as
 * "no custom color" by `resolveTenantColor`. Mirrors the value in
 * LanguageRouter's `DEFAULT_PRIMARY_COLOR`.
 */
export const DEFAULT_TENANT_COLOR = '#635bff';

/** Saturation/lightness for generated hues — kept constant so every tenant
 *  color sits in the same visually-balanced band. */
const GEN_SATURATION = 62;
const GEN_LIGHTNESS = 58;

/**
 * Stable string hash → unsigned integer. A small djb2-style hash; deterministic
 * across runtimes (no Math.random), so a tenantId always maps to the same value.
 * @param seed any stable per-tenant string (use the tenantId).
 * @returns a non-negative integer.
 */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return Math.abs(h);
}

/**
 * Convert HSL to a #rrggbb hex string.
 * @param h hue 0–360, @param s saturation 0–100, @param l lightness 0–100.
 */
function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number): string =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Parse a #rrggbb hex string to HSL. Returns null for anything that is not a
 * 6-digit hex (named colors, 3-digit shorthand) so callers can fall back.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1]!, 16);
  const r = ((int >> 16) & 0xff) / 255;
  const g = ((int >> 8) & 0xff) / 255;
  const b = (int & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = (((g - b) / d) % 6 + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/**
 * Shift a hex color's lightness by a delta (percentage points), clamped 0–100.
 * Used to build the lighter/darker stops of the hero gradient. If the input is
 * not a parseable hex it is returned unchanged.
 */
function shiftLightness(hex: string, deltaL: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex(hsl.h, hsl.s, Math.min(100, Math.max(0, hsl.l + deltaL)));
}

/**
 * Derive a stable, distinct color for a tenant from a seed (its tenantId).
 * @param seed a stable per-tenant string (the tenantId).
 * @returns a #rrggbb hex color, unique per hue across the wheel.
 */
export function tenantColor(seed: string): string {
  const hue = hashSeed(seed) % 360;
  return hslToHex(hue, GEN_SATURATION, GEN_LIGHTNESS);
}

/**
 * Pick the color to brand a tenant with: a genuinely custom config color when
 * one is set, otherwise a hashed color from the seed. Falls back to the Nexus
 * default when there is no tenant at all (no seed).
 * @param configColor the tenant's configured primaryColor (may be the default).
 * @param seed the tenantId to hash, or null/undefined when there is no tenant.
 * @returns the resolved #rrggbb hex color.
 */
export function resolveTenantColor(
  configColor: string | undefined,
  seed: string | null | undefined,
): string {
  if (configColor && configColor.toLowerCase() !== DEFAULT_TENANT_COLOR) {
    return configColor;
  }
  return seed ? tenantColor(seed) : DEFAULT_TENANT_COLOR;
}

/**
 * Build the 135° promo hero gradient from a base color: a darker stop, the base,
 * then a lighter stop — the same shape as the original hardcoded Nexus gradient.
 * @param baseHex the resolved tenant color (#rrggbb).
 */
export function heroGradient(baseHex: string): string {
  const darker = shiftLightness(baseHex, -14);
  const lighter = shiftLightness(baseHex, 12);
  return `linear-gradient(135deg, ${darker} 0%, ${baseHex} 45%, ${lighter} 100%)`;
}
