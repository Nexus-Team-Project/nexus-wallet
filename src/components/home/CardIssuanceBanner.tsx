import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * CardIssuanceBanner — premium home-page banner that drives users
 * into the card issuance onboarding flow (3-story journey).
 */
export default function CardIssuanceBanner() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  return (
    <section className="px-4 mb-6">
      <button
        onClick={() => navigate(`/${lang}/card-issuance`)}
        className="w-full relative overflow-hidden rounded-2xl text-start active:scale-[0.98] transition-transform"
        style={{
          background: 'linear-gradient(135deg, #0a0b14 0%, #1a1040 40%, #2d1b69 70%, #635bff 100%)',
          minHeight: 160,
        }}
      >
        {/* Decorative ambient glows */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: 'rgba(99, 91, 255, 0.35)',
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

        {/* Floating mini cards */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Card 1 — top right */}
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [12, 16, 12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-4 right-5 w-16 h-10 rounded-lg border border-white/15 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #635bff, #9c88ff)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-1 p-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <div className="text-[5px] font-bold text-white/70 tracking-widest uppercase">Nexus</div>
            </div>
          </motion.div>

          {/* Card 2 — mid right */}
          <motion.div
            animate={{ y: [0, 5, 0], rotate: [-8, -4, -8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-14 right-14 w-14 h-9 rounded-lg border border-white/10 overflow-hidden"
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

          {/* Card 3 — bottom right */}
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [6, 10, 6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-5 right-8 w-12 h-8 rounded-md border border-white/10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #f472b6, #c084fc)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Content */}
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
                Club Card
              </span>
            </div>

            <h3 className="text-white text-lg font-bold leading-snug">
              Your club card is ready
            </h3>
            <p className="text-white/60 text-xs mt-1 leading-relaxed max-w-[220px]">
              Unlock cashback, preferred billing, and exclusive benefits in one premium card.
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
              Get started
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                arrow_forward
              </span>
            </span>
            <div className="text-[9px] text-white/30 tracking-wide">Powered by Nexus</div>
          </div>
        </div>
      </button>
    </section>
  );
}
