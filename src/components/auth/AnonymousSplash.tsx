/**
 * Splash screen rendered for anonymous visitors at /:lang. Replaces
 * the mock-data home/store experience with a clean "please log in"
 * prompt + CTA that opens the LoginSheet.
 *
 * Two-column responsive layout: on mobile it stacks (hero copy + CTA
 * above the animated explainer). On lg+ desktop it spreads as a
 * proper hero with the value-prop pills and floating brand logos on
 * one side, and the welcome + log-in block on the other so the page
 * never looks like a centered phone preview pinned to a wide screen.
 *
 * Per spec: anonymous wallet visitors must log in before browsing
 * anything - this page is the single anonymous landing URL, and the
 * LanguageRouter middleware bounces every other path here.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md
 */
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import RouterHeroExplainer from '../router/RouterHeroExplainer';

export default function AnonymousSplash() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const openLogin = useLoginSheetStore((s) => s.open);

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,183,77,0.08) 0%, rgba(255,145,184,0.08) 50%, rgba(156,136,255,0.08) 100%), #ffffff',
      }}
    >
      {/* Ambient rotating blobs - same rhythm used in RouterScreen
          and InsightsPage, ties the brand together across screens. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at 30% 30%, #ffb74d, transparent 60%)' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at 70% 70%, #ff91b8, transparent 60%)' }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 pb-12 pt-16 sm:px-10 sm:pt-20 lg:flex-row lg:items-center lg:gap-24 lg:px-16 lg:py-24">

        {/* ── Welcome + CTA column ── */}
        <motion.div
          className="lg:flex-1 lg:max-w-xl"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          <motion.img
            variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
            transition={{ duration: 0.5 }}
            src="/nexus-logo.png"
            alt="Nexus"
            className="mb-6 h-16 w-16 object-contain opacity-95 sm:h-20 sm:w-20"
          />
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-3 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.1]"
          >
            {isHe ? 'ברוכים הבאים ל-Nexus Wallet' : 'Welcome to Nexus Wallet'}
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8 text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl lg:mb-10 lg:leading-relaxed"
          >
            {isHe
              ? 'הארנק הדיגיטלי של הארגון שלך - הטבות, מחירים מיוחדים, וניהול הוצאות במקום אחד.'
              : "Your organization's digital wallet - benefits, special pricing, and spend management in one place."}
          </motion.p>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => { void openLogin(); }}
            className="w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all sm:w-auto sm:px-12 sm:py-5 sm:text-lg lg:py-6 lg:text-xl"
          >
            {isHe ? 'התחבר' : 'Log in'}
          </motion.button>

          <a
            href="https://www.nexuswallet.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <img src="/nexus-logo.png" alt="Nexus" className="h-4" />
            <span className="text-xs text-slate-500">
              {isHe ? 'מופעל על ידי Nexus' : 'Powered by Nexus'}
            </span>
          </a>
        </motion.div>

        {/* ── Explainer column (floating brands + value props) ── */}
        <div className="mt-12 lg:mt-0 lg:flex-1 lg:max-w-md">
          <RouterHeroExplainer isHe={isHe} />
        </div>
      </div>
    </div>
  );
}
