import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';

interface WalletOffersSliderProps {
  /** When the wallet is in "Customize" mode, the section header shows an
   *  eye (hide/show) toggle and a grip handle for vertical reordering. */
  editEnabled?: boolean;
  isHidden?: boolean;
  onToggleHidden?: () => void;
  /** Pointer-down on the grip starts the parent Reorder.Item drag. */
  onReorderPointerDown?: (e: React.PointerEvent) => void;
}

/**
 * WalletOffersSlider — the wallet "קאשבק" (Cashback) section. It shows a
 * horizontal row of round business logos (the same treatment as the home
 * "Our Brands" slider), under a wallet-style collapsible section header.
 */
export default function WalletOffersSlider({
  editEnabled = false,
  isHidden = false,
  onToggleHidden,
  onReorderPointerDown,
}: WalletOffersSliderProps = {}) {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const [open, setOpen] = useState(true);

  const title = isHe ? 'קאשבק' : 'Cashback';

  const goToStore = () => navigate(`/${lang}/store`, { state: { filter: 'recommended' } });
  // The "עוד" button on the Cashback section sends the user to the home page.
  const goHome = () => navigate(`/${lang}`);

  if (!mockBusinesses.length) return null;

  return (
    <section className="mb-6">
      {/* Wallet-style section header — matches widgets / vouchers sections */}
      <div className="flex items-center justify-between w-full px-5 mb-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 active:opacity-70 transition-opacity"
        >
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <span
            className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            style={{ fontSize: '20px' }}
          >
            expand_more
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={goHome}
            className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal active:scale-95 transition-colors"
          >
            {isHe ? 'עוד' : 'More'}
          </button>
          {editEnabled && (
            <>
              <button
                type="button"
                onClick={onToggleHidden}
                className="text-text-muted p-1 -m-1 active:opacity-60"
                aria-label={isHidden ? 'Show section' : 'Hide section'}
              >
                {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <span
                onPointerDown={onReorderPointerDown}
                className="touch-none cursor-grab active:cursor-grabbing text-text-muted p-1 -m-1"
                aria-label="Reorder section"
              >
                <GripVertical size={18} />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Collapsible logos row — round business logos, like "Our Brands" */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[260px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex overflow-x-auto hide-scrollbar gap-4 px-5 items-center">
          {mockBusinesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => navigate(`/${lang}/business/${biz.id}`)}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
            >
              <div
                className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-sm flex items-center justify-center"
                style={{ backgroundColor: brandBgColors[biz.id] || '#FFFFFF' }}
              >
                {biz.logoUrl ? (
                  <img
                    src={biz.logoUrl}
                    alt={isHe ? biz.nameHe : biz.name}
                    className={FULL_BLEED_LOGOS.has(biz.id) ? 'w-full h-full object-cover' : 'w-[85%] h-[85%] object-contain'}
                  />
                ) : (
                  <span className="text-2xl">{biz.logo}</span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[60px] line-clamp-1">
                {isHe ? biz.nameHe : biz.name}
              </span>
            </button>
          ))}

          {/* Arrow bubble — sky-blue, matches home slider */}
          <div className="flex-none flex items-center justify-center px-1">
            <button
              onClick={goToStore}
              className="w-10 h-10 bg-sky-100 flex items-center justify-center active:scale-90 transition-transform rounded-full"
            >
              <span className="material-symbols-outlined text-sky-600" style={{ fontSize: '20px' }}>
                chevron_left
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
