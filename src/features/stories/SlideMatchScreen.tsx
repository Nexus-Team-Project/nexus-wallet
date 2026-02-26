import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';

export function SlideMatchScreen() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const authMethod        = useAuthStore((s) => s.authMethod);
  const authFirstName     = useAuthStore((s) => s.firstName);
  const logout            = useAuthStore((s) => s.logout);

  const orgMember         = useRegistrationStore((s) => s.orgMember);
  const phone             = useRegistrationStore((s) => s.phone);
  const missingFields     = useRegistrationStore((s) => s.missingFields);
  const profileData       = useRegistrationStore((s) => s.profileData);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const resetRegistration = useRegistrationStore((s) => s.resetRegistration);

  const tenantConfig  = useTenantStore((s) => s.config);
  const clearTenant   = useTenantStore((s) => s.clearTenant);

  const openLoginSheet = useLoginSheetStore((s) => s.open);

  const orgName  = isHe
    ? (tenantConfig?.nameHe ?? orgMember?.organizationName ?? '')
    : (tenantConfig?.name   ?? orgMember?.organizationName ?? '');
  const orgColor = tenantConfig?.primaryColor ?? '#635bff';
  const orgLogo  = tenantConfig?.logo;

  const userIdentifier =
    (authMethod === 'google' || authMethod === 'apple') && profileData.email
      ? profileData.email
      : authFirstName ?? phone ?? null;

  const handleContinueWithOrg = () => {
    if (tenantConfig?.requiresMembershipFee) {
      navigate(`/${lang}/register/membership`);
    } else {
      navigate(
        `/${lang}/register/onboarding/${getFirstOnboardingSlide(
          useRegistrationStore.getState()
        )}`
      );
    }
  };

  const handleContinueNoOrg = () => {
    clearTenant();
    startRegistration({
      path:         'new-user',
      phone:        phone ?? '',
      orgMember:    null,
      missingFields,
    });
    navigate(
      `/${lang}/register/onboarding/${getFirstOnboardingSlide(
        useRegistrationStore.getState()
      )}`
    );
  };

  const handleSwitchAccount = () => {
    logout();
    resetRegistration();
    clearTenant();
    navigate(`/${lang}`, { replace: true });
    Promise.resolve().then(() => openLoginSheet().catch(() => {}));
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      style={{ background: 'var(--color-surface)' }}
      dir={isHe ? 'rtl' : 'ltr'}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex flex-col px-5 pb-8 pt-8">

        {/* Header */}
        <div className="mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${orgColor}1a` }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: orgColor, fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-primary mb-1">
            {t.authFlow.matchTitle}
          </h1>
          <p className="text-sm text-text-muted leading-snug">
            {t.authFlow.matchSubtitleSingle.replace('{{orgName}}', orgName)}
          </p>

          {userIdentifier && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
              {authMethod === 'google' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              ) : authMethod === 'apple' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '12px' }}>phone</span>
              )}
              <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                {t.authFlow.matchConnectedAs.replace('{{identifier}}', userIdentifier)}
              </span>
            </div>
          )}
        </div>

        {/* Org card */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="h-7 w-7 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span className="material-symbols-outlined text-white"
                  style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                  business
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">{orgName}</p>
              <p className="text-white/70 text-xs mt-0.5">{isHe ? 'חבר ארגון' : 'Organization member'}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white"
                style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinueWithOrg}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ background: orgColor }}
          >
            {t.authFlow.matchContinueWithOrg.replace('{{orgName}}', orgName)}
          </button>
          <button
            onClick={handleContinueNoOrg}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-border text-text-primary bg-white active:scale-[0.98] transition-all hover:bg-surface"
          >
            {t.authFlow.matchContinueNoOrg}
          </button>
          <button
            onClick={handleSwitchAccount}
            className="w-full py-2.5 text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            {t.authFlow.matchSwitchAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
