/**
 * Shown after phone OTP succeeds for an unknown phone. Asks the user
 * for their email. On submit it starts an email-OTP via the backend
 * and navigates to EmailOtpPage. The phone-signup ticket id is
 * carried server-side via module-level state in auth.service so a
 * refresh of THIS page does not lose state.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 8
 */
import { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { walletStartEmailOtp } from '../../services/auth.service';
import { useLanguage } from '../../i18n/LanguageContext';

export default function EmailRequiredPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await walletStartEmailOtp(email.trim().toLowerCase());
      navigate(`/${lang}/auth/email-otp?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  const phone = params.get('phone') ?? '';
  return (
    <div className="min-h-dvh bg-white flex items-start justify-center pt-12">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {isHe ? 'הטלפון אומת. רק האימייל חסר.' : 'Phone verified. Just need your email.'}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {isHe
            ? `אימתנו את המספר ${phone}. כדי לסיים, הזן את כתובת האימייל שלך וניצור את החשבון.`
            : `We verified ${phone}. To finish, enter your email and we'll create the account.`}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e): void => setEmail(e.target.value)}
            placeholder={isHe ? 'you@example.com' : 'you@example.com'}
            required
            autoFocus
            dir="ltr"
            className="w-full border-2 border-border focus:border-primary outline-none rounded-2xl px-4 py-3 text-sm"
          />
          {err && (
            <p className="text-sm text-error">
              {isHe ? 'שליחת קוד נכשלה. נסה שוב.' : 'Failed to send code. Please try again.'}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !email}
            className="w-full py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40"
          >
            {busy
              ? isHe
                ? 'שולח...'
                : 'Sending...'
              : isHe
                ? 'המשך'
                : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
