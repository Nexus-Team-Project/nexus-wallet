import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import {
  firebaseSendOtp,
  firebaseVerifyOtp,
  firebaseGoogleSignIn,
  firebaseAppleSignIn,
  firebaseSaveConsent,
} from '../../services/auth.service';
import { lookupTenantByOrg } from '../../mock/handlers/tenant.handler';

export default function LoginSheet() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const { isOpen, step, close, setStep, completeLogin } =
    useLoginSheetStore();
  const login = useAuthStore((s) => s.login);
  const setMarketingConsent = useAuthStore((s) => s.setMarketingConsent);
  const tenantConfig = useTenantStore((s) => s.config);
  const setTenant = useTenantStore((s) => s.setTenant);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);

  // ── Local state ──
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState('');
  const [, setIsClosing] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [successOrgName, setSuccessOrgName] = useState('');
  const [phoneExpanded, setPhoneExpanded] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/nexus-logo.png');

  // ── Refs for drag-to-dismiss ──
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  // OTP input refs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // ── Reset when closed ──
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setOtp(['', '', '', '']);
      setError('');
      setIsLoading(false);
      setIsClosing(false);
      setMarketingOptIn(true);
      setSuccessOrgName('');
      setPhoneExpanded(false);
    }
  }, [isOpen]);

  // ── Play animated logo GIF every time the sheet opens ──
  useEffect(() => {
    if (isOpen) {
      setLogoSrc(`/nexus-logo-animated-black.gif?t=${Date.now()}`);
    }
  }, [isOpen]);

  // ── Auto-focus phone when expanded ──
  useEffect(() => {
    if (phoneExpanded) {
      setTimeout(() => phoneInputRef.current?.focus(), 200);
    }
  }, [phoneExpanded]);

  // ── Auto-focus OTP ──
  useEffect(() => {
    if (isOpen && step === 'otp') {
      setTimeout(() => otpRefs[0].current?.focus(), 300);
    }
  }, [isOpen, step]);

  // ── Dismiss animation ──
  const dismiss = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(close, 300);
  }, [close]);

  // ── Drag-to-dismiss (native events, passive:false) ──
  useEffect(() => {
    if (!isOpen) return;
    const headerEl = document.getElementById('login-sheet-header');
    if (!headerEl) return;

    const onTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      currentTranslateY.current = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        e.preventDefault();
        currentTranslateY.current = deltaY;
        if (sheetRef.current)
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        if (overlayRef.current)
          overlayRef.current.style.opacity = String(
            Math.max(0, 1 - deltaY / 400)
          );
      }
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (currentTranslateY.current > 80) {
        dismiss();
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.3s ease-out';
          sheetRef.current.style.transform = 'translateY(0)';
        }
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 0.3s ease-out';
          overlayRef.current.style.opacity = '1';
        }
      }
      currentTranslateY.current = 0;
    };

    headerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    headerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    headerEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      headerEl.removeEventListener('touchstart', onTouchStart);
      headerEl.removeEventListener('touchmove', onTouchMove);
      headerEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, dismiss]);

  // ── Phone helpers ──
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return;
    setIsLoading(true);
    setError('');
    try {
      await firebaseSendOtp(phone);
      setStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP helpers ──
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      const newOtp = [...otp];
      digits.split('').forEach((d, i) => {
        if (i + index < 4) newOtp[i + index] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 3);
      otpRefs[nextIdx].current?.focus();
      setError('');
      if (newOtp.every((d) => d !== '')) verifyOtp(newOtp.join(''));
      return;
    }
    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 3) otpRefs[index + 1].current?.focus();
    if (digit && newOtp.every((d) => d !== '')) verifyOtp(newOtp.join(''));
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // ── Post-OTP branching logic ──
  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await firebaseVerifyOtp(phone, code);
      if (!result.success || !result.session) {
        setError(t.auth.wrongCode);
        setOtp(['', '', '', '']);
        otpRefs[0].current?.focus();
        return;
      }

      const { session, registrationContext } = result;
      const orgMember = registrationContext?.orgMember;
      const profileComplete = registrationContext?.profileComplete ?? false;
      const missingFields = registrationContext?.missingFields ?? [];

      // Always authenticate the user first
      login({
        token: session.token,
        userId: session.userId,
        method: 'phone',
        isOrgMember: session.isOrgMember,
        organizationName: orgMember?.organizationName,
      });
      await firebaseSaveConsent(session.userId, marketingOptIn);
      setMarketingConsent(marketingOptIn);

      // Load tenant config for org members (so TopBar can show the logo)
      if (orgMember?.organizationId) {
        const orgTenant = lookupTenantByOrg(orgMember.organizationId);
        if (orgTenant) {
          setTenant(orgTenant.id, orgTenant);
        }
      }

      // Show routing overlay — auth is done, deciding which flow to open
      setIsRouting(true);

      // PATH A: Org member with complete profile → success animation
      if (orgMember && profileComplete) {
        setSuccessOrgName(orgMember.organizationName);
        setStep('success');
        setTimeout(() => completeLogin(), 1500);
        return;
      }

      // PATH B: Org member with missing fields → Nexus stories → match screen
      if (orgMember && !profileComplete) {
        startRegistration({
          path: 'org-member-incomplete',
          phone,
          orgMember: {
            organizationId: orgMember.organizationId,
            organizationName: orgMember.organizationName,
            firstName: orgMember.firstName,
            lastName: orgMember.lastName,
          },
          missingFields,
        });
        close();
        navigate(`/${lang}/auth-flow/new-user`);
        return;
      }

      // Returning user (already completed profile before) → go to requested page
      if (useAuthStore.getState().profileCompleted) {
        completeLogin();
        return;
      }

      // Phone auth — need full profile (name, email, birthday)
      const phoneMissing = ['firstName', 'lastName', 'email', 'birthday'];

      // PATH D/E: Tenant (with or without fee) → Nexus stories → match-screen → onboarding/membership
      if (tenantConfig) {
        startRegistration({
          path: tenantConfig.requiresMembershipFee ? 'tenant-with-fee' : 'tenant-no-fee',
          phone,
          missingFields: phoneMissing,
        });
        close();
        navigate(`/${lang}/auth-flow/new-user`);
        return;
      }

      // PATH C: New user (no tenant, no org) → Nexus stories → onboarding
      startRegistration({
        path: 'new-user',
        phone,
        missingFields: phoneMissing,
      });
      close();
      navigate(`/${lang}/auth-flow/new-user`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google ──
  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await firebaseGoogleSignIn();
      if (result.success && result.session) {
        const orgMember = result.orgMember;

        login({
          token: result.session.token,
          userId: result.session.userId,
          method: 'google',
          isOrgMember: result.session.isOrgMember,
          avatarUrl: result.profile?.picture,
          firstName: result.profile?.firstName,
          organizationName: orgMember?.organizationName,
        });
        await firebaseSaveConsent(result.session.userId, marketingOptIn);
        setMarketingConsent(marketingOptIn);

        // Load tenant config for org members
        if (orgMember?.organizationId) {
          const orgTenant = lookupTenantByOrg(orgMember.organizationId);
          if (orgTenant) {
            setTenant(orgTenant.id, orgTenant);
          }
        }

        // Show routing overlay — auth is done, deciding which flow to open
        setIsRouting(true);

        // Returning user (already completed profile before) → go to requested page
        if (useAuthStore.getState().profileCompleted) {
          completeLogin();
          return;
        }

        // ── Org member via Google: Nexus stories → match screen ──
        if (orgMember) {
          // Google gives email + name, org gives org info → only phone missing
          const missingFields: string[] = ['phone'];
          if (!orgMember.firstName && !result.profile?.firstName) missingFields.push('firstName');
          if (!orgMember.lastName && !result.profile?.lastName) missingFields.push('lastName');

          startRegistration({
            path: 'org-member-incomplete',
            phone: '',
            orgMember: {
              organizationId: orgMember.organizationId,
              organizationName: orgMember.organizationName,
              firstName: orgMember.firstName || result.profile?.firstName,
              lastName: orgMember.lastName || result.profile?.lastName,
            },
            missingFields,
          });
          // Pre-fill email from Google profile
          if (result.profile) {
            useRegistrationStore.getState().setProfileData({
              firstName: orgMember.firstName || result.profile.firstName,
              lastName: orgMember.lastName || result.profile.lastName,
              email: result.profile.email,
            });
          }
          close();
          navigate(`/${lang}/auth-flow/new-user`);
          return;
        }

        // ── Regular Google sign-in (not org member) ──
        const profile = result.profile;
        const regPath = tenantConfig?.requiresMembershipFee
          ? 'tenant-with-fee'
          : tenantConfig
            ? 'tenant-no-fee'
            : 'new-user';

        startRegistration({
          path: regPath,
          phone: '',
          missingFields: ['phone'],
        });
        // Pre-fill AFTER startRegistration (which resets profileData)
        if (profile) {
          useRegistrationStore.getState().setProfileData({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
          });
        }
        close();
        navigate(`/${lang}/auth-flow/new-user`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Apple ──
  const handleApple = async () => {
    setIsLoading(true);
    try {
      const result = await firebaseAppleSignIn();
      if (result.notAvailable) {
        setError(isHe ? 'התחברות עם Apple תהיה זמינה בקרוב' : 'Apple sign-in coming soon');
        return;
      }
      if (result.success && result.session) {
        login({
          token: result.session.token,
          userId: result.session.userId,
          method: 'apple',
          isOrgMember: result.session.isOrgMember,
          avatarUrl: result.profile?.picture,
          firstName: result.profile?.firstName,
        });
        await firebaseSaveConsent(result.session.userId, marketingOptIn);
        setMarketingConsent(marketingOptIn);

        // Show routing overlay — auth is done, deciding which flow to open
        setIsRouting(true);

        // Returning user (already completed profile before) → go to requested page
        if (useAuthStore.getState().profileCompleted) {
          completeLogin();
          return;
        }

        // Apple gives name + email → only phone is missing
        const profile = result.profile;
        const regPath = tenantConfig?.requiresMembershipFee
          ? 'tenant-with-fee'
          : tenantConfig
            ? 'tenant-no-fee'
            : 'new-user';

        startRegistration({
          path: regPath,
          phone: '',
          missingFields: ['phone'],
        });
        if (profile) {
          useRegistrationStore.getState().setProfileData({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
          });
        }
        close();
        navigate(`/${lang}/auth-flow/new-user`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset routing overlay every time the sheet opens fresh —
  // isRouting persists between opens (component stays mounted), so without
  // this reset the overlay would block the sheet on every subsequent open.
  useEffect(() => {
    if (isOpen) setIsRouting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const phoneDigits = phone.replace(/\D/g, '');
  const canSend = phoneDigits.length >= 9;

  // Tenant welcome message
  const welcomeTitle = tenantConfig?.flowOverrides?.customWelcomeMessage && !isHe
    ? tenantConfig.flowOverrides.customWelcomeMessage
    : tenantConfig?.flowOverrides?.customWelcomeMessageHe && isHe
      ? tenantConfig.flowOverrides.customWelcomeMessageHe
      : t.auth.loginSheetTitle;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/40 animate-fade-in"
        onClick={step === 'success' ? undefined : dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[50vh] flex flex-col animate-slide-up"
      >
        {/* ── Routing overlay — shown after auth succeeds, while flow is being decided ── */}
        {isRouting && step !== 'success' && (
          <div className="absolute inset-0 z-20 bg-white/90 rounded-t-3xl flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary animate-spin"
              style={{ fontSize: '36px', fontVariationSettings: "'wght' 300" }}
            >
              progress_activity
            </span>
          </div>
        )}

        {/* ── DRAG HEADER ── */}
        <div
          id="login-sheet-header"
          className="flex-shrink-0 select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {/* ========== WELCOME STEP (with inline phone) ========== */}
          {step === 'welcome' && (
            <div className="pt-2 animate-fade-in">
              {/* Tenant logo */}
              {tenantConfig && (
                <div className="flex justify-center mb-2">
                  <img
                    src={tenantConfig.logo}
                    alt={isHe ? tenantConfig.nameHe : tenantConfig.name}
                    className="h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <h2 className="text-base font-bold text-text-primary text-center mb-0.5">
                {welcomeTitle}
              </h2>
              <p className="text-[11px] text-text-muted text-center mb-4">
                {t.auth.loginSheetSubtitle}
              </p>

              {/* Row 1: Google + Apple */}
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <button
                  onClick={handleGoogle}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-border text-sm font-semibold text-text-primary hover:bg-surface active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={handleApple}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-border text-sm font-semibold text-text-primary hover:bg-surface active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted">{t.auth.or}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Row 2: WhatsApp + SMS / inline phone expand */}
              {!phoneExpanded ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => { setPhoneExpanded(true); }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-border text-sm font-semibold text-text-primary hover:bg-surface active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => { setPhoneExpanded(true); }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-border text-sm font-semibold text-text-primary hover:bg-surface active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontSize: '18px' }}
                    >
                      sms
                    </span>
                    SMS
                  </button>
                </div>
              ) : (
                /* ── Inline phone input (expanded) ── */
                <div className="mb-2.5 animate-fade-in">
                  <div className="flex items-center gap-2 border-2 border-primary rounded-2xl px-3 py-2.5 transition-colors mb-2.5">
                    <span className="text-base flex-shrink-0">🇮🇱</span>
                    <span className="text-xs text-text-secondary font-medium flex-shrink-0">
                      +972
                    </span>
                    <div className="w-px h-4 bg-border flex-shrink-0" />
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder={t.auth.phonePlaceholder}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSend) handleSendOtp();
                      }}
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={!canSend || isLoading}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
                    >
                      {isLoading ? (
                        <span
                          className="material-symbols-outlined text-white animate-spin"
                          style={{ fontSize: '18px' }}
                        >
                          progress_activity
                        </span>
                      ) : (
                        <span
                          className="material-symbols-outlined text-white"
                          style={{ fontSize: '18px' }}
                        >
                          arrow_forward
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Marketing opt-in checkbox */}
              <label className="flex items-center gap-2 mt-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border text-primary accent-primary flex-shrink-0"
                />
                <span className="text-[10px] text-text-muted leading-snug">
                  {t.auth.consentSubtitle}
                </span>
              </label>

              {/* Terms */}
              <p className="text-[9px] text-text-muted/60 text-center mt-3 leading-relaxed">
                {t.auth.termsNotice}
              </p>
              {/* Powered by Nexus */}
              <a
                href="https://www.nexuswallet.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-px mt-8 mb-3"
              >
                <img src={logoSrc} alt="Nexus" className="h-6" />
                <span className="text-[9px] text-black">Powered by</span>
              </a>
            </div>
          )}

          {/* ========== OTP STEP ========== */}
          {step === 'otp' && (
            <div className="pt-2 animate-fade-in">
              {/* Back */}
              <button
                onClick={() => {
                  setStep('welcome');
                  setOtp(['', '', '', '']);
                  setError('');
                }}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center mb-4"
              >
                <span
                  className="material-symbols-outlined text-text-primary"
                  style={{ fontSize: '18px' }}
                >
                  arrow_back
                </span>
              </button>

              <h2 className="text-lg font-bold text-text-primary mb-1">
                {t.auth.otpTitle}
              </h2>
              <p className="text-xs text-text-muted mb-6">
                {t.auth.otpSubtitle}
                <span className="font-medium text-text-secondary" dir="ltr">
                  {' '}
                  {phone}
                </span>
              </p>

              {/* OTP inputs */}
              <div className="flex gap-3 justify-center mb-4" dir="ltr">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={idx === 0 ? 4 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-14 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all ${
                      error
                        ? 'border-error text-error'
                        : digit
                          ? 'border-primary text-text-primary'
                          : 'border-border text-text-primary focus:border-primary'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-error text-center mb-3 animate-fade-in">
                  {error}
                </p>
              )}

              {isLoading && (
                <div className="flex justify-center py-3">
                  <span
                    className="material-symbols-outlined text-primary animate-spin"
                    style={{ fontSize: '24px' }}
                  >
                    progress_activity
                  </span>
                </div>
              )}

              <button
                onClick={async () => {
                  setOtp(['', '', '', '']);
                  setError('');
                  await firebaseSendOtp(phone);
                  otpRefs[0].current?.focus();
                }}
                disabled={isLoading}
                className="w-full text-center text-sm text-primary font-medium py-2 hover:underline disabled:opacity-50"
              >
                {t.auth.resendCode}
              </button>

            </div>
          )}

          {/* ========== SUCCESS STEP ========== */}
          {step === 'success' && (
            <div className="pt-6 pb-4 animate-scale-in text-center">
              <span
                className="material-symbols-outlined text-success mb-3 inline-block"
                style={{
                  fontSize: '56px',
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                check_circle
              </span>
              <h2 className="text-lg font-bold text-text-primary mb-1">
                {t.auth.connectionSuccess}
              </h2>
              <p className="text-sm text-text-muted">{successOrgName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invisible reCAPTCHA for phone auth */}
      <div id="recaptcha-container" />
    </>
  );
}
