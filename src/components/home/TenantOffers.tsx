import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';

// ── Benefit icons cycling through a set ──
const BENEFIT_ICONS = ['⭐', '🎁', '💳', '🎫', '🏆', '🎉', '🛍️', '🎊'];

const DEFAULT_BENEFITS_HE = [
  'הנחות בלעדיות לחברים',
  'מתנות ופרסים מיוחדים',
  'יתרונות מיוחדים לחברים',
];
const DEFAULT_BENEFITS_EN = [
  'Exclusive member discounts',
  'Special gifts and prizes',
  'Special member perks',
];

// Light tint overlays cycling per card index
const CARD_TINTS = [
  'rgba(255,255,255,0.08)',
  'rgba(0,0,0,0.06)',
  'rgba(255,255,255,0.14)',
  'rgba(0,0,0,0.10)',
];

// ── Tenant Benefit Card ──

function TenantBenefitCard({
  icon,
  label,
  index,
  primaryColor,
  logo,
  onCta,
}: {
  icon: string;
  label: string;
  index: number;
  primaryColor: string;
  logo: string;
  onCta: () => void;
}) {
  const tint = CARD_TINTS[index % CARD_TINTS.length];

  return (
    <div
      className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start active:scale-[0.97] transition-transform duration-150 flex flex-col"
      onClick={onCta}
    >
      {/* Colored header */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          height: '20vh',
          background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${primaryColor} 100%)`,
        }}
      >
        {/* Subtle tint overlay for variety */}
        <div
          className="absolute inset-0"
          style={{ background: tint }}
        />

        {/* Main icon */}
        <span
          className="relative z-10"
          style={{
            fontSize: 52,
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
          }}
        >
          {icon}
        </span>

        {/* Tenant logo badge — top-right */}
        <div className="absolute top-2.5 right-2.5 z-10 w-10 h-10 rounded-full bg-white/90 shadow-sm border border-white/60 flex items-center justify-center">
          <span style={{ fontSize: 20 }}>{logo}</span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-3 py-3 flex-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary leading-snug pe-2">
          {label}
        </span>
        <span
          className="material-symbols-outlined shrink-0"
          style={{ fontSize: '16px', color: primaryColor }}
        >
          chevron_left
        </span>
      </div>
    </div>
  );
}

// ── Arrow Bubble ──

function MoreBubble({
  primaryColor,
  onNavigate,
}: {
  primaryColor: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform rounded-full"
        style={{ background: `${primaryColor}22` }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '20px', color: primaryColor }}
        >
          chevron_left
        </span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

export default function TenantOffers() {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const config = useTenantStore((s) => s.config);
  const isHe = language === 'he';

  // Only render when there is an active tenant affiliation
  if (!config) return null;

  const sectionTitle = isHe
    ? `הטבות ${config.nameHe}`
    : `${config.name} Benefits`;

  // Resolve benefit labels from config or fall back to defaults
  const rawBenefits = isHe
    ? (config.membershipBenefitsHe?.length ? config.membershipBenefitsHe : DEFAULT_BENEFITS_HE)
    : (config.membershipBenefits?.length ? config.membershipBenefits : DEFAULT_BENEFITS_EN);

  return (
    <section className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{config.logo}</span>
          <h3 className="text-base font-bold">{sectionTitle}</h3>
        </div>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md text-xs font-normal active:scale-95 transition-colors"
          style={{
            background: `${config.primaryColor}1a`,
            color: config.primaryColor,
          }}
        >
          {isHe ? 'עוד' : 'More'}
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        {rawBenefits.map((label, idx) => (
          <TenantBenefitCard
            key={idx}
            icon={BENEFIT_ICONS[idx % BENEFIT_ICONS.length]}
            label={label}
            index={idx}
            primaryColor={config.primaryColor}
            logo={config.logo}
            onCta={() => navigate(`/${lang}/store`)}
          />
        ))}
        <MoreBubble
          primaryColor={config.primaryColor}
          onNavigate={() => navigate(`/${lang}/store`)}
        />
      </div>
    </section>
  );
}
