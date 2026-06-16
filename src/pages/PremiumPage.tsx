import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Crown,
  Zap,
  Gift,
  Heart,
  CreditCard,
  Check,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { cn } from '../utils/cn';
import TopBar from '../components/layout/TopBar';

// Single Premium plan, first month free. Billed monthly (₪25) or yearly.
// NOTE: the yearly price is a placeholder — confirm before launch.
const MONTHLY_PRICE = 25;
const YEARLY_PRICE = 250;
const YEARLY_SAVE_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);

type BillingPeriod = 'monthly' | 'yearly';

/**
 * Nexus Premium — subscription / upsell screen reached from the profile.
 *
 * Full-screen surface (the global TopBar + bottom nav are suppressed via the
 * `isFullScreenForm` match in AppLayout). Layout is a flex column locked to
 * the viewport height: the title + offer card + value props + comparison
 * scroll in the middle, while the CTA + legal stay pinned to the bottom.
 *
 * Messaging is built around the tier's defensible perks: instant payout is the
 * emotional headline (rivals with delayed payouts can't copy it), backed by
 * boosted 1.5× cashback, a birthday gift, and a community-fund split. Palette
 * follows the core surfaces (primary purple accents, navy text, `surface`
 * fills) with a dark-navy pill CTA matching the business store "Buy now".
 */
export default function PremiumPage() {
  const { t, language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const tp = t.premium;
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n, 'ILS', locale);

  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const isYearly = period === 'yearly';
  const price = money(isYearly ? YEARLY_PRICE : MONTHLY_PRICE);
  const perLabel = isYearly ? tp.perYear : tp.perMonth;

  const billingOptions: { id: BillingPeriod; label: string }[] = [
    { id: 'monthly', label: tp.billMonthly },
    { id: 'yearly', label: tp.billYearly },
  ];

  const features: {
    Icon?: LucideIcon;
    badge?: string;
    title: string;
    sub: string;
  }[] = [
    { badge: '1.5X', title: tp.featCashback, sub: tp.featCashbackSub },
    { Icon: Zap, title: tp.featInstant, sub: tp.featInstantSub },
    { Icon: CreditCard, title: tp.featInstallments, sub: tp.featInstallmentsSub },
    { Icon: Gift, title: tp.featBirthday, sub: tp.featBirthdaySub },
    { Icon: Heart, title: tp.featCommunity, sub: tp.featCommunitySub },
  ];

  // Free Nexus vs Premium. A cell value is a boolean (✓ / —) or a short
  // string (a rate or label). Free cashback baseline assumed 1% → 1.5× = 1.5%.
  const compareRows: {
    name: string;
    sub: string;
    free: boolean | string;
    plus: boolean | string;
    /** Force LTR on the value cells (for numeric ranges like "3-30%"). */
    ltr?: boolean;
  }[] = [
    { name: tp.cmpCashback, sub: tp.cmpCashbackSub, free: '3-30%', plus: '3-60%', ltr: true },
    { name: tp.cmpInstant, sub: tp.cmpInstantSub, free: tp.valDelayed, plus: tp.valInstant },
    { name: tp.cmpInstallments, sub: tp.cmpInstallmentsSub, free: false, plus: tp.valInstallments },
    { name: tp.cmpBirthday, sub: tp.cmpBirthdaySub, free: false, plus: true },
    { name: tp.cmpCommunity, sub: tp.cmpCommunitySub, free: false, plus: true },
  ];

  const disclaimer = tp.disclaimer
    .replace('{price}', price)
    .replace('{period}', isYearly ? tp.periodYearly : tp.periodMonthly);

  return (
    <div
      className="relative h-dvh bg-white flex flex-col px-5"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative gradient backdrop — identical to the home page's
          (AppLayout suppresses the global one on this full-screen route). */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 inset-x-0 z-0 h-[280px]"
      >
        <div
          className="w-full h-full opacity-[0.18]"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, var(--color-bg-light) 100%)',
          }}
        />
      </div>

      {/* ── Standard app TopBar — our routine strip (logo / avatar / chat /
          bell + back). The -mx-5 cancels the page's px-5 so TopBar keeps its
          own horizontal padding, exactly like the other core surfaces. ───── */}
      <div className="relative z-10 -mx-5 flex-shrink-0">
        <TopBar showBack />
      </div>

      {/* ── Scrollable middle — pb clears the floating glass panel so all
          content can scroll up from behind it. ───────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-[330px]">
        {/* Page title */}
        <h1 className="text-[28px] font-extrabold text-text-primary tracking-tight pt-3">
          {tp.selectPlan}
        </h1>

        {/* "Special offer" featured card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-white border border-border shadow-sm p-6 mt-5 mb-6"
        >
          {/* Decorative tilted Nexus card in the inline-end corner */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-3 end-[-28px] w-44 h-28 rotate-[-15deg] rounded-2xl balance-gradient shadow-lg flex items-center justify-center"
          >
            <Crown size={34} strokeWidth={1.6} className="text-white/90" />
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Sparkles size={11} strokeWidth={2.5} />
              {tp.offerBadge}
            </span>

            <h2 className="text-3xl font-bold text-text-primary mt-3">
              {tp.premium}
            </h2>

            <div className="mt-10">
              <p className="text-base font-semibold">
                <span className="text-text-muted">{tp.offerTrial}</span>{' '}
                <span className="text-text-primary">
                  {tp.offerThen} {price}
                  {perLabel}
                </span>
              </p>
              <p className="text-text-muted text-xs mt-1">{tp.offerTagline}</p>
            </div>
          </div>
        </motion.div>

        {/* Value props */}
        <h2 className="text-lg font-bold text-text-primary text-start mb-3">
          {tp.featuresTitle}
        </h2>
        <section className="rounded-3xl bg-surface border border-border p-5">
          <div className="space-y-4">
            {features.map(({ Icon, badge, title, sub }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {badge ? (
                    <span dir="ltr" className="text-primary font-extrabold text-[13px] leading-none">
                      {badge}
                    </span>
                  ) : (
                    Icon && <Icon size={18} strokeWidth={1.8} className="text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-text-primary leading-tight">
                    {title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plan comparison table — free Nexus vs Premium */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary text-start mb-5">
            {tp.compareTitle}
          </h2>

          {/* Column headers */}
          <div className="grid grid-cols-12 items-end mb-3">
            <div className="col-span-6">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wide">
                {tp.compareBenefits}
              </span>
            </div>
            <div className="col-span-3 text-center">
              <span className="text-sm font-bold text-text-muted">
                {tp.compareFree}
              </span>
            </div>
            <div className="col-span-3 text-center relative">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                {tp.compareRecommended}
              </span>
              <span className="text-sm font-bold text-primary">
                {tp.premium}
              </span>
            </div>
          </div>

          {/* Rows — the Premium column (inline-end in both LTR & RTL) sits on
              a soft primary-tinted strip so it reads as the highlighted plan. */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute end-0 top-0 bottom-0 w-1/4 bg-primary/[0.06] rounded-t-xl"
            />
            <div className="relative">
              {compareRows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-12 items-center py-4 border-b border-border/60"
                >
                  <div className="col-span-6 pe-2">
                    <h3 className="text-[14px] font-bold text-text-primary leading-tight">
                      {row.name}
                    </h3>
                    <p className="text-[11px] text-text-muted">{row.sub}</p>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <CompareCell value={row.free} ltr={row.ltr} />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <CompareCell value={row.plus} ltr={row.ltr} highlight />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Floating action area — no backing panel. Each control is its own
          standalone glass element over the transparent, scroll-through bg. ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-5 pt-2">
        {/* Monthly / Yearly switch — compact, content-width, centered */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/55 backdrop-blur-md border border-white/60 shadow-sm p-0.5">
            {billingOptions.map((opt) => {
              const selected = period === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all',
                    selected
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan tiers — Premium (active) + Family (coming soon). */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Premium — selected. Yearly savings ride on the card's envelope
              as a tab peeking over the top edge (only when yearly is picked). */}
          <div className="relative rounded-2xl p-3.5 bg-white/65 backdrop-blur-md border-[1.5px] border-primary shadow-[0_6px_20px_rgba(99,91,255,0.12)]">
            {isYearly && (
              <span className="absolute -top-2.5 start-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {tp.saveBadge.replace('{pct}', String(YEARLY_SAVE_PCT))}
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-bold text-text-primary">
                {tp.premium}
              </span>
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </span>
            </div>
            <div className="flex items-baseline gap-1" dir="ltr">
              <span className="text-lg font-bold text-text-primary">
                {price}
              </span>
              <span className="text-xs text-text-muted">{perLabel}</span>
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-text-muted">
              {tp.offerTrial}
            </div>
          </div>

          {/* Family — coming soon (disabled) */}
          <div className="rounded-2xl p-3.5 bg-white/40 backdrop-blur-md border border-white/50 opacity-90">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-bold text-text-secondary">
                {tp.family}
              </span>
              <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-[9px] font-bold text-text-secondary uppercase tracking-wide">
                {tp.comingSoon}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-text-muted">
              {tp.familyNote}
            </div>
          </div>
        </div>

        {/* CTA — solid navy pill (matches the business store "Buy now") */}
        <button
          onClick={() => navigate(`/${lang}/premium-reveal`)}
          className="w-full bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
        >
          {tp.cta}
        </button>

        {/* Legal */}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-text-secondary px-2">
          {disclaimer}
        </p>
        <div className="mt-1.5 flex justify-center gap-6">
          <button className="text-[11px] font-medium text-text-muted active:text-text-secondary">
            {tp.terms}
          </button>
          <button className="text-[11px] font-medium text-text-muted active:text-text-secondary">
            {tp.privacy}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A single comparison-table cell. `true` → primary check dot, `false` → a
 * muted dash, a string → a short value (highlighted in the Premium column).
 */
function CompareCell({
  value,
  highlight = false,
  ltr = false,
}: {
  value: boolean | string;
  highlight?: boolean;
  ltr?: boolean;
}) {
  if (value === true) {
    return (
      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check size={12} strokeWidth={3} className="text-white" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-text-muted/50 text-base leading-none">—</span>;
  }
  return (
    <span
      dir={ltr ? 'ltr' : undefined}
      className={cn(
        'text-[13px] font-bold',
        highlight ? 'text-primary' : 'text-text-secondary',
      )}
    >
      {value}
    </span>
  );
}
