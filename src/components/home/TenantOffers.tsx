import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';

// ── Tenant Benefit Card ──

function TenantBenefitCard({
  config,
  isHe,
  onCta,
}: {
  config: { nameHe: string; name: string; logo: string; primaryColor: string; membershipBenefitsHe?: string[]; membershipBenefits?: string[] };
  isHe: boolean;
  onCta: () => void;
}) {
  const benefits = isHe
    ? config.membershipBenefitsHe ?? config.membershipBenefits ?? []
    : config.membershipBenefits ?? config.membershipBenefitsHe ?? [];

  const displayBenefit = benefits[0] ?? (isHe ? 'הטבות בלעדיות לחברים' : 'Exclusive member benefits');

  return (
    <div className="flex-none w-[75vw] max-w-[300px] bg-white border border-border rounded-lg shadow-sm overflow-hidden text-start snap-start flex flex-col">
      {/* Visual header */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '20vh',
          background: `linear-gradient(135deg, ${config.primaryColor}22 0%, ${config.primaryColor}44 100%)`,
        }}
      >
        {/* Logo */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'white',
            boxShadow: `0 0 0 4px ${config.primaryColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
          }}
        >
          {config.logo}
        </div>

        {/* Bottom caption bar */}
        <div
          className="absolute bottom-0 left-0 right-0 py-2 px-3"
          style={{ background: `${config.primaryColor}cc`, backdropFilter: 'blur(4px)' }}
        >
          <p className="text-white text-[11px] text-center leading-relaxed font-medium">
            {displayBenefit}
          </p>
        </div>
      </div>

      {/* CTA area */}
      <div className="px-3 py-3 flex items-center justify-center">
        <button
          onClick={onCta}
          className="px-5 py-2 rounded-full text-white text-xs font-semibold active:scale-[0.97] transition-transform flex items-center gap-1.5"
          style={{ background: config.primaryColor }}
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '14px' }}
          >
            star
          </span>
          {isHe ? 'לכל ההטבות' : 'All benefits'}
        </button>
      </div>
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

  return (
    <section className="mb-6">
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

      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
        <TenantBenefitCard
          config={config}
          isHe={isHe}
          onCta={() => navigate(`/${lang}/store`)}
        />
      </div>
    </section>
  );
}
