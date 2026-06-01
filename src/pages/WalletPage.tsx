import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatCurrency';
import WalletTabs from '../components/wallet/WalletTabs';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import PayExtrasPanel from '../components/wallet/PayExtrasPanel';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';
import WalletOffersSlider from '../components/wallet/WalletOffersSlider';
import WidgetsGallery from '../components/wallet/WidgetsGallery';
import TopBar from '../components/layout/TopBar';
import { useTenantStore } from '../stores/tenantStore';
import { useWallpaperStore } from '../stores/wallpaperStore';
import { useWalletLayoutStore, type WalletWidgetId } from '../stores/walletLayoutStore';
import type { UserVoucher } from '../types/voucher.types';

// Logos
import MastercardLogo from '../assets/logos/mastercard-logo-transperant.png';
import NexusWideLogo from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';

interface WalletPageProps {
  // When embedded (e.g. inside the chat "pay in store" sheet) the dark
  // "card not on file" top banner is suppressed.
  embedded?: boolean;
}

export default function WalletPage({ embedded = false }: WalletPageProps) {
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
  const offersDragControls = useDragControls();
  const vouchersDragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<UserVoucher['status']>('active');

  // Collapsible section states
  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [vouchersOpen, setVouchersOpen] = useState(true);
  const [noCardBannerOpen, setNoCardBannerOpen] = useState(false);
  const [editBannerOpen, setEditBannerOpen] = useState(false);

  // ── Balance / card carousel ──
  // The balance square and the digital payment card share one horizontal
  // snap carousel (wallet on the right in RTL, card to its left). We
  // track the active index from scrollLeft to drive the dots. Using
  // Math.abs keeps the math correct under RTL's negative scrollLeft.
  const walletCarouselRef = useRef<HTMLDivElement>(null);
  const [walletSlide, setWalletSlide] = useState(0);
  const onWalletScroll = useCallback(() => {
    const el = walletCarouselRef.current;
    if (!el) return;
    setWalletSlide(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  }, []);

  // Mouse drag-to-scroll. Touch devices already pan the snap carousel
  // natively, but a hidden-scrollbar list can't be moved with a mouse —
  // so for pointerType 'mouse' we translate horizontal drag into
  // scrollLeft. Snap is suspended during the drag and restored on
  // release so the carousel settles onto a slide.
  const walletDrag = useRef({ active: false, startX: 0, startScroll: 0 });
  const onWalletPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    // Don't hijack presses on the action buttons (pay / add money) — let
    // their own pointer handlers and clicks fire normally.
    if ((e.target as HTMLElement).closest('button')) return;
    const el = walletCarouselRef.current;
    if (!el) return;
    walletDrag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.style.scrollSnapType = 'none';
    el.setPointerCapture(e.pointerId);
  }, []);
  const onWalletPointerMove = useCallback((e: React.PointerEvent) => {
    if (!walletDrag.current.active) return;
    const el = walletCarouselRef.current;
    if (!el) return;
    el.scrollLeft = walletDrag.current.startScroll - (e.clientX - walletDrag.current.startX);
  }, []);
  const endWalletDrag = useCallback(() => {
    if (!walletDrag.current.active) return;
    walletDrag.current.active = false;
    const el = walletCarouselRef.current;
    if (el) el.style.scrollSnapType = '';
  }, []);

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
      {/* ══════ INLINE TOPBAR ROW (logo, avatar, greeting, chat, bell) ══════ */}
      {!embedded && <TopBar collapsed={false} />}

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

        {/* Carousel wrapper — positioning context for the issue-card
            button that hangs below the card slide. */}
        <div className="relative">
        {/* Horizontal snap carousel: the balance square and the digital
            card live side by side. In RTL the first child sits on the
            right, so the wallet shows first and the card is one swipe to
            its left. */}
        <div
          ref={walletCarouselRef}
          onScroll={onWalletScroll}
          onPointerDown={onWalletPointerDown}
          onPointerMove={onWalletPointerMove}
          onPointerUp={endWalletDrag}
          onPointerCancel={endWalletDrag}
          onDragStart={(e) => e.preventDefault()}
          className="relative z-20 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing select-none"
        >
        <div
          className="snap-center shrink-0 w-full relative rounded-[32px] p-8 text-center overflow-hidden shadow-lg shadow-[#0a2540]/30"
          style={{
            background:
              'radial-gradient(120% 120% at 30% 20%, rgba(125,211,252,0.18), transparent 55%), linear-gradient(135deg, #0a2540 0%, #0a2540 55%, #06182b 100%)',
            border: '1px solid rgba(125,211,252,0.25)',
          }}
        >
          {/* New badge — top-start corner */}
          <span className="absolute top-4 start-4 bg-[#7dd3fc]/20 text-[#7dd3fc] text-xs font-bold px-2.5 py-0.5 rounded-full">
            {t.wallet.newBadge}
          </span>

          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-white/80 font-medium">
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
            <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
          </div>

          {/* Balance Amount */}
          <h1 className="text-6xl font-bold text-white mb-1 tracking-tight">
            {formatCurrency(wallet?.balance || 0, 'ILS', locale)}
          </h1>

          {/* Action Buttons Row + Cashback */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate(`/${lang}/wallet/add-money`)}
              className="bg-white/10 text-white border border-white/25 px-8 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform"
            >
              {t.wallet.addMoney}
            </button>
            <button
              onPointerDown={handlePayPointerDown}
              onPointerUp={handlePayPointerUp}
              onPointerLeave={handlePayPointerLeave}
              className="relative overflow-hidden bg-[#7dd3fc] text-[#0a2540] px-6 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform select-none"
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
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/25 active:scale-95 transition-transform flex-shrink-0"
            >
              <span className="material-symbols-outlined text-white/80 rotate-90" style={{ fontSize: '20px' }}>more_horiz</span>
            </button>
          </div>

          {/* Cashback Text — attached to buttons */}
          <p className="text-emerald-300 font-semibold text-sm mt-2">{t.wallet.earnCashback}</p>
        </div>

        {/* ── CARD SLIDE — fills the slide so the card is exactly the same
            size as the balance square. The "issue card" action hangs
            below it (rendered outside the scroller, see below). ── */}
        <div className="snap-center shrink-0 w-full flex">
          <div className="w-full h-full rounded-[32px] shadow-2xl relative p-5 flex flex-col justify-between bg-black overflow-hidden">
            <div
              className="absolute -bottom-10 left-3 text-[200px] font-extrabold leading-none text-white/[0.04] select-none pointer-events-none"
              aria-hidden="true"
            >
              N
            </div>
            <div className="flex items-start z-10">
              <img
                src={NexusWideLogo}
                alt="Nexus"
                className="h-10"
                style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
              />
            </div>
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
        </div>{/* /carousel */}

        {/* Issue-card action — only on the card slide, hanging below the
            matched card/wallet rectangle so it visibly protrudes. Lives
            outside the scroller so the overflow isn't clipped. */}
        {walletSlide === 1 && (
          <div className="absolute inset-x-0 -bottom-5 flex justify-center z-30">
            <button
              onClick={() => navigate(`/${lang}/card-issuance`)}
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {t.wallet.issueCard}
            </button>
          </div>
        )}
        </div>{/* /carousel wrapper */}

        {/* Carousel dots */}
        <div className="flex justify-center gap-1.5 mt-8">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                walletSlide === i ? 'w-5 bg-[#0a2540]' : 'w-1.5 bg-text-muted/40'
              }`}
            />
          ))}
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
          // "הטבות במיוחד בשבילך" — its own reorderable section so it can
          // be dragged up/down (and hidden) in customize mode.
          return (
      <Reorder.Item
        key="offers"
        value="offers"
        dragListener={false}
        dragControls={offersDragControls}
        className={`transition-opacity ${isHidden ? 'opacity-40' : ''}`}
      >
        <WalletOffersSlider
          editEnabled={editEnabled}
          isHidden={isHidden}
          onToggleHidden={() => toggleHidden('offers')}
          onReorderPointerDown={(e) => offersDragControls.start(e)}
        />
      </Reorder.Item>
          );
        }
        if (sectionId === 'digitalCards') {
          // The card and its "issue card" action now live in the balance
          // carousel above, so this section no longer renders anything.
          return null;
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
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border"
        style={{ backgroundColor: opts.bg ?? 'var(--color-surface)' }}
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
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border overflow-hidden"
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
        onClick: () => navigate(`/${lang}/store`),
      });
    case 'cashback-stat':
      return circle('📈', t.wallet.widgetCashback, {});
    case 'vouchers-stat':
      return circle('🎁', t.wallet.widgetActiveVouchers, {});
    case 'savings-stat':
      return circle('💰', t.wallet.widgetSavings, {});
  }
}
