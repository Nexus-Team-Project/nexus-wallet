import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { motion, Reorder, useDragControls, type PanInfo } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { usePaySession, PAY_SESSION_SECONDS } from '../hooks/usePaySession';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import WalletOffersSlider from '../components/wallet/WalletOffersSlider';
import WidgetsGallery from '../components/wallet/WidgetsGallery';
import BalanceCard from '../components/wallet/BalanceCard';
import DigitalCard from '../components/wallet/DigitalCard';
import VoucherCard from '../components/wallet/VoucherCard';
import TopBar from '../components/layout/TopBar';
import { useTenantStore } from '../stores/tenantStore';
import { useWallpaperStore } from '../stores/wallpaperStore';
import { useWalletLayoutStore, type WalletWidgetId } from '../stores/walletLayoutStore';

interface WalletPageProps {
  // When embedded (e.g. inside the chat "pay in store" sheet) the dark
  // "card not on file" top banner is suppressed.
  embedded?: boolean;
}

export default function WalletPage({ embedded = false }: WalletPageProps) {
  const { t, language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  // Active tenant — drives the "My organization" widget below.
  const tenantConfig = useTenantStore((s) => s.config);
  // User-picked wallpaper — flows into the inner gradient backdrop so
  // the lava theme follows the user onto the wallet page too. Falls
  // back to the signature rainbow when nothing is set.
  const wallpaperBg = useWallpaperStore((s) => s.selectedBackground);
  // User-customised section order — drives the loop below so the user
  // sees their wallet in their preferred arrangement.
  const sectionOrder = useWalletLayoutStore((s) => s.sectionOrder);
  const setOrder = useWalletLayoutStore((s) => s.setOrder);
  // When this is OFF, grip handles are hidden and Reorder drag is
  // disabled — the wallet reads like a static list.
  const editEnabled = useWalletLayoutStore((s) => s.editEnabled);
  const setEditEnabled = useWalletLayoutStore((s) => s.setEditEnabled);
  const hiddenSections = useWalletLayoutStore((s) => s.hiddenSections);
  const toggleHidden = useWalletLayoutStore((s) => s.toggleHidden);
  // Widget-level state: per-widget order and per-widget hidden flag.
  // Drives the horizontally-scrollable widgets gallery below.
  const widgetOrder = useWalletLayoutStore((s) => s.widgetOrder);
  const setWidgetOrder = useWalletLayoutStore((s) => s.setWidgetOrder);
  const hiddenWidgets = useWalletLayoutStore((s) => s.hiddenWidgets);
  const toggleHiddenWidget = useWalletLayoutStore((s) => s.toggleHiddenWidget);

  // One drag-controls instance per section — only the grip handle in
  // each section header triggers vertical drag, so taps elsewhere on
  // the section (collapse chevron, buttons inside) stay independent.
  const widgetsDragControls = useDragControls();

  // Collapsible section states
  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [noCardBannerOpen, setNoCardBannerOpen] = useState(false);
  const [editBannerOpen, setEditBannerOpen] = useState(false);

  // ── Stacked card deck (Google-Wallet style) ──
  // The balance square and the digital payment card sit in a stack: the
  // active card is on top, the next card peeks out from behind it.
  // Dragging the top card sideways past a threshold shuffles it to the
  // back and brings the next card forward.
  // The carousel: the balance sits in the MIDDLE — the digital card on one
  // side, the active vouchers on the other (chronological).
  const { data: myVouchers } = useMyVouchers();
  const activeVouchers = (myVouchers ?? [])
    .filter((v) => v.status === 'active')
    .sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime());
  const deckCards: string[] = [
    ...activeVouchers.map((v) => `voucher:${v.id}`),
    'balance',
    'card',
    // Trailing "manage payment methods" stop: the final drag past the
    // digital card parks it to the side (its dimmed peek form) and anchors
    // the stripes circle beside it.
    'add',
  ];
  // Balance sits right after the vouchers; its index shifts as vouchers
  // load async, so keep the deck centred on it until the user swipes.
  const balanceIndex = activeVouchers.length;
  const [activeCard, setActiveCard] = useState(0);
  const userMovedDeck = useRef(false);
  useLayoutEffect(() => {
    if (!userMovedDeck.current) setActiveCard(balanceIndex);
  }, [balanceIndex]);
  // Which voucher card is flipped to its redemption side (null = none).
  const [flippedVoucherId, setFlippedVoucherId] = useState<string | null>(null);
  // Cashback section phases. We don't unmount immediately on leaving the
  // balance card — we play a reverse pulse + height-collapse first so the
  // section below (widgets) rises up gradually. `seq` bumps on each open so
  // the reveal keyframe replays on every return to the balance card.
  const onBalanceCard = deckCards[activeCard] === 'balance';
  const [cashback, setCashback] = useState<{ phase: 'closed' | 'open' | 'closing'; seq: number }>(
    () => (onBalanceCard ? { phase: 'open', seq: 0 } : { phase: 'closed', seq: 0 }),
  );
  useEffect(() => {
    setCashback((c) => {
      if (onBalanceCard) return c.phase === 'open' ? c : { phase: 'open', seq: c.seq + 1 };
      return c.phase === 'open' ? { ...c, phase: 'closing' } : c;
    });
  }, [onBalanceCard]);
  // Commit a swap only once the drag travels far / fast enough; otherwise
  // dragSnapToOrigin springs the card back. The deck does NOT loop, so at
  // an edge nothing happens. You fling the centre card toward where it
  // should end up: drag it right and the card peeking on the left rolls
  // up and over to the centre while the current card slides off to the
  // right; drag left is the mirror. In RTL the next card sits on the left
  // and the previous on the right; LTR is mirrored.
  const onCardDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) <= 80 && Math.abs(info.velocity.x) <= 450) return;
      const draggedLeft = info.offset.x < 0;
      const target = draggedLeft
        ? isRTL
          ? activeCard - 1
          : activeCard + 1
        : isRTL
          ? activeCard + 1
          : activeCard - 1;
      if (target < 0 || target >= deckCards.length) return; // at the edge
      userMovedDeck.current = true; // respect the user's navigation from here
      setFlippedVoucherId(null); // never leave a voucher flipped off-centre
      setActiveCard(target);
    },
    [isRTL, activeCard, deckCards.length],
  );
  // The deck height is driven by the (taller) balance card's natural
  // height; the digital card is stretched to match so both read as
  // equal-sized cards in the stack.
  // One ref per deck card wrapper — used to measure the (taller) balance
  // card for the deck height and to map a tap's viewport point into
  // card-local coordinates for the ripple.
  const cardWrapRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [deckHeight, setDeckHeight] = useState(264);

  // ── Tap ripple → open ──
  // Tapping the active card raises a small, soft grey ripple around the
  // finger (clipped inside the card), then routes onward: the digital
  // card opens its detail page, the balance card opens wallet history.
  // Position is stored as a percentage of the card box so it stays
  // correct under the deck's scale transform.
  const rippleSeq = useRef(0);
  // Pointer-down position of the current gesture on a deck card. Used to
  // tell a real tap (barely moved) from a drag that framer mis-reports as
  // a tap on touch — so a drag never triggers the press/open.
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const [ripple, setRipple] = useState<{
    cardId: string;
    xPct: number;
    yPct: number;
    key: number;
  } | null>(null);
  const handleCardTap = useCallback(
    (
      cardId: string,
      _e: MouseEvent | TouchEvent | PointerEvent,
      info: { point: { x: number; y: number } },
    ) => {
      const el = cardWrapRefs.current[cardId];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const xPct = ((info.point.x - rect.left) / rect.width) * 100;
      const yPct = ((info.point.y - rect.top) / rect.height) * 100;
      rippleSeq.current += 1;
      setRipple({ cardId, xPct, yPct, key: rippleSeq.current });
      const dest = cardId === 'card' ? `/${lang}/wallet/card` : `/${lang}/wallet/balance`;
      window.setTimeout(() => navigate(dest), 360);
    },
    [lang, navigate],
  );

  // Soft grey ripple, clipped inside the tapped card's rounded box. A
  // changing `key` remounts it so the same card re-ripples on re-tap.
  const renderRipple = (cardId: string) =>
    ripple && ripple.cardId === cardId ? (
      <motion.span
        key={ripple.key}
        aria-hidden
        className="absolute rounded-full pointer-events-none z-20"
        style={{
          left: `${ripple.xPct}%`,
          top: `${ripple.yPct}%`,
          width: 160,
          height: 160,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.28) 40%, transparent 70%)',
        }}
        initial={{ scale: 0.25, opacity: 0.9, x: '-50%', y: '-50%' }}
        animate={{ scale: 1, opacity: 0, x: '-50%', y: '-50%' }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    ) : null;

  // Mock: whether the user has a payment card on file. When false, the
  // top dark banner appears prompting the user to add card details.
  const hasCard = false;
  // In "customize wallet" (edit) mode the top strip switches to an
  // edit-mode banner that links to settings — so the card prompt is
  // suppressed while editing.
  const showEditBanner = editEnabled && !embedded;
  // The dark top strip prompting "add card details" shows only on the
  // standalone wallet page — never in the embedded chat sheet, and never
  // while the edit-mode banner is showing.
  const showNoCardBanner = !hasCard && !embedded && !editEnabled;
  // Either banner occupies the dark top strip, so the white content frame
  // overlaps it the same way in both cases.
  const showTopStrip = showNoCardBanner || showEditBanner;

  // ── Balance card flip = pay session ──
  // Tapping the balance card flips it (gift-card style) to reveal the
  // in-store pay barcodes on the back and starts a 30s session; a ring on
  // the back fills as the session elapses, then auto-closes (flips back).
  const pay = usePaySession();
  const { showPaySheet, paySecondsLeft, openPay, closePay } = pay;

  // Measure the balance card so the deck reserves the right height and
  // the digital card can stretch to match it.
  useLayoutEffect(() => {
    const el = cardWrapRefs.current.balance;
    if (el) setDeckHeight(el.offsetHeight);
  }, [language, wallet?.balance]);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, _setNotificationType] = useState<'success' | 'declined'>('success');
  const [merchantName, _setMerchantName] = useState('');

  // Renders the inner box for a deck card. Used for both the crisp active
  // card on top and the faded side-peek copies behind it, so the markup
  // lives in one place.
  const renderDeckCard = (cardId: string) => {
    if (cardId.startsWith('voucher:')) {
      const uv = activeVouchers.find((v) => `voucher:${v.id}` === cardId);
      if (!uv) return null;
      return (
        <VoucherCard
          userVoucher={uv}
          flipped={flippedVoucherId === cardId}
          onExpire={() => setFlippedVoucherId(null)}
        />
      );
    }
    if (cardId === 'balance') {
      // Filling progress ring — empties→fills as the 30s session elapses.
      const ringC = 2 * Math.PI * 16;
      const ringOffset = ringC * (paySecondsLeft / PAY_SESSION_SECONDS);
      return (
        /* ── BALANCE CARD — flips to reveal the pay barcodes on the back ── */
        <div className="flip-perspective w-full">
          {/* Only show the flipped pay side while the balance card is the
              centre card — never on the side peek. */}
          <div className={`flip-inner ${showPaySheet && deckCards[activeCard] === 'balance' ? 'is-flipped' : ''}`}>
            {/* FRONT — balance, Nexus logo in the corner. In-flow, so it
                drives the card height; ignores pointers while flipped so
                the back's controls stay clickable. */}
            <div
              className="flip-face w-full flex items-center justify-center"
              style={{
                // The box floors the height so the pay side fits; the card
                // itself keeps the image aspect and floats centred inside,
                // with transparent space around it (no frame).
                minHeight: 264,
                pointerEvents: showPaySheet ? 'none' : 'auto',
              }}
            >
              <BalanceCard
                balance={wallet?.balance ?? 0}
                logoCorner
                className="w-full"
                style={{ aspectRatio: '1510 / 952' }}
              />
            </div>

            {/* BACK — pay barcodes panel filling the card, with the session
                clock + actions tucked into the corners. Pointers flow to the
                deck so a swipe can close it (handled in onDragEnd). */}
            <div
              className="flip-face flip-face-back"
              style={{ pointerEvents: showPaySheet ? 'auto' : 'none' }}
            >
              <PayCodesPanel compact />

              {/* Session clock — top-left corner, fills over the 30s */}
              <div className="absolute top-2 left-2 z-20 w-11 h-11">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(10,37,64,0.12)" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={ringC}
                    strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-text-primary"
                  dir="ltr"
                >
                  {paySecondsLeft}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (cardId === 'add') {
      // ── Manage-payment-methods stop. The digital card ('card') is the
      //    previous neighbour, so it auto-parks to one side in its dimmed
      //    peek form; the stripes circle is anchored on the OPPOSITE side so
      //    the two sit together. Tapping the circle → payment-methods page. ──
      return (
        <div className="relative w-full" style={{ minHeight: deckHeight || 264 }}>
          <button
            onClick={() => navigate(`/${lang}/wallet/payment-methods`)}
            aria-label={language === 'he' ? 'ניהול אמצעי תשלום' : 'Manage payment methods'}
            className="absolute top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.14)] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{ ...(isRTL ? { left: '-2%' } : { right: '-2%' }), backgroundColor: '#ffffff' }}
          >
            <span className="block w-7 h-0.5 rounded-full bg-text-secondary" />
            <span className="block w-7 h-0.5 rounded-full bg-text-secondary" />
            <span className="block w-7 h-0.5 rounded-full bg-text-secondary" />
          </button>
        </div>
      );
    }
    return (
      /* ── DIGITAL CARD — real card artwork, centred in the deck slot at
          the same height as the (taller) balance/pay card. ── */
      <DigitalCard className="w-full" heightPx={deckHeight || undefined}>
        {renderRipple('card')}
      </DigitalCard>
    );
  };

  // Hold the skeleton until the deck's card artwork has actually loaded, so
  // the wallet never flashes in with blank/half-painted cards.
  const [cardImagesReady, setCardImagesReady] = useState(false);
  useEffect(() => {
    const srcs = ['/cards/nexus-balance-card.png', '/cards/isracard-corporate.png'];
    let cancelled = false;
    Promise.all(
      srcs.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // never hang on a missing image
            img.src = src;
          }),
      ),
    ).then(() => {
      if (!cancelled) setCardImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (walletLoading || !cardImagesReady) {
    return <WalletPageSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      {/* ══════ EDIT-MODE DARK TOP STRIP ══════
          While customising the wallet, the card prompt is replaced by an
          edit-mode banner. Tapping it jumps to settings (profile) where the
          "Customize wallet" toggle lets the user finish / close edit mode. */}
      {showEditBanner && (
        <div className="bg-[#2e2e2e] text-white px-4 pt-5 pb-7">
          <button
            onClick={() => setEditBannerOpen((open) => !open)}
            className="w-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-white/80" style={{ fontSize: '18px' }}>
              tune
            </span>
            <span className="text-xs font-semibold">{t.wallet.editModeActive}</span>
            <span
              className={`material-symbols-outlined text-white/80 transition-transform duration-300 flex-shrink-0 ${
                editBannerOpen ? 'rotate-180' : ''
              }`}
              style={{ fontSize: '16px' }}
            >
              expand_more
            </span>
          </button>

          {/* Expandable CTA — revealed when chevron is clicked; closes edit mode */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              editBannerOpen ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}
          >
            <button
              onClick={() => {
                setEditEnabled(false);
                setEditBannerOpen(false);
              }}
              className="w-full bg-white text-[#2e2e2e] font-bold text-sm py-2.5 rounded-full active:scale-[0.98] transition-transform"
            >
              {t.wallet.editModeClose}
            </button>
          </div>
        </div>
      )}

      {/* ══════ YELLOW-STYLE DARK TOP STRIP ══════ */}
      {showNoCardBanner && (
        <div className="bg-[#2e2e2e] text-white px-4 pt-5 pb-7">
          <button
            onClick={() => setNoCardBannerOpen((open) => !open)}
            className="w-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{
                scale: [1, 1.18, 0.95, 1.06, 1],
                rotate: [0, -10, 8, -4, 0],
              }}
              transition={{ delay: 1.05, duration: 0.7, ease: 'easeOut' }}
              className="relative w-8 h-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0"
            >
              <span className="material-symbols-outlined text-white/80" style={{ fontSize: '16px' }}>
                credit_card
              </span>
              <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-[1.5px] border-[#2e2e2e]">
                ✕
              </span>
            </motion.div>
            <motion.span
              initial={{ y: -2, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4, ease: 'easeOut' }}
              className="text-xs font-semibold"
            >
              {t.wallet.cardNotOnFile}
            </motion.span>
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.15, duration: 0.35, ease: 'easeOut' }}
              className={`material-symbols-outlined text-white/80 transition-transform duration-300 flex-shrink-0 ${
                noCardBannerOpen ? 'rotate-180' : ''
              }`}
              style={{ fontSize: '16px' }}
            >
              expand_more
            </motion.span>
          </button>

          {/* Expandable CTA — revealed when chevron is clicked */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              noCardBannerOpen ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}
          >
            <button
              onClick={() =>
                navigate(`/${lang}/wallet/add-payment-method`, {
                  // Tags this navigation as the "dark balance card → add
                  // card details" entry so AddPaymentMethodPage knows to
                  // play the slide-down curtain animation. Other entries
                  // (direct URL, more-actions sheet) skip the animation.
                  state: { entry: 'wallet-cta' },
                })
              }
              className="w-full bg-white text-[#2e2e2e] font-bold text-sm py-2.5 rounded-full active:scale-[0.98] transition-transform"
            >
              {t.wallet.addCardCta}
            </button>
          </div>
        </div>
      )}

      {/* ══════ WHITE CONTENT FRAME — rounded top, overlaps dark strip ══════ */}
      <motion.div
        initial={showTopStrip ? { y: -76 } : false}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={
          showTopStrip
            ? 'bg-bg-light rounded-t-3xl -mt-4 pt-2 relative z-10 overflow-hidden'
            : 'pt-2 relative overflow-hidden'
        }
      >
        {/* Decorative backdrop — always anchored at the top hero area
            of the page. When a wallpaper is set it gets a taller band,
            stronger opacity, and the lava animation. */}
        <div
          aria-hidden
          className={`absolute top-0 inset-x-0 pointer-events-none z-0 ${
            wallpaperBg ? 'h-[480px]' : 'h-[280px]'
          }`}
        >
          <div
            className={`w-full h-full ${
              wallpaperBg ? 'opacity-[0.55]' : 'opacity-[0.12]'
            }`}
            style={{
              background:
                wallpaperBg ??
                'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
              backgroundSize: wallpaperBg ? '220% 220%' : undefined,
              animation: wallpaperBg ? 'lava-flow 14s ease-in-out infinite' : undefined,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: wallpaperBg
                ? 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.5) 70%, var(--color-bg-light) 100%)'
                : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, var(--color-bg-light) 100%)',
            }}
          />
        </div>
        {/* Wrap everything below in a relative div so the gradient stays
            behind. */}
        <div className="relative">
      {/* ══════ INLINE TOPBAR ROW (back, logo, avatar, greeting, chat, bell) ══════
          showBack adds the standard back arrow (navigate(-1)) — the wallet is a
          full page with no other way back. Not shown when embedded in the pay sheet. */}
      {!embedded && <TopBar collapsed={false} showBack />}

      {/* ══════ BALANCE CARD (Klarna-style) ══════ */}
      <section className="relative mt-4 mb-8 px-5">
        {/* ── CARD DECK (Google-Wallet style) ──
            Every card is a persistent element that animates between the
            centre slot and a side slot. The active card sits crisp in the
            centre; its real neighbour peeks, solid but dimmed, on one side
            (the deck does NOT loop, so at an edge that side stays empty).
            Drag the centre card sideways: the neighbour you fling toward
            rolls up — it takes the top z-index so it climbs OVER the
            current card — to the centre, while the current card slides out
            to the opposite side slot. Cards are centred vertically
            (top-1/2 + y:-50%) so the peek lines up with the card's middle.
            The wrapper is also the positioning context for the issue-card
            button. ── */}
        <div className="relative">
        <div className="relative" style={{ height: deckHeight ? deckHeight * 0.9 : undefined }}>
          {deckCards.map((cardId, i) => {
            const rel = i - activeCard;
            const isCenter = rel === 0;
            const isNeighbour = Math.abs(rel) === 1;
            // Visual side for a non-centre card: the next card (rel > 0)
            // sits on the left in RTL / right in LTR; the previous card
            // (rel < 0) is mirrored.
            const side = isCenter ? 0 : rel > 0 ? (isRTL ? -1 : 1) : isRTL ? 1 : -1;
            // NOTE: y (vertical centring) is a CONSTANT style below — never
            // part of the animated pose — so framer can't recompute/reset it
            // on re-render (flip, drag, etc.) and drop the card.
            const pose = isCenter
              ? { x: '0%', scale: 0.9, opacity: 1 }
              : isNeighbour
                ? { x: `${side * 16}%`, scale: 0.74, opacity: 1 }
                : { x: `${side * 40}%`, scale: 0.6, opacity: 0 };
            return (
              <motion.div
                key={cardId}
                aria-hidden={!isCenter}
                className="absolute inset-x-0 top-1/2 select-none"
                style={{
                  // Vertical centring as a fixed transform — kept OUT of the
                  // animated pose so it never moves.
                  y: '-50%',
                  transformOrigin: 'center center',
                  // The centre card always owns the top z-index, so the
                  // neighbour rolling in climbs over the outgoing one.
                  zIndex: isCenter ? 30 : 10,
                  filter: isCenter ? 'none' : 'brightness(0.78)',
                  pointerEvents: isCenter ? 'auto' : 'none',
                }}
                initial={false}
                animate={pose}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              >
                {/* Inner drag layer — kept SEPARATE from the carousel
                    transform above. Dragging here only moves x (px) and never
                    touches the outer's y:-50% centring, so the card can no
                    longer drop below the slider line on drag. */}
                <motion.div
                  ref={(el) => {
                    cardWrapRefs.current[cardId] = el;
                  }}
                  // deck-card-drag forces touch-action:none (with !important)
                  // so the sideways drag can't leak into vertical page scroll.
                  className={`w-full ${isCenter ? 'deck-card-drag' : ''}`}
                  style={{ cursor: isCenter ? 'grab' : 'default' }}
                  drag={isCenter ? 'x' : false}
                  dragElastic={0.5}
                  dragSnapToOrigin
                  whileDrag={{ cursor: 'grabbing' }}
                  onPointerDown={(e) => {
                    pressStart.current = { x: e.clientX, y: e.clientY };
                  }}
                  onDragEnd={
                    isCenter
                      ? (e, info) => {
                          // A drag NEVER triggers a press — only switches cards
                          // (or closes the pay side). Presses are handled solely
                          // by onTap, keeping scroll/drag and tap cleanly apart.
                          const swiped =
                            Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 450;
                          if (cardId === 'balance' && showPaySheet) {
                            if (swiped) closePay();
                            return;
                          }
                          onCardDragEnd(e, info);
                        }
                      : undefined
                  }
                  // Tapping the active centre card: the balance card flips to
                  // its pay side and starts the session; tapping the flipped
                  // card (anywhere but its buttons) closes it back. The digital
                  // card ripples and routes to its detail page. Framer fires
                  // onTap only for taps that didn't become a drag.
                  onTap={
                    isCenter
                      ? (e, info) => {
                          // Strict tap gate: framer fires onTap for medium
                          // touch-drags it didn't treat as a drag. If the
                          // finger moved more than a hair, it's a drag — do
                          // NOT open/press. Use the native event's viewport
                          // coords on both ends so they're comparable.
                          const start = pressStart.current;
                          pressStart.current = null;
                          const pe = e as PointerEvent;
                          if (
                            start &&
                            typeof pe.clientX === 'number' &&
                            Math.hypot(pe.clientX - start.x, pe.clientY - start.y) > 10
                          ) {
                            return;
                          }
                          // Voucher: flip to its redemption side (tap again,
                          // off a button, to flip back).
                          if (cardId.startsWith('voucher:')) {
                            const onBtn = (e.target as HTMLElement | null)?.closest('button');
                            if (flippedVoucherId === cardId && onBtn) return;
                            setFlippedVoucherId((prev) => (prev === cardId ? null : cardId));
                            return;
                          }
                          // Manage-methods stop: the circle button owns the
                          // tap; ignore taps elsewhere on the slot.
                          if (cardId === 'add') return;
                          if (cardId !== 'balance') {
                            handleCardTap(cardId, e, info);
                            return;
                          }
                          if (!showPaySheet) {
                            openPay();
                            return;
                          }
                          // Flipped: ignore taps that land on a control so the
                          // back-side buttons keep working; otherwise close.
                          const target = e.target as HTMLElement | null;
                          if (target && target.closest('button')) return;
                          closePay();
                        }
                      : undefined
                  }
                >
                  {renderDeckCard(cardId)}
                </motion.div>
              </motion.div>
            );
          })}
        </div>{/* /deck */}

        {/* Issue-card action — only when the digital card is on top,
            hanging below the stack so it visibly protrudes. */}
        {deckCards[activeCard] === 'card' && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40">
            <button
              onClick={() => navigate(`/${lang}/card-issuance`)}
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {t.wallet.issueCard}
            </button>
          </div>
        )}

        {/* More-actions — hangs below the flipped balance card (same
            placement + styling as the issue-card button). */}
        {deckCards[activeCard] === 'balance' && showPaySheet && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40">
            <button
              onClick={() => navigate(`/${lang}/wallet/balance`)}
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {language === 'he' ? 'פעולות נוספות' : 'More actions'}
            </button>
          </div>
        )}

        {/* More-actions for a flipped voucher → that voucher's page. */}
        {flippedVoucherId && deckCards[activeCard] === flippedVoucherId && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40">
            <button
              onClick={() =>
                navigate(`/${lang}/wallet/voucher/${flippedVoucherId.slice('voucher:'.length)}`)
              }
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {language === 'he' ? 'פעולות נוספות' : 'More actions'}
            </button>
          </div>
        )}
        </div>{/* /deck wrapper */}

        {/* Tap-to-pay CTA — under every card EXCEPT the digital card and the
            manage-methods stop (which navigate); fades while flipped. */}
        {deckCards[activeCard] !== 'card' && deckCards[activeCard] !== 'add' && (
        <div
          className={`flex items-center justify-center gap-2 mt-4 transition-opacity duration-300 ${
            (deckCards[activeCard] === 'balance' && showPaySheet) ||
            flippedVoucherId === deckCards[activeCard]
              ? 'opacity-0'
              : 'opacity-100'
          }`}
        >
          {/* Contactless (NFC) beacon — the SAME Material glyph everywhere,
              revealed left→right once (key remount replays it on card change).
              On the Nexus balance card (the default payment method) it's the
              FILLED variant; vouchers keep the outline. Same grey colour in
              both cases — only the fill differs. */}
          <motion.span
            key={`cta-${activeCard}`}
            aria-hidden
            className="material-symbols-outlined text-text-secondary shrink-0 leading-none"
            style={{
              fontSize: '20px',
              fontVariationSettings: deckCards[activeCard] === 'balance' ? "'FILL' 1" : "'FILL' 0",
            }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 0)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            contactless
          </motion.span>
          <span className="text-sm font-normal text-text-secondary">
            {language === 'he' ? 'לתשלום לחץ והצג בקופה' : 'Tap to pay and show at checkout'}
          </span>
        </div>
        )}

      </section>

      {/* ══════ REORDERABLE SECTIONS — Framer-motion Reorder.Group on
          the wallet page itself. Each section's title row hosts a grip
          handle; pointer-down on the grip starts a vertical reorder
          drag. Releasing fires onReorder which persists the new order
          to the wallet-layout store. ══════ */}
      <Reorder.Group
        axis="y"
        values={sectionOrder}
        onReorder={(next) => setOrder(next)}
        className="flex flex-col"
      >
      {sectionOrder.map((sectionId) => {
        const isHidden = hiddenSections.includes(sectionId);
        // Outside edit mode hidden sections disappear entirely; inside
        // edit mode they show dimmed so the user can bring them back.
        if (isHidden && !editEnabled) return null;
        if (sectionId === 'widgets') {
          return (
      <Reorder.Item
        key="widgets"
        value="widgets"
        dragListener={false}
        dragControls={widgetsDragControls}
        className={`mb-6 transition-opacity ${isHidden ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center justify-between w-full px-5 mb-3">
          <button
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <h2 className="text-lg font-bold text-text-primary">
              {t.wallet.widgetsTitle}
            </h2>
            <span
              className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${widgetsOpen ? 'rotate-180' : ''}`}
              style={{ fontSize: '20px' }}
            >
              expand_more
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/${lang}/wallet/actions`)}
              className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal active:scale-95 transition-colors"
            >
              {language === 'he' ? 'עוד' : 'More'}
            </button>
            {editEnabled && (
              <>
                <button
                  type="button"
                  onClick={() => toggleHidden('widgets')}
                  className="text-text-muted p-1 -m-1 active:opacity-60"
                  aria-label={isHidden ? 'Show section' : 'Hide section'}
                >
                  {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span
                  onPointerDown={(e) => widgetsDragControls.start(e)}
                  className="touch-none cursor-grab active:cursor-grabbing text-text-muted p-1 -m-1"
                  aria-label="Reorder section"
                >
                  <GripVertical size={18} />
                </span>
              </>
            )}
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${widgetsOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {/* Single-row gallery of circular icon widgets. In edit mode you
              grab a widget and it lifts under your finger; the others slide
              apart and a dashed-circle placeholder opens at the drop slot. */}
          <WidgetsGallery
            order={widgetOrder}
            setOrder={setWidgetOrder}
            hiddenWidgets={hiddenWidgets}
            toggleHidden={toggleHiddenWidget}
            editEnabled={editEnabled}
            isRTL={isRTL}
            renderBody={(widgetId) =>
              renderWidgetBody(widgetId, {
                t,
                isRTL,
                tenantConfig,
                navigate,
                lang,
              })
            }
          />
        </div>
      </Reorder.Item>
          );
        }
        if (sectionId === 'offers') {
          // The cashback section is now pinned directly below the card gallery
          // (see above), so it no longer renders here in the reorder list.
          return null;
        }
        if (sectionId === 'digitalCards') {
          // The card and its "issue card" action now live in the balance
          // carousel above, so this section no longer renders anything.
          return null;
        }
        if (sectionId === 'vouchers') {
          // Vouchers now live in the card carousel above, so this section
          // no longer renders anything.
          return null;
        }
        return null;
      })}
      </Reorder.Group>

      {/* ══════ CASHBACK — below the widgets / sections, shown only while the
          Nexus balance card is centred. `cashback-reveal` (open) expands a
          circle from the card centre; `cashback-collapse` (close) reverses it
          while the height folds to 0. ══════ */}
      {cashback.phase !== 'closed' && (
        <div
          key={`cashback-${cashback.seq}`}
          className={cashback.phase === 'closing' ? 'cashback-collapse' : 'cashback-reveal'}
          onAnimationEnd={(e) => {
            if (e.animationName === 'cashback-collapse') {
              setCashback((c) => (c.phase === 'closing' ? { ...c, phase: 'closed' } : c));
            }
          }}
        >
          <WalletOffersSlider />
        </div>
      )}
      </div>{/* /relative gradient wrapper */}
      </motion.div>

      {/* ══════ NOTIFICATION OVERLAY ══════ */}
      {showNotification && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
          <div
            onClick={() => setShowNotification(false)}
            className={`w-full max-w-md mt-14 transition-all duration-300 ease-out pointer-events-auto ${
              notificationType === 'success' ? 'cursor-pointer active:scale-95' : ''
            }`}
            style={{
              animation: 'slide-down 0.3s ease-out forwards',
            }}
          >
            <div
              className="rounded-[28px] p-4 shadow-2xl flex flex-col gap-2 ring-1 ring-white/20"
              style={{
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                background: 'rgba(255, 255, 255, 0.85)',
                boxShadow: '0 0 25px rgba(255, 255, 255, 0.35)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                    <span className="material-symbols-outlined text-white text-[18px]">domain</span>
                  </div>
                  <span className="text-xs font-bold text-gray-800 tracking-wide uppercase">
                    NEXUS
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                {notificationType === 'success' ? (
                  <>
                    <h3 className="font-bold text-[16px] text-gray-900">{t.wallet.paymentApproved}</h3>
                    <p className="text-[14px] text-gray-800 leading-snug">
                      {t.wallet.paymentApprovedMsg.replace('{merchant}', merchantName)}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-[16px] text-gray-900">{t.wallet.paymentDeclined}</h3>
                    <p className="text-[14px] text-gray-800 leading-snug">
                      {t.wallet.paymentDeclinedMsg.replace('{merchant}', merchantName)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification auto-dismiss */}
      {showNotification && <NotificationAutoDismiss onDismiss={() => setShowNotification(false)} />}
    </div>
  );
}

/** Helper to auto-dismiss notification after 5 seconds */
function NotificationAutoDismiss({ onDismiss }: { onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!timerRef.current) {
    timerRef.current = setTimeout(onDismiss, 5000);
  }
  return null;
}

/**
 * Renders the inner UI for a given widget. Kept outside the component
 * so the body doesn't recompose when WalletPage's other state changes
 * but `widgetOrder` doesn't.
 */
function renderWidgetBody(
  widgetId: WalletWidgetId,
  deps: {
    t: ReturnType<typeof useLanguage>['t'];
    isRTL: boolean;
    tenantConfig: ReturnType<typeof useTenantStore.getState>['config'];
    navigate: ReturnType<typeof useNavigate>;
    lang: string;
  },
): React.ReactNode {
  const { t, isRTL, tenantConfig, navigate, lang } = deps;

  /** Shared circle button: a soft disk holding a large colour emoji with
   *  a short label beneath. The emoji renders in the platform's native
   *  3D glyph set, giving the row a uniform, lively gallery feel. */
  const circle = (
    emoji: string,
    label: string,
    opts: { onClick?: () => void; bg?: string },
  ) => (
    <button
      type="button"
      onClick={opts.onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 w-full"
    >
      <span
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
        style={{ backgroundColor: opts.bg ?? '#ffffff' }}
      >
        <motion.span
          className="inline-block"
          style={{ fontSize: '30px', lineHeight: 1 }}
          whileTap={{ scale: 1.15, y: -3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 12 }}
        >
          {emoji}
        </motion.span>
      </span>
      <span className="text-[11px] font-medium text-text-secondary leading-tight text-center line-clamp-2">
        {label}
      </span>
    </button>
  );

  switch (widgetId) {
    case 'nearby-cashback':
      return circle('📍', t.wallet.widgetNearbyCashback, {
        onClick: () => navigate(`/${lang}/near-you-map`),
      });
    case 'my-organization':
      // Real org logo on a brand-coloured disk reads more "real" than any
      // emoji; fall back to a building emoji only when no logo is set.
      if (tenantConfig?.logo) {
        return (
          <button
            type="button"
            onClick={() => navigate(`/${lang}/profile`)}
            aria-label={t.wallet.widgetMyOrganization}
            className="flex flex-col items-center gap-1.5 w-full"
          >
            <span
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] overflow-hidden"
              style={{ backgroundColor: tenantConfig.primaryColor ?? 'var(--color-surface)' }}
            >
              <motion.img
                src={tenantConfig.logo}
                alt={isRTL ? tenantConfig.nameHe : tenantConfig.name}
                className="w-11 h-11 object-contain"
                whileTap={{ scale: 1.3, y: -6 }}
                transition={{ type: 'spring', stiffness: 500, damping: 10 }}
              />
            </span>
            <span className="text-[11px] font-medium text-text-secondary leading-tight text-center line-clamp-2">
              {t.wallet.widgetMyOrganization}
            </span>
          </button>
        );
      }
      return circle('🏟️', t.wallet.widgetMyOrganization, {
        onClick: () => navigate(`/${lang}/profile`),
      });
    case 'best-offers':
      return circle('🏷️', t.wallet.widgetBestOffers, {
        onClick: () => navigate(`/${lang}`),
      });
    case 'refer-friends':
      return circle('🤝', t.wallet.widgetReferFriends, {
        onClick: () => navigate(`/${lang}/referral-stories`),
      });
    case 'my-profile':
      return circle('🪪', t.wallet.widgetMyProfile, {
        onClick: () => navigate(`/${lang}/profile`),
      });
    case 'my-orders':
      return circle('🧾', t.wallet.widgetMyOrders, {
        onClick: () => navigate(`/${lang}/activity`),
      });
  }
}
