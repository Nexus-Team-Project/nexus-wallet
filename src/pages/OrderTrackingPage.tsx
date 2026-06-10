import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';

// Mock order — same source as the orders list so brand / product resolve.
const ORDER_BUSINESS = mockBusinesses.find((b) => (b.products?.length ?? 0) >= 2) ?? mockBusinesses[0];
const ACTIVE_PRODUCT = (ORDER_BUSINESS.products ?? [])[0];
const TRACKING_NUMBER = '92612902103258000179584347';

/**
 * Order tracking — the delivery detail screen reached by tapping the active
 * order on the Orders page. Shows a map, ETA + address, the carrier tracking
 * number, the item, and quick actions (receipt / contact / visit store).
 * The global TopBar (back) and floating nav come from AppLayout.
 */
export default function OrderTrackingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const isHe = language === 'he';

  const brandName = isHe ? ORDER_BUSINESS.nameHe : ORDER_BUSINESS.name;
  const productName = ACTIVE_PRODUCT ? (isHe ? ACTIVE_PRODUCT.nameHe : ACTIVE_PRODUCT.name) : '';

  return (
    <div className="animate-fade-in min-h-[100dvh] pb-28">
      {/* Brand header — pt-20 clears the floating TopBar overlay. */}
      <header className="px-5 pt-20 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
            <img src={ORDER_BUSINESS.logoUrl} alt="" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight text-text-primary truncate">{brandName}</h1>
            <p className="text-text-muted text-sm">{isHe ? 'פריט אחד • בדרך אליך' : '1 item • In transit'}</p>
          </div>
        </div>
        <button type="button" aria-label={isHe ? 'אפשרויות' : 'Options'} className="p-2 text-text-secondary active:opacity-60">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>more_horiz</span>
        </button>
      </header>

      <main className="px-5 space-y-4">
        {/* ── Tracking card ── */}
        <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Map */}
          <div
            className="h-44 w-full relative bg-surface"
            style={{ backgroundImage: 'url(/wallet-nearby-map.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-7 h-7 bg-bg-dark rounded-full border-4 border-white shadow-lg" />
            </div>
          </div>

          {/* Details */}
          <div className="p-5">
            <h2 className="font-bold text-lg text-text-primary">{isHe ? 'מגיע ביום חמישי' : 'Arrives Thursday'}</h2>
            <p className="text-text-secondary text-sm mb-4">{isHe ? 'תל אביב-יפו, ישראל' : 'Tel Aviv-Yafo, Israel'}</p>

            {/* Carrier + tracking number */}
            <div className="bg-surface rounded-xl p-3 flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-text-secondary" style={{ fontSize: 20 }}>local_shipping</span>
              </span>
              <span className="text-xs font-medium tracking-tight text-text-primary truncate" dir="ltr">{TRACKING_NUMBER}</span>
            </div>

            {/* Item */}
            <div className="flex items-center gap-4 bg-surface/60 rounded-2xl p-3">
              <div className="relative w-16 h-16 bg-white rounded-xl overflow-hidden border border-border shrink-0">
                <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>shopping_bag</span>
                </span>
                <img
                  src={ACTIVE_PRODUCT?.image}
                  alt=""
                  className="relative w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-text-primary truncate">{productName}</h3>
                {ACTIVE_PRODUCT && (
                  <p className="text-text-muted text-sm" dir="ltr">{ACTIVE_PRODUCT.currency}{ACTIVE_PRODUCT.price}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action links ── */}
        <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border/60">
          <button type="button" className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start active:bg-surface transition-colors">
            <span className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-rounded text-text-secondary shrink-0" style={{ fontSize: 22 }}>receipt_long</span>
              <span className="font-medium text-text-primary truncate">{isHe ? 'קבלה' : 'Order receipt'}</span>
            </span>
            <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>{isHe ? 'chevron_left' : 'chevron_right'}</span>
          </button>
          <button type="button" className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start active:bg-surface transition-colors">
            <span className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-rounded text-text-secondary shrink-0" style={{ fontSize: 22 }}>mail</span>
              <span className="font-medium text-text-primary truncate">{isHe ? `צרו קשר עם ${brandName}` : `Contact ${brandName}`}</span>
            </span>
            <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>{isHe ? 'chevron_left' : 'chevron_right'}</span>
          </button>
        </div>

        {/* ── Visit store ── */}
        <button
          type="button"
          onClick={() => navigate(`/${lang}/business/${ORDER_BUSINESS.id}/store`)}
          className="w-full bg-surface rounded-2xl py-4 font-bold text-sm text-text-primary active:opacity-70 transition-opacity"
        >
          {isHe ? 'ביקור בחנות' : 'Visit store'}
        </button>
      </main>
    </div>
  );
}
