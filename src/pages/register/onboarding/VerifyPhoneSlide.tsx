/**
 * VerifyPhoneSlide — the FIRST onboarding question for users who signed up with
 * Google and have no phone yet. Two steps in one slide:
 *   1. phone   — add an Israeli number (matches the "הוסף מספר טלפון" design).
 *   2. otp     — enter the InforU SMS code (real flow only).
 *
 * The number is attached to the NexusIdentity server-side (and mirrored onto the
 * user's tenant rows). The slide CAN be skipped via the secondary "skip for now"
 * action, which advances without attaching a number — the user can add + verify a
 * phone later from Profile -> Edit profile. Verifying requires a real InforU code.
 *
 * Israel-only: a non-Israeli country selection is blocked here and by the
 * backend; InforU is an Israeli SMS provider.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import PhoneInput, { type Country } from '../../../components/ui/PhoneInput';
import {
  getNextOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';
import {
  startPhoneOtp,
  verifyPhoneOtp,
} from '../../../services/walletPhone.service';
import { useCountdown, formatMmSs } from '../../../hooks/useCountdown';
import { useWebOtpAutofill } from '../../../hooks/useWebOtpAutofill';

type OtpStep = 'phone' | 'otp';
const MAX_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 600; // 10 minutes - mirrors the backend code expiry.
const COOLDOWN_SECONDS = 60;

export default function VerifyPhoneSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Live code-validity countdown (mirrors the 10-min backend expiry).
  const { remaining: otpRemaining, reset: resetOtpExpiry } = useCountdown(OTP_TTL_SECONDS);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIsrael = country?.code === 'IL';
  // Israeli mobile: exactly 10 digits starting with 05. The "המשך" button stays
  // disabled until this holds.
  const phoneDigits = phone.replace(/\D/g, '');
  const isValidIsraeliPhone = phoneDigits.length === 10 && phoneDigits.startsWith('05');
  const canSend = isIsrael && isValidIsraeliPhone;

  // Map a backend error code to a localized message.
  const mapError = useCallback(
    (e: unknown): string => {
      const code = e instanceof Error ? e.message : '';
      if (code === 'phone_in_use') return t.registration.verifyPhoneInUse;
      if (code === 'phone_not_israeli') return t.registration.verifyPhoneIsraelOnly;
      if (code === 'sms_unavailable') return t.registration.verifyPhoneSmsUnavailable;
      if (code === 'otp_invalid') return t.auth.wrongCode;
      if (code === 'otp_locked') return t.auth.otpTooManyAttempts;
      return t.auth.wrongCode;
    },
    [t],
  );

  // ── Cooldown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current!);
  }, [cooldown]);

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('verify-phone', storeState);

  const goNext = () => {
    useRegistrationStore.setState({ phone });
    const next = getNextOnboardingSlide('verify-phone', storeState);
    navigate(
      next ? `/${lang}/register/onboarding/${next}` : `/${lang}/register/complete`,
      { replace: true },
    );
  };

  // Skip the phone question entirely (Google first-time signups): advance to the
  // next slide WITHOUT attaching a number. Nothing is saved server-side, so the
  // user can add + verify a phone later from Profile -> Edit profile.
  const handleSkip = () => {
    const next = getNextOnboardingSlide('verify-phone', storeState);
    navigate(
      next ? `/${lang}/register/onboarding/${next}` : `/${lang}/register/complete`,
      { replace: true },
    );
  };

  // ── Real flow: send InforU OTP ─────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (!canSend || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const { challengeId: id } = await startPhoneOtp(phone);
      setChallengeId(id);
      setFailCount(0);
      setLocked(false);
      setOtp('');
      setStep('otp');
      setCooldown(COOLDOWN_SECONDS);
      resetOtpExpiry();
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (e) {
      setError(mapError(e));
    } finally {
      setIsLoading(false);
    }
  }, [canSend, isLoading, phone, mapError, resetOtpExpiry]);

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    if (code.length < 6 || locked || isLoading || otpRemaining === 0) return;
    setIsLoading(true);
    setError('');
    try {
      await verifyPhoneOtp(challengeId, code);
      goNext();
    } catch (e) {
      const nextFail = failCount + 1;
      setFailCount(nextFail);
      setOtp('');
      if (nextFail >= MAX_ATTEMPTS || (e instanceof Error && e.message === 'otp_locked')) {
        setLocked(true);
        setError(t.auth.otpTooManyAttempts);
      } else {
        setError(mapError(e));
        otpRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    if (locked) return;
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    setError('');
    if (digits.length === 6) handleVerify(digits);
  };

  // Android Chrome: auto-read the SMS code while the OTP step is active.
  // No-op elsewhere (iOS uses the autocomplete="one-time-code" attr below).
  // Re-arms on each new challenge (resend) via the challengeId key.
  useWebOtpAutofill({
    enabled: step === 'otp' && !locked && otpRemaining > 0,
    onCode: handleOtpChange,
    rearmKey: challengeId,
  });

  // ── Phone step ─────────────────────────────────────────────────────────────
  if (step === 'phone') {
    const formatHint =
      isIsrael && phoneDigits.length > 0 && !isValidIsraeliPhone
        ? t.registration.verifyPhoneFormat
        : undefined;
    const note = !isIsrael && country
      ? t.registration.verifyPhoneIsraelOnly
      : error || formatHint || undefined;
    return (
      <OnboardingSlideLayout
        totalSlides={total}
        currentSlideIndex={current}
        canSkip={false}
        canContinue={canSend && !isLoading}
        onContinue={handleSendOtp}
        footerNote={note}
        secondaryCta={{ label: t.registration.verifyPhoneSkip, onClick: handleSkip }}
        footerExtra={
          <p className="text-center text-xs text-text-muted px-2">
            {t.registration.verifyPhoneSkipNote}
          </p>
        }
      >
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
            {t.registration.verifyPhoneTitle}
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {t.registration.verifyPhoneSubtitle}
          </p>

          <PhoneInput
            value={phone}
            onChange={(v) => { setPhone(v); setError(''); }}
            onCountryChange={setCountry}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSend) handleSendOtp(); }}
            placeholder="050-000-0000"
            autoFocus
            inputRef={phoneInputRef}
            error={!!error}
            isLoading={isLoading}
          />
        </div>
      </OnboardingSlideLayout>
    );
  }

  // ── OTP step ───────────────────────────────────────────────────────────────
  const resendFooter = (
    <div className="flex flex-col items-center gap-2 pt-1">
      {!locked && (
        <button
          onClick={() => { if (cooldown === 0 && !isLoading) void handleSendOtp(); }}
          disabled={cooldown > 0 || isLoading}
          className="w-full text-center text-sm text-primary font-medium py-2 disabled:opacity-50 transition-opacity"
        >
          {cooldown > 0
            ? t.auth.resendCodeWait.replace('{seconds}', String(cooldown))
            : t.auth.resendCode}
        </button>
      )}
    </div>
  );

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={false}
      canContinue={otp.length === 6 && !isLoading && !locked && otpRemaining > 0}
      onBack={() => { setStep('phone'); setOtp(''); setError(''); setFailCount(0); setLocked(false); }}
      onContinue={() => handleVerify(otp)}
      footerNote={error || undefined}
      footerExtra={resendFooter}
    >
      <div className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
          {t.auth.otpTitle}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-primary)' }}>
          {t.auth.otpSubtitle}
          <span className="font-semibold text-text-secondary ms-1" dir="ltr">{phone}</span>
        </p>

        <div className="relative mb-3" dir="ltr">
          <div className="flex gap-2 justify-center pointer-events-none select-none" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-11 h-12 flex items-center justify-center rounded-2xl border-2 text-lg font-bold transition-all ${
                  locked
                    ? 'border-border text-text-muted opacity-40'
                    : error
                      ? 'border-error text-error'
                      : otp[i] || i === otp.length
                        ? 'border-primary text-text-primary'
                        : 'border-border text-text-muted'
                }`}
              >
                {otp[i] ?? ''}
              </div>
            ))}
          </div>
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            disabled={locked || otpRemaining === 0}
            autoFocus
            className="absolute inset-0 w-full h-full opacity-0 cursor-text disabled:cursor-not-allowed"
          />
        </div>

        {!locked && (
          <p
            className="text-center text-xs mb-4"
            style={{ color: otpRemaining === 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}
          >
            {otpRemaining > 0
              ? t.auth.otpExpiresIn.replace('{time}', formatMmSs(otpRemaining))
              : t.auth.otpExpired}
          </p>
        )}
      </div>
    </OnboardingSlideLayout>
  );
}
