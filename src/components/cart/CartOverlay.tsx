import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore, groupByStore } from '../../stores/cartStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';
import { useLanguage } from '../../i18n/LanguageContext';

// Coverflow tuning.
const CARD_W = 0.86;        // card width as a fraction of the stage
const ANGLE = 18;           // max tilt (deg) for a card one step off-centre
const DIP = 26;             // arc dip (px) for off-centre cards
const TRANSITION = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s';

/**
 * The lifted cart overlay. Cart items are grouped by store; each store is a
 * card in a coverflow-style carousel. The active card settles centred on the
 * page; a swipe to the side animates the neighbouring store in along the arc
 * (one store per swipe — no free continuous scrolling).
 */
export default function CartOverlay() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const closeCart = useCartStore((s) => s.closeCart);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const removeStore = useCartStore((s) => s.removeStore);

  const stores = groupByStore(items);

  // Active store index + live drag offset (px). The carousel is a discrete
  // pager: dragging moves the active card with the finger, and on release it
  // commits at most one step in the drag direction, then animates to settle.
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);
  const drag = useRef<{ startX: number; startY: number; axis: null | 'x' | 'y' } | null>(null);

  // Reset to the first store each time the cart opens.
  useEffect(() => { if (open) setIndex(0); }, [open]);
  // Keep the index valid as stores are removed.
  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(i, stores.length - 1)));
  }, [stores.length]);

  // Measure the stage so card positions are in real pixels. Layout effect so
  // the first paint already has the real width (no centre-stack flash).
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, stores.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startY: e.clientY, axis: null };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (e.pointerType === 'mouse' && e.buttons !== 1) { drag.current = null; setDragging(false); return; }
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Lock the axis: a mostly-vertical move scrolls the item list natively.
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') setDragging(true);
    }
    if (d.axis !== 'x') return;
    let nx = dx;
    // Rubber-band at the ends; cap to one step either way.
    if ((index === 0 && nx > 0) || (index === stores.length - 1 && nx < 0)) nx *= 0.3;
    nx = Math.max(-stageW, Math.min(stageW, nx));
    setDragX(nx);
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== 'x') { setDragging(false); return; }
    const threshold = stageW * 0.2;
    let target = index;
    if (dragX <= -threshold) target = index + 1;
    else if (dragX >= threshold) target = index - 1;
    target = Math.max(0, Math.min(stores.length - 1, target));
    setDragging(false);
    setIndex(target);
    setDragX(0);
  };

  const frac = stageW ? dragX / stageW : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-0 max-w-md mx-auto overflow-hidden"
          style={{ background: '#121212' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          dir={isHe ? 'rtl' : 'ltr'}
        >
          <div className="absolute inset-0 flex flex-col">
            {/* Spacer for the lifted page above. */}
            <div className="shrink-0" style={{ height: '46vh' }} />

            <div className="flex-1 min-h-0 flex flex-col items-center pb-3">
              {stores.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/60 text-center px-6">{isHe ? 'העגלה ריקה' : 'Your cart is empty'}</p>
                </div>
              ) : (
                <>
                  {stores.length > 1 && (
                    <div className="flex flex-col items-center mb-2 shrink-0">
                      {/* Overlapping store-logo tiles (up to 4) — same look as the
                          checkout "Nexus cares" nonprofit tiles. Total count below. */}
                      <div className="flex items-center mb-2">
                        {stores.slice(0, 4).map((store, i) => {
                          const biz = mockBusinesses.find((b) => b.id === store.businessId);
                          return (
                            <span
                              key={store.businessId}
                              className="relative w-12 h-12 rounded-[14px] shadow-md border border-white/10 overflow-hidden flex items-center justify-center"
                              style={{
                                backgroundColor: biz ? (brandBgColors[biz.id] || '#fff') : '#fff',
                                marginInlineStart: i === 0 ? 0 : -12,
                                transform: `rotate(${[-4, 4, -3, 5][i] ?? 0}deg)`,
                                zIndex: 10 - i,
                              }}
                            >
                              {biz?.logoUrl ? (
                                <img
                                  src={biz.logoUrl}
                                  alt=""
                                  aria-hidden
                                  className={FULL_BLEED_LOGOS.has(biz.id) ? 'w-full h-full object-cover' : 'w-7 h-7 object-contain'}
                                />
                              ) : (
                                <span className="text-lg">{biz?.logo ?? '🛍️'}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-white/50 text-xs text-center">
                        {isHe ? `${stores.length} חנויות — החלק כדי לעבור` : `${stores.length} stores — swipe to switch`}
                      </p>
                    </div>
                  )}

                  {/* Coverflow stage */}
                  <div
                    ref={stageRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    onPointerLeave={onPointerEnd}
                    className="relative w-full flex-1 min-h-0 overflow-hidden select-none cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'pan-y' }}
                  >
                    {stores.map((store, i) => {
                      const biz = mockBusinesses.find((b) => b.id === store.businessId);
                      const brandName = biz ? (isHe ? biz.nameHe : biz.name) : store.businessId;
                      const cur = store.items[0]?.currency ?? '₪';
                      const subtotal = store.items.reduce((n, it) => n + it.price * it.qty, 0);

                      const d = (i - index) + frac;
                      const ad = Math.min(Math.abs(d), 1.6);
                      const x = d * stageW;
                      const rot = Math.max(-1, Math.min(1, d)) * ANGLE;
                      const y = ad * DIP;
                      const scale = 1 - ad * 0.16;
                      const opacity = ad >= 1.05 ? 0 : 1 - ad * 0.4;
                      const zIndex = 100 - Math.round(ad * 50);

                      return (
                        <div
                          key={store.businessId}
                          className="absolute top-1/2 left-1/2"
                          style={{
                            width: `${CARD_W * 100}%`,
                            transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
                            transformOrigin: '50% 100%',
                            transition: dragging ? 'none' : TRANSITION,
                            opacity,
                            zIndex,
                            // Only the centred card takes pointer events for its
                            // inner buttons; neighbours are inert.
                            pointerEvents: i === index && !dragging ? 'auto' : 'none',
                          }}
                        >
                          <div className="relative bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
                            {/* Remove-store X — top-left corner */}
                            <button
                              onClick={() => removeStore(store.businessId)}
                              aria-label={isHe ? 'הסר חנות' : 'Remove store'}
                              className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-white/10 text-white/80 flex items-center justify-center active:scale-90 hover:bg-white/20 transition-all"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                            </button>

                            {/* Store header */}
                            <div className="flex items-center gap-3 pl-9">
                              <div
                                className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                                style={{ backgroundColor: biz ? brandBgColors[biz.id] || '#fff' : '#fff' }}
                              >
                                {biz?.logoUrl ? (
                                  <img
                                    src={biz.logoUrl}
                                    alt={brandName}
                                    className={FULL_BLEED_LOGOS.has(biz.id) ? 'w-full h-full object-cover' : 'w-8 h-8 object-contain'}
                                  />
                                ) : (
                                  <span className="text-lg">{biz?.logo ?? '🛍️'}</span>
                                )}
                              </div>
                              <p className="text-white font-semibold text-lg">{brandName}</p>
                            </div>

                            {/* Items (scrolls vertically if the cart is long) */}
                            <div className="flex flex-col gap-4 max-h-[34vh] overflow-y-auto scrollbar-hide">
                              {store.items.map((it) => (
                                <div key={it.productId} className="flex gap-3 items-center">
                                  <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0">
                                    <img src={it.image} alt={isHe ? it.nameHe : it.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-[14px] font-medium leading-snug line-clamp-2">
                                      {isHe ? it.nameHe : it.name}
                                    </p>
                                    <p className="text-white/70 text-[13px] mt-1" dir="ltr">{cur}{(it.price * it.qty).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 shrink-0">
                                    <button className="text-white p-1 active:opacity-60" onClick={() => setQty(store.businessId, it.productId, it.qty - 1)}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{it.qty <= 1 ? 'delete' : 'remove'}</span>
                                    </button>
                                    <span className="text-white font-bold text-sm min-w-[16px] text-center">{it.qty}</span>
                                    <button className="text-white p-1 active:opacity-60" onClick={() => setQty(store.businessId, it.productId, it.qty + 1)}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                                    </button>
                                  </div>
                                  <button className="text-white/40 p-1 active:text-white shrink-0" onClick={() => removeItem(store.businessId, it.productId)} aria-label={isHe ? 'הסר' : 'Remove'}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Subtotal */}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                              <span className="text-white font-medium">{isHe ? 'סה״כ' : 'Subtotal'}</span>
                              <span className="text-white font-medium" dir="ltr">{cur}{subtotal.toLocaleString()}</span>
                            </div>

                            {/* Checkout */}
                            <button
                              className="w-full bg-sky-200 text-bg-dark font-bold py-3.5 rounded-full text-base active:scale-95 transition-transform"
                              onClick={() => {
                                const first = store.items[0];
                                closeCart();
                                navigate(`/${lang}/business/${store.businessId}/product/${first.productId}/checkout`, {
                                  state: { qty: first.qty },
                                });
                              }}
                            >
                              {isHe ? 'המשך לתשלום' : 'Continue to checkout'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Round close button — dismisses the whole cart. */}
              <button
                onClick={closeCart}
                aria-label={isHe ? 'סגירת העגלה' : 'Close cart'}
                className="shrink-0 mt-3 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center active:scale-90 hover:bg-white/20 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
