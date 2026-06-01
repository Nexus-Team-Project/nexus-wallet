import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Boxes, CreditCard, Ticket, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  useWalletLayoutStore,
  DEFAULT_SECTION_ORDER,
  type WalletSectionId,
} from '../stores/walletLayoutStore';

/**
 * Single draggable row representing one wallet section. Vertical drag is
 * triggered only through the grip handle (via dragControls) so taps on
 * the row body don't accidentally start a reorder.
 */
function SectionRow({
  id,
  label,
  icon,
}: {
  id: WalletSectionId;
  label: string;
  icon: React.ReactNode;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] select-none"
      whileDrag={{
        scale: 1.02,
        zIndex: 20,
        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
      }}
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
        aria-label="Reorder"
      >
        <GripVertical size={20} />
      </div>
      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-text-primary truncate">
          {label}
        </div>
      </div>
    </Reorder.Item>
  );
}

/**
 * WalletCustomizePage
 *
 * Reached from Profile → Settings → "Customize your wallet". Lists the
 * wallet's reorderable sections in their current order — user drags
 * rows to rearrange, taps Save to persist the new order to the wallet
 * layout store, which the wallet page reads when rendering.
 */
export default function WalletCustomizePage() {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const storedOrder = useWalletLayoutStore((s) => s.sectionOrder);
  const setOrder = useWalletLayoutStore((s) => s.setOrder);
  const resetOrder = useWalletLayoutStore((s) => s.resetOrder);

  // Local working copy so the wallet page doesn't re-render with every
  // intermediate drag — only on Save.
  const [order, setLocalOrder] = useState<WalletSectionId[]>(storedOrder);

  const SECTION_META: Record<
    WalletSectionId,
    { label: string; icon: React.ReactNode }
  > = {
    widgets: {
      label: t.profile.customizeSectionWidgets,
      icon: <Boxes size={20} strokeWidth={1.6} />,
    },
    offers: {
      label: t.profile.customizeSectionOffers,
      icon: <Sparkles size={20} strokeWidth={1.6} />,
    },
    digitalCards: {
      label: t.profile.customizeSectionDigitalCards,
      icon: <CreditCard size={20} strokeWidth={1.6} />,
    },
    vouchers: {
      label: t.profile.customizeSectionVouchers,
      icon: <Ticket size={20} strokeWidth={1.6} />,
    },
  };

  const isDirty =
    order.length !== storedOrder.length ||
    order.some((id, i) => id !== storedOrder[i]);

  const isAtDefault =
    order.length === DEFAULT_SECTION_ORDER.length &&
    DEFAULT_SECTION_ORDER.every((id, i) => order[i] === id);

  const handleSave = () => {
    setOrder(order);
    navigate(`/${lang}/wallet`);
  };

  const handleReset = () => {
    resetOrder();
    setLocalOrder(DEFAULT_SECTION_ORDER);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col max-w-md mx-auto pt-16 pb-28">
      {/* Header — category-style large title; back lives in the global
          TopBar overlay above. */}
      <header className="px-4 pt-4 pb-3">
        <h1
          className={`text-3xl font-extrabold text-text-primary leading-tight ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          {t.profile.customizeWalletTitle}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t.profile.customizeWalletHint}
        </p>
      </header>

      {/* Reorderable rows. */}
      <main className="flex-grow px-4">
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setLocalOrder}
          className="space-y-3"
        >
          {order.map((id) => (
            <SectionRow
              key={id}
              id={id}
              label={SECTION_META[id].label}
              icon={SECTION_META[id].icon}
            />
          ))}
        </Reorder.Group>

        {/* Reset link — only visible when the user has moved things. */}
        {!isAtDefault && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-text-secondary text-sm font-medium hover:underline"
            >
              {t.profile.customizeResetDefault}
            </button>
          </div>
        )}
      </main>

      {/* Fixed CTA — saves the order. */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/85 backdrop-blur-sm border-t border-border/60 px-6 pt-4 pb-6 z-20">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
            isDirty
              ? 'bg-bg-dark text-white shadow-lg shadow-bg-dark/20 active:scale-[0.98] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t.profile.customizeSave}
        </button>
      </footer>
    </div>
  );
}
