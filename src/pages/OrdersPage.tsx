import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { mockBusinesses } from '../mock/data/businesses.mock';

// Mock order data sourced from existing businesses so the product / brand
// images resolve. Swap for real order data once a backend is wired.
const ORDER_BUSINESS = mockBusinesses.find((b) => (b.products?.length ?? 0) >= 2) ?? mockBusinesses[0];
const ACTIVE_PRODUCT = (ORDER_BUSINESS.products ?? [])[0];
// "Buy again" pulls a variety of products from across the catalog, excluding
// the one that's already on its way.
const BUY_AGAIN = mockBusinesses
  .flatMap((b) => b.products ?? [])
  .filter((p) => p.image && p.id !== ACTIVE_PRODUCT?.id)
  .slice(0, 6);

/**
 * "My Orders" — the user's order history. Shows an active order (delivery
 * tracking) plus a "Buy again" rail when there are orders; otherwise a friendly
 * empty state. The global TopBar (back) and floating nav come from AppLayout,
 * so the page only owns its centered title + content.
 */
export default function OrdersPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const isHe = language === 'he';
  // Mock: flip to false to preview the empty state.
  const hasOrders = !!ACTIVE_PRODUCT;

  const brandName = isHe ? ORDER_BUSINESS.nameHe : ORDER_BUSINESS.name;
  // Gradient fill for the delivery progress bar — runs from the start edge.
  const barGradient = `linear-gradient(${isHe ? 'to left' : 'to right'}, #635bff 0%, #7b6bff 45%, #00c2cb 100%)`;

  return (
    <div className="animate-fade-in min-h-[100dvh] flex flex-col pb-28">
      {/* Page title — matches the business-page section headers (Stories /
          Products): text-2xl bold, start-aligned. pt-28 clears the floating
          TopBar overlay and drops the whole page lower. */}
      <header className="px-6 pt-28 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {isHe ? 'ההזמנות שלי' : 'My Orders'}
        </h1>
      </header>

      {!hasOrders ? (
        /* ── Empty state ── */
        <div className="flex-grow flex flex-col items-center justify-center px-10 -mt-12 text-center">
          <div className="relative mb-8 flex items-center justify-center w-40 h-32">
            <div className="absolute bottom-2 w-28 h-5 rounded-[100%] bg-black/10 blur-md" aria-hidden />
            <span
              className="relative z-10 select-none"
              role="img"
              aria-label={isHe ? 'קופסה' : 'Box'}
              style={{ fontSize: 92, lineHeight: 1, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))' }}
            >
              📦
            </span>
          </div>
          <h2 className="text-[22px] font-bold text-text-primary leading-tight">
            {isHe ? 'אין הזמנות עדיין' : 'No orders yet'}
          </h2>
          <p className="mt-3 text-[15px] text-text-muted leading-relaxed max-w-[270px]">
            {isHe
              ? 'כאן יופיעו ההזמנות שתבצע — מעקב, קבלות ופרטים, הכול במקום אחד.'
              : 'Orders you place will show up here — tracking, receipts and details, all in one place.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Active order — delivery tracking card (taps through to the
              full tracking screen) ── */}
          <section className="px-4 mb-8">
            <button
              type="button"
              onClick={() => navigate(`/${lang}/orders/track`)}
              className="block w-full text-start bg-white rounded-2xl border border-border p-3.5 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-stretch gap-3">
                {/* Content column — brand + status + (short) progress bar */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Brand */}
                  <div className="flex items-center gap-2 mb-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                      <img src={ORDER_BUSINESS.logoUrl} alt="" className="w-5 h-5 object-contain" />
                    </div>
                    <span className="text-[13px] font-semibold text-text-primary truncate">{brandName}</span>
                  </div>

                  {/* Status + progress grouped at the bottom so the "arrives"
                      title sits snug above the bar. */}
                  <div className="mt-auto">
                    <h2 className="text-sm font-bold text-text-primary mb-2">
                      {isHe ? 'מגיע ביום חמישי' : 'Arrives Thursday'}
                    </h2>
                    <div className="relative h-2 bg-border/60 rounded-full">
                      {/* Gradient fill from the start edge */}
                      <div
                        className="absolute inset-y-0 rounded-full"
                        style={{ insetInlineStart: 0, width: '40%', background: barGradient }}
                      />
                      {/* Stops — white centre, ringed by the local bar colour */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary" style={{ insetInlineStart: 0 }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-border" />
                      <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-border" style={{ insetInlineEnd: 0 }} />
                      {/* Delivery marker over the bar */}
                      <div
                        className="absolute -top-2.5 bg-white rounded-full p-0.5 shadow-md border border-border"
                        style={{ insetInlineStart: '35%' }}
                      >
                        <div className="w-5 h-5 bg-surface rounded-full flex items-center justify-center text-xs leading-none">📦</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product image — a square thumbnail */}
                <div className="relative w-24 h-24 bg-surface rounded-xl overflow-hidden border border-border shrink-0">
                  <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                    <span className="material-symbols-rounded" style={{ fontSize: 28 }}>shopping_bag</span>
                  </span>
                  <img
                    src={ACTIVE_PRODUCT.image}
                    alt=""
                    className="relative w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            </button>
          </section>

          {/* ── Buy again ── */}
          <section className="mb-4">
            <div className="flex items-center justify-between mb-4 px-6">
              <h3 className="text-[19px] font-bold text-text-primary">{isHe ? 'לקנות שוב' : 'Buy again'}</h3>
              <div className="bg-surface p-1.5 rounded-full">
                <span className="material-symbols-rounded text-text-primary block leading-none" style={{ fontSize: 16 }}>
                  {isHe ? 'chevron_left' : 'chevron_right'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-6 pt-1 pb-3">
              {BUY_AGAIN.map((p) => (
                <div key={p.id} className="relative shrink-0 w-[100px]">
                  {/* Image — clipped to rounded corners. The add button lives on
                      the outer wrapper so it isn't cropped by this overflow. */}
                  <div className="relative w-[100px] h-[130px] bg-surface rounded-2xl border border-border overflow-hidden">
                    {/* Fallback shown if the product image fails to load. */}
                    <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                      <span className="material-symbols-rounded" style={{ fontSize: 30 }}>shopping_bag</span>
                    </span>
                    <img
                      src={p.image}
                      alt={isHe ? p.nameHe : p.name}
                      className="relative w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={isHe ? 'הוספה לסל' : 'Add to cart'}
                    className="absolute -bottom-1.5 -end-1.5 w-8 h-8 bg-bg-dark rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-rounded leading-none" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Archived orders — sits right under the "buy again" gallery,
              styled like the grey "visit" button on the product page. ── */}
          <section className="px-6">
            <button
              type="button"
              className="w-full bg-surface rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
            >
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>inventory_2</span>
              {isHe ? 'צפייה בהזמנות בארכיון' : 'View archived orders'}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
