import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useRegistrationStore } from '../stores/registrationStore';
import { useLoginSheetStore } from '../stores/loginSheetStore';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { completeProfile } from '../services/registration.service';

// Local carousel images (served from /public, no external dependency)
const SLIDE_IMAGES = [
  '/signup-slide-1.jpg',
  '/signup-slide-2.jpg',
  '/signup-slide-3.jpg',
];

const AUTO_ROTATE_MS = 4500;

export default function SignupPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authMethod = useAuthStore((s) => s.authMethod);
  const userId = useAuthStore((s) => s.userId);
  const setProfileCompleted = useAuthStore((s) => s.setProfileCompleted);
  const tenantConfig = useTenantStore((s) => s.config);
  const open = useLoginSheetStore((s) => s.open);

  const {
    isRegistering,
    missingFields,
    profileData,
    setProfileData,
    phone: regPhone,
    orgMember,
  } = useRegistrationStore();

  // Are we in "registration form" mode? (authenticated + has registration in progress)
  const showForm = isAuthenticated && isRegistering;

  // ── Carousel state ──
  const [activeIndex, setActiveIndex] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagesLoaded = useRef(false);

  // ── Form state ──
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneInput, setPhoneInput] = useState('');
  const [googleFilled, setGoogleFilled] = useState(false);

  const showField = (field: string) => missingFields.includes(field);

  // ── Mock Google auto-fill (simulates fetching Google profile data) ──
  const handleFillWithGoogle = () => {
    setProfileData({
      firstName: 'ישראל',
      lastName: 'כהן',
      email: 'user@gmail.com',
      birthday: '1990-05-15',
    });
    setGoogleFilled(true);
    setErrors({});
  };

  // Slide data
  const slides = [
    { title: t.auth.signupSlide1Title, subtitle: t.auth.signupSlide1Subtitle },
    { title: t.auth.signupSlide2Title, subtitle: t.auth.signupSlide2Subtitle },
    { title: t.auth.signupSlide3Title, subtitle: t.auth.signupSlide3Subtitle },
  ];

  // ── Preload images ──
  useEffect(() => {
    if (imagesLoaded.current) return;
    imagesLoaded.current = true;
    SLIDE_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // ── Go to specific slide ──
  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
    setTextKey((k) => k + 1);
  }, []);

  // ── Auto-rotate ──
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        setTextKey((k) => k + 1);
        return next;
      });
    }, AUTO_ROTATE_MS);
  }, [slides.length]);

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoRotate]);

  const handleDotClick = useCallback(
    (index: number) => {
      goToSlide(index);
      startAutoRotate();
    },
    [goToSlide, startAutoRotate]
  );

  // ── Phone formatting ──
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  // ── Form validation ──
  const validate = () => {
    const errs: Record<string, string> = {};
    if (showField('firstName') && !profileData.firstName.trim()) {
      errs.firstName = isHe ? 'שדה חובה' : 'Required';
    }
    if (showField('lastName') && !profileData.lastName.trim()) {
      errs.lastName = isHe ? 'שדה חובה' : 'Required';
    }
    if (showField('email')) {
      if (!profileData.email.trim()) {
        errs.email = isHe ? 'שדה חובה' : 'Required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
        errs.email = isHe ? 'אימייל לא תקין' : 'Invalid email';
      }
    }
    if (showField('birthday') && !profileData.birthday) {
      errs.birthday = isHe ? 'שדה חובה' : 'Required';
    }
    if (showField('phone')) {
      const digits = phoneInput.replace(/\D/g, '');
      if (digits.length < 9) {
        errs.phone = isHe ? 'מספר טלפון לא תקין' : 'Invalid phone number';
      }
    }
    return errs;
  };

  // ── Form submit ──
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      await completeProfile(userId ?? '', profileData);
      setProfileCompleted(true);

      const skipQuestionnaire = tenantConfig?.flowOverrides?.skipQuestionnaire;
      if (skipQuestionnaire) {
        useRegistrationStore.getState().completeRegistration();
        navigate(`/${lang}`, { replace: true });
      } else {
        navigate(`/${lang}/register/preferences`, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auth handlers (pre-auth state) ──
  const handleCreateAccount = async () => {
    try {
      await open();
      // After auth completes, component re-renders with showForm=true
    } catch {
      // User dismissed the sheet
    }
  };

  const handleLogin = async () => {
    try {
      await open();
    } catch {
      // User dismissed
    }
  };

  const handleClose = () => {
    navigate(`/${lang}`, { replace: true });
  };

  // Carousel is shorter when showing form
  const carouselHeight = showForm ? '35vh' : '52vh';

  return (
    <div className="relative flex min-h-dvh w-full max-w-md mx-auto flex-col bg-white overflow-x-hidden">
      {/* ══════ CAROUSEL HERO ══════ */}
      <div
        className="relative w-full overflow-hidden transition-all duration-500"
        style={{ height: carouselHeight }}
      >
        {/* Background image layers (crossfade) */}
        {SLIDE_IMAGES.map((src, idx) => (
          <div
            key={idx}
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url("${src}")`,
              opacity: idx === activeIndex ? 1 : 0,
              transition: 'opacity 600ms ease-in-out',
              zIndex: idx === activeIndex ? 1 : 0,
            }}
          />
        ))}

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 75%, rgba(255,255,255,0.3) 95%, rgba(255,255,255,1) 100%)',
          }}
        />

        {/* Slide text */}
        <div className="absolute bottom-14 left-0 right-0 z-[3] px-7" key={textKey}>
          <h2 className="text-white font-extrabold text-[26px] leading-[1.15] tracking-tight drop-shadow-lg opacity-0 animate-slide-fade-in">
            {slides[activeIndex].title}
          </h2>
          <p className="text-white/85 text-[14px] font-medium leading-relaxed mt-2 drop-shadow-md max-w-[85%] opacity-0 animate-slide-fade-in-delay">
            {slides[activeIndex].subtitle}
          </p>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-0 right-0 z-[3] flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className="p-1"
              aria-label={`Slide ${idx + 1}`}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === activeIndex ? 24 : 8,
                  height: 8,
                  backgroundColor:
                    idx === activeIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Close button */}
        <div className={`absolute top-6 z-[4] ${isHe ? 'right-6' : 'left-6'}`}>
          <button
            onClick={handleClose}
            className="bg-white/80 backdrop-blur-md rounded-full p-2 text-text-primary shadow-sm flex items-center justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* ══════ CONTENT SECTION ══════ */}
      <div className="flex-1 flex flex-col px-6 pt-5 relative z-10">

        {/* ═══════════════════════════════════════════ */}
        {/* MODE A: Not authenticated — show auth buttons */}
        {/* ═══════════════════════════════════════════ */}
        {!showForm && (
          <>
            {/* Hero Text */}
            <div className="space-y-2 mb-8">
              <h1 className="text-text-primary font-extrabold text-[28px] leading-[1.1] tracking-tight">
                {t.auth.signupHeroTitle}
              </h1>
              <p className="text-text-muted text-[14px] font-medium leading-relaxed max-w-[90%]">
                {t.auth.signupHeroSubtitle}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full mb-8">
              <button
                onClick={handleCreateAccount}
                className="flex items-center justify-center bg-primary text-white h-14 w-full rounded-full font-bold text-base hover:bg-primary-dark active:scale-[0.98] transition-all"
              >
                {t.auth.signupCreateAccount}
              </button>
              <button
                onClick={handleLogin}
                className="flex items-center justify-center bg-surface text-text-primary h-14 w-full rounded-full font-bold text-base hover:bg-border/50 active:scale-[0.98] transition-all"
              >
                {t.auth.signupLogin}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-auto pb-6">
              <div className="flex items-center justify-center mb-5">
                <div className="h-px bg-border flex-1" />
                <span className="px-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  {t.auth.or}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>
              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-3 w-full py-2 group"
              >
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    storefront
                  </span>
                </div>
                <span className="text-text-primary font-bold text-sm border-b-2 border-primary/30 group-hover:border-primary transition-colors">
                  {t.auth.signupBrowseGuest}
                </span>
              </button>
            </div>

            <div className="px-4 pb-6 text-center">
              <p className="text-[11px] text-text-muted leading-tight">
                {t.auth.termsNotice}
              </p>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MODE B: Authenticated — show registration form */}
        {/* ═══════════════════════════════════════════ */}
        {showForm && (
          <div className="animate-fade-in">
            {/* Title / Greeting */}
            {orgMember ? (
              /* ── Org member greeting ── */
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <h1 className="text-xl font-bold text-text-primary mb-2">
                  {t.registration.orgMemberGreeting
                    .replace('{name}', orgMember.firstName || profileData.firstName || '')
                    .replace('{org}', orgMember.organizationName || '')}
                </h1>
              </div>
            ) : authMethod === 'google' ? (
              <div className="text-center mb-5">
                <h1 className="text-xl font-bold text-text-primary mb-2">
                  {t.registration.googleGreeting.replace('{name}', profileData.firstName || '')}
                </h1>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-text-primary mb-1">
                    {t.registration.profileTitle}
                  </h1>
                  <p className="text-sm text-text-muted">
                    {t.registration.profileSubtitle}
                  </p>
                </div>

                {/* Verified phone badge */}
                <div className="mb-4 px-4 py-3 bg-success/5 rounded-2xl border border-success/20 flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-success"
                    style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-sm font-medium text-success">
                    {t.registration.phoneConnected}
                    {regPhone && (
                      <span className="font-bold ms-1" dir="ltr">{regPhone}</span>
                    )}
                  </span>
                </div>
              </>
            )}

            {/* "Fill with Google" button — shown for phone auth (has multiple fields to fill) */}
            {authMethod === 'phone' && !googleFilled && (
              <button
                onClick={handleFillWithGoogle}
                className="w-full flex items-center justify-center gap-2.5 py-3 mb-4 rounded-2xl bg-white border-2 border-primary/30 text-sm font-semibold text-text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.registration.fillWithGoogle}
              </button>
            )}

            {/* Google filled badge */}
            {authMethod === 'phone' && googleFilled && (
              <div className="mb-4 px-4 py-3 bg-[#4285F4]/5 rounded-2xl border border-[#4285F4]/20 flex items-center gap-3 animate-fade-in">
                <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-medium text-[#4285F4]">
                  {t.registration.filledWithGoogle}
                </span>
              </div>
            )}

            {/* Dynamic form fields */}
            <div className="space-y-4">
              {/* First name */}
              {showField('firstName') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t.registration.firstNameLabel}
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => {
                      setProfileData({ firstName: e.target.value });
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors ${
                      errors.firstName ? 'border-error' : 'border-border focus:border-primary'
                    }`}
                    placeholder={t.registration.firstNameLabel}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-error mt-1">{errors.firstName}</p>
                  )}
                </div>
              )}

              {/* Last name */}
              {showField('lastName') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t.registration.lastNameLabel}
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => {
                      setProfileData({ lastName: e.target.value });
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors ${
                      errors.lastName ? 'border-error' : 'border-border focus:border-primary'
                    }`}
                    placeholder={t.registration.lastNameLabel}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-error mt-1">{errors.lastName}</p>
                  )}
                </div>
              )}

              {/* Email */}
              {showField('email') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t.registration.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData({ email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors ${
                      errors.email ? 'border-error' : 'border-border focus:border-primary'
                    }`}
                    placeholder={t.registration.emailLabel}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-xs text-error mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Birthday */}
              {showField('birthday') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t.registration.birthdayLabel}
                  </label>
                  <input
                    type="date"
                    value={profileData.birthday}
                    onChange={(e) => {
                      setProfileData({ birthday: e.target.value });
                      if (errors.birthday) setErrors((prev) => ({ ...prev, birthday: '' }));
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors ${
                      errors.birthday ? 'border-error' : 'border-border focus:border-primary'
                    }`}
                  />
                  {errors.birthday && (
                    <p className="text-xs text-error mt-1">{errors.birthday}</p>
                  )}
                </div>
              )}

              {/* Phone input */}
              {showField('phone') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t.registration.addPhoneNumber}
                  </label>
                  <div className={`flex items-center gap-2 border-2 rounded-2xl px-3 py-2.5 transition-colors focus-within:border-primary bg-white ${
                    errors.phone ? 'border-error' : 'border-border'
                  }`}>
                    <span className="text-base flex-shrink-0">🇮🇱</span>
                    <span className="text-xs text-text-secondary font-medium flex-shrink-0">
                      +972
                    </span>
                    <div className="w-px h-4 bg-border flex-shrink-0" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(formatPhone(e.target.value));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder={t.auth.phonePlaceholder}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0"
                      dir="ltr"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-error mt-1">{errors.phone}</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-6 pb-8">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="material-symbols-outlined animate-spin"
                      style={{ fontSize: '18px' }}
                    >
                      progress_activity
                    </span>
                    {t.common.loading}
                  </span>
                ) : (
                  t.registration.continueButton
                )}
              </button>

              <a
                href="https://www.nexuswallet.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-px mt-6 mb-2"
              >
                <img src={`/nexus-logo-animated-black.gif?t=${Date.now()}`} alt="Nexus" className="h-6" />
                <span className="text-[9px] text-black">Powered by</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
