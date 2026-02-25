import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTenantStore } from '../../../stores/tenantStore';
import { useRegistrationStore } from '../../../stores/registrationStore';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

/**
 * OrgIntroSlide — conditional first onboarding slide for org-flow users.
 *
 * Shown when orgMember is set (PATH B / tenant flows after Match Screen).
 * Displays an org-branded "ברוך הבא ל-Nexus" intro with feature bullets
 * before the user proceeds through the rest of the onboarding.
 */
const FEATURE_BULLETS = [
  { icon: 'card_giftcard', key: 'welcomeOrgBullet1' as const },
  { icon: 'local_offer',   key: 'welcomeOrgBullet2' as const },
  { icon: 'verified',      key: 'welcomeOrgBullet3' as const },
];

export default function OrgIntroSlide() {
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

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('org-intro', storeState);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    const next = getNextOnboardingSlide('org-intro', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('org-intro', storeState);
    if (prev) {
      navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
    }
  };

  const hasPrev = !!getPrevOnboardingSlide('org-intro', storeState);

  const subtitle = t.authFlow.orgWelcomeSubtitle.replace('{{orgName}}', orgName);

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
        {/* Progress bar + back */}
        <div className="flex items-center gap-3 mb-4">
          {hasPrev && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
            >
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '18px' }}
              >
                {isHe ? 'arrow_forward' : 'arrow_back'}
              </span>
            </button>
          )}
          {/* Thin white progress bar */}
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-white/70 font-medium flex-shrink-0">
            {current} / {total}
          </span>
        </div>

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
