import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

type Product = NonNullable<Business['products']>[number];

export interface OriginRect { top: number; left: number; width: number; height: number }

interface ProductPinViewProps {
  product: Product;
  /** Screen-space rect of the pressed image — the peek animates FROM here. */
  originRect: OriginRect;
  isFav: boolean;
  onToggleFav: () => void;
  onOpenProduct: (productId: string) => void;
  onClose: () => void;
}

/**
 * ProductPinView — a long-press "peek": the SAME image the user pressed springs
 * from its grid position to the centre at a slight tilt, the rest dims, and a
 * cluster of quick actions sits overlaid on the image's corner. Tap outside to
 * dismiss.
 */
export default function ProductPinView({ product, originRect, isFav, onToggleFav, onOpenProduct, onClose }: ProductPinViewProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const name = isHe ? product.nameHe : product.name;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Apple-style "visual look up" colour scan over the image.
  const [scanKey, setScanKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const startScan = () => {
    setScanKey((k) => k + 1);
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1700);
  };

  // Each action button latches on tap (caught → Nexus-dark + popped forward),
  // and releases on the next tap.
  const [latched, setLatched] = useState<{ search?: boolean; share?: boolean }>({});
  const toggleLatch = (k: 'search' | 'share') => setLatched((s) => ({ ...s, [k]: !s[k] }));

  // Centred target within the mobile frame.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(vw, 448) * 0.72;
  const h = w * (4 / 3);
  const left = (vw - w) / 2;
  const top = (vh - h) / 2 - 48;
  // FLIP: final box fixed at centre; start transformed to overlay the pressed
  // image, then animate the transform to identity → it visibly travels.
  const finalCx = left + w / 2;
  const finalCy = top + h / 2;
  const originCx = originRect.left + originRect.width / 2;
  const originCy = originRect.top + originRect.height / 2;

  // When latched: the characteristic Nexus dark with a white icon, lifted
  // toward the viewer (bigger shadow = "forward", not an upward jump).
  const btnClass = (active: boolean) =>
    `w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-[background-color,color,box-shadow] duration-200 ${
      active
        ? 'bg-bg-dark text-white shadow-[0_16px_34px_rgba(0,0,0,0.45)]'
        : 'bg-white/95 text-text-primary shadow-[0_8px_20px_rgba(0,0,0,0.30)]'
    }`;

  // Place a button on a quarter-circle arc anchored at the image's bottom-end
  // corner (degrees from the bottom edge → up & inward). `from` is the pop-in
  // start: collapsed at the corner.
  const ARC_R = 112;
  const half = 24;
  const pos = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    const ex = ARC_R * Math.cos(r);
    const ey = ARC_R * Math.sin(r);
    return {
      style: { insetInlineEnd: 22 + ex - half, bottom: 22 + ey - half },
      from: { x: isHe ? -ex : ex, y: ey, scale: 0.5, opacity: 0 },
    };
  };
  const pPin = pos(12);
  const pShare = pos(49);
  const pSearch = pos(86);

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} dir={isHe ? 'rtl' : 'ltr'}>
      {/* The pressed image itself — FLIP from its grid rect to the centre. */}
      <motion.div
        style={{ position: 'fixed', top, left, width: w, height: h }}
        initial={{
          x: originCx - finalCx,
          y: originCy - finalCy,
          scaleX: originRect.width / w,
          scaleY: originRect.height / h,
          rotate: 0,
        }}
        animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => { e.stopPropagation(); onOpenProduct(product.id); }}
        className="overflow-hidden rounded-[24px] shadow-2xl bg-gray-100 cursor-pointer"
      >
        <img src={product.image} alt={name} className="w-full h-full object-cover" draggable={false} />

        {/* Visual-search colour scan overlay. */}
        <AnimatePresence>
          {scanning && (
            <motion.div key={scanKey} className="absolute inset-0 pointer-events-none overflow-hidden" exit={{ opacity: 0 }}>
              {/* Iridescent shimmer wash */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(120deg, rgba(94,49,244,0), rgba(255,77,166,.45), rgba(94,49,244,.45), rgba(0,200,255,.45), rgba(94,49,244,0))',
                  backgroundSize: '220% 220%',
                  mixBlendMode: 'screen',
                }}
                initial={{ opacity: 0, backgroundPosition: '0% 50%' }}
                animate={{ opacity: [0, 0.9, 0], backgroundPosition: '100% 50%' }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />
              {/* Diagonal colour sweep */}
              <motion.div
                className="absolute top-[-25%] bottom-[-25%] w-1/3"
                style={{
                  background: 'linear-gradient(105deg, transparent, rgba(120,210,255,.85), rgba(190,130,255,.85), rgba(255,130,210,.85), transparent)',
                  filter: 'blur(7px)',
                  transform: 'rotate(8deg)',
                }}
                initial={{ left: '-45%' }}
                animate={{ left: '130%' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
              {/* Pulsing edge glow around the scanned element */}
              <motion.div
                className="absolute inset-0 rounded-[24px]"
                style={{ boxShadow: 'inset 0 0 14px 2px rgba(255,255,255,.55)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action cluster — overlaid on the image's bottom corner. Each button
          pops out from the corner to its arc position, staggered. */}
      <div
        style={{ position: 'fixed', top, left, width: w, height: h }}
        className="pointer-events-none"
        onClick={stop}
      >
        <motion.button
          onClick={onToggleFav}
          className={`${btnClass(isFav)} absolute pointer-events-auto`}
          style={pPin.style}
          initial={pPin.from}
          animate={{ x: 0, y: 0, scale: isFav ? 1.14 : 1, opacity: 1 }}
          transition={{ delay: 0.16, type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
          aria-label={isHe ? 'שמירה' : 'Save'}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 24, fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
        </motion.button>
        <motion.button
          onClick={() => toggleLatch('share')}
          className={`${btnClass(!!latched.share)} absolute pointer-events-auto`}
          style={pShare.style}
          initial={pShare.from}
          animate={{ x: 0, y: 0, scale: latched.share ? 1.14 : 1, opacity: 1 }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
          aria-label={isHe ? 'שיתוף' : 'Share'}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>ios_share</span>
        </motion.button>
        <motion.button
          onClick={() => { const next = !latched.search; toggleLatch('search'); if (next) startScan(); }}
          className={`${btnClass(!!latched.search)} absolute pointer-events-auto`}
          style={pSearch.style}
          initial={pSearch.from}
          animate={{ x: 0, y: 0, scale: latched.search ? 1.14 : 1, opacity: 1 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
          aria-label={isHe ? 'חיפוש ויזואלי' : 'Visual search'}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>search</span>
        </motion.button>
      </div>
    </div>,
    document.body,
  );
}
