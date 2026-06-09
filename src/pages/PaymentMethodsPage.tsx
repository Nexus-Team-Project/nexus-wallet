import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reorder, motion, useDragControls, type PanInfo } from 'framer-motion';
import { Plus, GripVertical, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods, type PaymentMethod } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';

// Width of the action button revealed behind the card on swipe. Card
// snaps open to exactly this width.
const ACTION_WIDTH = 96;
const OPEN_DISTANCE = 36;
const OPEN_VELOCITY = 400;

/**
 * Single payment-method row.
 *
 * Two gestures live on this row:
 *  - Vertical drag → Reorder (handled by `Reorder.Item`, triggered only
 *    via the GripVertical handle so the rest of the card stays free).
 *  - Horizontal swipe → reveal the "Settings" action button behind the
 *    card (own `<motion.div>` with `drag="x"` clamped to ACTION_WIDTH).
 *
 * The two are mutually exclusive in practice because the dragControls
 * gate the vertical drag to the handle only.
 */
function PaymentMethodRow({
  card,
  isDefault,
  isRTL,
  mainCardLabel,
  settingsLabel,
  onOpenSettings,
}: {
  card: PaymentMethod;
  isDefault: boolean;
  isRTL: boolean;
  mainCardLabel: string;
  settingsLabel: string;
  onOpenSettings: (cardId: string) => void;
}) {
  const dragControls = useDragControls();
  const [isOpen, setIsOpen] = useState(false);
  const justDraggedRef = useRef(false);

  // Swipe direction matches the in-app NotificationsPage pattern:
  // the card always slides LEFT, revealing the action button on the
  // RIGHT — regardless of LTR/RTL. Consistent across the app.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const draggedFar = info.offset.x < -OPEN_DISTANCE;
    const flicked = info.velocity.x < -OPEN_VELOCITY;
    setIsOpen(draggedFar || flicked);
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 100);
  };

  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
    >
      {/* Settings backplate — always on the right edge, exposed when
          the card slides left. */}
      <button
        type="button"
        onClick={() => onOpenSettings(card.id)}
        aria-label={settingsLabel}
        tabIndex={isOpen ? 0 : -1}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 text-text-secondary active:text-text-primary font-medium text-xs"
        style={{ width: ACTION_WIDTH }}
      >
        <Settings size={22} />
        <span>{settingsLabel}</span>
      </button>

      {/* Swipeable card layer — opaque white background so it fully
          covers the backplate when closed. `relative z-10` lifts it
          above the backplate in the stacking context. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={{ left: 0.05, right: 0.05 }}
        dragMomentum={false}
        animate={{ x: isOpen ? -ACTION_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        onDragStart={() => {
          justDraggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onClickCapture={(e) => {
          if (isOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
            return;
          }
          if (justDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative z-10 bg-white rounded-2xl p-4 flex items-center gap-3 select-none"
      >
        {/* Drag handle — pointer-down here starts the reorder drag via
            dragControls, so the rest of the card stays available for
            horizontal swipes. */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
          aria-label="Reorder"
        >
          <GripVertical size={20} />
        </div>
        <PaymentBrandMark brand={card.brand} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-text-primary truncate">
            {isRTL ? card.labelHe : card.label}
          </div>
          {isDefault && (
            <div className="text-xs font-semibold text-primary mt-0.5">
              {mainCardLabel}
            </div>
          )}
        </div>
      </motion.div>

      {/* Scrim — when the row is open, a tap on the visible card surface
          (everything left of the revealed Settings button) closes it. */}
      {isOpen && (
        <div
          aria-hidden
          onClick={() => setIsOpen(false)}
          className="absolute inset-y-0 left-0 z-20"
          style={{ width: `calc(100% - ${ACTION_WIDTH}px)` }}
        />
      )}
    </Reorder.Item>
  );
}

/**
 * PaymentMethodsPage
 *
 * Lists the user's saved payment methods. The first card in the list is
 * the "main" card (default for charges) — the user can drag rows by
 * the grip handle to reorder, and swipe rows sideways to reveal a
 * Settings action button.
 */
export default function PaymentMethodsPage() {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { data: initialCards } = usePaymentMethods();

  const [cards, setCards] = useState<PaymentMethod[]>(initialCards);

  const handleAddAnother = () => {
    // Navigate without the `entry: 'wallet-cta'` state so the dark
    // slide-down curtain does NOT play here — that animation belongs
    // only to the wallet's "Add card details" prompt on the dark
    // balance card.
    navigate(`/${lang}/wallet/add-payment-method`);
  };

  const handleOpenSettings = (cardId: string) => {
    // Placeholder — production wiring will navigate to a per-card
    // settings sheet (rename, set default, remove, etc.).
    console.log('[PaymentMethods] open settings for', cardId);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col max-w-md mx-auto pt-16">
      {/* Content — plain white background, no decorative panel. Each
          card row is its own swipeable + reorderable surface. The first
          row is the default. Back button lives in the AppLayout TopBar
          overlay so it isn't repeated here. */}
      <main className="flex-grow px-4 pb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-5 mt-2">
          {t.wallet.paymentMethodsTitle}
        </h2>

        <Reorder.Group
          axis="y"
          values={cards}
          onReorder={setCards}
          className="space-y-3"
        >
          {cards.map((card, index) => (
            <PaymentMethodRow
              key={card.id}
              card={card}
              isDefault={index === 0}
              isRTL={isRTL}
              mainCardLabel={t.wallet.mainCard}
              settingsLabel={t.wallet.cardSettings}
              onOpenSettings={handleOpenSettings}
            />
          ))}
        </Reorder.Group>

        {/* "Add another card" row — dashed outlined tile sitting under
            the reorder list (not draggable). */}
        <button
          type="button"
          onClick={handleAddAnother}
          className="mt-3 w-full bg-white border-2 border-dashed border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-surface transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
            <Plus size={20} className="text-text-primary" strokeWidth={2.4} />
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="text-text-primary font-bold text-base">
              {t.wallet.addAnotherCard}
            </div>
            <div className="text-text-muted text-xs">
              {t.wallet.addCardDescription}
            </div>
          </div>
        </button>
      </main>
    </div>
  );
}
