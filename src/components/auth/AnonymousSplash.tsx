/**
 * Anonymous landing screen. Lives at /:lang and is the single URL the
 * LanguageRouter middleware allows un-authenticated visitors to load.
 * Replaces the mock-data home/store experience with a real desktop
 * hero that explains the wallet + a one-tap Log-in CTA.
 *
 * Visual language deliberately diverges from RouterScreen:
 *  - RouterScreen reuses RouterHeroExplainer (floating brand logos +
 *    short value-prop pills) - that's the post-login context picker.
 *  - This page uses a PhoneShowcase animation (brand offer cards
 *    rotating inside an iPhone mockup) and three product-pitch
 *    benefit rows with Lucide icons, so the anonymous landing reads
 *    as marketing/brand rather than a chooser.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md
 */
import { motion } from 'framer-motion';
import { Banknote, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import PhoneShowcase from './PhoneShowcase';

interface Benefit {
  Icon: typeof Sparkles;
  iconColor: string;
  iconBg: string;
  he: { title: string; body: string };
  en: { title: string; body: string };
}

// Marketing-oriented copy that is intentionally DIFFERENT from the
// RouterScreen value props. Anonymous visitors need a "why should I
// sign in" pitch; RouterScreen users have already signed in and need a
// "what do I do next" picker. Same brand, different jobs.
const BENEFITS: Benefit[] = [
  {
    Icon: Banknote,
    iconColor: '#16a34a',
    iconBg: '#dcfce7',
    he: {
      title: 'חוסכים בכל קנייה',
      body: 'מחירים מיוחדים שמשתלמים מהקנייה הראשונה - בלי קופונים, בלי תנאים מסובכים.',
    },
    en: {
      title: 'Save on every purchase',
      body: 'Members-only prices that pay off from the first basket - no coupons, no fine print.',
    },
  },
  {
    Icon: Sparkles,
    iconColor: '#f97316',
    iconBg: '#ffedd5',
    he: {
      title: 'הטבות שהארגון שלך בחר',
      body: 'מסעדות, אופנה, סופר, ספורט - כל קטלוג ההטבות של הארגון, מסונכרן ועדכני.',
    },
    en: {
      title: 'Curated by your organization',
      body: 'Food, fashion, groceries, sport - your org\'s benefits catalog, always in sync.',
    },
  },
  {
    Icon: ShieldCheck,
    iconColor: '#0ea5e9',
    iconBg: '#e0f2fe',
    he: {
      title: 'פרטי ומאובטח',
      body: 'הזהות מנוהלת על ידי נקסוס. הארגון לא רואה מה קנית או היכן הוצאת.',
    },
    en: {
      title: 'Private and secure',
      body: 'Nexus owns your identity. Your org never sees what you buy or where you spend.',
    },
  },
];

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
      {/* Ambient rotating blobs - shared brand motif. */}
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

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 pb-12 pt-16 sm:px-10 sm:pt-20 lg:flex-row lg:items-center lg:gap-20 lg:px-16 lg:py-24">

        {/* ── Welcome + CTA + benefits column ── */}
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
            className="block w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all sm:w-auto sm:px-14 sm:py-5 sm:text-lg lg:py-6 lg:text-xl"
          >
            {isHe ? 'התחבר' : 'Log in'}
          </motion.button>

          {/* Benefit list. Lives BELOW the CTA on every breakpoint, so
              the "Powered by Nexus" footer no longer collides with the
              login button (the previous layout had the footer as an
              inline-flex anchor sitting next to the button on lg+). */}
          <motion.ul
            className="mt-10 flex flex-col gap-3 sm:gap-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12, delayChildren: 0.6 } },
            }}
          >
            {BENEFITS.map(({ Icon, iconColor, iconBg, ...copy }, i) => (
              <motion.li
                key={i}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm shadow-sm sm:gap-4 sm:px-5 sm:py-4"
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                  style={{ background: iconBg }}
                  aria-hidden
                >
                  <Icon size={22} color={iconColor} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 sm:text-base">
                    {isHe ? copy.he.title : copy.en.title}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {isHe ? copy.he.body : copy.en.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {/* Footer - now a block element with mt-8 so it stacks under
              the benefit list instead of overlapping the CTA. */}
          <a
            href="https://www.nexuswallet.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 opacity-60 transition-opacity hover:opacity-100"
          >
            <img src="/nexus-logo.png" alt="Nexus" className="h-4" />
            <span className="text-xs text-slate-500">
              {isHe ? 'מופעל על ידי Nexus' : 'Powered by Nexus'}
            </span>
          </a>
        </motion.div>

        {/* ── Phone showcase column (right on lg+) ── */}
        <div className="mt-12 flex justify-center lg:mt-0 lg:flex-1">
          <PhoneShowcase isHe={isHe} />
        </div>
      </div>
    </div>
  );
}
