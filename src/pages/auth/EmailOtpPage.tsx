/**
 * 6-digit email verification. On success the backend mints a wallet
 * session; we hydrate AuthContext via onLoginSucceeded and run the
 * central post-login routing in lib/postLogin.ts.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 8
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { walletVerifyEmailOtp, walletStartEmailOtp } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { nextPathAfterLogin } from '../../lib/postLogin';
import { useCountdown, formatMmSs } from '../../hooks/useCountdown';

export default function EmailOtpPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang = 'he' } = useParams();
  const { onLoginSucceeded } = useAuth();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Resend throttle. The first code was just sent from EmailRequiredPage, so we
  // start in cooldown; 30s mirrors the backend's 1-per-30s email-OTP send limit.
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  // Live code-validity countdown (mirrors the 10-min backend expiry).
  const { remaining: otpRemaining, reset: resetOtpExpiry } = useCountdown(600);

  const email = params.get('email') ?? '';

  // Cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /** Request a fresh code for the same email, then restart the cooldown. */
  async function onResend(): Promise<void> {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErr('');
    try {
      await walletStartEmailOtp(email.toLowerCase());
      setCode('');
      setCooldown(30);
      resetOtpExpiry();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'unknown');
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!/^\d{6}$/.test(code) || otpRemaining === 0) return;
    setBusy(true);
    setErr('');
    try {
      const r = await walletVerifyEmailOtp(code);
      const me = await onLoginSucceeded(r.accessToken);
      // ?tenant=X drives org-aware routing; ?ecosystem=1 (or absent) = no tenant.
      const urlTenantId = params.get('ecosystem') === '1' ? null : params.get('tenant');
      if (me) {
        navigate(nextPathAfterLogin({ lang, urlTenantId, me }));
      } else {
        // /api/me hydration hiccupped — fall back to the ecosystem catalog.
        navigate(`/${lang}/store?ecosystem=1`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white flex items-start justify-center pt-12">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {isHe ? 'הזן את הקוד מהאימייל' : 'Enter the code from your email'}
        </h1>
        <p className="text-sm text-text-muted mb-6" dir={isHe ? 'rtl' : 'ltr'}>
          {isHe ? `שלחנו קוד בן 6 ספרות ל-${email}.` : `We sent a 6-digit code to ${email}.`}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e): void => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            required
            autoFocus
            dir="ltr"
            disabled={otpRemaining === 0}
            className="w-full border-2 border-border focus:border-primary outline-none rounded-2xl px-4 py-3 text-center text-2xl tracking-widest disabled:opacity-50"
          />
          <p className={`text-xs ${otpRemaining === 0 ? 'text-error' : 'text-text-muted'}`}>
            {otpRemaining > 0
              ? isHe
                ? `הקוד בתוקף עוד ${formatMmSs(otpRemaining)}`
                : `Code expires in ${formatMmSs(otpRemaining)}`
              : isHe
                ? 'הקוד פג תוקף. בקשו קוד חדש.'
                : 'Code expired. Request a new one.'}
          </p>
          {err && (
            <p className="text-sm text-error">
              {err === 'otp_invalid'
                ? isHe
                  ? 'קוד שגוי. נסה שוב.'
                  : 'Wrong code. Try again.'
                : err === 'otp_locked'
                  ? isHe
                    ? 'יותר מדי ניסיונות. בקש קוד חדש.'
                    : 'Too many tries. Request a new code.'
                  : isHe
                    ? 'אימות נכשל.'
                    : 'Verification failed.'}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || code.length !== 6 || otpRemaining === 0}
            className="w-full py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40"
          >
            {busy ? (isHe ? 'בודק...' : 'Verifying...') : isHe ? 'אמת' : 'Verify'}
          </button>
        </form>

        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || resending}
          className="mt-3 w-full py-2 text-center text-sm font-medium text-primary disabled:opacity-50"
        >
          {cooldown > 0
            ? isHe
              ? `שליחת קוד חדש בעוד ${cooldown} שניות`
              : `Resend code in ${cooldown}s`
            : resending
              ? isHe
                ? 'שולח...'
                : 'Sending...'
              : isHe
                ? 'שלח קוד חדש'
                : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
