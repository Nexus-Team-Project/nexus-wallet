import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reorder, motion, useDragControls, type PanInfo } from 'framer-motion';
import { Plus, GripVertical, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods, type PaymentMethod } from '../hooks/usePaymentMethods';

/**
 * Brand mark used inside the payment-method row — Nexus card gets the
 * project's own logo chip (dark, with /nexus-icon.png); everything else
 * uses the small Mastercard / Visa / Maestro / generic tile.
 */
function BrandMark({ brand }: { brand: PaymentMethod['brand'] }) {
  if (brand === 'nexus') {
    // Match the "יתרת נקסוס" treatment in WalletPage: cyan sky-300 pill
    // with the wide black Nexus logo inside. Slightly larger here than
    // before so the wordmark reads clearly at row scale.
    return (
      <div className="bg-sky-300 rounded-lg px-2.5 py-1.5 flex items-center justify-center">
        <img
          src="/nexus-logo-black.png"
          alt="Nexus"
          className="h-5 w-auto object-contain"
        />
      </div>
    );
  }
  if (brand === 'visa') {
    return (
      <div className="border border-border rounded-lg px-2 py-1.5 bg-white">
        <span className="text-xs font-black italic text-primary leading-none">
          VISA
        </span>
      </div>
    );
  }
  if (brand === 'mastercard') {
    return (
      <div className="border border-border rounded-lg p-2 bg-white">
        <svg height={20} viewBox="0 0 32 20" width={32} aria-hidden>
          <circle cx={10} cy={10} r={9} fill="#eb001b" opacity={0.85} />
          <circle cx={22} cy={10} r={9} fill="#f79e1b" opacity={0.85} />
        </svg>
      </div>
    );
  }
  if (brand === 'maestro') {
    return (
      <div className="border border-border rounded-lg p-2 bg-white">
        <svg height={20} viewBox="0 0 32 20" width={32} aria-hidden>
          <circle cx={10} cy={10} r={9} fill="#0099df" opacity={0.85} />
          <circle cx={22} cy={10} r={9} fill="#eb001b" opacity={0.85} />
        </svg>
      </div>
    );
  }
  if (brand === 'googlepay') {
    // Google "G" multi-colour glyph on a white chip — same artwork used
    // by the GooglePayButton on AddPaymentMethodPage so the brand reads
    // consistently across the app.
    return (
      <div className="border border-border rounded-lg p-1.5 bg-white flex items-center justify-center">
        <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="border border-border rounded-lg px-2 py-1.5 bg-white text-xs font-bold text-text-secondary">
      ••••
    </div>
  );
}

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
        <BrandMark brand={card.brand} />
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
