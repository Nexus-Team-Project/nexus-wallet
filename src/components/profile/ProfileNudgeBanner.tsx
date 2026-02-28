/**
 * ProfileNudgeBanner — fixed bottom banner shown to authenticated users whose
 * optional preference slides have not been completed yet.
 *
 * Visibility rules:
 *  • isAuthenticated = true
 *  • preferencesIncomplete = true  (set on login when missingFields contains
 *    any of purpose / lifeStage / birthday / gender / benefitCategories)
 *  • user is NOT currently in the registration flow (isRegistering = false)
 *  • user has NOT dismissed the banner this session
 *
 * CTA ("להשלמה"): starts a 'preferences-completion' registration flow and
 * navigates directly to the motivation slide (consents skipped for returning
 * users who already gave consent at initial signup).
 *
 * Dismiss (✕): hides the banner for the rest of the session via sessionStorage.
 * Auto-hidden: once setProfileCompleted(true) is called from the completion
 * page, authStore clears preferencesIncomplete and the banner disappears.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';

const SESSION_KEY = 'nexus_profile_nudge_dismissed';

export default function ProfileNudgeBanner() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isAuthenticated     = useAuthStore((s) => s.isAuthenticated);
  const preferencesIncomplete = useAuthStore((s) => s.preferencesIncomplete);
  const isRegistering       = useRegistrationStore((s) => s.isRegistering);
  const startRegistration   = useRegistrationStore((s) => s.startRegistration);

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Guard: only render when all conditions are met
  if (!isAuthenticated || !preferencesIncomplete || isRegistering || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch { /* silently fail */ }
    setDismissed(true);
  };

  const handleComplete = () => {
    startRegistration({
      path: 'preferences-completion',
      phone: '',
      missingFields: [],
    });
    navigate(`/${lang}/register/onboarding/motivation`);
  };

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div
        className="mx-4 max-w-md w-full rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Leading icon */}
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{
            fontSize: '22px',
            color: 'white',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          auto_awesome
        </span>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">
            {t.registration.profileNudgeTitle}
          </p>
          <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.80)' }}>
            {t.registration.profileNudgeSubtitle}
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={handleComplete}
          className="flex-shrink-0 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.profileNudgeCta}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 -me-1 p-1 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
          aria-label="Dismiss"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', color: 'white' }}
          >
            close
          </span>
        </button>
      </div>
    </div>
  );
}
