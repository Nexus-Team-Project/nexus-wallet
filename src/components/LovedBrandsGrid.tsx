import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { mockBusinesses } from '../mock/data/businesses.mock';

/**
 * LovedBrandsGrid — the About page's take on the home page's dark
 * RecentlyViewed card: same shell (dark gradient, 3×3 white tiles, big
 * footer title + arrow), but chains/brands only — no products, no price
 * tags, no hearts. Each tile is a brand logo with its cashback % pinned
 * to the top-right corner (literal right in Hebrew via inline-start).
 */

// Cashback %, derived stably per brand — same 5–30% steps as the store
// rows (vouchers/businesses carry no cashback field in the mock data).
function cashbackPct(key: string): number {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  const steps = [5, 8, 10, 12, 15, 20, 25, 30];
  return steps[sum % steps.length];
}

export default function LovedBrandsGrid() {
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [open, setOpen] = useState(false);

  const brands = mockBusinesses.filter((b) => b.logoUrl).slice(0, 9);
  if (brands.length === 0) return null;

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-5 mb-6 rounded-3xl p-5 text-white"
      style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)' }}
    >
      {/* Header — big title on top */}
      <h2 className="text-[28px] font-semibold leading-[1.05] tracking-tight">
        {isHe ? 'צבירה במאות מותגים שאוהבים' : 'Earn at hundreds of brands you love'}
      </h2>

      {/* 3×3 brand-logo grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/${lang}/business/${b.id}`)}
            className="aspect-square rounded-xl bg-white relative flex items-center justify-center p-4 active:scale-[0.97] transition-transform"
          >
            <img
              src={b.logoUrl}
              alt={isHe ? b.nameHe : b.name}
              className="max-h-[60%] max-w-[80%] object-contain"
              // Castro's wordmark is white — flatten it to black on the tile.
              style={b.id === 'biz_002' ? { filter: 'brightness(0)' } : undefined}
            />
            {/* Cashback % — top, inline-start (top-right in Hebrew). Same
                rectangular gray tag treatment as the product price tags,
                one size up. */}
            <span
              className="absolute top-2 px-2 py-1 rounded text-white text-xs font-semibold bg-black/45 backdrop-blur-sm"
              style={{ insetInlineStart: 8 }}
              dir="ltr"
            >
              {cashbackPct(b.name)}%
            </span>
          </button>
        ))}
      </div>

      {/* Footer — small "learn more" label + arrow. Toggles the accordion
          panel below; the panel is in normal flow, so opening it pushes
          everything under the card further down the page. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 w-full flex items-center justify-between active:opacity-80 transition-opacity"
      >
        <span className="text-sm font-medium text-white/60">
          {isHe ? 'למד עוד' : 'Learn more'}
        </span>
        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          {/* Side arrow as in the original card; rotates to point down
              while the accordion is open. */}
          <span
            className="material-symbols-rounded text-white/90 block transition-transform duration-300"
            style={{ fontSize: 22, transform: open ? `rotate(${isHe ? -90 : 90}deg)` : 'none' }}
          >
            {isHe ? 'arrow_back' : 'arrow_forward'}
          </span>
        </span>
      </button>

      {/* Accordion panel — grid-rows trick animates height 0→auto without
          measuring; the inner overflow-hidden clips while collapsed. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          {/* TODO: real content TBD — placeholder copy for now */}
          <p className="pt-4 text-sm leading-relaxed text-white/70">
            {isHe
              ? 'כאן יופיע בקרוב הסבר מפורט על איך הצבירה עובדת אצל המותגים המשתתפים. טקסט זמני.'
              : 'A detailed explanation of how earning works at participating brands will appear here soon. Placeholder text.'}
          </p>
        </div>
      </div>
    </section>
  );
}
