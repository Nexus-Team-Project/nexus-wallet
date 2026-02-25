import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';
import { useRegistrationStore } from '../../stores/registrationStore';

/**
 * OrgWelcomePage — simple "ברוך הבא ל-Nexus" intro page.
 *
 * Shown ONLY for pre-provision users (org member link, no customerId):
 *   PATH B: orgMember found → org-welcome → org-user (Match Screen)
 *
 * Routing logic:
 *   IF pre_provision AND NOT customer_id → org-welcome → org-user
 *   ELSE → org-user (Match Screen directly)
 */
export default function OrgWelcomePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [visible, setVisible] = useState(false);

  const tenantConfig = useTenantStore((s) => s.config);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // Resolve org name & color from available sources
  const orgName =
    (isHe ? tenantConfig?.nameHe : tenantConfig?.name) ??
    orgMember?.organizationName ??
    (isHe ? 'הארגון שלך' : 'Your organization');

  const orgColor = tenantConfig?.primaryColor ?? '#635bff';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    navigate(`/${lang}/auth-flow/org-user`);
  };

  const subtitle = t.authFlow.orgWelcomeSubtitle.replace('{{orgName}}', orgName);

  const FEATURE_BULLETS = [
    { icon: 'card_giftcard', key: 'welcomeOrgBullet1' as const },
    { icon: 'local_offer',   key: 'welcomeOrgBullet2' as const },
    { icon: 'verified',      key: 'welcomeOrgBullet3' as const },
  ];

  return (
    <div
      className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col bg-white overflow-x-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* ── Gradient header ──────────────────────────────────── */}
      <div
        className="flex-shrink-0 w-full flex flex-col justify-end px-6 pb-8"
        style={{
          minHeight: '40vh',
          background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 60%, #00d4ff 100%)`,
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
        }}
      >
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {/* Org logo bubble */}
          <div className="w-16 h-16 rounded-2xl border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            {tenantConfig?.logo ? (
              <img
                src={tenantConfig.logo}
                alt={orgName}
                className="h-9 w-9 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '30px', fontVariationSettings: "'FILL' 1" }}
              >
                business
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-white drop-shadow mb-2">
            {t.authFlow.orgWelcomeTitle}
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">{subtitle}</p>
        </div>
      </div>

      {/* ── White content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 pt-7 pb-8">
        {/* Feature bullets */}
        <ul className="space-y-4 mb-8">
          {FEATURE_BULLETS.map(({ icon, key }, i) => (
            <li
              key={key}
              className="flex items-center gap-3 transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible
                  ? 'translateX(0)'
                  : `translateX(${isHe ? '-' : ''}16px)`,
                transitionDelay: `${100 + i * 80}ms`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${orgColor}18` }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    color: orgColor,
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  {icon}
                </span>
              </div>
              <span className="text-text-primary font-medium leading-snug text-sm">
                {t.authFlow[key]}
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div
          className="mt-auto transition-all duration-500 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '320ms',
          }}
        >
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ background: orgColor }}
          >
            {t.authFlow.orgWelcomeCta}
          </button>
        </div>
      </div>
    </div>
  );
}
