import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

export interface QuickBuyProduct {
  name: string;
  nameHe: string;
  image: string;
  price: number;
  originalPrice?: number;
  currency: string;
  description?: string;
  descriptionHe?: string;
}

export interface QuickBuyBusiness {
  id: string;
  name: string;
  nameHe: string;
  logoUrl: string;
  rating: number;
  reviewCount: number;
  heroImages?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: QuickBuyProduct;
  business: QuickBuyBusiness;
  initialQty?: number;
}

const PURPLE = '#5D3CF3';
const FREE_SHIPPING_THRESHOLD = 150;

export default function QuickBuySheet({ isOpen, onClose, product, business, initialQty = 1 }: Props) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();

  const [qty, setQty] = useState(initialQty);
  // The white (original) page sits on top of the black checkout. Lifting it up
  // exposes the black page underneath; pulling it back down covers it again.
  const [lifted, setLifted] = useState(true);

  // How far the white page lifts up (leaving a strip at the top).
  const [liftMax, setLiftMax] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight * 0.62 : 500,
  );
  useEffect(() => {
    const update = () => setLiftMax(window.innerHeight * 0.62);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQty(initialQty);
      setLifted(true);
    }
  }, [isOpen, initialQty]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const productName     = isHe ? product.nameHe : product.name;
  const brandName       = isHe ? business.nameHe : business.name;
  const total           = product.price * qty;
  const remaining       = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress        = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 top-0 max-w-md mx-auto overflow-hidden"
            style={{ background: '#121212' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            dir={isHe ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ───────────────────────────────────────────────
                BLACK PAGE — checkout, sits UNDERNEATH the white page.
                Exposed in the lower area when the white page lifts up.
               ─────────────────────────────────────────────── */}
            <div className="absolute inset-0 z-0 overflow-y-auto scrollbar-hide pt-[40%] pb-10" style={{ touchAction: 'pan-y' }}>
              <div className="mx-4 bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-5">

                {/* Brand header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={business.logoUrl}
                      alt={brandName}
                      className="w-8 h-8 object-contain"
                      style={business.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg leading-tight">{brandName}</p>
                    <div className="flex items-center gap-1 text-[13px] text-gray-400">
                      <span className="font-medium text-white">{business.rating.toFixed(1)}</span>
                      <span className="material-symbols-rounded text-white" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span>({business.reviewCount.toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                {/* Product row */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0">
                    <img src={product.image} alt={productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-white font-medium text-[15px] leading-snug flex-1">{productName}</p>
                      <p className="text-white font-medium text-[15px] shrink-0 whitespace-nowrap">
                        {product.currency}{product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-auto flex justify-between items-center pt-3">
                      <div className="flex items-center gap-3 bg-black/40 rounded-lg px-2 py-1">
                        <button className="text-white p-1 active:opacity-60" onClick={() => setQty(q => Math.max(1, q - 1))}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{qty <= 1 ? 'delete' : 'remove'}</span>
                        </button>
                        <span className="text-white font-bold text-sm min-w-[14px] text-center">{qty}</span>
                        <button className="text-white p-1 active:opacity-60" onClick={() => setQty(q => q + 1)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                        </button>
                      </div>
                      <button className="bg-black/40 w-10 h-8 rounded-lg flex items-center justify-center active:opacity-60">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>more_horiz</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping progress */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-white">
                      {remaining > 0
                        ? (isHe ? `הוסף ${product.currency}${remaining} למשלוח חינם` : `Add ${product.currency}${remaining} for free shipping`)
                        : (isHe ? '🎉 מגיע לך משלוח חינם!' : "🎉 You've earned free shipping!")}
                    </span>
                    <button className="text-white">{isHe ? 'הוסף מוצרים' : 'Add items'}</button>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-white font-medium text-base">{isHe ? 'סה״כ' : 'Subtotal'}</span>
                  <span className="text-white font-medium text-base">{product.currency}{total.toLocaleString()}</span>
                </div>

                {/* Checkout */}
                <button
                  className="w-full text-white font-bold py-4 rounded-2xl text-base active:scale-95 transition-transform"
                  style={{ background: PURPLE }}
                  onClick={() => navigate(`/${lang}/wallet`)}
                >
                  {isHe ? 'המשך לתשלום' : 'Continue to checkout'}
                </button>
              </div>
            </div>

            {/* ───────────────────────────────────────────────
                WHITE PAGE — the original page, on top. Lift it up to
                expose the black checkout underneath; pull it back down
                to cover it again.
               ─────────────────────────────────────────────── */}
            <motion.div
              className="absolute inset-x-0 top-0 z-20 h-full bg-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
              style={{ borderRadius: '0 0 28px 28px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)', touchAction: 'none' }}
              initial={false}
              animate={{ y: lifted ? -liftMax : 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              drag="y"
              dragConstraints={{ top: -liftMax, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (lifted) {
                  if (info.offset.y > 60 || info.velocity.y > 400) setLifted(false);
                } else if (info.offset.y < -60 || info.velocity.y < -400) {
                  setLifted(true);
                }
              }}
            >
              <div className="px-5 pt-16 flex flex-col gap-4">

                {/* Shipping info box */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>local_shipping</span>
                      {isHe ? 'משלוח עד הבית' : 'Ship to home'}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {remaining === 0
                        ? (isHe ? 'משלוח חינם' : 'Free shipping')
                        : `${product.currency}25`}
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: PURPLE, width: `${progress}%` }} />
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {remaining === 0
                      ? (isHe ? 'יש לך משלוח חינם! 🎉' : "You've unlocked free shipping! 🎉")
                      : isHe
                        ? `הוסף ${product.currency}${remaining} למשלוח חינם`
                        : `Add ${product.currency}${remaining} more for free shipping`}
                  </p>
                </div>

                {/* Quantity row */}
                <div>
                  <span className="text-sm font-semibold text-text-primary block mb-2">
                    {isHe ? 'כמות' : 'Quantity'}
                  </span>
                  <div className="inline-flex items-center gap-3 bg-surface rounded-xl px-2 py-1.5">
                    <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:opacity-60" onClick={() => setQty(q => Math.max(1, q - 1))}>
                      <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>remove</span>
                    </button>
                    <span className="text-base font-bold text-text-primary w-5 text-center">{qty}</span>
                    <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white active:opacity-60" onClick={() => setQty(q => q + 1)}>
                      <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 18 }}>add</span>
                    </button>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col gap-3">
                  <button className="w-full py-4 rounded-3xl font-bold text-base text-white" style={{ background: PURPLE }}>
                    {isHe ? 'הוספה לסל' : 'Add to cart'}
                  </button>
                  <button
                    className="w-full py-4 rounded-3xl font-bold text-base text-white bg-black active:scale-95 transition-transform"
                    onClick={() => setLifted(true)}
                  >
                    {isHe ? 'קנייה מהירה' : 'Buy now'}
                  </button>
                </div>
              </div>

              {/* Grab handle at the bottom edge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-border rounded-full pointer-events-none" />
            </motion.div>

            {/* Close control — returns to the product page */}
            <button
              onClick={onClose}
              className="absolute top-4 z-[30] w-10 h-10 bg-black/5 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={isHe ? { left: 16 } : { right: 16 }}
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>close</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
