import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore, groupByStore } from '../../stores/cartStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * The lifted cart overlay. Sits behind the page (which AppLayout lifts up to
 * reveal it). Cart items are grouped by store; each store is a full-width
 * slide in a horizontal snap-pager — you can't mix stores in one order.
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

  const stores = groupByStore(items);

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
          <div
            className="absolute inset-0 overflow-y-auto scrollbar-hide"
            style={{ paddingTop: '50vh', paddingBottom: 40, touchAction: 'pan-y' }}
          >
            {stores.length === 0 ? (
              <p className="text-white/60 text-center px-6">{isHe ? 'העגלה ריקה' : 'Your cart is empty'}</p>
            ) : (
              <>
                {stores.length > 1 && (
                  <p className="text-white/50 text-xs text-center mb-2">
                    {isHe ? `${stores.length} חנויות — החלק כדי לעבור` : `${stores.length} stores — swipe to switch`}
                  </p>
                )}
                <div
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  style={{ touchAction: 'pan-x' }}
                >
                  {stores.map((store) => {
                    const biz = mockBusinesses.find((b) => b.id === store.businessId);
                    const brandName = biz ? (isHe ? biz.nameHe : biz.name) : store.businessId;
                    const cur = store.items[0]?.currency ?? '₪';
                    const subtotal = store.items.reduce((n, i) => n + i.price * i.qty, 0);
                    return (
                      <div key={store.businessId} className="min-w-full snap-center px-4">
                        <div className="bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-4">
                          {/* Store header */}
                          <div className="flex items-center gap-3">
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

                          {/* Items */}
                          <div className="flex flex-col gap-4">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
