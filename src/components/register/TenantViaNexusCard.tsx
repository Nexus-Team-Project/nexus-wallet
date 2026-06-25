import type { TenantConfig } from '../../types/tenant.types';
import { TENANT_HERO_IMAGES } from '../../data/tenantHeroImages';

/** Normalize a hex color to 6 digits, or null if it isn't parseable. */
function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return null;
  return h;
}

/** Darken a hex color by `amount` (0–1) toward black, as an rgb() string. */
function darken(hex: string, amount: number): string {
  const h = normalizeHex(hex);
  if (!h) return hex;
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 255) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

interface TenantViaNexusCardProps {
  tenant: TenantConfig;
  isHe: boolean;
}

/**
 * The "two in one" made visual: the user joins Nexus, and Nexus delivers their
 * organization. The card is the tenant's own brand surface — a gradient from the
 * tenant's primaryColor (the same color that themes its page) toward a darker
 * shade, with white text and logo on top. If the tenant defines a real
 * backgroundImage it layers in behind a brand-tinted scrim; if the asset is
 * missing the brand gradient still shows through, so the card never breaks.
 * The "via Nexus" label frames the org membership as something Nexus grants.
 */
export default function TenantViaNexusCard({ tenant, isHe }: TenantViaNexusCardProps) {
  const orgName = isHe ? tenant.nameHe : tenant.name;
  const color = tenant.primaryColor || '#2563EB';

  // Same background the tenant's club page shows: its own cover if defined,
  // else the shared hero lifestyle image used by the tenant page.
  const bgImage = tenant.backgroundImage ?? TENANT_HERO_IMAGES[0];

  // First membership benefit makes a good subtitle; otherwise a generic line.
  const subtitle =
    (isHe ? tenant.membershipBenefitsHe?.[0] : tenant.membershipBenefits?.[0]) ??
    (isHe ? 'חברות מלאה' : 'Full membership');

  const brandGradient = `linear-gradient(135deg, ${color} 0%, ${darken(color, 0.4)} 100%)`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl p-5"
      style={{ background: brandGradient }}
    >
      {/* Background image — matches the tenant club page hero — sitting behind a
          brand-tinted dark scrim that keeps the white text/logo legible. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${color}CC 0%, rgba(0,0,0,0.65) 100%)` }}
      />

      <div className="relative z-10">
        {/* Top label — "via Nexus", marking the membership as granted by Nexus. */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold mb-3 text-white/90">
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          {isHe ? 'דרך נקסוס' : 'via Nexus'}
        </span>

        {/* Org logo tile + name — reads like a membership tile. */}
        <div className="flex items-center gap-4">
          <span
            className="shrink-0 relative w-16 h-16 rounded-[18px] shadow-sm border border-black/5 overflow-hidden flex items-center justify-center bg-white"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <img
              src={tenant.logo}
              alt={orgName}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold leading-tight text-white">{orgName}</p>
            <p className="text-xs mt-0.5 leading-snug text-white/80">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
