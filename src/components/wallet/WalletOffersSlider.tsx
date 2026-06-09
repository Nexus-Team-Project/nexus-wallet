import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useVouchers } from '../../hooks/useVouchers';
import { SliderCard } from '../store/StoreSliders';
import VoucherDetail from '../store/VoucherDetail';
import type { Voucher } from '../../types/voucher.types';

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
 * WalletOffersSlider — "הטבות במיוחד בשבילך" row shown below the wallet
 * widgets. The card row reuses the home page slider design (gradient
 * vertical label + horizontal voucher cards), but the section HEADER is
 * styled to match the other wallet sections (bold title + collapse
 * chevron) rather than the home slider's small header.
 */
export default function WalletOffersSlider({
  editEnabled = false,
  isHidden = false,
  onToggleHidden,
  onReorderPointerDown,
}: WalletOffersSliderProps = {}) {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const { data: allVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [open, setOpen] = useState(true);

  const title = isHe ? 'קאשבק' : 'Cashback';

  // Personalized-feel subset: highest-discount, in-stock, not coming soon.
  // Require a real photo (imageUrl) AND a real brand logo so every card
  // renders realistically — no emoji placeholders or broken logo images.
  const vouchers = [...(allVouchers ?? [])]
    .filter((v) => !v.comingSoon && v.inStock && !!v.imageUrl && !!v.brandLogo)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 8);

  const goToStore = () => navigate(`/${lang}/store`, { state: { filter: 'recommended' } });
  // The "עוד" button on the Cashback section sends the user to the home page.
  const goHome = () => navigate(`/${lang}`);

  if (!vouchers.length) return null;

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

      {/* Collapsible card row */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 snap-x snap-mandatory items-stretch">
          {/* Gradient label rectangle — matches home slider pattern */}
          <div
            className="flex-none w-[90px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(to bottom, #ec4899, #a855f7)', minHeight: '20vh' }}
          >
            <span
              className="text-white text-sm font-bold whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {title}
            </span>
          </div>

          {vouchers.map((v) => (
            <SliderCard
              key={v.id}
              voucher={v}
              isHe={isHe}
              onSelect={setSelectedVoucher}
              comingSoonLabel={t.store.comingSoon}
              outOfStockLabel={t.store.outOfStock}
            />
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

      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </section>
  );
}
