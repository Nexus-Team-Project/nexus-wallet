import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';

/** Darken a hex colour by a percentage (0-100). */
function darkenHex(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(2.55 * percent));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * percent));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Hex → rgba string. */
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}, ${alpha})`;
}

/**
 * CardIssuanceBanner — premium home-page banner that drives users
 * into the card issuance onboarding flow (3-story journey).
 */
export default function CardIssuanceBanner() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const tenantConfig = useTenantStore((s) => s.config);

  const pc = tenantConfig?.primaryColor || '#635bff';
  const tenantName = (isHe ? tenantConfig?.nameHe : null) || tenantConfig?.name || 'Nexus';

  return (
    <section className="px-4 mb-6">
      <button
        onClick={() => navigate(`/${lang}/card-issuance`)}
        className="w-full relative overflow-hidden rounded-2xl text-start active:scale-[0.98] transition-transform"
        style={{
          background: `linear-gradient(135deg, #0a0b14 0%, ${darkenHex(pc, 40)} 40%, ${darkenHex(pc, 20)} 70%, ${pc} 100%)`,
          minHeight: 160,
        }}
      >
        {/* Decorative ambient glows */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: hexToRgba(pc, 0.35),
            filter: 'blur(40px)',
            transform: 'translate(20%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'rgba(0, 212, 255, 0.2)',
            filter: 'blur(36px)',
            transform: 'translate(-20%, 30%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full pointer-events-none"
          style={{
            background: 'rgba(236, 72, 153, 0.15)',
            filter: 'blur(30px)',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Floating mini cards — positioned only on the left (start) side so they don't cover text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Card 1 — top left */}
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [12, 16, 12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-4 left-5 w-16 h-10 rounded-lg border border-white/15 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${pc}, ${darkenHex(pc, -20)})`,
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-1 p-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <div className="text-[5px] font-bold text-white/70 tracking-widest uppercase">{tenantName}</div>
            </div>
          </motion.div>

          {/* Card 2 — mid left */}
          <motion.div
            animate={{ y: [0, 5, 0], rotate: [-8, -4, -8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-14 left-14 w-14 h-9 rounded-lg border border-white/10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              opacity: 0.7,
            }}
          >
            <div className="flex items-center gap-1 p-1.5">
              <div className="h-1 w-1 rounded-full bg-white/60" />
            </div>
          </motion.div>

          {/* Card 3 — bottom left */}
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [6, 10, 6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-5 left-8 w-12 h-8 rounded-md border border-white/10 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(pc, 0.8)}, ${darkenHex(pc, -10)})`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Content — on the right (end) side, away from floating cards */}
        <div className="relative z-10 p-5 flex flex-col justify-between h-full" style={{ minHeight: 160 }}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                >
                  credit_card
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                {isHe ? 'כרטיס מועדון' : 'Club Card'}
              </span>
            </div>

            <h3 className="text-white text-lg font-bold leading-snug">
              {isHe ? 'כרטיס המועדון שלך מוכן' : 'Your club card is ready'}
            </h3>
            <p className="text-white/60 text-xs mt-1 leading-relaxed max-w-[220px]">
              {isHe
                ? 'קאשבק, חיוב מועדף והטבות בלעדיות — הכל בכרטיס פרימיום אחד.'
                : 'Unlock cashback, preferred billing, and exclusive benefits in one premium card.'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
              {isHe ? 'להתחיל' : 'Get started'}
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                arrow_forward
              </span>
            </span>
            <div className="text-[9px] text-white/30 tracking-wide">
              {isHe ? `מופעל ע״י ${tenantName}` : `Powered by ${tenantName}`}
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}
