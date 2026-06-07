import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reorder, motion, useDragControls, type PanInfo } from 'framer-motion';
import { Plus, GripVertical, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods, type PaymentMethod } from '../hooks/usePaymentMethods';
import { useMyVouchers } from '../hooks/useMyVouchers';
import type { UserVoucher } from '../types/voucher.types';
import { formatCurrency } from '../utils/formatCurrency';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';

/** Perceived-luminance check so we pick readable ink on the brand colour. */
function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

/**
 * A purchased voucher as a reorderable row: a white card row (like the
 * payment-method rows) with a small brand-coloured voucher card thumbnail
 * (sized like the Nexus brand chip), the merchant name + balance text, and
 * a drag handle. Tapping routes to the voucher detail page.
 */
function VoucherMiniRow({
  uv,
  language,
  locale,
  onOpen,
}: {
  uv: UserVoucher;
  language: string;
  locale: string;
  onOpen: (id: string) => void;
}) {
  const dragControls = useDragControls();
  const [logoError, setLogoError] = useState(false);
  const v = uv.voucher;
  const bg = v.brandColor || '#0a2540';
  const ink = isDarkColor(bg) ? '#ffffff' : '#0a2540';

  return (
    <Reorder.Item value={uv} dragListener={false} dragControls={dragControls} className="relative">
      <div className="bg-white rounded-2xl p-4 flex items-center gap-3 select-none">
        {/* Drag handle — starts the reorder via dragControls only. */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing text-text-muted flex-shrink-0 p-1 -m-1"
          aria-label="Reorder"
        >
          <GripVertical size={20} />
        </div>

        {/* Mini voucher card — brand colour, sized like the brand chip. */}
        <div
          className="w-12 h-8 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm"
          style={{ backgroundColor: bg }}
        >
          {v.brandLogo && !logoError ? (
            <img
              src={v.brandLogo}
              alt={v.merchantName}
              className="max-w-full max-h-full object-contain p-1"
              draggable={false}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-xs font-bold" style={{ color: ink }}>
              {v.merchantName.charAt(0)}
            </span>
          )}
        </div>

        {/* Tappable body → voucher detail. Name + balance text as before. */}
        <button
          type="button"
          onClick={() => onOpen(uv.id)}
          className="flex-1 min-w-0 text-start"
        >
          <div className="text-base font-bold text-text-primary truncate">
            {v.merchantName}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {language === 'he' ? 'יתרה' : 'Balance'}{' '}
            <span className="font-semibold text-text-secondary">
              {formatCurrency(v.originalPrice || 0, 'ILS', locale)}
            </span>
          </div>
        </button>
      </div>
    </Reorder.Item>
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
  const { t, isRTL, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { data: initialCards } = usePaymentMethods();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';

  // Active vouchers — shown in their own reorderable section below the
  // payment cards. Seeded once the async query resolves; reorders persist.
  const { data: myVouchers } = useMyVouchers();
  const activeVouchers = (myVouchers ?? [])
    .filter((v) => v.status === 'active')
    .sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime());
  const [voucherList, setVoucherList] = useState<UserVoucher[]>([]);
  const voucherSeeded = useRef(false);
  useEffect(() => {
    if (!voucherSeeded.current && activeVouchers.length) {
      setVoucherList(activeVouchers);
      voucherSeeded.current = true;
    }
  }, [activeVouchers]);

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

        {/* ── VOUCHERS — separate section: the user's active vouchers as
            miniature, reorderable cards, with an "add voucher" tile. ── */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-5">
            {t.wallet.myVouchers}
          </h2>

          {voucherList.length > 0 && (
            <Reorder.Group
              axis="y"
              values={voucherList}
              onReorder={setVoucherList}
              className="space-y-3"
            >
              {voucherList.map((uv) => (
                <VoucherMiniRow
                  key={uv.id}
                  uv={uv}
                  language={language}
                  locale={locale}
                  onOpen={(id) => navigate(`/${lang}/wallet/voucher/${id}`)}
                />
              ))}
            </Reorder.Group>
          )}

          {/* "Add voucher" — dashed tile, like the add-card row. */}
          <button
            type="button"
            onClick={() => navigate(`/${lang}/store`)}
            className="mt-3 w-full bg-white border-2 border-dashed border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-surface transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
              <Plus size={20} className="text-text-primary" strokeWidth={2.4} />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="text-text-primary font-bold text-base">
                {language === 'he' ? 'הוסף שובר' : 'Add voucher'}
              </div>
              <div className="text-text-muted text-xs">
                {language === 'he' ? 'עברו לחנות ורכשו שוברים נוספים' : 'Browse the store for more vouchers'}
              </div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
