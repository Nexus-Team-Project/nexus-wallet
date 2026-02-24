/**
 * VerifyPhoneSlide — mandatory slide for users who authenticated via Google/Apple
 * and don't yet have a phone number in their account.
 *
 * Security (client-side layer):
 *   - Max 5 verification attempts → locked, forced back to phone step
 *   - Escalating resend: attempt 1 → 60s cooldown; attempt 2+ → WhatsApp option
 *   - OTP expiry hint: "הקוד בתוקף ל-5 דקות" shown below the boxes
 *   - Generic error message ("קוד שגוי, נסה שוב") — no info leakage
 *   - Backend (Firebase) handles: CSPRNG, hashed storage, true single-use, rate limiting
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';

// WebOTP API type — not in standard lib
interface OTPCredential extends Credential { code: string }
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import PhoneInput from '../../../components/ui/PhoneInput';
import {
  getNextOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

type OtpStep = 'phone' | 'otp';

const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS     = 5;
const OTP_VALID_MINS   = 5;

export default function VerifyPhoneSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep]           = useState<OtpStep>('phone');
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // Escalation & attempt tracking
  const [resendCount, setResendCount]   = useState(0);  // times user clicked resend
  const [failCount, setFailCount]       = useState(0);  // wrong-code attempts for current OTP
  const [cooldown, setCooldown]         = useState(0);  // seconds remaining in resend cooldown
  const [locked, setLocked]            = useState(false); // true = max attempts reached

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpRef        = useRef<HTMLInputElement>(null);
  const cooldownRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSendOtp = phone.replace(/\D/g, '').length >= 7;

  // ── Cooldown ticker ─────────────────────────────────────────────────────────
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

  // ── WebOTP API (Android) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'otp') return;
    if (!('OTPCredential' in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ac.signal } as CredentialRequestOptions)
      .then((credential) => {
        if (!credential) return;
        const code = (credential as OTPCredential).code;
        if (/^\d{4}$/.test(code)) { setOtp(code); handleVerify(code); }
      })
      .catch(() => {/* dismissed or unsupported — ignore */});
    return () => ac.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('verify-phone', storeState);

  const goNext = () => {
    const next = getNextOnboardingSlide('verify-phone', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  // ── Reset to phone step ──────────────────────────────────────────────────────
  const resetToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setFailCount(0);
    setLocked(false);
  };

  // ── Send OTP (SMS) ───────────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (!canSendOtp) return;
    setError('');
    setIsLoading(true);
    try {
      // TODO: Replace with real Firebase signInWithPhoneNumber
      await new Promise((r) => setTimeout(r, 800));
      setFailCount(0);
      setLocked(false);
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch {
      setError(t.auth.wrongCode);
    } finally {
      setIsLoading(false);
    }
  }, [canSendOtp, t.auth.wrongCode]);

  // ── Resend (with escalation) ─────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setOtp('');
    setError('');

    const nextCount = resendCount + 1;
    setResendCount(nextCount);

    // First resend → start cooldown; subsequent resends → no extra cooldown
    if (nextCount === 1) setCooldown(COOLDOWN_SECONDS);

    await handleSendOtp();
  };

  // ── Send via WhatsApp ────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    // TODO: trigger WhatsApp OTP flow via backend
    const stripped = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${stripped}`, '_blank');
  };

  // ── OTP input change ─────────────────────────────────────────────────────────
  const handleOtpChange = (value: string) => {
    if (locked) return;
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setOtp(digits);
    setError('');
    if (digits.length === 4) handleVerify(digits);
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    if (code.length < 4 || locked) return;
    setIsLoading(true);
    setError('');
    try {
      // TODO: Replace with real Firebase confirmation
      await new Promise((r) => setTimeout(r, 600));
      if (code === '0000') throw new Error('wrong');
      const normalizedPhone = `050-${phone.slice(-7)}`;
      useRegistrationStore.setState({ phone: normalizedPhone });
      goNext();
    } catch {
      const nextFail = failCount + 1;
      setFailCount(nextFail);
      setOtp('');

      if (nextFail >= MAX_ATTEMPTS) {
        // Lock — too many wrong attempts
        setLocked(true);
        setError(t.auth.otpTooManyAttempts);
      } else {
        setError(t.auth.wrongCode);
        otpRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend / WhatsApp footer ─────────────────────────────────────────────────
  const resendFooter = (
    <div className="flex flex-col items-center gap-2 pt-1">
      {/* Resend SMS — hidden when locked (user must request new code via back button) */}
      {!locked && (
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || isLoading}
          className="w-full text-center text-sm text-primary font-medium py-2 disabled:opacity-50 transition-opacity"
        >
          {cooldown > 0
            ? t.auth.resendCodeWait.replace('{seconds}', String(cooldown))
            : t.auth.resendCode}
        </button>
      )}

      {/* WhatsApp option — only after 2nd resend attempt */}
      {resendCount >= 2 && !locked && (
        <button
          onClick={handleWhatsApp}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full text-sm font-medium py-2 rounded-2xl border border-border text-text-primary active:bg-surface transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.979-1.303A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
              fill="#25D366"
            />
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
              fill="white"
            />
          </svg>
          {t.auth.resendViaWhatsApp}
        </button>
      )}
    </div>
  );

  // ── Phone step ───────────────────────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <OnboardingSlideLayout
        totalSlides={total}
        currentSlideIndex={current}
        canSkip={false}
        canContinue={canSendOtp && !isLoading}
        onContinue={handleSendOtp}
        footerNote={error || undefined}
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
            onKeyDown={(e) => { if (e.key === 'Enter' && canSendOtp) handleSendOtp(); }}
            placeholder={t.auth.phonePlaceholder}
            autoFocus
            inputRef={phoneInputRef}
            isLoading={isLoading}
          />
        </div>
      </OnboardingSlideLayout>
    );
  }

  // ── OTP step ─────────────────────────────────────────────────────────────────
  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={false}
      canContinue={otp.length === 4 && !isLoading && !locked}
      onBack={resetToPhone}
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

        {/* Single OTP input — iOS QuickType + Android WebOTP both work */}
        <div className="relative mb-3" dir="ltr">
          {/* Visual 4-box overlay */}
          <div className="flex gap-3 justify-center pointer-events-none select-none" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 text-xl font-bold transition-all ${
                  locked
                    ? 'border-border text-text-muted opacity-40'
                    : error
                      ? 'border-error text-error'
                      : otp[i]
                        ? 'border-primary text-text-primary'
                        : i === otp.length
                          ? 'border-primary text-text-primary'
                          : 'border-border text-text-muted'
                }`}
              >
                {otp[i] ?? ''}
              </div>
            ))}
          </div>

          {/* Real input — transparent, sits over the visual boxes */}
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            disabled={locked}
            autoFocus
            className="absolute inset-0 w-full h-full opacity-0 cursor-text disabled:cursor-not-allowed"
          />
        </div>

        {/* OTP expiry hint — shown when not locked */}
        {!locked && (
          <p className="text-center text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {t.auth.otpExpiry.replace('{minutes}', String(OTP_VALID_MINS))}
          </p>
        )}

        {isLoading && (
          <div className="flex justify-center py-2">
            <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: '22px' }}>
              progress_activity
            </span>
          </div>
        )}
      </div>
    </OnboardingSlideLayout>
  );
}
