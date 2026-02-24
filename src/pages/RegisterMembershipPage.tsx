import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useTenantStore } from '../stores/tenantStore';
import { useRegistrationStore } from '../stores/registrationStore';
import { useAuthStore } from '../stores/authStore';
import { processMembershipFee } from '../services/registration.service';
import { getFirstOnboardingSlide } from '../utils/onboardingNavigation';

export default function RegisterMembershipPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const tenantConfig = useTenantStore((s) => s.config);
  const userId = useAuthStore((s) => s.userId);
  const setMembershipFeePaid = useRegistrationStore((s) => s.setMembershipFeePaid);

  const [isLoading, setIsLoading] = useState(false);

  if (!tenantConfig?.requiresMembershipFee) {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`, { replace: true });
    return null;
  }

  const benefits = isHe
    ? tenantConfig.membershipBenefitsHe ?? tenantConfig.membershipBenefits ?? []
    : tenantConfig.membershipBenefits ?? [];

  const feeLabel = isHe
    ? tenantConfig.membershipFeeLabelHe ?? tenantConfig.membershipFeeLabel ?? ''
    : tenantConfig.membershipFeeLabel ?? '';

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const result = await processMembershipFee(
        userId ?? '',
        tenantConfig.membershipFeeAmount ?? 0
      );
      if (result.success) {
        setMembershipFeePaid(true);
        const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
        navigate(`/${lang}/register/onboarding/${firstSlide}`, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>

      {/* ── Progress bar ── */}
      <div className="flex-shrink-0 flex gap-1 px-3 pt-3 pb-2">
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
          <div className="h-full rounded-full bg-white w-full" />
        </div>
      </div>

      {/* ── White content card ── */}
      <div className="flex-1 bg-white rounded-t-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 pt-7 pb-5 px-6 text-center">
          <img
            src={tenantConfig.logo}
            alt={isHe ? tenantConfig.nameHe : tenantConfig.name}
            className="h-12 mx-auto mb-4 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
            {isHe ? 'חברות' : 'Membership'}
          </p>
          <h1 className="text-2xl font-extrabold text-text-primary mb-1 leading-tight">
            {t.registration.membershipTitle}
          </h1>
          <p className="text-sm text-text-muted">
            {t.registration.membershipSubtitle}
          </p>
        </div>

        {/* Benefits */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {t.registration.membershipBenefitsTitle}
          </h3>
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-surface rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-success flex-shrink-0 mt-0.5" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-sm text-text-secondary">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Price card */}
          <div className="p-5 bg-white rounded-2xl border-2 border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">{t.registration.membershipPriceLabel}</p>
                <p className="text-xs text-text-muted">{feeLabel}</p>
              </div>
              <div className="text-2xl font-bold text-text-primary" dir="ltr">
                {tenantConfig.membershipFeeCurrency === 'ILS' ? '₪' : '$'}
                {tenantConfig.membershipFeeAmount?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pb-10 pt-3 space-y-4">
          <button
            onClick={handlePay}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-primary text-white text-sm font-bold active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                {t.common.loading}
              </span>
            ) : (
              `${t.registration.membershipPayButton} — ${tenantConfig.membershipFeeCurrency === 'ILS' ? '₪' : '$'}${tenantConfig.membershipFeeAmount?.toFixed(2)}`
            )}
          </button>

          <a
            href="https://www.nexuswallet.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-px"
          >
            <img src={`/nexus-logo-animated-black.gif?t=${Date.now()}`} alt="Nexus" className="h-5" />
            <span className="text-[9px] text-black">Powered by</span>
          </a>
        </div>
      </div>
    </div>
  );
}
