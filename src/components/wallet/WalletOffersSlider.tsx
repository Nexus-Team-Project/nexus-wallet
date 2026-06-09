import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';

/**
 * Cashback percentage per business. There's no field in the mock data, so we
 * derive a stable value from the id (clean 5–30% steps) for a consistent look.
 */
function cashbackPct(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  const steps = [5, 8, 10, 12, 15, 20, 25, 30];
  return steps[sum % steps.length];
}

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
  // Active tenant — its logo is overlaid on a few of the cashback brands.
  const tenant = useTenantStore((s) => s.config);

  const title = isHe ? 'קאשבק' : 'Cashback';

  // Three (stable, pseudo-random) brands get the tenant-logo overlay badge.
  const badgedIds = new Set(
    [...mockBusinesses]
      .sort(
        (a, b) =>
          [...a.id].reduce((s, c) => s + c.charCodeAt(0), 0) -
          [...b.id].reduce((s, c) => s + c.charCodeAt(0), 0),
      )
      .slice(0, 3)
      .map((b) => b.id),
  );

  // The "עוד" button on the Cashback section sends the user to the home page.
  const goHome = () => navigate(`/${lang}`);

  if (!mockBusinesses.length) return null;

  // Two horizontally-scrollable rows.
  const half = Math.ceil(mockBusinesses.length / 2);
  const rows = [mockBusinesses.slice(0, half), mockBusinesses.slice(half)];

  const renderCard = (biz: (typeof mockBusinesses)[number]) => (
    <button
      key={biz.id}
      onClick={() => navigate(`/${lang}/business/${biz.id}`)}
      className="rounded-[20px] p-3 flex flex-col justify-between min-h-[116px] w-[112px] shrink-0 text-start active:scale-95 transition-transform duration-100"
      style={{ backgroundColor: '#f1f1f3' }}
    >
      {/* Logo — soft drop shadow so the circle appears to float */}
      <div className="relative w-12 h-12 mb-3">
        <div
          className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: brandBgColors[biz.id] || '#FFFFFF',
            boxShadow: '0 7px 14px -3px rgba(0,0,0,0.28)',
          }}
        >
          {biz.logoUrl ? (
            <img
              src={biz.logoUrl}
              alt={isHe ? biz.nameHe : biz.name}
              className={FULL_BLEED_LOGOS.has(biz.id) ? 'w-full h-full object-cover' : 'w-[82%] h-[82%] object-contain'}
            />
          ) : (
            <span className="text-xl">{biz.logo}</span>
          )}
        </div>
        {/* Tenant-logo overlay badge — top-right, on a few brands only */}
        {tenant && badgedIds.has(biz.id) && (
          <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full overflow-hidden border-[1.5px] border-white bg-white shadow-sm flex items-center justify-center">
            <img src={tenant.logo} alt="" className="w-full h-full object-contain p-px" />
          </div>
        )}
      </div>

      {/* Name + cashback line */}
      <div>
        <p className="text-[13px] font-bold text-text-primary leading-tight line-clamp-1">
          {isHe ? biz.nameHe : biz.name}
        </p>
        <p className="text-[11px] font-normal text-emerald-600 mt-0.5">
          {cashbackPct(biz.id)}% {isHe ? 'קאשבק' : 'cashback'}
        </p>
      </div>
    </button>
  );

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

      {/* Collapsible — two horizontally-scrollable rows of cashback cards
          (grey rounded boxes: round logo + store name + cashback % in green). */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex flex-col gap-3 py-1">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-3 overflow-x-auto hide-scrollbar px-5">
              {row.map(renderCard)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
