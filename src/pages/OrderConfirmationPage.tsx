import { useMemo, useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Gift, Heart, CreditCard, Check, type LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../utils/brandColors';

const MONTHLY_PRICE = 25;
const YEARLY_PRICE = 250;
const YEARLY_SAVE_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);
import { useLanguage } from '../i18n/LanguageContext';
import TopBar from '../components/layout/TopBar';
import ReferralBanner from '../components/home/ReferralBanner';

/**
 * OrderConfirmationPage — success screen after "Pay now".
 *
 * Reached (via replace) from the checkout once payment "completes". Rebuilt
 * from the Rhode order-confirmation mockup in the nexus design language: order
 * header + brand badge, ship-to + product thumb, totals, a receipt CTA, a
 * "More from <brand>" rail and a floating navigation bar. AppLayout suppresses
 * its global chrome here so the screen stands on its own.
 */

interface ConfirmState {
  qty?: number;
  total?: number;
  shippingLabel?: string;
  address?: string;
}

export default function OrderConfirmationPage() {
  const { businessId, productId } = useParams<{ businessId: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const state = (location.state as ConfirmState | null) ?? {};
  // Stable order number derived once per mount.
  const orderNumber = useMemo(
    () => `${Math.floor(1000000 + Math.random() * 9000000)}`,
    [],
  );
  const [logoError, setLogoError] = useState(false);
  const [showUpsell, setShowUpsell] = useState(true);
  const [expandedPeriod, setExpandedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const COUNTDOWN_START = 300;
  const [countdown, setCountdown] = useState(COUNTDOWN_START);

  useEffect(() => {
    if (!showUpsell) return;
    if (countdown <= 0) { setShowUpsell(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showUpsell, countdown]);

  // Store earned cashback so WalletPage can play the balance animation when user navigates there.
  useEffect(() => {
    if (typeof state.total === 'number') {
      const cashback = Math.round(state.total * 0.05 * 100) / 100;
      try {
        sessionStorage.setItem('nexus_pending_wallet_anim', JSON.stringify({ cashback }));
        // Persistent upsell payload — overwrites any previous purchase's upsell.
        localStorage.setItem('nexus_premium_upsell', JSON.stringify({
          cashback,
          total: state.total,
          productName: isHe ? (product?.nameHe ?? product?.name) : product?.name,
          businessName: isHe ? (business?.nameHe ?? business?.name) : business?.name,
          businessLogo: business?.logoUrl ?? null,
          cardColor: (business && brandBgColors[business.id]) || '#0a2540',
          targetCardId: 'balance',
          expiresAt: Date.now() + 300_000,
        }));
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!business || !product) return <Navigate to=".." replace />;

  const cur = product.currency;
  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const qty = Math.max(1, state.qty ?? 1);
  const fmt = (n: number) => `${cur}${n.toLocaleString()}`;

  const recommendations = (business.products ?? []).filter((p) => p.id !== product.id).slice(0, 6);

  // Cross-brand "You might also like" — one product from each other business.
  const alsoLike = mockBusinesses
    .filter((b) => b.id !== business.id && (b.products?.length ?? 0) > 0)
    .slice(0, 8)
    .map((b) => ({ biz: b, p: b.products![0] }));

  // Star row — same treatment as the product page (filled black up to the
  // rounded rating, light grey for the rest).
  const renderStars = (rating: number, reviewCount: number) => {
    const filled = Math.round(rating);
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`material-symbols-rounded leading-none ${s <= filled ? 'text-black' : 'text-gray-200'}`}
              style={{ fontSize: 14, marginInline: -1.5, fontVariationSettings: s <= filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
        <span className="text-[11px] text-text-muted font-medium">({reviewCount.toLocaleString()})</span>
      </div>
    );
  };

  return (
    <div className="relative min-h-dvh bg-white flex flex-col pb-28" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Decorative home-page gradient glow — same rainbow backdrop the home /
          wallet / orders surfaces use, fading into the white page below. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0" aria-hidden>
        <div
          className="w-full h-full opacity-[0.18]"
          style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)' }}
        />
      </div>

      {/* Standard top strip — user icon / chat (support) / notifications */}
      <div className="relative z-10">
        <TopBar showBack />
      </div>

      {/* Order details */}
      <main className="relative z-10 px-5 pt-8 space-y-6">
        {/* Order heading + brand badge */}
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold text-text-primary leading-tight">
              {isHe ? 'ההזמנה אושרה' : 'Order confirmed'}
            </h1>
            <p className="text-sm text-text-muted mt-1" dir="ltr">
              {isHe ? `מס׳ הזמנה #${orderNumber}` : `Order No. #${orderNumber}`}
            </p>
          </div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: brandBgColors[business.id] || 'var(--color-surface)' }}
          >
            {business.logoUrl && !logoError ? (
              <img
                src={business.logoUrl}
                alt={brandName}
                className={FULL_BLEED_LOGOS.has(business.id) ? 'w-full h-full object-cover' : 'w-11 h-11 object-contain'}
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-2xl" aria-hidden>{business.logo}</span>
            )}
          </div>
        </div>

        {/* Ships to + product thumb */}
        <div className="flex justify-between items-start gap-4 pt-1">
          <div className="max-w-[70%]">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {isHe ? 'נשלח אל' : 'Ships to'}
            </h3>
            <p className="text-[15px] font-semibold text-text-primary mt-1 leading-snug">
              {state.address || (isHe ? 'איסוף עצמי מהסניף' : 'Pickup at store')}
            </p>
            {state.shippingLabel && (
              <p className="text-sm text-text-muted mt-1">{state.shippingLabel}</p>
            )}
          </div>
          <div className="relative w-14 h-16 shrink-0">
            <div className="w-full h-full bg-surface rounded-xl border border-border overflow-hidden flex items-center justify-center">
              <img src={product.image} alt={productName} className="h-12 object-contain" />
            </div>
            <span className="absolute -top-1.5 -end-1.5 z-10 min-w-[20px] h-5 px-1 rounded-full bg-bg-dark text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
              {qty}
            </span>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-text-primary">{isHe ? 'סה״כ' : 'Total'}</span>
            <span className="text-base font-bold text-text-primary">
              {typeof state.total === 'number' ? fmt(state.total) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-text-secondary">{isHe ? 'נקסוס •••• 2907' : 'Nexus •••• 2907'}</span>
            <span className="text-[15px] text-text-secondary">
              {typeof state.total === 'number' ? fmt(state.total) : '—'}
            </span>
          </div>
        </div>

        {/* Receipt + track shipment */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/${language}/business/${business.id}/product/${product.id}/receipt`, {
                state: {
                  qty,
                  total: state.total,
                  shippingLabel: state.shippingLabel,
                  address: state.address,
                  orderNumber,
                },
              })
            }
            className="w-full bg-surface text-text-primary font-semibold py-3.5 rounded-xl text-center text-sm active:opacity-70 transition-opacity"
          >
            {isHe ? 'צפייה בקבלה' : 'View order receipt'}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${language}/orders/track`)}
            className="w-full bg-surface text-text-primary font-semibold py-3.5 rounded-xl text-center text-sm active:opacity-70 transition-opacity"
          >
            {isHe ? 'צפייה במשלוח' : 'View shipment'}
          </button>
        </div>
      </main>

      {/* Referral nudge — same "share Nexus & get ₪100" banner as the home page */}
      <div className="relative z-10 mt-8">
        <ReferralBanner />
      </div>

      {/* More from brand */}
      {recommendations.length > 0 && (
        <section className="mt-10">
          <div className="px-5 flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {isHe ? `עוד מ${brandName}` : `More from ${brandName}`}
            </h2>
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-4 px-5">
            {recommendations.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/${language}/business/${business.id}/product/${p.id}`)}
                className="min-w-[170px] w-[170px] text-start shrink-0"
              >
                <div className="relative bg-surface rounded-2xl p-4 aspect-[4/5] flex items-center justify-center overflow-hidden">
                  <img src={p.image} alt={isHe ? p.nameHe : p.name} className="h-4/5 object-contain" />
                  <span className="absolute bottom-3 end-3 bg-white/80 backdrop-blur rounded-full p-2 border border-white">
                    <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>favorite</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mt-2 truncate">{isHe ? p.nameHe : p.name}</p>
                {renderStars(business.rating, business.reviewCount)}
                <p className="text-sm font-bold text-text-primary mt-1">{`${p.currency}${p.price.toLocaleString()}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* You might also like — cross-brand recommendations */}
      {alsoLike.length > 0 && (
        <section className="mt-8">
          <div className="px-5 flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {isHe ? 'אולי תאהב גם' : 'You might also like'}
            </h2>
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-4 px-5">
            {alsoLike.map(({ biz, p }) => (
              <button
                key={`${biz.id}-${p.id}`}
                type="button"
                onClick={() => navigate(`/${language}/business/${biz.id}/product/${p.id}`)}
                className="min-w-[170px] w-[170px] text-start shrink-0"
              >
                <div className="relative bg-surface rounded-2xl p-4 aspect-[4/5] flex items-center justify-center overflow-hidden">
                  <img src={p.image} alt={isHe ? p.nameHe : p.name} className="h-4/5 object-contain" />
                  <span className="absolute bottom-3 end-3 bg-white/80 backdrop-blur rounded-full p-2 border border-white">
                    <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>favorite</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mt-2 truncate">{isHe ? p.nameHe : p.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5 truncate">{isHe ? biz.nameHe : biz.name}</p>
                {renderStars(biz.rating, biz.reviewCount)}
                <p className="text-sm font-bold text-text-primary mt-1">{`${p.currency}${p.price.toLocaleString()}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Draggable premium sheet */}
      {showUpsell && typeof state.total === 'number' && (() => {
        const cashback = Math.round(state.total * 0.05 * 100) / 100;
        const premiumCashback = cashback * 2;
        const fmtCb = (n: number) => `₪${n.toFixed(2)}`;
        const R = 14;
        const CIRC = 2 * Math.PI * R;
        const dashOffset = CIRC * (1 - countdown / COUNTDOWN_START);
        return (
          <div className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto pb-5">
            <div className="px-4">

            {/* Card */}
            <div
              className="relative overflow-hidden rounded-3xl border border-white/40 shadow-lg flex flex-col"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              {/* Compact header */}
              <div className="relative px-5 pt-4 flex-shrink-0">
                {/* Tilted Nexus card */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-3 end-[-36px] w-44 h-28 rotate-[-15deg] rounded-2xl balance-gradient shadow-lg flex items-center justify-center"
                >
                  <img src="/nexus-logo-animated-white.gif" alt="" className="h-14 w-auto object-contain" draggable={false} />
                </div>

                <div className="relative z-10 pt-1">
                  <p className="text-[15px] font-bold text-text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-yellow-500" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    {isHe ? 'עם פרימיום היית צובר פי 2' : 'With Premium you get 2×'}
                  </p>
                  <div className="mt-3 flex items-center gap-3 ps-32" dir="ltr">
                    <div className="flex-1 text-center">
                      <p className="text-[11px] font-semibold text-primary mb-0.5">{isHe ? 'פרימיום' : 'Premium'}</p>
                      <p className="text-2xl font-bold text-primary tabular-nums">{fmtCb(premiumCashback)}</p>
                    </div>
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>arrow_back</span>
                    <div className="flex-1 text-center">
                      <p className="text-[11px] font-semibold text-text-muted mb-0.5">{isHe ? 'קיבלת' : 'You got'}</p>
                      <p className="text-2xl font-bold text-text-primary tabular-nums">{fmtCb(cashback)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* REMOVED expanded content */}
              <AnimatePresence>
                {false && (
                  <motion.div
                    className="flex-1 overflow-y-auto"
                    dir={isHe ? 'rtl' : 'ltr'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                  >
                    {(() => {
                      const tp = (language === 'he'
                        ? {
                            selectPlan: 'בחר תוכנית',
                            offerBadge: 'הצעה מיוחדת',
                            premium: 'פרימיום',
                            offerTrial: 'חודש ראשון חינם,',
                            offerThen: 'לאחר מכן',
                            perMonth: '/חודש',
                            perYear: '/שנה',
                            offerTagline: 'בטל בכל עת',
                            featuresTitle: 'מה כלול בפרימיום',
                            featCashback: 'קאשבק מוגבר ×2',
                            featCashbackSub: 'כפל את הקאשבק שלך על כל עסקה',
                            featInstant: 'פירעון מיידי',
                            featInstantSub: 'הכסף מגיע לארנק מיד',
                            featInstallments: 'תשלומים ללא ריבית',
                            featInstallmentsSub: 'עד 12 תשלומים בחנויות נבחרות',
                            featBirthday: 'מתנת יום הולדת',
                            featBirthdaySub: 'בונוס מפתיע בחודש הולדתך',
                            featCommunity: 'תרומה לקהילה',
                            featCommunitySub: '1% מכל עסקה הולך לקרן קהילתית',
                            billMonthly: 'חודשי',
                            billYearly: 'שנתי',
                            saveBadge: 'חסוך {pct}%',
                            family: 'משפחה',
                            comingSoon: 'בקרוב',
                            familyNote: 'עד 5 חשבונות',
                            cta: 'התחל חינם למשך חודש',
                            compareTitle: 'השוואת תוכניות',
                            compareBenefits: 'הטבות',
                            compareFree: 'חינם',
                            compareRecommended: 'מומלץ',
                            cmpCashback: 'קאשבק', cmpCashbackSub: 'על כל עסקה',
                            cmpInstant: 'פירעון', cmpInstantSub: 'מועד קבלת הכסף',
                            valDelayed: 'דחוי', valInstant: 'מיידי',
                            cmpInstallments: 'תשלומים', cmpInstallmentsSub: 'ללא ריבית',
                            valInstallments: 'עד 12',
                            cmpBirthday: 'מתנת יום הולדת', cmpBirthdaySub: '',
                            cmpCommunity: 'תרומה קהילתית', cmpCommunitySub: '',
                            periodMonthly: 'חודשי', periodYearly: 'שנתי',
                            disclaimer: 'לאחר החודש החינמי, {price} {period}. בטל בכל עת.',
                            terms: 'תנאי שימוש', privacy: 'פרטיות',
                          }
                        : {
                            selectPlan: 'Choose a plan',
                            offerBadge: 'Special offer',
                            premium: 'Premium',
                            offerTrial: 'First month free,',
                            offerThen: 'then',
                            perMonth: '/mo',
                            perYear: '/yr',
                            offerTagline: 'Cancel anytime',
                            featuresTitle: "What's included",
                            featCashback: '2× cashback',
                            featCashbackSub: 'Double cashback on every transaction',
                            featInstant: 'Instant payout',
                            featInstantSub: 'Money hits your wallet immediately',
                            featInstallments: '0% installments',
                            featInstallmentsSub: 'Up to 12 months at select stores',
                            featBirthday: 'Birthday gift',
                            featBirthdaySub: 'A surprise bonus in your birthday month',
                            featCommunity: 'Community fund',
                            featCommunitySub: '1% of every transaction goes to a community fund',
                            billMonthly: 'Monthly',
                            billYearly: 'Yearly',
                            saveBadge: 'Save {pct}%',
                            family: 'Family',
                            comingSoon: 'Soon',
                            familyNote: 'Up to 5 accounts',
                            cta: 'Start free for a month',
                            compareTitle: 'Plan comparison',
                            compareBenefits: 'Benefits',
                            compareFree: 'Free',
                            compareRecommended: 'Recommended',
                            cmpCashback: 'Cashback', cmpCashbackSub: 'Per transaction',
                            cmpInstant: 'Payout', cmpInstantSub: 'When you receive funds',
                            valDelayed: 'Delayed', valInstant: 'Instant',
                            cmpInstallments: 'Installments', cmpInstallmentsSub: 'Interest-free',
                            valInstallments: 'Up to 12',
                            cmpBirthday: 'Birthday gift', cmpBirthdaySub: '',
                            cmpCommunity: 'Community fund', cmpCommunitySub: '',
                            periodMonthly: 'monthly', periodYearly: 'yearly',
                            disclaimer: 'After the free month, {price} {period}. Cancel anytime.',
                            terms: 'Terms', privacy: 'Privacy',
                          });

                      const locale = language === 'he' ? 'he-IL' : 'en-IL';
                      const money = (n: number) => formatCurrency(n, 'ILS', locale);
                      const [period, setPeriod] = [expandedPeriod, setExpandedPeriod];
                      const isYearly = period === 'yearly';
                      const price = money(isYearly ? YEARLY_PRICE : MONTHLY_PRICE);
                      const perLabel = isYearly ? tp.perYear : tp.perMonth;

                      const features: { Icon?: LucideIcon; badge?: string; title: string; sub: string }[] = [
                        { badge: '2X', title: tp.featCashback, sub: tp.featCashbackSub },
                        { Icon: Zap, title: tp.featInstant, sub: tp.featInstantSub },
                        { Icon: CreditCard, title: tp.featInstallments, sub: tp.featInstallmentsSub },
                        { Icon: Gift, title: tp.featBirthday, sub: tp.featBirthdaySub },
                        { Icon: Heart, title: tp.featCommunity, sub: tp.featCommunitySub },
                      ];

                      const compareRows = [
                        { name: tp.cmpCashback, sub: tp.cmpCashbackSub, free: '3-30%', plus: '3-60%', ltr: true },
                        { name: tp.cmpInstant, sub: tp.cmpInstantSub, free: tp.valDelayed, plus: tp.valInstant },
                        { name: tp.cmpInstallments, sub: tp.cmpInstallmentsSub, free: false, plus: tp.valInstallments },
                        { name: tp.cmpBirthday, sub: tp.cmpBirthdaySub, free: false, plus: true },
                        { name: tp.cmpCommunity, sub: tp.cmpCommunitySub, free: false, plus: true },
                      ];

                      const renderCell = (value: boolean | string, highlight = false, ltr = false) => {
                        if (value === true) return <span className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}><Check size={11} strokeWidth={3} /></span>;
                        if (value === false) return <span className="text-text-muted text-lg leading-none">—</span>;
                        return <span className={`text-[13px] font-bold ${highlight ? 'text-primary' : 'text-text-primary'}`} dir={ltr ? 'ltr' : undefined}>{value}</span>;
                      };

                      return (
                        <div className="px-5 pt-4 pb-8">
                          {/* Gradient backdrop */}
                          <div className="absolute top-0 inset-x-0 h-48 pointer-events-none overflow-hidden rounded-t-3xl">
                            <div className="w-full h-full opacity-[0.15]" style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)' }} />
                          </div>

                          <h2 className="relative text-[22px] font-extrabold text-text-primary tracking-tight mb-5">{tp.selectPlan}</h2>

                          {/* Features */}
                          <h3 className="text-[13px] font-bold text-text-primary mb-3">{tp.featuresTitle}</h3>
                          <div className="rounded-2xl bg-surface border border-border p-4 space-y-3 mb-6">
                            {features.map(({ Icon, badge, title, sub }) => (
                              <div key={title} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  {badge ? <span dir="ltr" className="text-primary font-extrabold text-[12px]">{badge}</span> : Icon && <Icon size={16} strokeWidth={1.8} className="text-primary" />}
                                </div>
                                <div>
                                  <p className="text-[14px] font-semibold text-text-primary leading-tight">{title}</p>
                                  <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Comparison table */}
                          <h3 className="text-[13px] font-bold text-text-primary mb-3">{tp.compareTitle}</h3>
                          <div className="rounded-2xl border border-border overflow-hidden mb-6">
                            <div className="grid grid-cols-12 bg-surface px-4 py-2 border-b border-border">
                              <div className="col-span-6 text-[10px] font-bold text-text-muted uppercase tracking-wide">{tp.compareBenefits}</div>
                              <div className="col-span-3 text-center text-[11px] font-bold text-text-muted">{tp.compareFree}</div>
                              <div className="col-span-3 text-center text-[11px] font-bold text-primary">{tp.premium}</div>
                            </div>
                            {compareRows.map((row) => (
                              <div key={row.name} className="relative grid grid-cols-12 items-center px-4 py-3 border-b border-border/50 last:border-0">
                                <div className="absolute end-0 top-0 bottom-0 w-1/4 bg-primary/[0.05]" />
                                <div className="col-span-6">
                                  <p className="text-[13px] font-semibold text-text-primary">{row.name}</p>
                                  {row.sub && <p className="text-[10px] text-text-muted">{row.sub}</p>}
                                </div>
                                <div className="col-span-3 flex justify-center">{renderCell(row.free, false, row.ltr)}</div>
                                <div className="col-span-3 flex justify-center">{renderCell(row.plus, true, row.ltr)}</div>
                              </div>
                            ))}
                          </div>

                          {/* Billing toggle */}
                          <div className="flex justify-center mb-3">
                            <div className="inline-flex items-center gap-1 rounded-full bg-surface border border-border p-0.5">
                              {(['monthly', 'yearly'] as const).map((opt) => (
                                <button key={opt} onClick={() => setPeriod(opt)}
                                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${period === opt ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary'}`}>
                                  {opt === 'monthly' ? tp.billMonthly : tp.billYearly}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Plan cards */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="relative rounded-2xl p-3.5 bg-white border-[1.5px] border-primary shadow-sm">
                              {isYearly && <span className="absolute -top-2.5 start-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">{tp.saveBadge.replace('{pct}', String(YEARLY_SAVE_PCT))}</span>}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] font-bold text-text-primary">{tp.premium}</span>
                                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check size={11} strokeWidth={3} /></span>
                              </div>
                              <div className="flex items-baseline gap-1" dir="ltr">
                                <span className="text-base font-bold text-text-primary">{price}</span>
                                <span className="text-[11px] text-text-muted">{perLabel}</span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-text-muted">{tp.offerTrial}</p>
                            </div>
                            <div className="rounded-2xl p-3.5 bg-surface border border-border opacity-70">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] font-bold text-text-secondary">{tp.family}</span>
                                <span className="rounded-full bg-text-muted/15 px-1.5 py-0.5 text-[9px] font-bold text-text-secondary uppercase">{tp.comingSoon}</span>
                              </div>
                              <p className="text-[12px] text-text-muted">{tp.familyNote}</p>
                            </div>
                          </div>

                          {/* CTA */}
                          <button
                            onClick={() => navigate(`/${language}/premium`, {
                              state: {
                                countdown,
                                total: state.total,
                                cashback: typeof state.total === 'number' ? Math.round(state.total * 0.05 * 100) / 100 : undefined,
                                productImage: product?.image ?? null,
                                productName: isHe ? (product?.nameHe ?? product?.name) : product?.name,
                                businessName: isHe ? (business?.nameHe ?? business?.name) : business?.name,
                                businessLogo: business?.logoUrl ?? null,
                              }
                            })}
                            className="w-full bg-bg-dark text-white py-2.5 rounded-full font-bold text-sm shadow-lg shadow-bg-dark/30 active:scale-[0.98] transition-transform"
                          >
                            {tp.cta}
                          </button>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Bottom row inside card: upgrade text only */}
              <div className="px-5 pb-4 pt-2 flex-shrink-0">
                <p className="text-[14px] font-bold text-text-primary leading-tight">
                  {isHe ? 'שדרג עכשיו והכפל את הרווח שלך' : 'Upgrade now & double your cashback'}
                </p>
              </div>
            </div>

            </div>{/* end px-4 wrapper */}

            {/* External CTAs — Learn more (gray) + Upgrade (black, with ring) */}
            {(() => {
              const goPremium = () => navigate(`/${language}/premium`, {
                state: {
                  countdown,
                  total: state.total,
                  cashback: typeof state.total === 'number' ? Math.round(state.total * 0.05 * 100) / 100 : undefined,
                  productImage: product?.image ?? null,
                  productName: isHe ? ((product as any)?.nameHe ?? product?.name) : product?.name,
                  businessName: isHe ? (business?.nameHe ?? business?.name) : business?.name,
                  businessLogo: business?.logoUrl ?? null,
                }
              });
              return (
                <div className="mt-2 mx-4 flex flex-row-reverse gap-3">
                  <button
                    type="button"
                    onClick={goPremium}
                    className="flex-1 py-3.5 rounded-full font-bold text-base bg-[#e5e7eb] text-slate-900 active:scale-[0.98] transition-transform"
                  >
                    {isHe ? 'למד עוד' : 'Learn more'}
                  </button>
                  <button
                    type="button"
                    onClick={goPremium}
                    className="flex-1 bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <span className="relative flex-shrink-0 w-7 h-7">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                        <circle cx="18" cy="18" r={R} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${CIRC}`} strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
                        {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
                      </span>
                    </span>
                    <span>{isHe ? 'שדרג' : 'Upgrade'}</span>
                  </button>
                </div>
              );
            })()}

          </div>
        );
      })()}

    </div>
  );
}
