import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCartStore, cartCount } from '../../stores/cartStore';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Global, draggable cart button. Persists across pages once the cart has
 * items. Tapping lifts the page and opens the cart overlay; dragging it onto
 * the X target at the bottom clears the whole cart.
 */
export default function CartFab() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const location = useLocation();

  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const openCart = useCartStore((s) => s.openCart);
  const clear = useCartStore((s) => s.clear);
  const count = cartCount(items);

  const fabRef = useRef<HTMLButtonElement>(null);
  const draggedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [fabKey, setFabKey] = useState(0);

  // Hidden on full-screen / non-shopping flows so it doesn't collide with
  // their own bottom bars.
  const hidden =
    /\/(checkout|order-confirmed|receipt|gift|split|pay-intro|add-payment-method|premium-reveal|referral-stories|wallpaper)\b/.test(
      location.pathname,
    );

  if (count === 0 || open || hidden) return null;

  return (
    <>
      {/* Trash / X drop target */}
      {dragging && (
        <div
          aria-hidden
          className="fixed z-[58] w-14 h-14 rounded-full flex items-center justify-center pointer-events-none"
          style={{
            bottom: 80,
            left: '50%',
            transform: `translateX(-50%) scale(${overTrash ? 1.1 : 1})`,
            background: overTrash ? 'rgba(220,38,38,0.95)' : 'rgba(15,23,42,0.7)',
            color: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
            transition: 'transform 0.18s ease-out, background 0.18s',
          }}
        >
          <X size={20} strokeWidth={2} />
        </div>
      )}

      <motion.button
        key={fabKey}
        ref={fabRef}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          window.scrollTo({ top: 0 });
          openCart();
        }}
        aria-label={isHe ? 'עגלה' : 'Cart'}
        className="fixed z-[59] w-14 h-14 rounded-full bg-bg-dark text-white shadow-lg flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        style={{ right: 16, bottom: 96 }}
        drag
        dragMomentum={false}
        dragElastic={0.06}
        dragConstraints={{
          left: -((typeof window !== 'undefined' ? window.innerWidth : 400) - 88),
          right: 8,
          top: -((typeof window !== 'undefined' ? window.innerHeight : 800) - 168),
          bottom: 64,
        }}
        onDragStart={() => {
          draggedRef.current = true;
          setDragging(true);
        }}
        onDrag={() => {
          const el = fabRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const tx = window.innerWidth / 2;
          const ty = window.innerHeight - 80 - 28;
          setOverTrash(Math.hypot(cx - tx, cy - ty) < 60);
        }}
        onDragEnd={() => {
          const removed = overTrash;
          setDragging(false);
          setOverTrash(false);
          if (removed) {
            clear();
            setFabKey((k) => k + 1);
          }
        }}
        whileDrag={{ scale: 1.12 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 26 }}>shopping_cart</span>
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
          {count}
        </span>
      </motion.button>
    </>
  );
}
