/**
 * PhoneUpdateSheet — bottom sheet to add or change the wallet phone from the
 * profile. Same backend flow as the onboarding phone slide: a real InforU OTP
 * when SMS is configured, otherwise the test attach (saved unverified). On
 * success the number is attached to the identity and mirrored onto the user's
 * tenant rows server-side; the caller reloads /api/me.
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
  attachPhoneTest,
  PHONE_OTP_ENABLED,
} from '../../../services/walletPhone.service';

interface Props {
  onClose: () => void;
  /** Called after a successful attach (the caller should reload /api/me). */
  onUpdated: () => void;
}

export default function PhoneUpdateSheet({ onClose, onUpdated }: Props) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isIsrael = country?.code === 'IL';
  const canSend = phone.replace(/\D/g, '').length >= 9 && isIsrael;

  const mapErr = (e: unknown): string => {
    const c = e instanceof Error ? e.message : '';
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
      setChallengeId(id); setOtp(''); setStep('otp');
    } catch (e) { setError(mapErr(e)); } finally { setBusy(false); }
  };

  const testAttach = async () => {
    if (!canSend || busy) return;
    setBusy(true); setError('');
    try { await attachPhoneTest(phone); success(); }
    catch (e) { setError(mapErr(e)); } finally { setBusy(false); }
  };

  const verify = async (code: string) => {
    if (code.length < 4 || busy) return;
    setBusy(true); setError('');
    try { await verifyPhoneOtp(challengeId, code); success(); }
    catch (e) { setError(mapErr(e)); setOtp(''); } finally { setBusy(false); }
  };

  const showError = !isIsrael && country ? t.registration.verifyPhoneIsraelOnly : error || null;

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
              disabled={!PHONE_OTP_ENABLED || !canSend || busy}
              onClick={sendOtp}
              className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
            >
              {isHe ? 'המשך' : 'Continue'}
            </button>
            {!PHONE_OTP_ENABLED && (
              <button
                type="button"
                disabled={!canSend || busy}
                onClick={testAttach}
                className="mt-2 w-full py-2 text-sm font-semibold text-primary disabled:opacity-40"
              >
                {t.registration.verifyPhoneTestContinue}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4">
              {t.auth.otpSubtitle}<span className="font-semibold ms-1" dir="ltr">{phone}</span>
            </p>
            <input
              value={otp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                setOtp(d); setError('');
                if (d.length === 4) void verify(d);
              }}
              inputMode="numeric"
              maxLength={4}
              autoFocus
              dir="ltr"
              placeholder="••••"
              className="w-full rounded-2xl border-2 border-border focus:border-primary outline-none px-4 py-3 text-center text-2xl tracking-widest"
            />
            {error && <p className="text-error text-xs mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
