import { motion } from 'framer-motion';
import GiftCardsCarousel from '../components/onboarding/GiftCardsCarousel';

/**
 * Onboarding "gift cards" story — the rotating 3D gift-card carousel under a
 * short headline. The carousel itself lives in GiftCardsCarousel so it can be
 * reused (e.g. as the hero of the deal-intro page).
 */
export default function GiftCardsPage() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)' }}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-right mb-8 text-2xl font-semibold leading-relaxed w-full max-w-sm"
        style={{ color: 'var(--color-primary)' }}
      >
        <div>בחר גיפט קארד מהמותגים האהובים עליך</div>
        <div className="text-base font-normal mt-1" style={{ color: 'var(--color-text-muted)' }}>
          ומשל את הקאשבק שצברת
        </div>
      </motion.div>

      <GiftCardsCarousel />
    </div>
  );
}
