import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';

/**
 * WelcomeOrgPage — Match Screen ("מצאנו התאמה").
 *
 * Shown when a user has authenticated and we found an org match:
 *   - CUSTOMER-ID flow (arrived via ?customerId=): directly after auth
 *   - Pre-provision flow: after OrgWelcomePage intro
 *   - PATH B (org member incomplete profile): after org-welcome
 *
 * Displays:
 *   1. "מצאנו התאמה" header + user identity badge
 *   2. Org card (single org) or dropdown selector (multiple orgs)
 *   3. Three action buttons:
 *      - "המשך עם [orgName]"  → proceed with org affiliation
 *      - "להיכנס בלי שיוך"   → proceed without org (new-user flow)
 *      - "התחבר עם חשבון אחר" → logout + reset + reopen auth sheet
 */

interface OrgEntry {
  id: string;
  name: string;
  logo?: string;
  color: string;
}

export default function WelcomeOrgPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const [selectedOrgIdx, setSelectedOrgIdx] = useState(0);
  // Gate safety-guard redirect until after first render (stores may hydrate async)
  const [mounted, setMounted] = useState(false);
  // Prevents the safety guard from firing during intentional navigations
  const navigatingAwayRef = useRef(false);

  // ── Auth state ───────────────────────────────────────────────
  const firstName  = useAuthStore((s) => s.firstName);
  const authMethod = useAuthStore((s) => s.authMethod);
  const logout     = useAuthStore((s) => s.logout);

  // ── Registration state ───────────────────────────────────────
  const orgMember         = useRegistrationStore((s) => s.orgMember);
  const phone             = useRegistrationStore((s) => s.phone);
  const missingFields     = useRegistrationStore((s) => s.missingFields);
  const profileData       = useRegistrationStore((s) => s.profileData);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const resetRegistration = useRegistrationStore((s) => s.resetRegistration);

  // ── Login sheet ──────────────────────────────────────────────
  const open = useLoginSheetStore((s) => s.open);

  // ── Tenant state ─────────────────────────────────────────────
  const tenantConfig  = useTenantStore((s) => s.config);
  const clearTenant   = useTenantStore((s) => s.clearTenant);

  // ── Build org list ───────────────────────────────────────────
  const orgs: OrgEntry[] = useMemo(() => {
    const list: OrgEntry[] = [];
    if (tenantConfig) {
      list.push({
        id:    tenantConfig.id,
        name:  isHe ? tenantConfig.nameHe : tenantConfig.name,
        logo:  tenantConfig.logo,
        color: tenantConfig.primaryColor,
      });
    } else if (orgMember) {
      list.push({
        id:    orgMember.organizationId,
        name:  orgMember.organizationName,
        color: '#635bff',
      });
    }
    return list;
  }, [tenantConfig, orgMember, isHe]);

  const selectedOrg = orgs[selectedOrgIdx] ?? null;
  const orgColor    = selectedOrg?.color ?? '#635bff';

  // ── User identifier for badge ────────────────────────────────
  // Priority: email (Google/Apple) > firstName > phone
  const userIdentifier =
    (authMethod === 'google' || authMethod === 'apple') && profileData.email
      ? profileData.email
      : firstName
        ? firstName
        : phone
          ? phone
          : null;

  useEffect(() => { setMounted(true); }, []);

  // Safety guard: if no org data available, redirect to home.
  // Suppressed during intentional navigations (switch-account, continue-no-org)
  // to prevent a race-condition redirect before clearTenant/resetRegistration settle.
  useEffect(() => {
    if (mounted && orgs.length === 0 && !navigatingAwayRef.current) {
      navigate(`/${lang}`, { replace: true });
    }
  }, [mounted, orgs.length, navigate, lang]);

  // ── Action handlers ──────────────────────────────────────────

  /** Continue with org affiliation → onboarding */
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

  /** Continue without org → register as a plain new user (Nexus only, no org affiliation) */
  const handleContinueNoOrg = () => {
    navigatingAwayRef.current = true;
    clearTenant(); // remove org branding — Nexus colors take over from this point
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

  /** Switch account → logout, reset state, reopen auth sheet for a fresh flow */
  const handleSwitchAccount = () => {
    navigatingAwayRef.current = true;
    logout();
    resetRegistration();
    clearTenant();
    // Navigate home first, then open the LoginSheet (it's a root portal —
    // a microtask delay ensures the new page is mounted before the sheet appears)
    navigate(`/${lang}`, { replace: true });
    Promise.resolve().then(() => open().catch(() => {}));
  };

  // ── Subtitle text ─────────────────────────────────────────────
  const subtitleText =
    orgs.length === 1
      ? t.authFlow.matchSubtitleSingle.replace('{{orgName}}', selectedOrg?.name ?? '')
      : orgs.length > 1
        ? t.authFlow.matchSubtitleMultiple
        : '';

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-dvh w-full max-w-md mx-auto flex flex-col bg-surface"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Thin org-color accent bar at very top */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{
          background: `linear-gradient(90deg, ${orgColor} 0%, ${orgColor}55 100%)`,
        }}
      />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-5 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>

        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Check badge */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${orgColor}1a` }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '22px',
                color: orgColor,
                fontVariationSettings: "'FILL' 1",
              }}
            >
              verified
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-primary mb-1">
            {t.authFlow.matchTitle}
          </h1>
          <p className="text-sm text-text-muted leading-snug">{subtitleText}</p>

          {/* User identity badge */}
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
                <span
                  className="material-symbols-outlined text-text-muted"
                  style={{ fontSize: '12px' }}
                >
                  phone
                </span>
              )}
              <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                {t.authFlow.matchConnectedAs.replace('{{identifier}}', userIdentifier)}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Org card (single) ──────────────────────────────── */}
        {orgs.length === 1 && selectedOrg && (
          <motion.div
            className="rounded-2xl p-4 mb-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            style={{
              background: `linear-gradient(135deg, ${orgColor} 0%, ${orgColor}cc 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {selectedOrg.logo ? (
                  <img
                    src={selectedOrg.logo}
                    alt={selectedOrg.name}
                    className="h-7 w-7 object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span
                    className="material-symbols-outlined text-white"
                    style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}
                  >
                    business
                  </span>
                )}
              </div>

              {/* Name + label */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">
                  {selectedOrg.name}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {isHe ? 'חבר ארגון' : 'Organization member'}
                </p>
              </div>

              {/* Verified check */}
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Org dropdown (multiple) ───────────────────────── */}
        {orgs.length > 1 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            <label className="block text-xs text-text-muted mb-1.5 font-medium">
              {isHe ? 'בחר ארגון' : 'Select organization'}
            </label>
            <select
              value={selectedOrgIdx}
              onChange={(e) => setSelectedOrgIdx(Number(e.target.value))}
              className="w-full border border-border rounded-2xl px-4 py-3 text-sm text-text-primary bg-white outline-none focus:border-primary transition-colors"
            >
              {orgs.map((org, i) => (
                <option key={org.id} value={i}>
                  {org.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Spacer pushes buttons to bottom */}
        <div className="flex-1" />

        {/* ── Action buttons ────────────────────────────────── */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          {/* Primary: continue with org */}
          <button
            onClick={handleContinueWithOrg}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ background: orgColor }}
          >
            {t.authFlow.matchContinueWithOrg.replace(
              '{{orgName}}',
              selectedOrg?.name ?? ''
            )}
          </button>

          {/* Secondary: continue without org */}
          <button
            onClick={handleContinueNoOrg}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-border text-text-primary bg-white active:scale-[0.98] transition-all hover:bg-surface"
          >
            {t.authFlow.matchContinueNoOrg}
          </button>

          {/* Tertiary: switch account */}
          <button
            onClick={handleSwitchAccount}
            className="w-full py-2.5 text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            {t.authFlow.matchSwitchAccount}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
