import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
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
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';

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
  const location = useLocation();
  const orderState = location.state as {
    countdown?: number;
    total?: number;
    cashback?: number;
    productImage?: string | null;
    productName?: string;
    businessName?: string;
    businessLogo?: string | null;
  } | null;
  const tp = t.premium;
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n, 'ILS', locale);

  const COUNTDOWN_START = 300;
  const [countdown, setCountdown] = useState<number | null>(
    orderState?.countdown != null ? orderState.countdown : null
  );
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Detect when the bonus card is pinned (sticky) so we can ring it in the
  // brand blue, matching the plan cards below. Observed against the scroll
  // container: ratio < 1 means its top is clipped at the sticky offset.
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyCardRef = useRef<HTMLDivElement>(null);
  const [cardStuck, setCardStuck] = useState(false);
  useEffect(() => {
    const el = stickyCardRef.current;
    const root = scrollRef.current;
    if (!el || !root) return;
    const obs = new IntersectionObserver(
      ([e]) => setCardStuck(e.intersectionRatio < 1),
      { root, threshold: [1], rootMargin: '-13px 0px 0px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [orderState?.cashback]);

  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const { data: paymentMethods } = usePaymentMethods();
  const [payMethodId, setPayMethodId] = useState<string | null>(null);
  const selectedMethod = paymentMethods.find((m) => m.id === payMethodId) ?? paymentMethods[0];
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

      {/* ── Scrollable middle — the top strip now lives INSIDE this scroll
          area so it scrolls away with the content (not pinned). pb clears the
          floating glass panel so content can scroll up from behind it. ─────── */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-[330px]">
        {/* Top strip — scrolls away with the content (not sticky). The -mx-5
            cancels the page's px-5 so TopBar keeps its own horizontal padding. */}
        <div className="-mx-5">
          <TopBar showBack />
        </div>

        {/* Page title */}
        <h1 className="text-[28px] font-extrabold text-text-primary tracking-tight pt-3">
          {tp.selectPlan}
        </h1>

        {/* Cashback-bonus card (shown when arriving from a purchase) + the
            "And also" heading — now sits ABOVE the special-offer card. */}
        {orderState?.cashback != null && (
          <>
          {/* Sticky — pins near the top of the screen (small top gap) when
              scrolled; frosted/translucent like the plan cards, sitting above
              the cards that scroll under it via z-20. */}
          <div
            ref={stickyCardRef}
            className={cn(
              'sticky top-3 z-20 overflow-hidden rounded-3xl bg-white/65 backdrop-blur-md p-5 mt-5 transition-all duration-300',
              cardStuck
                ? 'border-[1.5px] border-primary shadow-[0_6px_20px_rgba(99,91,255,0.12)]'
                : 'border border-white/60 shadow-sm',
            )}
          >
            <div className="flex items-center gap-4">
              {/* Mini card */}
              <div
                className="flex-shrink-0 w-24 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-2.5"
                style={{ aspectRatio: '1.586 / 1', background: '#e8242a' }}
              >
                {orderState.businessLogo ? (
                  <img src={orderState.businessLogo} alt="" draggable={false} className="h-10 w-auto object-contain" />
                ) : (
                  <span className="text-white font-bold text-[11px] leading-tight text-center">
                    {orderState.businessName ?? orderState.productName}
                  </span>
                )}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-text-muted mb-0.5 truncate">
                  {orderState.businessName ?? orderState.productName}
                </p>
                <p className="text-[15px] font-bold text-text-primary leading-snug mb-2">
                  {isRTL
                    ? 'שדרג עכשיו ונכפיל לך את ה-CashBack כבר על עסקה זו'
                    : 'Upgrade now and double your CashBack on this order'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-bold text-primary">CashBack</span>
                  <span className="text-[18px] font-extrabold text-primary tabular-nums" dir="ltr">
                    ₪{(orderState.cashback * 2).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-text-muted line-through tabular-nums" dir="ltr">
                    ₪{orderState.cashback.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* Countdown clock — parked on the card's outer (left in RTL) edge,
                  vertically centred; mirrors the clock on the bottom CTA. */}
              {countdown !== null && (
                <span className="relative flex-shrink-0 w-11 h-11">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-primary)" strokeOpacity="0.2" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={2 * Math.PI * 14 * (1 - countdown / COUNTDOWN_START)}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-primary">
                    {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
                  </span>
                </span>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold text-text-primary text-start mt-4 mb-3">{isRTL ? 'וגם' : 'And also'}</h2>
          </>
        )}

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
            <img
              src="/nexus-logo-animated-white.gif"
              alt=""
              className="h-14 w-auto object-contain"
              draggable={false}
            />
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

        {/* Payment method */}
        {paymentMethods.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[13px] font-bold text-text-primary mb-3">
              {isRTL ? 'אמצעי תשלום' : 'Payment method'}
            </h3>
            <div className="rounded-2xl bg-surface border border-border overflow-hidden">
              {/* Selected method row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                <PaymentBrandMark brand={selectedMethod?.brand} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">
                    {isRTL ? selectedMethod?.labelHe : selectedMethod?.label}
                  </p>
                  {selectedMethod?.last4 && (
                    <p className="text-[11px] text-text-muted" dir="ltr">···· {selectedMethod.last4}</p>
                  )}
                </div>
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                  <Check size={11} strokeWidth={3} />
                </span>
              </div>
              {/* Horizontal picker */}
              <div className="flex overflow-x-auto gap-2 px-3 py-3 scrollbar-hide snap-x snap-proximity scroll-px-3">
                {paymentMethods.map((m) => {
                  const active = m.id === selectedMethod?.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPayMethodId(m.id)}
                      className={cn(
                        'flex-none snap-start rounded-xl border px-3 py-2 flex flex-col items-center gap-1.5 bg-white transition-colors min-w-[72px]',
                        active ? 'border-primary shadow-sm' : 'border-border',
                      )}
                    >
                      <PaymentBrandMark brand={m.brand} />
                      <span className="text-[10px] font-medium text-text-secondary text-center leading-tight truncate w-full" dir="ltr">
                        {m.last4 ? `···· ${m.last4}` : (isRTL ? m.labelHe : m.label)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Fine print */}
        <p className="mt-6 text-[10px] leading-relaxed text-text-muted px-1">
          {tp.fineprint
            .replace('{price}', price)
            .replace('{period}', isYearly ? tp.periodYearly : tp.periodMonthly)}
        </p>
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
        {(() => {
          const R_btn = 14; const CIRC_btn = 2 * Math.PI * R_btn;
          const dashOffset = countdown !== null ? CIRC_btn * (1 - countdown / COUNTDOWN_START) : 0;
          return (
            <button
              onClick={() => navigate(`/${lang}/premium-reveal`)}
              className="w-full flex items-center justify-center gap-3 bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
            >
              {countdown !== null && (
                <span className="relative flex-shrink-0 w-8 h-8">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r={R_btn} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r={R_btn} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${CIRC_btn}`} strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
                    {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
                  </span>
                </span>
              )}
              <span>{isRTL ? 'התחילו חודש חינם' : 'Start your free month'}</span>
            </button>
          );
        })()}

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
