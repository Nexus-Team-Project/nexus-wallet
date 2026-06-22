import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { usePaySession, PAY_SESSION_SECONDS } from '../hooks/usePaySession';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import PayCodeInfoSheet from '../components/wallet/PayCodeInfoSheet';
import WalletOffersSlider from '../components/wallet/WalletOffersSlider';
import WidgetsGallery from '../components/wallet/WidgetsGallery';
import BalanceCard from '../components/wallet/BalanceCard';
import DigitalCard from '../components/wallet/DigitalCard';
import VoucherCard from '../components/wallet/VoucherCard';
import TransactionSuccessShell from '../components/ui/TransactionSuccessShell';
import TopBar from '../components/layout/TopBar';
import { useTenantStore } from '../stores/tenantStore';
import { useWallpaperStore } from '../stores/wallpaperStore';
import { useWalletLayoutStore, type WalletWidgetId } from '../stores/walletLayoutStore';
import { useArchiveStore } from '../stores/archiveStore';
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import dotLottieWasmUrl from '@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm?url';
import tapAnimUrl from '../assets/animations/tap.lottie?url';

// Serve the dotLottie player wasm from our own origin (same as the nav/action
// icons) so the tap-to-pay coach mark renders even if the default CDN is
// blocked. Runs once on import.
setWasmUrl(dotLottieWasmUrl);

interface WalletPageProps {
  // When embedded (e.g. inside the chat "pay in store" sheet) the dark
  // "card not on file" top banner is suppressed.
  embedded?: boolean;
}

// The Bnei Akiva gift voucher (added to the wallet mock); arriving from the
// gift-sample redeem deep-links here with `?focus=` set to this id.
const BNEI_VOUCHER_ID = 'uv_bnei_pesach';
// The SPAR gift voucher — its redeemed wallet view also shows the Isracard
// digital card beside the gift card in the deck.
const SPAR_VOUCHER_ID = 'uv_spar_gift';

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

  // Deep-link: arriving with `?focus=<userVoucherId>` (from redeeming a gift)
  // puts the wallet into a focused, LOCKED "gift" view — only the gift card in
  // the deck, widgets collapsed, and toolbars / cashback non-interactive.
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const focusVoucherId = searchParams.get('focus');
  const cameFromGift = !!focusVoucherId;
  const centerVoucherId = (location.state as { centerVoucherId?: string } | null)?.centerVoucherId;
  // Pay-at-store flow: arriving with state.payMode shows only the card carousel
  // (the rest of the wallet is hidden) with the Nexus balance card already
  // flipped to its pay/barcode side.
  const payMode = (location.state as { payMode?: boolean } | null)?.payMode === true;

  // Post-transaction cashback animation: the success page stores the earned
  // cashback (+ which card was just bought) in sessionStorage; we read + clear
  // it once on mount. The balance counts up by the cashback, then the deck
  // slides to reveal the purchased card.
  const [postTx, setPostTx] = useState<{ cashback: number; targetCardId: string | null } | null>(() => {
    try {
      const raw = sessionStorage.getItem('nexus_pending_wallet_anim');
      if (raw) {
        sessionStorage.removeItem('nexus_pending_wallet_anim');
        const parsed = JSON.parse(raw);
        return { cashback: parsed.cashback as number, targetCardId: (parsed.targetCardId ?? null) as string | null };
      }
    } catch {}
    return null;
  });
  const postTxCashback = postTx?.cashback ?? null;

  // ── SPAR gift payment demo ──
  // In the SPAR gift-redeemed wallet, flipping the gift card shows a
  // "המחשת תשלום" (simulate payment) button. Tapping it plays a ₪150 purchase
  // confirmation; closing it marks the card "used" — greyed-out + locked, with
  // an archive action on the carousel. Archiving slides the deck to the Nexus
  // balance card, which counts up the earned cashback.
  const SPAR_DEMO_AMOUNT = 150;
  const SPAR_DEMO_CASHBACK = 15;
  const [showSparSuccess, setShowSparSuccess] = useState(false);
  const [sparUsed, setSparUsed] = useState(false);
  const [sparArchiveConfirming, setSparArchiveConfirming] = useState(false);

  // Collapsible section states.
  const [noCardBannerOpen, setNoCardBannerOpen] = useState(false);
  const [editBannerOpen, setEditBannerOpen] = useState(false);
  // "How it works" explainer sheet, opened from the digital card's "?" button.
  const [showCardHelp, setShowCardHelp] = useState(false);
  // Pay-code "how it works" sheet (the "?" on the Nexus balance card) — auto-
  // opened when returning from the pay-intro → add-card onboarding flow
  // (navigated here with state.openPayCodeHelp).
  const [showPayCodeHelp, setShowPayCodeHelp] = useState<boolean>(
    () => (location.state as { openPayCodeHelp?: boolean } | null)?.openPayCodeHelp === true,
  );
  // One-shot: the spotlight + sheet open ONLY when arriving from the pay-intro →
  // add-card flow (which sets state.openPayCodeHelp). Clear that flag from the
  // history entry once consumed so back/forward navigation can't re-trigger it.
  useEffect(() => {
    if ((location.state as { openPayCodeHelp?: boolean } | null)?.openPayCodeHelp) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stacked card deck (Google-Wallet style) ──
  // The balance square and the digital payment card sit in a stack: the
  // active card is on top, the next card peeks out from behind it.
  // Dragging the top card sideways past a threshold shuffles it to the
  // back and brings the next card forward.
  // The carousel: the balance sits in the MIDDLE — the digital card on one
  // side, the active vouchers on the other (chronological).
  const { data: myVouchers } = useMyVouchers();
  // Cards the user has moved to the archive — filtered out of the deck below.
  const archivedIds = useArchiveStore((s) => s.archivedIds);
  const activeVouchers = (myVouchers ?? [])
    .filter((v) => v.status === 'active' && !archivedIds.includes(`voucher:${v.id}`))
    .sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime());
  // Post-tx: the just-purchased voucher must sit adjacent to the balance card
  // (opposite side from the digital 'card'), regardless of its mock date — so
  // hoist it to the end of the voucher list.
  const postTxVoucherId =
    postTx?.targetCardId?.startsWith('voucher:') ? postTx.targetCardId.slice('voucher:'.length) : null;
  if (postTxVoucherId) {
    const i = activeVouchers.findIndex((v) => v.id === postTxVoucherId);
    if (i >= 0) activeVouchers.push(activeVouchers.splice(i, 1)[0]);
  }
  // In the gift view the deck holds the gift card — no other vouchers,
  // balance, or "add" stops. The SPAR gift additionally keeps the Isracard
  // digital card in the deck, so the redeemed wallet shows it in the slider.
  const deckCards: string[] = cameFromGift
    ? focusVoucherId === SPAR_VOUCHER_ID
      ? // Once the gift card is "used", the Nexus balance card joins the deck so
        // archiving the gift can slide across to it (counting up the cashback).
        sparUsed
        ? [`voucher:${focusVoucherId}`, 'balance', 'card']
        : [`voucher:${focusVoucherId}`, 'card']
      : [`voucher:${focusVoucherId}`]
    : [
        // Leading "add money" (+) stop — mirrors the trailing manage-methods
        // stop on the opposite end of the carousel.
        'plus',
        ...activeVouchers.map((v) => `voucher:${v.id}`),
        // The balance + digital cards drop out of the deck once archived.
        ...(archivedIds.includes('balance') ? [] : ['balance']),
        ...(archivedIds.includes('card') ? [] : ['card']),
        // Trailing "manage payment methods" stop: the final drag past the
        // digital card parks it to the side (its dimmed peek form) and anchors
        // the stripes circle beside it.
        'add',
      ];
  // Balance sits right after the vouchers; its index shifts as vouchers
  // load async (and when cards are archived), so keep the deck centred on it
  // until the user swipes. Falls back to the voucher count if archived.
  const balanceIndex = (() => {
    const i = deckCards.indexOf('balance');
    // Fallback (balance archived): vouchers sit after the leading 'plus' stop.
    return i >= 0 ? i : activeVouchers.length + (cameFromGift ? 0 : 1);
  })();
  const [activeCard, setActiveCard] = useState(0);
  // True while the centre card is being dragged — used to hide the upsell peek
  // the instant the user grabs and moves the card (not only on swipe-commit).
  const [cardDragging, setCardDragging] = useState(false);
  // During the post-tx flow the deck must LAND directly on the balance card with
  // no slide-in (the active index otherwise animates from 0 across to the balance
  // index once the vouchers load async). While `deckSnap` is true, deck position
  // changes are instant; we flip it off right before sliding to the purchased card.
  const [deckSnap, setDeckSnap] = useState<boolean>(postTx != null);
  // The premium upsell is revealed only AFTER the post-tx slide settles. With no
  // post-tx flow (e.g. a reload while the upsell is still live) it's shown right
  // away. The slide-out / retract animation itself is handled by AnimatePresence.
  const [upsellReady, setUpsellReady] = useState<boolean>(postTx == null);
  // The upsell opens straight into its full expanded form — no peek sliver and
  // no tap required. Kept as state (rather than a constant) so the existing
  // expand/collapse styling hooks keep working unchanged.
  const [upsellExpanded, setUpsellExpanded] = useState<boolean>(true);
  // Safety net: if the post-tx slide can't resolve (e.g. no card in the deck),
  // still reveal the upsell after the animation window so it never gets stuck.
  useEffect(() => {
    if (!postTx) return;
    const t = setTimeout(() => setUpsellReady(true), 4000);
    return () => clearTimeout(t);
  }, [postTx]);
  const userMovedDeck = useRef(false);
  useLayoutEffect(() => {
    if (!userMovedDeck.current && !cameFromGift) setActiveCard(balanceIndex);
  }, [balanceIndex, cameFromGift]);

  // Post-tx: show the balance count-up first, then slide to reveal the card that
  // was just purchased. The count-up can finish BEFORE the vouchers query loads,
  // so we only record that it's done here — the actual slide happens in an
  // effect below once the deck is ready. We keep `postTx` set so the pinned
  // voucher (and topped-up balance) stay stable.
  const didPostTxSlide = useRef(false);
  const [countUpDone, setCountUpDone] = useState(false);
  const handleBalanceCountComplete = useCallback(() => {
    setCountUpDone(true);
  }, []);
  // Resolve which deck index to slide to. With a specific purchased card we wait
  // for THAT exact card to appear (the vouchers query may first return stale
  // cached data without it) — never fall back to an old card, which would slide
  // to the wrong place and lock the one-shot guard. Without a target (e.g. a
  // product purchase) we use the newest voucher adjacent to balance.
  const postTxTargetIdx = postTx
    ? postTx.targetCardId
      ? deckCards.indexOf(postTx.targetCardId)
      : (balanceIndex > 0 ? balanceIndex - 1 : -1)
    : -1;
  useEffect(() => {
    if (!postTx || !countUpDone || didPostTxSlide.current) return;
    if (postTxTargetIdx < 0) return; // purchased card not in the deck yet — wait
    didPostTxSlide.current = true;
    const t = setTimeout(() => {
      userMovedDeck.current = true;
      setDeckSnap(false); // re-enable animation so the move to the card slides
      setActiveCard(postTxTargetIdx);
    }, 800);
    // Reveal the upsell (it then slides out of the card) once the slide settles.
    const t2 = setTimeout(() => setUpsellReady(true), 1500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [postTx, countUpDone, postTxTargetIdx]);
  // Deep-link focus: centre + pin the deck on the gift voucher.
  const didFocus = useRef(false);
  useLayoutEffect(() => {
    if (didFocus.current || !focusVoucherId) return;
    const idx = deckCards.indexOf(`voucher:${focusVoucherId}`);
    if (idx >= 0) {
      userMovedDeck.current = true;
      setActiveCard(idx);
      didFocus.current = true;
    }
  }, [focusVoucherId, deckCards]);
  // Post-purchase center: arriving with state.centerVoucherId centres the deck
  // on that voucher without locking the wallet into gift-only mode. EXCEPTION:
  // during a post-transaction animation (postTx) we must FIRST land on the
  // balance card and count up the cashback — the slide to the purchased card
  // happens afterwards (see the post-tx slide effect). So skip this when postTx
  // is active; otherwise it would jump straight onto the purchased card.
  const didCenter = useRef(false);
  useLayoutEffect(() => {
    if (didCenter.current || !centerVoucherId || postTx) return;
    const idx = deckCards.indexOf(`voucher:${centerVoucherId}`);
    if (idx >= 0) {
      userMovedDeck.current = true;
      setActiveCard(idx);
      didCenter.current = true;
    }
  }, [centerVoucherId, deckCards, postTx]);
  // Gift view: kill native pull-to-refresh so a long pull can't navigate away
  // (the page is already locked to the screen via overflow-hidden in AppLayout).
  // overscrollBehavior isn't touched by AppLayout's body self-heal, so it sticks.
  useEffect(() => {
    if (!cameFromGift) return;
    const html = document.documentElement;
    const prev = html.style.overscrollBehavior;
    html.style.overscrollBehavior = 'none';
    return () => {
      html.style.overscrollBehavior = prev;
    };
  }, [cameFromGift]);
  // Which voucher card is flipped to its redemption side (null = none).
  const [flippedVoucherId, setFlippedVoucherId] = useState<string | null>(null);

  // SPAR demo: archive the "used" gift card and slide the deck across to the
  // balance card, which counts up the earned cashback (reuses the post-tx
  // balance count-up animation).
  const archiveSparGift = () => {
    setSparArchiveConfirming(false);
    setFlippedVoucherId(null);
    setPostTx({ cashback: SPAR_DEMO_CASHBACK, targetCardId: 'balance' });
    userMovedDeck.current = true;
    setDeckSnap(false);
    const balIdx = deckCards.indexOf('balance');
    if (balIdx >= 0) setActiveCard(balIdx);
  };

  // ── Balance card flip = pay session ──
  // Tapping the balance card flips it (gift-card style) to reveal the in-store
  // pay barcodes on the back and starts a 30s session; a ring on the back fills
  // as the session elapses, then auto-closes (flips back). Declared here (above
  // the cashback section) so the cashback reveal can key off the flip state.
  const pay = usePaySession();
  const { showPaySheet, paySecondsLeft, openPay, closePay } = pay;
  // Cashback section phases. We don't unmount immediately on leaving the
  // balance card — we play a reverse pulse + height-collapse first so the
  // section below (widgets) rises up gradually. `seq` bumps on each open so
  // the reveal keyframe replays on every return to the balance card.
  const onBalanceCard = deckCards[activeCard] === 'balance';
  // The Bnei Akiva gift card has its own cashback section (same reveal slot),
  // so redeeming a gift lands on a wallet that immediately shows where to spend
  // it — branded for Bnei Akiva.
  const onBneiCard = deckCards[activeCard] === `voucher:${BNEI_VOUCHER_ID}`;
  // The SPAR gift card carries the same "redeemable here" section, branded for
  // SPAR — so the redeemed wallet shows where the card works.
  const onSparCard = deckCards[activeCard] === `voucher:${SPAR_VOUCHER_ID}`;
  // Which cashback section the active card wants (null = none). Tracking the
  // *identity* (not just a boolean) lets the section animate closed→open even
  // when switching between two cards that BOTH have cashback (balance ↔ gift).
  type CashbackKey = 'balance' | 'bnei' | 'spar' | null;
  // The cashback / "redeemable here" section only reveals once the active card
  // is flipped to its back — the pay-barcode side for the balance card, the
  // redemption side for the gift cards — not while a card's front is showing.
  const targetCashback: CashbackKey = (onBalanceCard && showPaySheet)
    ? 'balance'
    : (onBneiCard && flippedVoucherId === deckCards[activeCard])
      ? 'bnei'
      : (onSparCard && flippedVoucherId === deckCards[activeCard])
        ? 'spar'
        : null;
  const [cashback, setCashback] = useState<{
    phase: 'closed' | 'open' | 'closing';
    seq: number;
    key: CashbackKey;
  }>(() =>
    targetCashback
      ? { phase: 'open', seq: 0, key: targetCashback }
      : { phase: 'closed', seq: 0, key: null },
  );
  useEffect(() => {
    setCashback((c) => {
      // Leaving cashback entirely → collapse.
      if (targetCashback === null) {
        return c.phase === 'open' ? { ...c, phase: 'closing' } : c;
      }
      // Closed → open fresh on the target card.
      if (c.phase === 'closed') {
        return { phase: 'open', seq: c.seq + 1, key: targetCashback };
      }
      // Switching to a DIFFERENT cashback card → collapse the current one first
      // (it reopens on the new card once the collapse animation ends).
      if (c.key !== targetCashback) {
        return { ...c, phase: 'closing' };
      }
      return c;
    });
  }, [targetCashback]);
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
  // Arriving from a redeemed gift (deep-link `?focus=`): suppress the
  // "add a payment method" prompt — the user just received a gift, not a nudge.
  const showNoCardBanner = !hasCard && !embedded && !editEnabled && !cameFromGift;
  // Either banner occupies the dark top strip, so the white content frame
  // overlaps it the same way in both cases.
  const showTopStrip = showNoCardBanner || showEditBanner;


  // ── Tap-to-pay coach mark ──
  // A white hand tapping the balance card on entry, hinting "tap to pay".
  // It's a one-shot: the moment the user opens the pay session (or flips a
  // voucher) we dismiss it for good so it never nags again.
  const prefersReduced = useReducedMotion();
  // Playback speed of the tap-coach Lottie (<1 = slower taps). The wrapper lift
  // derives its loop duration from this (TAP_LOOP_SEC) so the two stay in sync.
  const TAP_SPEED = 0.6;
  const TAP_LOOP_SEC = 1.18 / TAP_SPEED; // base loop is 1.18s at speed 1
  const [coachDismissed, setCoachDismissed] = useState(false);
  useEffect(() => {
    if (showPaySheet || flippedVoucherId) setCoachDismissed(true);
  }, [showPaySheet, flippedVoucherId]);

  // Pay-at-store: land centred on the Nexus balance card and flip it straight to
  // the pay/barcode side.
  const didPayMode = useRef(false);
  useLayoutEffect(() => {
    if (!payMode || didPayMode.current) return;
    didPayMode.current = true;
    userMovedDeck.current = true;
    setActiveCard(balanceIndex);
    openPay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payMode, balanceIndex]);

  // Onboarding return (state.openPayCodeHelp): flip the balance card to its pay
  // side so the "?" info sheet sits over the live pay-codes view. Closing the
  // sheet (see onClose) flips the card back. The auto-center effect keeps the
  // balance card centred, so the flip lands on the right card.
  const didPayCodeHelp = useRef(false);
  useLayoutEffect(() => {
    if (!showPayCodeHelp || didPayCodeHelp.current) return;
    didPayCodeHelp.current = true;
    openPay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPayCodeHelp]);

  // Spotlight rect — the balance card's on-screen box, so an overlay can dim
  // everything EXCEPT the card (a lit cut-out) while its info sheet is open.
  const [spotRect, setSpotRect] = useState<
    { top: number; left: number; width: number; height: number } | null
  >(null);
  useLayoutEffect(() => {
    if (!showPayCodeHelp) {
      setSpotRect(null);
      return;
    }
    // Track the card every frame while the sheet is open — the card flips and
    // the deck springs into place on arrival, so a one-shot measure lands on a
    // mid-animation position. Continuous tracking keeps the frame glued to the
    // card's final resting box (and follows any scroll/resize).
    let raf = 0;
    const tick = () => {
      const el = cardWrapRefs.current.balance;
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotRect((prev) =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPayCodeHelp]);

  // Measure the balance card so the deck reserves the right height and
  // the digital card can stretch to match it.
  useLayoutEffect(() => {
    const el = cardWrapRefs.current.balance;
    if (el) setDeckHeight(el.offsetHeight);
  }, [language, wallet?.balance]);

  // Premium upsell card — purchase-driven. Each completed purchase writes an
  // upsell payload (with an expiry) to localStorage; a NEW purchase overwrites
  // the previous one. The card shows only while a non-expired payload exists, so
  // it appears after a purchase and stays until its timer runs out.
  const UPSELL_COUNTDOWN = 300;
  type UpsellData = {
    cashback: number;
    total?: number;
    productName?: string;
    businessName?: string;
    businessLogo?: string | null;
    cardColor?: string;
    targetCardId?: string | null;
    expiresAt: number;
  };
  const [upsellData, setUpsellData] = useState<UpsellData | null>(() => {
    try {
      const raw = localStorage.getItem('nexus_premium_upsell');
      if (raw) {
        const d = JSON.parse(raw) as UpsellData;
        if (d.expiresAt && d.expiresAt > Date.now()) return d;
        localStorage.removeItem('nexus_premium_upsell');
      }
    } catch {}
    return null;
  });
  const [upsellCountdown, setUpsellCountdown] = useState<number>(() =>
    upsellData ? Math.max(0, Math.round((upsellData.expiresAt - Date.now()) / 1000)) : 0,
  );
  const showUpsell = upsellData != null && upsellCountdown > 0;
  const dismissUpsell = useCallback(() => {
    setUpsellData(null);
    try { localStorage.removeItem('nexus_premium_upsell'); } catch {}
  }, []);
  useEffect(() => {
    if (!showUpsell) return;
    if (upsellCountdown <= 0) { dismissUpsell(); return; }
    const t = setTimeout(() => setUpsellCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showUpsell, upsellCountdown, dismissUpsell]);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, _setNotificationType] = useState<'success' | 'declined'>('success');
  const [merchantName, _setMerchantName] = useState('');

  // Renders the inner box for a deck card. Used for both the crisp active
  // card on top and the faded side-peek copies behind it, so the markup
  // lives in one place.
  const renderDeckCard = (cardId: string, isCenter = false) => {
    if (cardId.startsWith('voucher:')) {
      const uv = activeVouchers.find((v) => `voucher:${v.id}` === cardId);
      if (!uv) return null;
      // SPAR demo: once paid, the gift card reads as "used" — greyed-out and
      // locked (same treatment as a frozen digital card).
      const isUsedSpar = cardId === `voucher:${SPAR_VOUCHER_ID}` && sparUsed;
      return (
        <div className="relative w-full">
          <VoucherCard
            userVoucher={uv}
            flipped={flippedVoucherId === cardId && !isUsedSpar}
            onExpire={() => setFlippedVoucherId(null)}
          />
          {isUsedSpar && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-full rounded-xl flex items-center justify-center"
                style={{
                  aspectRatio: '1.586 / 1',
                  background: 'rgba(55,65,81,0.55)',
                  backdropFilter: 'grayscale(0.6)',
                  WebkitBackdropFilter: 'grayscale(0.6)',
                }}
              >
                <span
                  className="material-symbols-rounded text-white"
                  style={{ fontSize: 44, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                >
                  lock
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (cardId === 'balance') {
      // Filling progress ring — empties→fills as the 30s session elapses.
      const ringC = 2 * Math.PI * 16;
      const ringOffset = ringC * (paySecondsLeft / PAY_SESSION_SECONDS);
      // SPAR gift demo: the recipient is a brand-new Nexus user, so the balance
      // starts at ₪0 and counts up ONLY the cashback just earned — not the mock
      // user's ₪1,250.
      const isSparDemo = cameFromGift && focusVoucherId === SPAR_VOUCHER_ID;
      const baseBalance = isSparDemo ? 0 : (wallet?.balance ?? 0);
      const balanceValue =
        postTxCashback != null && !walletLoading ? baseBalance + postTxCashback : baseBalance;
      const balanceFrom =
        postTxCashback != null && !walletLoading ? baseBalance : undefined;
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
                balance={balanceValue}
                logoCorner
                className="w-full"
                style={{ aspectRatio: '1510 / 952' }}
                countFrom={balanceFrom}
                onCountComplete={handleBalanceCountComplete}
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
    if (cardId === 'plus') {
      // ── "+" stop (leading end of the carousel) — mirrors the trailing
      //    manage-methods stop on the opposite side. The neighbouring voucher
      //    peeks on one side; the "+" circle is anchored on the OPPOSITE side.
      //    Tapping it → the stores list. ──
      return (
        <div className="relative w-full" style={{ minHeight: deckHeight || 264 }}>
          <button
            onClick={() => navigate(`/${lang}/wallet/deal-intro`)}
            aria-label={language === 'he' ? 'צור עסקה בתנאים שלך' : 'Create a deal on your terms'}
            className="absolute top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.14)] flex items-center justify-center active:scale-95 transition-transform"
            style={{ ...(isRTL ? { right: '-2%' } : { left: '-2%' }), backgroundColor: '#ffffff' }}
          >
            <span className="material-symbols-rounded text-text-secondary" style={{ fontSize: 34 }}>
              add
            </span>
          </button>
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
          the same height as the (taller) balance/pay card. In the SPAR gift
          view it carries the SPAR co-brand logo above the NEXUS mark. ── */
      <DigitalCard
        className="w-full"
        heightPx={deckHeight || undefined}
        brandLogo={
          cameFromGift && focusVoucherId === SPAR_VOUCHER_ID
            ? '/tenants/spar-logo-black.png'
            : undefined
        }
        onHelp={() => setShowCardHelp(true)}
        locked
        lockActive={isCenter}
      >
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
      {/* ══════ INLINE TOPBAR ROW (logo, avatar, greeting, chat, bell) ══════ */}
      {!embedded && (
        // Gift view: the top toolbar stays visible but non-interactive.
        <div className={cameFromGift ? 'pointer-events-none' : undefined}>
          <TopBar collapsed={false} />
        </div>
      )}

      {/* ══════ BALANCE CARD (Klarna-style) ══════ */}
      {/* mb is generous so the hanging dark CTA (issue-card / more-actions),
          which protrudes -bottom-8 below the deck, has clearance and isn't
          clipped by the section that follows. */}
      <section className="relative mt-4 mb-16 px-5">
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
        <div className="relative z-10">
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
                transition={deckSnap ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 32 }}
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
                  onDragStart={isCenter ? () => setCardDragging(true) : undefined}
                  onDragEnd={
                    isCenter
                      ? (e, info) => {
                          setCardDragging(false);
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
                          // Gift flow: the Isracard digital card is display-only
                          // — it can still be swiped, but a tap does nothing;
                          // only its "issue card" button is interactive.
                          if (cameFromGift && cardId === 'card') return;
                          // Voucher: flip to its redemption side (tap again,
                          // off a button, to flip back). A "used" SPAR gift card
                          // is locked — it no longer flips.
                          if (cardId.startsWith('voucher:')) {
                            if (cardId === `voucher:${SPAR_VOUCHER_ID}` && sparUsed) return;
                            const onBtn = (e.target as HTMLElement | null)?.closest('button');
                            if (flippedVoucherId === cardId && onBtn) return;
                            setFlippedVoucherId((prev) => (prev === cardId ? null : cardId));
                            return;
                          }
                          // Manage-methods / "+" stops: the circle button owns
                          // the tap; ignore taps elsewhere on the slot.
                          if (cardId === 'add' || cardId === 'plus') return;
                          if (cardId !== 'balance') {
                            // A tap on an on-card control (e.g. the "?" help
                            // button) opens its own sheet — it must NOT count as
                            // a card tap that navigates to the card page.
                            if ((e.target as HTMLElement | null)?.closest('button')) return;
                            handleCardTap(cardId, e, info);
                            return;
                          }
                          if (!showPaySheet) {
                            // First-ever tap on the balance card opens the pay
                            // intro (onboarding); every tap after that flips
                            // straight to the in-store pay barcodes.
                            let introSeen = false;
                            try { introSeen = localStorage.getItem('nexus_pay_intro_seen') === '1'; } catch {}
                            if (!introSeen) {
                              try { localStorage.setItem('nexus_pay_intro_seen', '1'); } catch {}
                              navigate(`/${lang}/wallet/pay-intro`);
                              return;
                            }
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
                  {renderDeckCard(cardId, isCenter)}
                </motion.div>
              </motion.div>
            );
          })}

          {/* ══════ TAP-TO-PAY COACH MARK ══════
              A white hand tapping the balance card, shown on entry until the
              user opens the pay session (one-shot, see coachDismissed). It sits
              in the empty upper area of the card so it never covers the balance,
              and is pointer-events-none so the tap still lands on the card
              underneath. Honors prefers-reduced-motion. */}
          <AnimatePresence>
            {!coachDismissed && !cameFromGift && !postTx && !cardDragging &&
              deckCards[activeCard] === 'balance' && !showPaySheet && (
              <motion.div
                key="tap-coach"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute top-[5%] start-[2%] z-[36]"
              >
                {/* White "tap" Lottie (LottieFiles — "Tap" by Arun KP), tucked
                    into the top corner and tilted on a slight diagonal so it
                    reads like a hand reaching in to tap the card. Loops while
                    visible; holds the static first frame under reduced-motion. */}
                {/* Holds the 18° tilt. At rest the hand sits low; on the tap it
                    lifts up, then drops back down. The lift is synced to the
                    Lottie's own loop — duration matches its 1.18s cycle (frames
                    50–109 @ 50fps) and the peak lands at ~20%, the press moment. */}
                <motion.div
                  className="w-36 h-36"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
                  animate={
                    prefersReduced
                      ? { rotate: 18 }
                      : {
                          rotate: 18,
                          y: [6, 6, -8, 6, 6],
                        }
                  }
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : {
                          duration: TAP_LOOP_SEC,
                          times: [0, 0.06, 0.2, 0.62, 1],
                          ease: 'easeInOut',
                          repeat: Infinity,
                        }
                  }
                >
                  <DotLottieReact
                    src={tapAnimUrl}
                    autoplay={!prefersReduced}
                    loop={!prefersReduced}
                    speed={TAP_SPEED}
                    style={{ width: '100%', height: '100%' }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>{/* /deck */}

        {/* Issue-card action — only when the digital card is on top,
            hanging below the stack so it visibly protrudes. */}
        {deckCards[activeCard] === 'card' && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40">
            <button
              onClick={() => {
                // SPAR hands off to Isracard's hosted issuance page — opened in
                // a NEW TAB so the gift flow stays intact in this tab (no full
                // navigation away that a back button can't restore). Other
                // tenants go through the in-app issuance story flow.
                if (tenantConfig?.id === 'spar') {
                  window.open(
                    'https://issuance.isracard.co.il/spar/CardsAuthentication',
                    '_blank',
                    'noopener,noreferrer',
                  );
                  return;
                }
                navigate(`/${lang}/card-issuance`);
              }}
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

        {/* More-actions for a flipped voucher. For the SPAR gift card this is the
            "simulate payment" button that drives the demo; every other voucher
            keeps the usual "more actions" link to its page. */}
        {flippedVoucherId && deckCards[activeCard] === flippedVoucherId && !sparUsed && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40">
            {flippedVoucherId === `voucher:${SPAR_VOUCHER_ID}` ? (
              <button
                onClick={() => setShowSparSuccess(true)}
                className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
              >
                {language === 'he' ? 'המחשת תשלום' : 'Simulate payment'}
              </button>
            ) : (
              <button
                onClick={() =>
                  navigate(`/${lang}/wallet/voucher/${flippedVoucherId.slice('voucher:'.length)}`)
                }
                className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
              >
                {language === 'he' ? 'פעולות נוספות' : 'More actions'}
              </button>
            )}
          </div>
        )}

        {/* Archive action — hangs below the "used" (greyed-out) SPAR gift card.
            Confirming archives the card and slides the deck across to the Nexus
            balance card, which counts up the earned cashback. */}
        {deckCards[activeCard] === `voucher:${SPAR_VOUCHER_ID}` && sparUsed && (
          <div className="absolute inset-x-0 -bottom-8 flex justify-center z-40 px-6 w-full">
            {!sparArchiveConfirming ? (
              <button
                onClick={() => setSparArchiveConfirming(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-surface border border-border text-text-secondary font-bold text-sm active:scale-95 transition-transform shadow-md"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
                {language === 'he' ? 'העבר לארכיון' : 'Move to archive'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={archiveSparGift}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
                  {language === 'he' ? 'אישור' : 'Confirm'}
                </button>
                <button
                  onClick={() => setSparArchiveConfirming(false)}
                  className="px-5 py-3 rounded-full bg-surface border border-border text-text-secondary font-bold text-sm active:scale-95 transition-transform shadow-md"
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        )}
        </div>{/* /deck wrapper */}

        {/* Tap-to-pay CTA — under every card EXCEPT the digital card and the
            manage-methods stop (which navigate); fades while flipped. Hidden
            while the post-purchase upsell peeks under the card. The balance
            card ALSO gets the on-card hand coach mark (see deck) on top of this
            hint. */}
        {deckCards[activeCard] !== 'card' && deckCards[activeCard] !== 'add' && deckCards[activeCard] !== 'plus' && !(showUpsell && upsellReady) && !(deckCards[activeCard] === `voucher:${SPAR_VOUCHER_ID}` && sparUsed) && (
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

        {/* ══════ PREMIUM UPSELL — opens straight into its full expanded form
            below the purchased card (no peek, no tap). It's bound to the card it
            relates to: only shown while that card is centred, so swiping to
            another card retracts it (fast exit) and unmounts it. ══════ */}
        <AnimatePresence>
        {showUpsell && upsellReady && upsellData && upsellData.targetCardId?.startsWith('voucher:')
          && deckCards[activeCard] === upsellData.targetCardId
          && !cardDragging
          // Hide (retract) while the bound card is flipped — voucher flipped or
          // balance card in its pay-session flip.
          && !(flippedVoucherId === deckCards[activeCard])
          && !(deckCards[activeCard] === 'balance' && showPaySheet)
          && (() => {
          const cb = Math.round(upsellData.cashback * 100) / 100;
          const premiumCb = Math.round(cb * 2 * 100) / 100;
          const fmtCb = (n: number) => `₪${n.toFixed(2)}`;
          const R = 14; const CIRC = 2 * Math.PI * R;
          const dashOffset = CIRC * (1 - upsellCountdown / UPSELL_COUNTDOWN);
          const mmss = `${Math.floor(upsellCountdown / 60)}:${String(upsellCountdown % 60).padStart(2, '0')}`;
          return (
            <motion.div
              key="premium-upsell-peek"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1, scaleY: 1 }}
              exit={{ scaleY: 0, opacity: 0, transition: { duration: 0 } }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.7 }}
              style={{ transformOrigin: 'top' }}
              className={`relative z-0 transition-[margin] duration-500 ease-out ${upsellExpanded ? 'mx-0' : 'mx-8'}`}
            >
              <div
                role={upsellExpanded ? undefined : 'button'}
                onClick={upsellExpanded ? undefined : () => setUpsellExpanded(true)}
                className={`relative overflow-hidden rounded-3xl transition-all duration-500 ease-out outline-none ${upsellExpanded ? 'shadow-sm' : 'shadow-md balance-gradient'}`}
                style={{
                  background: upsellExpanded ? 'rgba(255,255,255,0.92)' : undefined,
                  backdropFilter: upsellExpanded ? 'blur(16px)' : undefined,
                  WebkitBackdropFilter: upsellExpanded ? 'blur(16px)' : undefined,
                  border: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  maxHeight: upsellExpanded ? 480 : 56,
                  // Collapsed: tuck the top behind the card so only a sliver with
                  // the label peeks out beneath it (the card sits at a higher z).
                  marginTop: upsellExpanded ? 12 : -28,
                  cursor: upsellExpanded ? 'default' : 'pointer',
                  // Gentle breathing while collapsed — invites a tap.
                  animation: upsellExpanded ? undefined : 'upsellBreathe 2.2s ease-in-out infinite',
                }}
              >
                {!upsellExpanded ? (
                  /* PEEK — bottom-aligned label inside the visible sliver */
                  <div className="h-14 flex items-end justify-center pb-2.5 px-5">
                    <p className="text-white text-[13px] font-bold flex items-center gap-2 leading-none">
                      <span className="relative flex-shrink-0 w-7 h-7">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                          <circle cx="18" cy="18" r={R} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${CIRC}`} strokeDashoffset={dashOffset}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums">{mmss}</span>
                      </span>
                      {isRTL ? 'עם פרימיום היית צובר פי 2' : 'With Premium you get 2×'}
                      <span className="material-symbols-outlined text-white/90" style={{ fontSize: 18 }}>expand_less</span>
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Close — gray circle, top-right */}
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissUpsell(); }}
                      aria-label={isRTL ? 'סגור' : 'Close'}
                      className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-[#e5e7eb] text-slate-600 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                    <div aria-hidden className="pointer-events-none absolute -top-3 end-[-36px] w-44 h-28 rotate-[-15deg] rounded-2xl balance-gradient shadow-lg flex items-center justify-center">
                      <img src="/nexus-logo-animated-white.gif" alt="" className="h-14 w-auto object-contain" draggable={false} />
                    </div>
                    <div className="relative px-5 pt-4 pb-3">
                      <p className="text-[15px] font-bold text-text-primary flex items-center gap-1.5 mb-3">
                        <span className="material-symbols-outlined text-yellow-500" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        {isRTL ? 'עם פרימיום היית צובר פי 2' : 'With Premium you get 2×'}
                      </p>

                      <div className="flex items-center gap-3 ps-32 mb-4" dir="ltr">
                        <div className="flex-1 text-center">
                          <p className="text-[11px] font-semibold text-primary mb-0.5">{isRTL ? 'פרימיום' : 'Premium'}</p>
                          <p className="text-2xl font-bold text-primary tabular-nums">{fmtCb(premiumCb)}</p>
                        </div>
                        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>arrow_back</span>
                        <div className="flex-1 text-center">
                          <p className="text-[11px] font-semibold text-text-muted mb-0.5">{isRTL ? 'קיבלת' : 'You got'}</p>
                          <p className="text-2xl font-bold text-text-primary tabular-nums">{fmtCb(cb)}</p>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-text-primary leading-tight">
                        {isRTL ? 'שדרג עכשיו והכפל את הרווח שלך' : 'Upgrade now & double your earnings'}
                      </p>
                    </div>
                    <div className="px-5 pb-4 flex flex-row-reverse gap-3">
                      {/* Gray — Learn more → premium */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${lang}/premium`, {
                            state: {
                              countdown: upsellCountdown,
                              total: upsellData.total,
                              cashback: cb,
                              productName: upsellData.productName,
                              businessName: upsellData.businessName,
                              businessLogo: upsellData.businessLogo ?? null,
                            },
                          });
                        }}
                        className="flex-1 py-3.5 rounded-full font-semibold text-base bg-[#e5e7eb] text-slate-900 active:scale-95 transition-transform"
                      >
                        {isRTL ? 'למד עוד' : 'Learn more'}
                      </button>
                      {/* Black — Upgrade (with countdown ring) → premium */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${lang}/premium`, {
                            state: {
                              countdown: upsellCountdown,
                              total: upsellData.total,
                              cashback: cb,
                              productName: upsellData.productName,
                              businessName: upsellData.businessName,
                              businessLogo: upsellData.businessLogo ?? null,
                            },
                          });
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0a0a0b] text-white py-3.5 rounded-full font-semibold text-base active:scale-95 transition-transform"
                      >
                        <span className="relative flex-shrink-0 w-7 h-7">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                            <circle cx="18" cy="18" r={R} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                              strokeDasharray={`${CIRC}`} strokeDashoffset={dashOffset}
                              style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
                            {`${Math.floor(upsellCountdown / 60)}:${String(upsellCountdown % 60).padStart(2, '0')}`}
                          </span>
                        </span>
                        <span>{isRTL ? 'שדרג' : 'Upgrade'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })()}
        </AnimatePresence>

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
        // Pay-at-store: show only the card carousel — drop every section.
        if (payMode) return null;
        // Outside edit mode hidden sections disappear entirely; inside
        // edit mode they show dimmed so the user can bring them back.
        if (isHidden && !editEnabled) return null;
        if (sectionId === 'widgets') {
          // Gift view: drop the widgets section entirely.
          if (cameFromGift) return null;
          return (
      <Reorder.Item
        key="widgets"
        value="widgets"
        dragListener={false}
        dragControls={widgetsDragControls}
        className={`mb-6 transition-opacity ${isHidden ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center justify-between w-full px-5 mb-3">
          <h2 className="text-lg font-bold text-text-primary">
            {t.wallet.widgetsTitle}
          </h2>
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

        <div>
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
              setCashback((c) => {
                if (c.phase !== 'closing') return c;
                // If a cashback card is still targeted, reopen on it (the
                // card-switch close→open); otherwise finish closing.
                return targetCashback
                  ? { phase: 'open', seq: c.seq + 1, key: targetCashback }
                  : { ...c, phase: 'closed' };
              });
            }
          }}
        >
          <WalletOffersSlider
            bneiAkiva={cashback.key === 'bnei'}
            spar={cashback.key === 'spar'}
            locked={cameFromGift}
            payHere={payMode}
          />
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

      {/* ══════ "HOW IT WORKS" SHEET — opened from the card's "?" button.
          Same design as the card-back info sheet (PayCodeInfoSheet): a
          slide-up rounded sheet, portalled to the body. ══════ */}
      {showCardHelp &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[150] bg-black/40 animate-fade-in"
              onClick={() => setShowCardHelp(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-[150] max-w-md mx-auto px-4 pb-6 pointer-events-none">
              <div
                dir="rtl"
                className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up"
              >
                {/* Drag handle + title + close */}
                <div className="flex-shrink-0 px-6 pt-3 pb-4">
                  <div className="flex justify-center pb-4">
                    <div className="w-10 h-1.5 bg-border rounded-full" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-text-primary leading-tight">איך זה עובד?</h2>
                    <button
                      onClick={() => setShowCardHelp(false)}
                      aria-label="סגירה"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>
                        close
                      </span>
                    </button>
                  </div>
                </div>

                {/* Content — issue a SPAR card and get the standard club-card
                    benefits (same value list as the card-issuance page). */}
                <div className="px-6 pb-8">
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    הנפק כרטיס SPAR בחינם — וקבל את כל ההטבות של כרטיס המועדון:
                  </p>
                  <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
                    {[
                      { title: 'גמישות אשראי נוספת', desc: 'קו אשראי חוץ-בנקאי נוסף להוצאות יומיומיות' },
                      { title: 'תנאים מועדפים בחו"ל', desc: 'חיוב מועדף ברכישות בינלאומיות ואונליין' },
                      { title: 'יתרונות במט"ח', desc: 'חיובים נדחים במט"ח ותנאי המרה משופרים' },
                      { title: 'קאשבק', desc: '2%–5% קאשבק אצל בתי עסק שותפים נבחרים' },
                    ].map((b) => (
                      <div key={b.title} className="px-4 py-3.5">
                        <p className="text-sm font-bold text-text-primary">{b.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{b.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Maximize cashback section */}
                  <div className="mt-5 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '1px solid #86efac' }}>
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">💡</span>
                        <p className="text-sm font-bold text-green-900">רוצה למקסם קאשבק?</p>
                      </div>
                      <p className="text-sm font-semibold text-green-800 mb-1">צור עסקה בתנאים שלך</p>
                      <p className="text-xs text-green-700 leading-relaxed">
                        לפני כל רכישה — בחר את בית העסק, קבע את הסכום, ובחר את שיעור הקאשבק שתרצה לקבל. העסקה תיצור לך וואוצר ייעודי עם ההטבה שבחרת, ותוכל לממש אותו בקנייה הבאה.
                      </p>
                    </div>
                    <div className="px-4 pb-4 pt-1 flex flex-col gap-2 text-xs text-green-700">
                      {[
                        { icon: 'storefront',     text: 'בחר בית עסק שותף' },
                        { icon: 'tune',           text: 'קבע סכום ואחוז קאשבק' },
                        { icon: 'confirmation_number', text: 'קבל וואוצר מותאם אישית' },
                        { icon: 'payments',       text: 'מממש בקנייה — וחוזר חלילה' },
                      ].map(({ icon, text }) => (
                        <div key={icon} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600" style={{ fontSize: 16 }}>{icon}</span>
                          <span className="font-medium">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Pay-code "how it works" sheet — opened from the "?" on the Nexus
          balance card, and auto-opened after the add-card onboarding flow. */}
      {/* Spotlight — dims the whole screen except the balance card (via the
          giant box-shadow trick), with a lit cyan frame around it, so the
          "how it works" sheet visibly points at the card. Purely visual; the
          sheet's transparent backdrop handles tap-to-close. */}
      {showPayCodeHelp && spotRect &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: 'fixed',
              top: spotRect.top - 6,
              left: spotRect.left - 6,
              width: spotRect.width + 12,
              height: spotRect.height + 12,
              borderRadius: 26,
              zIndex: 55,
              pointerEvents: 'none',
              boxShadow:
                'inset 0 0 0 2px rgba(125,211,252,0.95), 0 0 30px 8px rgba(125,211,252,0.65), 0 0 0 9999px rgba(0,0,0,0.55)',
            }}
          />,
          document.body,
        )}

      <PayCodeInfoSheet
        isOpen={showPayCodeHelp}
        dim={false}
        onClose={() => {
          setShowPayCodeHelp(false);
          closePay();
        }}
      />

      {/* SPAR demo: ₪150 purchase confirmation. Closing marks the gift card
          "used" (greyed-out + locked) and surfaces the archive action. */}
      {showSparSuccess && (
        <div className="fixed inset-0 z-[140] mx-auto max-w-md bg-white overflow-y-auto">
          <TransactionSuccessShell
            cashback={SPAR_DEMO_CASHBACK}
            isHe={language === 'he'}
            autoMs={0}
            iconUrl="/tenants/spar-official.svg"
            onClose={() => {
              setShowSparSuccess(false);
              setSparUsed(true);
              setFlippedVoucherId(null);
            }}
          >
            <div className="px-5 pt-4 divide-y divide-border text-[15px]" dir={language === 'he' ? 'rtl' : 'ltr'}>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">{language === 'he' ? 'בית עסק' : 'Merchant'}</span>
                <span className="font-semibold">SPAR</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">{language === 'he' ? 'סכום עסקה' : 'Amount'}</span>
                <span className="font-semibold" dir="ltr">₪{SPAR_DEMO_AMOUNT}.00</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">{language === 'he' ? 'קאשבק שנצבר' : 'Cashback earned'}</span>
                <span className="font-semibold text-green-600" dir="ltr">+₪{SPAR_DEMO_CASHBACK}.00</span>
              </div>
            </div>
          </TransactionSuccessShell>
        </div>
      )}
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
            onClick={() => navigate(`/${lang}/club`)}
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
        onClick: () => navigate(`/${lang}/club`),
      });
    case 'best-offers':
      return circle('🏷️', t.wallet.widgetBestOffers, {
        onClick: () => navigate(`/${lang}`),
      });
    case 'more-actions':
      return circle('+', isRTL ? 'פעולות נוספות' : 'More actions', {
        onClick: () => navigate(`/${lang}/wallet/actions`),
      });
  }
}
