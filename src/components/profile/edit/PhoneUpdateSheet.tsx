/**
 * PhoneUpdateSheet — bottom sheet to add or change the wallet phone from the
 * profile. Same backend flow as the onboarding phone slide: a real InforU SMS
 * OTP (start -> verify). On success the number is attached to the identity and
 * mirrored onto the user's tenant rows server-side; the caller reloads /api/me.
 *
 * Israel-only: a non-Israeli selection is blocked here and by the backend.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import PhoneInput, { type Country } from '../../ui/PhoneInput';
import {
  startPhoneOtp,
  verifyPhoneOtp,
} from '../../../services/walletPhone.service';
import { useCountdown, formatMmSs } from '../../../hooks/useCountdown';

interface Props {
  onClose: () => void;
  /** The caller's current phone (canonical 05XXXXXXXX) or null - blocks re-entry. */
  currentPhone?: string | null;
  /** Called after a successful attach (the caller should reload /api/me). */
  onUpdated: () => void;
}

export default function PhoneUpdateSheet({ onClose, currentPhone, onUpdated }: Props) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Live code-validity countdown (mirrors the 10-min backend expiry).
  const { remaining: otpRemaining, reset: resetOtpExpiry } = useCountdown(600);
  // Resend throttle (mirrors the backend 1-per-30s send limit).
  const { remaining: resendCooldown, reset: resetResendCooldown } = useCountdown(30);

  const isIsrael = country?.code === 'IL';
  // Israeli mobile: exactly 10 digits starting with 05.
  const phoneDigits = phone.replace(/\D/g, '');
  const isValidIsraeliPhone = phoneDigits.length === 10 && phoneDigits.startsWith('05');
  // Block re-entering the number the user already has (compare on digits only).
  const isSameAsCurrent =
    isValidIsraeliPhone && !!currentPhone && phoneDigits === currentPhone.replace(/\D/g, '');
  const canSend = isIsrael && isValidIsraeliPhone && !isSameAsCurrent;

  const sameMsg = isHe ? 'זה כבר המספר הנוכחי שלך.' : 'This is already your current number.';

  const mapErr = (e: unknown): string => {
    const c = e instanceof Error ? e.message : '';
    if (c === 'phone_unchanged') return sameMsg;
    if (c === 'phone_in_use') return t.registration.verifyPhoneInUse;
    if (c === 'phone_not_israeli') return t.registration.verifyPhoneIsraelOnly;
    if (c === 'sms_unavailable') return t.registration.verifyPhoneSmsUnavailable;
    return t.auth.wrongCode;
  };

  const success = () => { onUpdated(); onClose(); };

  const sendOtp = async () => {
    if (!canSend || busy) return;
    setBusy(true); setError('');
    try {
      const { challengeId: id } = await startPhoneOtp(phone);
      setChallengeId(id); setOtp(''); setStep('otp'); resetOtpExpiry(); resetResendCooldown();
    } catch (e) { setError(mapErr(e)); } finally { setBusy(false); }
  };

  const verify = async (code: string) => {
    if (code.length < 6 || busy || otpRemaining === 0) return;
    setBusy(true); setError('');
    try { await verifyPhoneOtp(challengeId, code); success(); }
    catch (e) { setError(mapErr(e)); setOtp(''); } finally { setBusy(false); }
  };

  const formatHint =
    isIsrael && phoneDigits.length > 0 && !isValidIsraeliPhone
      ? t.registration.verifyPhoneFormat
      : null;
  const showError = !isIsrael && country
    ? t.registration.verifyPhoneIsraelOnly
    : isSameAsCurrent
      ? sameMsg
      : error || formatHint || null;

  return createPortal(
    <div dir={isHe ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-[210] mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="flex justify-center pb-3"><div className="h-1 w-10 rounded-full bg-border" /></div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
          {t.profile.phoneSheetTitle}
        </h2>

        {step === 'phone' ? (
          <>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">{t.registration.verifyPhoneSubtitle}</p>
            <PhoneInput
              value={phone}
              onChange={(v) => { setPhone(v); setError(''); }}
              onCountryChange={setCountry}
              placeholder="050-000-0000"
              autoFocus
              error={!!error}
              isLoading={busy}
            />
            {showError && <p className="text-error text-xs mt-2">{showError}</p>}
            <button
              type="button"
              disabled={!canSend || busy}
              onClick={sendOtp}
              className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
            >
              {isHe ? 'המשך' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4">
              {t.auth.otpSubtitle}<span className="font-semibold ms-1" dir="ltr">{phone}</span>
            </p>
            <input
              value={otp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(d); setError('');
                if (d.length === 6) void verify(d);
              }}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              dir="ltr"
              disabled={otpRemaining === 0}
              placeholder="••••••"
              className="w-full rounded-2xl border-2 border-border focus:border-primary outline-none px-4 py-3 text-center text-2xl tracking-widest disabled:opacity-50"
            />
            <p
              className="mt-2 text-xs"
              style={{ color: otpRemaining === 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}
            >
              {otpRemaining > 0
                ? t.auth.otpExpiresIn.replace('{time}', formatMmSs(otpRemaining))
                : t.auth.otpExpired}
            </p>
            {error && <p className="text-error text-xs mt-2">{error}</p>}
            <button
              type="button"
              onClick={() => { if (resendCooldown === 0 && !busy) void sendOtp(); }}
              disabled={resendCooldown > 0 || busy}
              className="mt-3 w-full py-2 text-center text-sm font-medium text-primary disabled:opacity-50"
            >
              {resendCooldown > 0
                ? t.auth.resendCodeWait.replace('{seconds}', String(resendCooldown))
                : t.auth.resendCode}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
