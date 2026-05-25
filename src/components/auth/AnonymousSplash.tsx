/**
 * Splash screen rendered inside AppLayout when no /api/me session
 * exists. Replaces the mock-data home/store experience with a clean
 * "please log in" prompt + CTA that opens the LoginSheet.
 *
 * Per spec section "Anonymous wallet visitors must log in before
 * browsing anything." Anonymous users must NOT see mock or real
 * catalog content.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { useLoginSheetStore } from '../../stores/loginSheetStore';

export default function AnonymousSplash() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const openLogin = useLoginSheetStore((s) => s.open);

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
      <img
        src="/nexus-logo.png"
        alt="Nexus"
        className="w-20 h-20 object-contain mb-6 opacity-90"
      />
      <h1 className="text-2xl font-bold text-text-primary mb-3">
        {isHe ? 'ברוכים הבאים ל-Nexus Wallet' : 'Welcome to Nexus Wallet'}
      </h1>
      <p className="text-sm text-text-muted mb-8 max-w-xs leading-relaxed">
        {isHe
          ? 'כדי לצפות בקטלוג ההטבות שלך, התחבר תחילה לחשבון.'
          : 'Log in to your account to see your benefits catalog.'}
      </p>
      <button
        type="button"
        onClick={() => {
          void openLogin();
        }}
        className="px-8 py-3 rounded-2xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {isHe ? 'התחבר' : 'Log in'}
      </button>
      <a
        href="https://www.nexuswallet.info/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-12 flex items-center gap-1 opacity-50"
      >
        <img src="/nexus-logo.png" alt="Nexus" className="h-4" />
        <span className="text-[10px] text-text-muted">
          {isHe ? 'מופעל על ידי Nexus' : 'Powered by Nexus'}
        </span>
      </a>
    </div>
  );
}
