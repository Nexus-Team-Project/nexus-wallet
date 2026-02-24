import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';

/** Auto-redirect delay (ms) for existing users */
const EXISTING_USER_REDIRECT_MS = 2800;

export default function WelcomeOrgPage() {
  const { lang = 'he' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // mode=existing → משתמש קיים, auto-redirect לבית
  // mode=new      → משתמש חדש, כפתור להמשך רישום
  const mode = searchParams.get('mode');
  const isExistingUser = mode === 'existing';
  const isNewUser = mode === 'new';

  const organizationName = useAuthStore((s) => s.organizationName);
  const orgMember = useRegistrationStore((s) => s.orgMember);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const registrationPath = useRegistrationStore((s) => s.registrationPath);
  const phone = useRegistrationStore((s) => s.phone);
  const tenantConfig = useTenantStore((s) => s.config);

  console.log('[WelcomeOrgPage] tenantConfig:', tenantConfig?.id ?? 'NULL', '| mode:', mode);

  const orgName =
    tenantConfig?.nameHe ??
    organizationName ??
    orgMember?.organizationName ??
    'הארגון שלך';

  const orgColor = tenantConfig?.primaryColor ?? '#635bff';

  // Fade in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Existing user → auto-redirect to home after splash
  useEffect(() => {
    if (!isExistingUser) return;
    const leaveTimer = setTimeout(() => setLeaving(true), EXISTING_USER_REDIRECT_MS - 450);
    const navTimer = setTimeout(() => {
      navigate(`/${lang}`, { replace: true });
    }, EXISTING_USER_REDIRECT_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(navTimer);
    };
  }, [isExistingUser, navigate, lang]);

  const handleContinue = () => {
    if (tenantConfig?.requiresMembershipFee) {
      navigate(`/${lang}/register/membership`);
    } else {
      navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
    }
  };

  const handleSkip = () => {
    startRegistration({
      path: registrationPath ?? 'new-user',
      phone: phone ?? '',
      orgMember: null,
    });
    navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
  };

  const subtitle = t.authFlow.welcomeOrgSubtitle.replace('{{orgName}}', orgName);

  // ── Existing user: full-screen splash (like WelcomeBackPage) ──────────
  if (isExistingUser) {
    return (
      <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col items-center justify-center overflow-hidden">
        {/* Gradient background — tenant color */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 50%, ${orgColor}88 100%)`,
          }}
        />

        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-64 h-64 rounded-full opacity-20"
            style={{
              background: 'rgba(255,255,255,0.3)',
              top: '-10%',
              right: '-10%',
              animation: 'blob1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-48 h-48 rounded-full opacity-15"
            style={{
              background: 'rgba(255,255,255,0.2)',
              bottom: '10%',
              left: '-5%',
              animation: 'blob2 10s ease-in-out infinite',
            }}
          />
        </div>

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center text-center px-8 transition-all duration-700 ease-out"
          style={{
            opacity: visible && !leaving ? 1 : 0,
            transform: visible && !leaving ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
          }}
        >
          {/* Tenant logo or check circle */}
          {tenantConfig?.logo ? (
            <div
              className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
              style={{
                animation: visible ? 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
              }}
            >
              <img
                src={tenantConfig.logo}
                alt={orgName}
                className="h-12 w-12 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
              style={{
                animation: visible ? 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path
                  d="M10 22L19 31L34 13"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 50,
                    strokeDashoffset: visible ? 0 : 50,
                    transition: 'stroke-dashoffset 0.5s ease 0.4s',
                  }}
                />
              </svg>
            </div>
          )}

          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
            {t.authFlow.welcomeOrgTitle}
          </h1>
          <p className="text-lg text-white/85 mb-2">{subtitle}</p>

          {/* Redirect indicator */}
          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5 text-white/60 text-sm">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>{t.authFlow.redirecting}</span>
            </div>
            <button
              onClick={() => navigate(`/${lang}`, { replace: true })}
              className="text-xs text-white/60 font-medium underline"
            >
              מעבר מיידי
            </button>
          </div>
        </div>

        <style>{`
          @keyframes blob1 {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(-20px, 15px) scale(1.1); }
          }
          @keyframes blob2 {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(15px, -20px) scale(1.08); }
          }
          @keyframes scale-in {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── New / pre-provisioned user: splash + CTA button ───────────────────
  return (
    <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col items-center justify-center overflow-hidden">
      {/* Gradient background — tenant color */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 50%, ${orgColor}88 100%)`,
        }}
      />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-20"
          style={{
            background: 'rgba(255,255,255,0.3)',
            top: '-10%',
            right: '-10%',
            animation: 'blob1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-15"
          style={{
            background: 'rgba(255,255,255,0.2)',
            bottom: '10%',
            left: '-5%',
            animation: 'blob2 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8 w-full transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
        }}
      >
        {/* Tenant logo or check circle */}
        {tenantConfig?.logo ? (
          <div
            className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
            style={{
              animation: visible ? 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
            }}
          >
            <img
              src={tenantConfig.logo}
              alt={orgName}
              className="h-12 w-12 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div
            className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
            style={{
              animation: visible ? 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path
                d="M10 22L19 31L34 13"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: visible ? 0 : 50,
                  transition: 'stroke-dashoffset 0.5s ease 0.4s',
                }}
              />
            </svg>
          </div>
        )}

        <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
          {t.authFlow.welcomeOrgTitle}
        </h1>
        <p className="text-lg text-white/85 mb-10">{subtitle}</p>

        {/* CTA */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl bg-white font-bold text-sm active:scale-[0.98] transition-all"
            style={{ color: orgColor }}
          >
            {t.authFlow.welcomeOrgCta}
          </button>
          {!isNewUser && (
            <button
              onClick={handleSkip}
              className="w-full py-3 text-center text-sm text-white/60 hover:text-white transition-colors"
            >
              {t.authFlow.welcomeOrgSkip}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px, 15px) scale(1.1); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(15px, -20px) scale(1.08); }
        }
        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
