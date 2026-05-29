import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatCurrency';
import WalletTabs from '../components/wallet/WalletTabs';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import PayExtrasPanel from '../components/wallet/PayExtrasPanel';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';
import BestOffersWidget from '../components/wallet/BestOffersWidget';
import TopBar from '../components/layout/TopBar';
import { useTenantStore } from '../stores/tenantStore';
import { useWallpaperStore } from '../stores/wallpaperStore';
import { useWalletLayoutStore, type WalletWidgetId } from '../stores/walletLayoutStore';
import type { UserVoucher } from '../types/voucher.types';

// Logos
import MastercardLogo from '../assets/logos/mastercard-logo-transperant.png';
import NexusWideLogo from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';

export default function WalletPage() {
  const { t, language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
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
  const hiddenSections = useWalletLayoutStore((s) => s.hiddenSections);
  const toggleHidden = useWalletLayoutStore((s) => s.toggleHidden);
  // Widget-level state: per-widget order and per-widget hidden flag.
  // Drives the horizontally-scrollable widgets gallery below.
  const widgetOrder = useWalletLayoutStore((s) => s.widgetOrder);
  const setWidgetOrder = useWalletLayoutStore((s) => s.setWidgetOrder);
  const hiddenWidgets = useWalletLayoutStore((s) => s.hiddenWidgets);
  const toggleHiddenWidget = useWalletLayoutStore((s) => s.toggleHiddenWidget);

  // Refs for auto-scrolling the widgets gallery while the user drags a
  // widget near the screen edge.
  const widgetsScrollRef = useRef<HTMLDivElement>(null);
  const widgetsScrollRafRef = useRef<number | null>(null);
  const widgetsPointerXRef = useRef(0);

  const handleWidgetsPointerMove = useCallback((e: PointerEvent) => {
    widgetsPointerXRef.current = e.clientX;
  }, []);

  const stopWidgetsAutoScroll = useCallback(() => {
    if (widgetsScrollRafRef.current !== null) {
      cancelAnimationFrame(widgetsScrollRafRef.current);
      widgetsScrollRafRef.current = null;
    }
    window.removeEventListener('pointermove', handleWidgetsPointerMove);
  }, [handleWidgetsPointerMove]);

  const startWidgetsAutoScroll = useCallback(() => {
    window.addEventListener('pointermove', handleWidgetsPointerMove);
    const EDGE_ZONE = 70;
    const MAX_SPEED = 18;
    const loop = () => {
      const el = widgetsScrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = widgetsPointerXRef.current;
      if (x < rect.left + EDGE_ZONE) {
        const ratio = Math.min(1, (rect.left + EDGE_ZONE - x) / EDGE_ZONE);
        el.scrollLeft -= ratio * MAX_SPEED;
      } else if (x > rect.right - EDGE_ZONE) {
        const ratio = Math.min(1, (x - (rect.right - EDGE_ZONE)) / EDGE_ZONE);
        el.scrollLeft += ratio * MAX_SPEED;
      }
      widgetsScrollRafRef.current = requestAnimationFrame(loop);
    };
    widgetsScrollRafRef.current = requestAnimationFrame(loop);
  }, [handleWidgetsPointerMove]);

  // Make sure we don't leak the animation frame / global listener.
  useEffect(() => {
    return () => stopWidgetsAutoScroll();
  }, [stopWidgetsAutoScroll]);
  // One drag-controls instance per section — only the grip handle in
  // each section header triggers vertical drag, so taps elsewhere on
  // the section (collapse chevron, buttons inside) stay independent.
  const widgetsDragControls = useDragControls();
  const cardsDragControls = useDragControls();
  const vouchersDragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<UserVoucher['status']>('active');

  // Collapsible section states
  const [cardOpen, setCardOpen] = useState(true);
  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [vouchersOpen, setVouchersOpen] = useState(true);
  const [noCardBannerOpen, setNoCardBannerOpen] = useState(false);

  // Mock: whether the user has a payment card on file. When false, the
  // top dark banner appears prompting the user to add card details.
  const hasCard = false;

  // Sheet states
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // ── Pay panel session timer ──
  // Tapping "Payment" reveals the inline pay panel (sliding up from
  // behind the balance square) and starts a 30s countdown shown ON the
  // button. At 0 the panel auto-closes. Holding the button freezes the
  // countdown so the panel stays open as long as the finger is down.
  const PAY_SESSION_SECONDS = 30;
  const [paySecondsLeft, setPaySecondsLeft] = useState(PAY_SESSION_SECONDS);
  const [payPaused, setPayPaused] = useState(false);
  const payHoldStart = useRef(0);

  const openPay = useCallback(() => {
    setPaySecondsLeft(PAY_SESSION_SECONDS);
    setPayPaused(false);
    setShowPaySheet(true);
  }, []);

  const closePay = useCallback(() => {
    setShowPaySheet(false);
    setPayPaused(false);
  }, []);

  // Countdown — one tick per second while open and not held.
  useEffect(() => {
    if (!showPaySheet || payPaused) return;
    if (paySecondsLeft <= 0) {
      closePay();
      return;
    }
    const id = setTimeout(() => setPaySecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showPaySheet, payPaused, paySecondsLeft, closePay]);

  // Press = freeze while held; release distinguishes a quick tap
  // (toggle open/close) from a hold (resume countdown).
  const PAY_HOLD_MS = 250;
  const handlePayPointerDown = useCallback(() => {
    payHoldStart.current = Date.now();
    if (showPaySheet) setPayPaused(true);
  }, [showPaySheet]);

  const handlePayPointerUp = useCallback(() => {
    const held = Date.now() - payHoldStart.current;
    if (!showPaySheet) {
      openPay();
      return;
    }
    if (held >= PAY_HOLD_MS) {
      setPayPaused(false);
    } else {
      closePay();
    }
  }, [showPaySheet, openPay, closePay]);

  const handlePayPointerLeave = useCallback(() => {
    if (showPaySheet && payPaused) setPayPaused(false);
  }, [showPaySheet, payPaused]);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, _setNotificationType] = useState<'success' | 'declined'>('success');
  const [merchantName, _setMerchantName] = useState('');

  if (walletLoading) {
    return <WalletPageSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      {/* ══════ YELLOW-STYLE DARK TOP STRIP ══════ */}
      {!hasCard && (
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
        initial={!hasCard ? { y: -76 } : false}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={
          !hasCard
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
      {/* ══════ INLINE TOPBAR ROW (logo, avatar, greeting, chat, bell) ══════ */}
      <TopBar collapsed={false} />

      {/* ══════ BALANCE CARD (Klarna-style) ══════ */}
      <section className="relative mt-4 mb-8 px-5">
        {/* ── CODES — above the square, rises up from behind it ── */}
        <div
          className="relative z-10 overflow-hidden transition-all duration-500"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: showPaySheet ? 900 : 0,
            marginBottom: showPaySheet ? 12 : 0,
          }}
        >
          <div
            className="transition-transform duration-500"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transform: showPaySheet ? 'translateY(0)' : 'translateY(90px)',
            }}
          >
            <PayCodesPanel />
          </div>
        </div>

        <div
          className="relative z-20 bg-white/75 backdrop-blur-md border border-gray-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center"
        >
          {/* New badge — top-start corner */}
          <span className="absolute top-4 start-4 bg-success/20 text-success text-xs font-bold px-2.5 py-0.5 rounded-full">
            {t.wallet.newBadge}
          </span>

          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-text-secondary font-medium">
              <span>יתרת</span>
              <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden" style={{ transform: 'scale(0.873)' }}>
                <img
                  src="/nexus-logo-black.png"
                  alt="Nexus"
                  className="h-7 w-auto object-contain"
                  style={{ transform: 'scale(1.373)' }}
                />
              </span>
            </span>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
          </div>

          {/* Balance Amount */}
          <h1 className="text-6xl font-bold text-text-primary mb-1 tracking-tight">
            {formatCurrency(wallet?.balance || 0, 'ILS', locale)}
          </h1>

          {/* Action Buttons Row + Cashback */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate(`/${lang}/wallet/add-money`)}
              className="bg-bg-dark text-white px-8 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform"
            >
              {t.wallet.addMoney}
            </button>
            <button
              onPointerDown={handlePayPointerDown}
              onPointerUp={handlePayPointerUp}
              onPointerLeave={handlePayPointerLeave}
              className="relative overflow-hidden bg-surface text-text-primary px-6 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform border border-border select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Depleting countdown pie behind the label */}
              {showPaySheet && (
                <span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none transition-opacity"
                  style={{
                    background: `conic-gradient(var(--color-primary) ${(paySecondsLeft / PAY_SESSION_SECONDS) * 360}deg, transparent 0deg)`,
                    opacity: 0.18,
                  }}
                />
              )}
              <span className="relative flex items-center justify-center gap-1.5">
                {showPaySheet ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {payPaused ? 'lock' : 'timer'}
                    </span>
                    <span className="tabular-nums" dir="ltr">{paySecondsLeft}</span>
                  </>
                ) : (
                  t.wallet.payment
                )}
              </span>
            </button>
            <button
              onClick={() => setShowMoreSheet(true)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-surface border border-border active:scale-95 transition-transform flex-shrink-0"
            >
              <span className="material-symbols-outlined text-text-secondary rotate-90" style={{ fontSize: '20px' }}>more_horiz</span>
            </button>
          </div>

          {/* Cashback Text — attached to buttons */}
          <p className="text-success font-semibold text-sm mt-2">{t.wallet.earnCashback}</p>
        </div>

        {/* ── EXTRAS — below the square, slides down into place ── */}
        <div
          className="relative z-10 overflow-hidden transition-all duration-500"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: showPaySheet ? 700 : 0,
            marginTop: showPaySheet ? 12 : 0,
          }}
        >
          <div
            className="transition-transform duration-500"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transform: showPaySheet ? 'translateY(0)' : 'translateY(-60px)',
            }}
          >
            <PayExtrasPanel onClose={closePay} />
          </div>
        </div>
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
          {editEnabled && (
            <div className="flex items-center gap-1">
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
            </div>
          )}
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${widgetsOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {/* Two-row widgets grid restored — each slot has a fixed
              gridColumn/gridRow placement so "Best offers" can sit on
              row 2 spanning under nearby-cashback + my-organization.
              The widgetOrder array drives which widget lands in which
              slot (slot ← widgetOrder index). In edit mode each widget
              is free-draggable; when the drag pointer nears the
              gallery edge, auto-scroll kicks in. */}
          <Reorder.Group
            axis="x"
            values={widgetOrder}
            onReorder={setWidgetOrder}
            as="div"
            ref={widgetsScrollRef}
            className="px-5 grid grid-rows-2 gap-3 overflow-x-auto no-scrollbar pb-1"
            style={{ gridAutoColumns: 'max-content', gridAutoFlow: 'column' }}
          >
            {widgetOrder.map((widgetId, index) => {
              const isHidden = hiddenWidgets.includes(widgetId);
              if (isHidden && !editEnabled) return null;
              return (
                <WidgetReorderItem
                  key={widgetId}
                  widgetId={widgetId}
                  slotIndex={index}
                  editEnabled={editEnabled}
                  isHidden={isHidden}
                  onHide={() => toggleHiddenWidget(widgetId)}
                  onDragStart={startWidgetsAutoScroll}
                  onDragEnd={stopWidgetsAutoScroll}
                >
                  {renderWidgetBody(widgetId, {
                    t,
                    isRTL,
                    tenantConfig,
                    navigate,
                    lang,
                  })}
                </WidgetReorderItem>
              );
            })}
          </Reorder.Group>
        </div>
      </Reorder.Item>
          );
        }
        if (sectionId === 'digitalCards') {
          return (
      <Reorder.Item
        key="digitalCards"
        value="digitalCards"
        dragListener={false}
        dragControls={cardsDragControls}
        className={`mb-6 transition-opacity ${isHidden ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center justify-between w-full px-5 mb-3">
          <button
            onClick={() => setCardOpen(!cardOpen)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <h2 className="text-lg font-bold text-text-primary">
              {t.wallet.digitalCards}
            </h2>
            <span
              className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${cardOpen ? 'rotate-180' : ''}`}
              style={{ fontSize: '20px' }}
            >
              expand_more
            </span>
          </button>
          {editEnabled && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleHidden('digitalCards')}
                className="text-text-muted p-1 -m-1 active:opacity-60"
                aria-label={isHidden ? 'Show section' : 'Hide section'}
              >
                {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <span
                onPointerDown={(e) => cardsDragControls.start(e)}
                className="touch-none cursor-grab active:cursor-grabbing text-text-muted p-1 -m-1"
                aria-label="Reorder section"
              >
                <GripVertical size={18} />
              </span>
            </div>
          )}
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${cardOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {/* Single Centered Card */}
          <div className="px-5">
            <div className="w-full aspect-[1.7/1] rounded-2xl shadow-2xl relative p-5 flex flex-col justify-between bg-black overflow-hidden">
              {/* Decorative background K */}
              <div
                className="absolute -bottom-10 left-3 text-[200px] font-extrabold leading-none text-white/[0.04] select-none pointer-events-none"
                aria-hidden="true"
              >
                N
              </div>

              {/* Top row: Nexus wide logo (white) */}
              <div className="flex items-start z-10">
                <img
                  src={NexusWideLogo}
                  alt="Nexus"
                  className="h-10"
                  style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
                />
              </div>

              {/* Bottom row: Mastercard (scheme) + contactless */}
              <div className="flex justify-between items-end z-10">
                <div className="relative ml-8">
                  <img
                    src={MastercardLogo}
                    alt="Mastercard"
                    className="h-20 opacity-90"
                    style={{ transform: 'translate(16px, 16px)' }}
                  />
                </div>
                <span className="material-symbols-outlined text-white/40 text-2xl rotate-90 -mr-1">
                  contactless
                </span>
              </div>
            </div>
          </div>

          {/* Issue Card Button */}
          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate(`/${lang}/card-issuance`)}
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {t.wallet.issueCard}
            </button>
          </div>
        </div>
      </Reorder.Item>
          );
        }
        if (sectionId === 'vouchers') {
          return (
      <Reorder.Item
        key="vouchers"
        value="vouchers"
        dragListener={false}
        dragControls={vouchersDragControls}
        className={`px-5 space-y-4 mb-6 transition-opacity ${isHidden ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setVouchersOpen(!vouchersOpen)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <h2 className="text-lg font-bold text-text-primary">{t.wallet.myVouchers}</h2>
            <span
              className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${vouchersOpen ? 'rotate-180' : ''}`}
              style={{ fontSize: '20px' }}
            >
              expand_more
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface text-text-secondary text-xs font-medium active:scale-95 transition-transform">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
              {t.wallet.filterVouchers}
            </button>
            {editEnabled && (
              <>
                <button
                  type="button"
                  onClick={() => toggleHidden('vouchers')}
                  className="text-text-muted p-1 -m-1 active:opacity-60"
                  aria-label={isHidden ? 'Show section' : 'Hide section'}
                >
                  {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span
                  onPointerDown={(e) => vouchersDragControls.start(e)}
                  className="touch-none cursor-grab active:cursor-grabbing text-text-muted p-1 -m-1"
                  aria-label="Reorder section"
                >
                  <GripVertical size={18} />
                </span>
              </>
            )}
          </div>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${vouchersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <WalletTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </Reorder.Item>
          );
        }
        return null;
      })}
      </Reorder.Group>
      </div>{/* /relative gradient wrapper */}
      </motion.div>

      {/* ══════ BOTTOM SHEETS ══════ */}
      {showMoreSheet && <MoreActionsSheet onClose={() => setShowMoreSheet(false)} />}

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
 * Slot positions for the 2-row widgets grid. Slot N gets whatever
 * widget id sits at widgetOrder[N] — so reordering the array reshuffles
 * which widget lands in which slot. The wide row-2 slot (index 2) is
 * where the carousel naturally lives.
 */
const WIDGET_SLOTS: {
  gridColumn: string;
  gridRow: string;
  /** Size class applied to the Reorder.Item wrapper. */
  size: string;
}[] = [
  { gridColumn: '1', gridRow: '1', size: 'w-48 h-36' },
  { gridColumn: '2', gridRow: '1', size: 'w-48 h-36' },
  { gridColumn: '1 / 3', gridRow: '2', size: 'w-full h-36' },
  { gridColumn: '3', gridRow: '1', size: 'w-40 h-36' },
  { gridColumn: '3', gridRow: '2', size: 'w-40 h-36' },
  { gridColumn: '4', gridRow: '1', size: 'w-40 h-36' },
];

/**
 * One Reorder.Item per widget in the widgets gallery. Drag is only
 * enabled when the user has flipped "Customize wallet" on. The × hide
 * button mimics the AccessibilityWidget's dismiss circle — small dark
 * navy disk with purple ring, anchored at the top-right corner.
 *
 * onDragStart/End fire the auto-scroll loop so the gallery can scroll
 * sideways while a widget is being dragged past the screen edge.
 */
function WidgetReorderItem({
  widgetId,
  slotIndex,
  editEnabled,
  isHidden,
  onHide,
  onDragStart,
  onDragEnd,
  children,
}: {
  widgetId: WalletWidgetId;
  slotIndex: number;
  editEnabled: boolean;
  isHidden: boolean;
  onHide: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  const slot = WIDGET_SLOTS[slotIndex] ?? WIDGET_SLOTS[0];
  return (
    <Reorder.Item
      value={widgetId}
      drag={editEnabled ? true : false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.04,
        zIndex: 30,
        boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
      }}
      style={{ gridColumn: slot.gridColumn, gridRow: slot.gridRow }}
      className={`relative ${slot.size} transition-opacity ${
        editEnabled ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      } ${isHidden ? 'opacity-40' : ''}`}
    >
      <div className="w-full h-full">{children}</div>
      {editEnabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={isHidden ? 'Show widget' : 'Hide widget'}
          title={isHidden ? 'Show widget' : 'Hide widget'}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-[#6366f1]/50 bg-[#0a2540] text-white/70 flex items-center justify-center z-30 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </Reorder.Item>
  );
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
  switch (widgetId) {
    case 'nearby-cashback':
      return (
        <button
          type="button"
          onClick={() => navigate(`/${lang}/near-you-map`)}
          aria-label={t.wallet.widgetNearbyCashback}
          className="w-full h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-transform relative"
        >
          <img
            src="/wallet-nearby-map.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0) 45%, rgba(255,255,255,0.7) 100%)',
            }}
          />
          <div className="absolute top-3 start-3 max-w-[7.5rem] text-start pointer-events-none">
            <p className="text-sm font-bold text-text-primary leading-tight">
              {t.wallet.widgetNearbyCashback}
            </p>
          </div>
          <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-black shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center">
            <img
              src="/brands/castro-home.png"
              alt="Castro"
              className="w-full h-full object-contain"
              style={{ filter: 'invert(1)' }}
            />
          </div>
          <div className="absolute bottom-4 left-12 w-10 h-10 rounded-full bg-white shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center">
            <img
              src="/brands/carrefour.png"
              alt="Carrefour"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      );
    case 'my-organization':
      return (
        <button
          type="button"
          onClick={() => navigate(`/${lang}/profile`)}
          aria-label={t.wallet.widgetMyOrganization}
          className="w-full h-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border active:scale-[0.98] transition-transform relative text-start p-4"
          style={{
            backgroundColor: tenantConfig?.primaryColor ?? 'var(--color-surface)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0) 60%, rgba(255,255,255,0.4) 100%)',
            }}
          />
          <div className="relative flex justify-start mb-2">
            <div className="w-9 h-9 rounded-full bg-white shadow-sm overflow-hidden flex items-center justify-center">
              {tenantConfig?.logo ? (
                <img
                  src={tenantConfig.logo}
                  alt={isRTL ? tenantConfig.nameHe : tenantConfig.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-text-secondary"
                  style={{ fontSize: '20px' }}
                >
                  domain
                </span>
              )}
            </div>
          </div>
          <div
            className="relative pointer-events-none"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
          >
            <div className="text-xs text-white/85 font-medium leading-tight mb-1">
              {t.wallet.widgetMyOrganization}
            </div>
            <div className="text-base font-bold text-white leading-tight line-clamp-2">
              {tenantConfig
                ? isRTL
                  ? tenantConfig.nameHe
                  : tenantConfig.name
                : t.wallet.widgetNoOrganization}
            </div>
          </div>
        </button>
      );
    case 'best-offers':
      return <BestOffersWidget className="w-full h-full" />;
    case 'cashback-stat':
      return (
        <div className="w-full h-full bg-white border border-border rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-success" style={{ fontSize: '20px' }}>trending_up</span>
          </div>
          <div className="text-xs text-text-secondary font-medium leading-tight mb-1">
            {t.wallet.widgetCashback}
          </div>
          <div className="text-xl font-bold text-text-primary" dir="ltr">
            ₪127
          </div>
        </div>
      );
    case 'vouchers-stat':
      return (
        <div className="w-full h-full bg-white border border-border rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>card_giftcard</span>
          </div>
          <div className="text-xs text-text-secondary font-medium leading-tight mb-1">
            {t.wallet.widgetActiveVouchers}
          </div>
          <div className="text-xl font-bold text-text-primary">5</div>
        </div>
      );
    case 'savings-stat':
      return (
        <div className="w-full h-full bg-white border border-border rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-warning" style={{ fontSize: '20px' }}>savings</span>
          </div>
          <div className="text-xs text-text-secondary font-medium leading-tight mb-1">
            {t.wallet.widgetSavings}
          </div>
          <div className="text-xl font-bold text-text-primary" dir="ltr">
            ₪450
          </div>
        </div>
      );
  }
}
