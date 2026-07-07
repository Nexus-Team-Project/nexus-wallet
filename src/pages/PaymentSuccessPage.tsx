import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';

type Phase = 'spinning' | 'completing' | 'check' | 'reveal';

const R = 52;
const CX = 66;
const CY = 66;
const CIRC = 2 * Math.PI * R;
const GREEN_BG = '#DCFCE7';
const GREEN_STROKE = '#16A34A';

export interface PaymentSuccessState {
  amount: number;
  cashback?: number;
  merchantName?: string;
  merchantNameHe?: string;
  merchantLogo?: string;
  paymentMethodId?: string;
  description?: string;
  descriptionHe?: string;
  /** Where to navigate on close/auto-nav. Defaults to wallet. */
  returnTo?: string;
}

export default function PaymentSuccessPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const state = (location.state as PaymentSuccessState | null) ?? { amount: 150 };
  const {
    amount = 150,
    cashback = Math.round(amount * 0.05 * 100) / 100,
    merchantName,
    merchantNameHe,
    merchantLogo,
    paymentMethodId,
    description,
    descriptionHe,
    returnTo,
  } = state;

  const { data: paymentMethods } = usePaymentMethods();
  const payMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? paymentMethods[0];

  const [phase, setPhase] = useState<Phase>('spinning');
  const [cashbackCount, setCashbackCount] = useState(0);
  const spinCtrl = useAnimation();
  const confirmId = useRef(`NX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const now = useRef(new Date());

  useEffect(() => {
    spinCtrl.start({ rotate: 360 * 100, transition: { duration: 110, ease: 'linear' } });
    const t = setTimeout(() => setPhase('completing'), 1800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'completing') {
      spinCtrl.stop();
      const t = setTimeout(() => setPhase('check'), 300);
      return () => clearTimeout(t);
    }
    if (phase === 'check') {
      const t = setTimeout(() => setPhase('reveal'), 1100);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal') {
      // Count up cashback over ~1.2s with easing
      if (cashback > 0) {
        const duration = 1200;
        const steps = Math.min(cashback * 10, 60);
        const interval = duration / steps;
        let step = 0;
        const id = setInterval(() => {
          step++;
          const progress = step / steps;
          const eased = 1 - Math.pow(1 - progress, 3);
          setCashbackCount(Math.round(eased * cashback * 100) / 100);
          if (step >= steps) clearInterval(id);
        }, interval);
      }
      const t = setTimeout(() => {
        navigate(returnTo ?? `/${lang}/wallet`, { replace: true });
      }, 5500);
      return () => clearTimeout(t);
    }
  }, [phase, spinCtrl, navigate, lang, returnTo, cashback]);

  const arcDashOffset = phase === 'spinning' ? CIRC * 0.3 : 0;
  const arcOpacity    = phase === 'check' || phase === 'reveal' ? 0 : 1;

  const timeStr = now.current.toLocaleTimeString(isHe ? 'he-IL' : 'en-IL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.current.toLocaleDateString(isHe ? 'he-IL' : 'en-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const displayMerchant = isHe ? (merchantNameHe ?? merchantName) : merchantName;
  const displayDesc     = isHe ? (descriptionHe ?? description)   : description;

  const handleClose = () => navigate(returnTo ?? `/${lang}/wallet`, { replace: true });

  return (
    <div
      className="min-h-dvh bg-white flex flex-col items-center max-w-md mx-auto overflow-hidden px-5"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* ── Animated circle ───────────────────────────── */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ marginTop: 120 }}
        animate={phase === 'reveal' ? { y: -88, scale: 0.5 } : { y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Pastel green */}
        <div className="w-[120px] h-[120px] rounded-full" style={{ background: GREEN_BG }} />

        {/* Arc ring (spins → fills → fades) */}
        <motion.svg
          className="absolute"
          style={{ top: -6, left: -6, width: 132, height: 132 }}
          viewBox="0 0 132 132"
          animate={spinCtrl}
        >
          <motion.circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={GREEN_STROKE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            animate={{
              strokeDashoffset: arcDashOffset,
              opacity: arcOpacity,
            }}
            transition={{
              strokeDashoffset: { duration: phase === 'completing' ? 0.28 : 0, ease: 'easeOut' },
              opacity: { duration: 0.2 },
            }}
          />
        </motion.svg>

        {/* Checkmark — same stroke as arc, draws from arc's end point */}
        <svg
          className="absolute inset-0"
          width={120} height={120}
          viewBox="0 0 120 120"
          style={{ overflow: 'visible' }}
        >
          <motion.path
            d="M 28 62 L 50 82 L 92 36"
            fill="none"
            stroke={GREEN_STROKE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: phase === 'check' || phase === 'reveal' ? 1 : 0,
              opacity:    phase === 'check' || phase === 'reveal' ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 0.58, ease: [0.16, 1, 0.3, 1], delay: 0.05 },
              opacity:    { duration: 0.05 },
            }}
          />
        </svg>

        {/* Merchant logo inside circle — fades in with checkmark */}
        {merchantLogo && (
          <AnimatePresence>
            {(phase === 'check' || phase === 'reveal') && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <img
                  src={merchantLogo}
                  alt=""
                  draggable={false}
                  className="w-10 h-10 object-contain rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Cashback counter ─────────────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && cashback > 0 && (
          <motion.div
            className="flex flex-col items-center gap-1 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          >
            <span
              className="text-[34px] font-bold leading-none tabular-nums"
              style={{ color: GREEN_STROKE }}
              dir="ltr"
            >
              +₪{Number.isInteger(cashbackCount) ? cashbackCount : cashbackCount.toFixed(2)}
            </span>
            <span className="text-[13px] font-medium text-green-700">
              {isHe ? 'קאשבק נצבר' : 'cashback earned'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Receipt card ──────────────────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            className="w-full mt-5 bg-white border border-border rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 text-center">
              {displayMerchant && (
                <p className="text-sm text-text-secondary font-medium mb-1">{displayMerchant}</p>
              )}
              <p className="text-[44px] font-bold text-text-primary leading-tight" dir="ltr">
                ₪{amount}
              </p>
              {displayDesc && (
                <p className="text-sm text-text-muted mt-1">{displayDesc}</p>
              )}
              <span className="inline-block mt-2 text-[12px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                {isHe ? 'עסקה בוצעה' : 'Payment successful'}
              </span>
            </div>

            <div className="mx-5 border-t border-border/60" />

            {/* Detail rows */}
            <div className="px-5 py-4 space-y-3" dir={isHe ? 'rtl' : 'ltr'}>
              {[
                { label: isHe ? 'סטטוס'     : 'Status', value: isHe ? 'הושלם' : 'Completed', green: true },
                { label: isHe ? 'תאריך'      : 'Date',   value: dateStr,                      green: false },
                { label: isHe ? 'שעה'        : 'Time',   value: timeStr,                      green: false },
                { label: isHe ? 'מספר אישור' : 'Ref',    value: confirmId.current,            green: false },
              ].map(({ label, value, green }) => (
                <div key={label} className="flex items-center justify-between text-[14px]">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`font-medium ${green ? 'text-green-600' : 'text-text-primary'}`} dir="ltr">
                    {green && <span className="me-1">✓</span>}
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment method */}
            {payMethod && (
              <>
                <div className="mx-5 border-t border-border/60" />
                <div className="mx-5 my-4 bg-surface rounded-2xl p-4">
                  <p className="text-[12px] font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                    {isHe ? 'אמצעי תשלום' : 'Payment method'}
                  </p>
                  <div className="flex items-center gap-3">
                    <PaymentBrandMark brand={payMethod.brand} />
                    <span className="text-text-secondary font-medium text-sm tracking-widest" dir="ltr">
                      {payMethod.last4
                        ? `• • • •  ${payMethod.last4}`
                        : (isHe ? payMethod.labelHe : payMethod.label)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: isHe ? 'קבלת עסקה' : 'Payment receipt',
                      text: isHe
                        ? `שילמתי ₪${amount}${displayMerchant ? ` ב${displayMerchant}` : ''}`
                        : `Paid ₪${amount}${displayMerchant ? ` at ${displayMerchant}` : ''}`,
                    });
                  } catch { /* dismissed */ }
                }}
                className="w-full bg-bg-dark text-white font-semibold py-3.5 rounded-xl text-[15px] active:opacity-80 transition-opacity"
              >
                {isHe ? 'שיתוף' : 'Share'}
              </motion.button>

              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.35 }}
                onClick={handleClose}
                className="w-full text-text-secondary text-sm font-medium py-2 active:opacity-60 transition-opacity"
              >
                {isHe ? 'סגירה' : 'Close'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
