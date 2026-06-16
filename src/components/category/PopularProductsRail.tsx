import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';

/**
 * PopularProductsRail — a horizontal slider of popular products pulled from
 * several different stores (one–two per brand), each tile showing the store, the
 * product and its price. Tapping a tile opens that product. Used on the category
 * page in place of the voucher-based trending slider.
 */
export default function PopularProductsRail() {
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Spread across stores: take up to two products from each business that has
  // them, so the rail visibly mixes brands.
  const items = mockBusinesses
    .filter((b) => (b.products?.length ?? 0) > 0)
    .flatMap((b) => (b.products ?? []).filter((p) => p.image).slice(0, 2).map((p) => ({ biz: b, p })))
    .slice(0, 12);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-6">
        <h3 className="text-[19px] font-bold text-text-primary">
          {isHe ? 'מוצרים פופולריים' : 'Popular products'}
        </h3>
        <button
          type="button"
          onClick={() => navigate(`/${lang}/store`)}
          className="bg-surface p-1.5 rounded-full active:opacity-70"
          aria-label={isHe ? 'הכל' : 'See all'}
        >
          <span className="material-symbols-rounded text-text-primary block leading-none" style={{ fontSize: 16 }}>
            {isHe ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-6 pt-1 pb-3">
        {items.map(({ biz, p }) => (
          <button
            key={`${biz.id}-${p.id}`}
            type="button"
            onClick={() => navigate(`/${lang}/business/${biz.id}/product/${p.id}`)}
            className="shrink-0 w-[150px] text-start active:scale-[0.98] transition-transform"
          >
            <div className="relative w-full aspect-[4/5] bg-surface rounded-2xl border border-border overflow-hidden">
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
            <p className="mt-2 text-[11px] text-text-muted truncate">{isHe ? biz.nameHe : biz.name}</p>
            <p className="text-sm font-semibold text-text-primary truncate leading-tight">{isHe ? p.nameHe : p.name}</p>
            <p className="text-sm font-bold text-text-primary mt-0.5" dir="ltr">{p.currency}{p.price}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
