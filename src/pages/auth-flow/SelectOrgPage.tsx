import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';
import { mockTenants } from '../../mock/data/tenants.mock';

// Orgs that have a tenant config (with customerId) appear first, then generic ones
const TENANT_ORGS = Object.values(mockTenants)
  .filter((t) => t.customerId)
  .map((t) => ({
    id: t.id,
    name: t.nameHe,
    initials: t.nameHe.slice(0, 2),
    tenantId: t.id,
    logo: t.logo,
    primaryColor: t.primaryColor,
  }));

const GENERIC_ORGS = [
  { id: 'selcom', name: 'סלקום', initials: 'סל' },
  { id: 'hapoel', name: 'הפועל תל אביב', initials: 'הפ' },
  { id: 'tau', name: 'אוניברסיטת תל אביב', initials: 'אתא' },
  { id: 'maccabi', name: 'מכבי שירותי בריאות', initials: 'מכ' },
  { id: 'jerusalem', name: 'עיריית ירושלים', initials: 'עיר' },
  { id: 'leumi', name: 'בנק לאומי', initials: 'בל' },
  { id: 'shirbit', name: 'שירביט ביטוח', initials: 'שב' },
  { id: 'clalit', name: 'כללית שירותי בריאות', initials: 'כל' },
];

const MOCK_ORGS = [...TENANT_ORGS, ...GENERIC_ORGS];

export default function SelectOrgPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const registrationPath = useRegistrationStore((s) => s.registrationPath);
  const phone = useRegistrationStore((s) => s.phone);
  const setTenant = useTenantStore((s) => s.setTenant);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const filtered = MOCK_ORGS.filter((o) => o.name.includes(search));

  const handleSelect = (org: typeof MOCK_ORGS[0]) => {
    setSelected(org.id);

    startRegistration({
      path: registrationPath ?? 'new-user',
      phone: phone ?? '',
      orgMember: {
        organizationId: org.id,
        organizationName: org.name,
      },
    });

    // If org has a tenant config → set it and show org stories
    if ('tenantId' in org && org.tenantId) {
      const tenantConfig = mockTenants[org.tenantId as string];
      if (tenantConfig) {
        setTenant(tenantConfig.id, tenantConfig);
        setTimeout(() => {
          navigate(`/${lang}/auth-flow/org-user`);
        }, 350);
        return;
      }
    }

    setTimeout(() => {
      navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
    }, 350);
  };

  const handleSkip = () => {
    navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
  };

  return (
    <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col bg-white overflow-x-hidden">
      {/* Gradient hero */}
      <div
        className="flex-shrink-0 w-full flex flex-col justify-end pb-6 px-6 pt-0"
        style={{
          minHeight: '28vh',
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)',
        }}
      >
        {/* Back button */}
        <div className="flex items-center justify-between px-0 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
          <button
            onClick={() => navigate(-1)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_forward</span>
          </button>
        </div>
        <div
          className="mt-2 transition-all duration-500 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <h1 className="text-2xl font-extrabold text-white drop-shadow">
            {t.authFlow.selectOrgTitle}
          </h1>
        </div>
      </div>

      {/* Search + list */}
      <div className="flex-1 flex flex-col px-5 pt-5 pb-8">
        {/* Search */}
        <div className="relative mb-4">
          <span
            className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 end-3 text-text-muted pointer-events-none"
            style={{ fontSize: '18px' }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.authFlow.selectOrgSearch}
            className="w-full pe-10 ps-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted bg-surface transition-colors"
          />
        </div>

        {/* Org list */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-white divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-10">לא נמצאו ארגונים</p>
          ) : (
            filtered.map((org) => {
              const isSelected = selected === org.id;
              return (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-right transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-surface active:bg-surface'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">
                    {org.initials}
                  </div>
                  <span className="flex-1 font-medium text-text-primary text-sm">{org.name}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="mt-5 text-center text-sm text-text-muted hover:text-primary transition-colors underline underline-offset-2"
        >
          {t.authFlow.selectOrgNotFound}
        </button>
      </div>
    </div>
  );
}
