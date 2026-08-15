import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * A stripped-down "piece" of the SmartInsightsCarousel story slide
 * (src/pages/InsightsPage.tsx — the first slide of /stories). That original
 * carries a rotating background blob, a per-slide image overlay and card
 * repositioning; this keeps only the part relevant here: a card with a
 * category title + a slider that shrinks to show the cashback-reduced spend,
 * cycling through categories as a right-to-left sliding gallery.
 */

interface ExpenseSlide {
  title: string;
  titleEn: string;
  before: number;
  after: number;
  /** Decorative prop image — same assets as the story slide's per-category overlay. */
  image: string;
  endRotate: number;
}

const EXPENSE_SLIDES: ExpenseSlide[] = [
  { title: 'הוצאות אוכל בחוץ', titleEn: 'Eating out', before: 2434, after: 2102, image: '/coffee.png', endRotate: 6 },
  { title: 'הוצאות ביגוד והנעלה', titleEn: 'Clothing & shoes', before: 480, after: 58, image: '/shoe.png', endRotate: -8 },
  { title: 'הוצאות פיננסיות וביטוחים', titleEn: 'Finance & insurance', before: 3200, after: 2750, image: '/calculator.png', endRotate: 5 },
  { title: 'הוצאות בסופר', titleEn: 'Supermarket', before: 1800, after: 1520, image: '/avocado.png', endRotate: 12 },
];

const DISPLAY_MS = 3200;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ExpenseCard({ slide, isRTL }: { slide: ExpenseSlide; isRTL: boolean }) {
  const amount = useMotionValue(slide.before);
  const formattedAmount = useTransform(amount, (v) => `₪${Math.round(v).toLocaleString()}`);
  const percent = useMotionValue(0);
  // Slider fill shrinks from the (visual) right — same trick as the story slide.
  const fillWidth = useTransform(percent, (p) => `${100 - p}%`);

  const targetPercent = useMemo(() => {
    const d = slide.before;
    if (!d) return 0;
    return clamp(100 - (slide.after / d) * 100, 0, 45);
  }, [slide]);

  useEffect(() => {
    percent.set(0);
    amount.set(slide.before);
    const a1 = animate(percent, targetPercent, { duration: 1.1, ease: 'easeInOut', delay: 0.25 });
    const a2 = animate(amount, slide.after, { duration: 1.1, ease: 'easeInOut', delay: 0.25 });
    return () => { a1.stop(); a2.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, targetPercent]);

  return (
    <div className="relative w-full">
      {/* Decorative prop — same asset + rotation as the story slide's
          per-category image overlay. z-20 floats it IN FRONT of the card.
          Its own initial/animate/exit (independent of the outer slide
          transition) pop it in and out — framer-motion propagates a nested
          `exit` down into an AnimatePresence-removed subtree, so this plays
          its own scale-pop even though the whole card is also sliding out. */}
      <motion.img
        src={slide.image}
        alt=""
        aria-hidden
        initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
        animate={{
          // Full opacity — not a faded/washed-out overlay.
          opacity: 1,
          scale: 1,
          rotate: slide.endRotate,
          transition: { type: 'spring', stiffness: 300, damping: 14, delay: 0.05 },
        }}
        exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.22, ease: 'easeIn' } }}
        draggable={false}
        className="absolute z-20 pointer-events-none w-[154px] h-[154px] object-contain"
        style={{
          // Now that the card is centered (not right-anchored), there's
          // ~38px of clear space on each side — still less than this image's
          // own width, so a small safety margin keeps it from clipping the
          // screen edge; the rest is an accepted small overlap with the
          // card's top-left corner.
          top: -100,
          left: -30,
          filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.2))',
        }}
      />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-5 w-full border border-border/60">
        <h3 className="text-center font-bold text-sm text-text-primary mb-4">
          {isRTL ? slide.title : slide.titleEn}
        </h3>
        <div className="w-full h-3 rounded-full bg-border overflow-hidden">
          <motion.div
            style={{ width: fillWidth, marginInlineStart: 'auto' }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <div className="flex justify-between items-center mt-2 px-1" dir="ltr">
          <div className="text-[11px] font-semibold text-text-muted">
            ₪{slide.before.toLocaleString()}
          </div>
          <motion.div className="text-[11px] font-bold text-primary">
            {formattedAmount}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseCashbackGallery() {
  const { isRTL } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % EXPENSE_SLIDES.length), DISPLAY_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full" style={{ height: 108 }}>
      {/* Entering card stays fully visible while it pushes in (opacity 1
          throughout). The exiting card fades out gradually WHILE it slides
          away — opacity gets its own tween (separate from x's spring) so it
          doesn't just vanish once the slide settles; it visibly dissolves
          over the course of the movement. Travel distance is bigger than
          the card's own width so the two never sit edge-to-edge. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ x: 380, opacity: 1 }}
          animate={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 24 } }}
          exit={{
            x: -380,
            opacity: 0,
            transition: {
              x: { type: 'spring', stiffness: 180, damping: 24 },
              opacity: { duration: 0.5, ease: 'easeIn' },
            },
          }}
          className="absolute inset-0"
        >
          <ExpenseCard slide={EXPENSE_SLIDES[index]} isRTL={isRTL} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
