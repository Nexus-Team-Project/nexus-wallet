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
import { motion, useAnimationControls } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import PhoneShowcase from './PhoneShowcase';
import BenefitsCarousel, { type BenefitItem } from './BenefitsCarousel';

interface Benefit {
  he: { title: string; body: string };
  en: { title: string; body: string };
}

// Marketing-oriented copy that is intentionally DIFFERENT from the
// RouterScreen value props. Anonymous visitors need a "why should I
// sign in" pitch; RouterScreen users have already signed in and need a
// "what do I do next" picker. Same brand, different jobs.
const BENEFITS: Benefit[] = [
  {
    he: {
      title: 'חוסכים בכל קנייה',
      body: 'מחירים מיוחדים שמשתלמים מהקנייה הראשונה, בלי תנאים מסובכים.',
    },
    en: {
      title: 'Save on every purchase',
      body: 'Members-only prices that pay off from the first basket, no fine print.',
    },
  },
  {
    he: {
      title: 'הטבות שהארגון שלך בחר',
      body: 'מסעדות, אופנה, סופר, ספורט - כל קטלוג ההטבות של הארגון, מסונכרן ועדכני.',
    },
    en: {
      title: 'Curated by your organization',
      body: "Food, fashion, groceries, sport - your org's benefits catalog, always in sync.",
    },
  },
  {
    he: {
      title: 'פרטי ומאובטח',
      body: 'הזהות מנוהלת על ידי נקסוס.',
    },
    en: {
      title: 'Private and secure',
      body: 'Nexus manages your identity.',
    },
  },
];

export default function AnonymousSplash() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const openLogin = useLoginSheetStore((s) => s.open);

  // Imperative controls for the top Nexus logo. Hover (desktop) plays
  // a quick wiggle via the declarative whileHover; click/tap (also
  // touchscreen) fires this full spin + pulse so the icon feels
  // interactive instead of decorative.
  const logoControls = useAnimationControls();
  const playLogoBurst = (): void => {
    void logoControls.start({
      rotate: [0, 360],
      scale: [1, 1.18, 0.96, 1],
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    });
  };

  return (
    <div
      // min-h-dvh on mobile so content stack can scroll if it overruns
      // (it usually does). On lg+ pin to exact viewport height + clip
      // overflow so the desktop hero never produces a page scrollbar -
      // everything is already visible in the two-column layout and a
      // scrollbar would just be visual noise.
      className="relative min-h-dvh w-full overflow-hidden lg:h-dvh"
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

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-16 lg:h-dvh lg:min-h-0 lg:flex-row lg:items-center lg:gap-20 lg:overflow-hidden lg:px-16 lg:py-16">

        {/* ── Welcome + CTA + benefits column ──
            order-2 on mobile so the PhoneShowcase appears above the
            fold first; lg:order-1 restores the desktop layout where
            welcome sits on the left and showcase on the right. */}
        <motion.div
          className="order-2 lg:order-1 lg:flex-1 lg:max-w-xl"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          {/* Interactive Nexus logo. Hover plays a small wiggle (desktop),
              tap plays a full spin+pulse burst (mobile + desktop), so the
              icon feels alive instead of decorative. role=button + tabIndex
              keep it keyboard-accessible. */}
          <motion.img
            variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
            transition={{ duration: 0.5 }}
            animate={logoControls}
            whileHover={{
              rotate: [0, -10, 10, -6, 6, 0],
              transition: { duration: 0.6, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.92 }}
            onClick={playLogoBurst}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playLogoBurst(); } }}
            role="button"
            tabIndex={0}
            aria-label={isHe ? 'הפעל אנימציה' : 'Play animation'}
            src="/nexus-logo.png"
            alt="Nexus"
            className="mb-6 h-16 w-16 object-contain opacity-95 cursor-pointer select-none sm:h-20 sm:w-20"
            draggable={false}
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

          {/* Benefits carousel. Lives BELOW the CTA on every breakpoint
              so the "Powered by Nexus" footer sits cleanly under it.
              The carousel auto-rotates every 5s, pauses on hover/focus,
              respects prefers-reduced-motion, and is fully keyboard +
              swipe navigable. See BenefitsCarousel for the a11y notes. */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220, delay: 0.6 }}
          >
            <BenefitsCarousel
              isRtl={isHe}
              items={BENEFITS.map<BenefitItem>((b) => ({
                title: isHe ? b.he.title : b.en.title,
                body: isHe ? b.he.body : b.en.body,
              }))}
              labels={{
                prev: isHe ? 'ההטבה הקודמת' : 'Previous benefit',
                next: isHe ? 'ההטבה הבאה' : 'Next benefit',
                region: isHe ? 'הטבות הארנק' : 'Wallet benefits',
                slide: (n, total) =>
                  isHe
                    ? `הטבה ${n} מתוך ${total}`
                    : `Benefit ${n} of ${total}`,
              }}
            />
          </motion.div>

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

        {/* ── Phone showcase column ──
            order-1 on mobile so it sits at the top of the page and
            users see the rotating brand cards without scrolling.
            lg:order-2 + lg:mt-0 restores the right-column position
            on desktop. */}
        <div className="order-1 mb-8 flex justify-center lg:order-2 lg:mb-0 lg:mt-0 lg:flex-1">
          <PhoneShowcase isHe={isHe} />
        </div>
      </div>
    </div>
  );
}
