import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import DigitalCard from '../components/wallet/DigitalCard';

/**
 * Card-detail page. Reached by tapping the digital card on the wallet —
 * after the tap ripple, the page opens on a clean white surface with the
 * card sitting large at the top and its details below.
 */
export default function CardDetailPage() {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const rows: { icon: string; label: string; value?: string }[] = [
    {
      icon: 'pin',
      label: isRTL ? 'מספר כרטיס' : 'Card number',
      value: '•••• •••• •••• 4827',
    },
    {
      icon: 'badge',
      label: isRTL ? 'בעל הכרטיס' : 'Cardholder',
      value: isRTL ? 'ישראל ישראלי' : 'Israel Israeli',
    },
    {
      icon: 'event',
      label: isRTL ? 'בתוקף עד' : 'Expires',
      value: '08/29',
    },
  ];

  const actions: { icon: string; label: string }[] = [
    { icon: 'ac_unit', label: isRTL ? 'הקפאת כרטיס' : 'Freeze card' },
    { icon: 'lock_reset', label: isRTL ? 'שינוי קוד' : 'Change PIN' },
    { icon: 'settings', label: isRTL ? 'הגדרות כרטיס' : 'Card settings' },
  ];

  return (
    <div className="relative min-h-dvh bg-white px-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button — dark on the white surface */}
      <button
        onClick={() => navigate(`/${lang}/wallet`)}
        aria-label={isRTL ? 'חזרה' : 'Back'}
        className="absolute top-5 start-4 z-10 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
          {isRTL ? 'arrow_forward' : 'arrow_back'}
        </span>
      </button>

      {/* ── CARD — sits large at the top of the white page ── */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20"
      >
        <DigitalCard className="w-full" />
      </motion.div>

      {/* ── DETAILS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pt-6 pb-10"
      >
        <h1 className="text-xl font-bold text-text-primary mb-4">
          {isRTL ? 'הכרטיס שלי' : 'My card'}
        </h1>

        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '22px' }}>
                {row.icon}
              </span>
              <span className="text-sm text-text-secondary flex-1">{row.label}</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums" dir="ltr">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {actions.map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface border border-border py-4 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '24px' }}>
                {action.icon}
              </span>
              <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
