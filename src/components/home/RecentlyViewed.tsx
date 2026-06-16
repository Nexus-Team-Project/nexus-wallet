import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';

type Tile =
  | {
      kind: 'brand';
      key: string;
      name: string;
      logoUrl: string;
      invert?: boolean;
      onClick: () => void;
    }
  | {
      kind: 'product';
      key: string;
      name: string;
      image: string;
      price: number;
      currency: string;
      onClick: () => void;
    };

/**
 * RecentlyViewed — a dark "jump back in" card with a 3×3 grid of recently-seen
 * brands + products. Brand tiles show the logo on a light chip; product tiles
 * show the image with a price tag and a heart you can favourite (turns the
 * brand purple). A big "נצפו לאחרונה" title + arrow sit at the foot.
 *
 * Data is a placeholder mix from the mock catalogue — wire it to a real
 * recently-viewed store later.
 */
export default function RecentlyViewed() {
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const toggleFav = (key: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Build a mixed grid from the catalogue: brands with a logo + a product each.
  const brandBiz = mockBusinesses.filter((b) => b.logoUrl);
  const productEntries = mockBusinesses.flatMap((b) =>
    (b.products ?? [])
      .filter((p) => p.image)
      .slice(0, 1)
      .map((p) => ({ b, p })),
  );

  const order: ('b' | 'p')[] = ['b', 'p', 'b', 'p', 'p', 'b', 'p', 'b', 'p'];
  let bi = 0;
  let pi = 0;
  const tiles: Tile[] = [];
  for (const want of order) {
    const tryBrand = want === 'b' ? brandBiz[bi] : undefined;
    if (tryBrand) {
      bi++;
      tiles.push({
        kind: 'brand',
        key: `b-${tryBrand.id}`,
        name: isHe ? tryBrand.nameHe : tryBrand.name,
        logoUrl: tryBrand.logoUrl as string,
        invert: tryBrand.id === 'biz_002', // Castro's wordmark is white
        onClick: () => navigate(`/${lang}/business/${tryBrand.id}`),
      });
    } else if (productEntries[pi]) {
      const { b, p } = productEntries[pi++];
      tiles.push({
        kind: 'product',
        key: `p-${b.id}-${p.id}`,
        name: isHe ? p.nameHe : p.name,
        image: p.image,
        price: p.price,
        currency: p.currency,
        onClick: () => navigate(`/${lang}/business/${b.id}/product/${p.id}`),
      });
    } else if (brandBiz[bi]) {
      const b = brandBiz[bi++];
      tiles.push({
        kind: 'brand',
        key: `b-${b.id}`,
        name: isHe ? b.nameHe : b.name,
        logoUrl: b.logoUrl as string,
        invert: b.id === 'biz_002',
        onClick: () => navigate(`/${lang}/business/${b.id}`),
      });
    }
  }

  if (tiles.length === 0) return null;

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-5 mb-6 rounded-3xl p-5 text-white"
      style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)' }}
    >
      <p className="text-sm font-medium text-white/60">
        {isHe ? 'המשיכו לצפות' : 'Jump back in'}
      </p>

      {/* 3×3 tile grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {tiles.map((tile) =>
          tile.kind === 'brand' ? (
            <button
              key={tile.key}
              onClick={tile.onClick}
              className="aspect-square rounded-xl bg-white flex items-center justify-center p-4 active:scale-[0.97] transition-transform"
            >
              <img
                src={tile.logoUrl}
                alt={tile.name}
                className="max-h-[60%] max-w-[80%] object-contain"
                style={tile.invert ? { filter: 'brightness(0)' } : undefined}
              />
            </button>
          ) : (
            <button
              key={tile.key}
              onClick={tile.onClick}
              className="aspect-square rounded-xl overflow-hidden relative bg-white active:scale-[0.97] transition-transform"
            >
              <img
                src={tile.image}
                alt={tile.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Price tag — top, inline-start */}
              <span
                className="absolute top-2 px-1.5 py-0.5 rounded text-white text-[10px] font-semibold bg-black/40 backdrop-blur-sm"
                style={{ insetInlineStart: 8 }}
                dir="ltr"
              >
                {tile.currency}{tile.price}
              </span>
              {/* Favourite heart — bottom, inline-end */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(tile.key);
                }}
                className={`absolute bottom-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                  favs.has(tile.key) ? 'bg-primary' : 'bg-white/30'
                }`}
                style={{ insetInlineEnd: 8 }}
                aria-label="Favorite"
              >
                <Heart
                  size={15}
                  className="text-white"
                  fill={favs.has(tile.key) ? 'currentColor' : 'none'}
                  strokeWidth={2}
                />
              </span>
            </button>
          ),
        )}
      </div>

      {/* Footer — big title + arrow */}
      <div className="mt-4 flex items-end justify-between">
        <h2 className="text-[28px] font-semibold leading-[1.05] tracking-tight">
          {isHe ? 'נצפו' : 'Recently'}<br />{isHe ? 'לאחרונה' : 'viewed'}
        </h2>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          aria-label={isHe ? 'הכל' : 'See all'}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 active:scale-90 transition-transform"
        >
          <span className="material-symbols-rounded text-white/90 block" style={{ fontSize: 22 }}>
            {isHe ? 'arrow_back' : 'arrow_forward'}
          </span>
        </button>
      </div>
    </section>
  );
}
