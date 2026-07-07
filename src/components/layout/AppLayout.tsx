import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import ProfileNudgeBanner from '../profile/ProfileNudgeBanner';
import WalletLoadingScreen from '../wallet/WalletLoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import NotificationToastHost from '../notifications/NotificationToastHost';
import SupportChatButton from '../SupportChatButton';
import CartFab from '../cart/CartFab';
import CartOverlay from '../cart/CartOverlay';
import { useChatStore } from '../../stores/chatStore';
import { useVouchers } from '../../hooks/useVouchers';
import { useWallpaperStore } from '../../stores/wallpaperStore';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname, search } = useLocation();
  // All route-shape checks are derived purely from the URL. They were being
  // recomputed (15+ regex `.test()` calls + a URLSearchParams parse) on every
  // render — including every scroll tick on the home page, which toggles
  // `collapsed`. Memoise them so they only recompute when the URL changes.
  const routeFlags = useMemo(() => {
    const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
    const isSearch = /^\/[a-z]{2}\/search\/?$/.test(pathname);
    // The store front door is a primary surface (like home): it gets the sticky
    // TopBar (app chrome - avatar / Log in / switcher) above StorePage's own
    // header, and no overlay back-header.
    const isStore = /^\/[a-z]{2}\/store\/?$/.test(pathname);
    // Settings/form pages render their own minimal SettingsHeader (back + title),
    // so AppLayout must not also stamp the heavy overlay TopBar on top of them.
    const isEditProfile = /^\/[a-z]{2}\/profile\/edit\/?$/.test(pathname);
    // Pages that opt into the home-page decorative gradient backdrop.
    const isNotifications = /^\/[a-z]{2}\/notifications\/?$/.test(pathname);
    const isProfile = /^\/[a-z]{2}\/profile\/?$/.test(pathname);
    // Wallet opted into the same decorative gradient backdrop the home /
    // notifications / profile pages use, so the wallet feels like part of
    // the "core surfaces" family rather than a flat sub-page.
    const isWalletGradient = /^\/[a-z]{2}\/wallet\/?$/.test(pathname);
    const isWallpaper = /^\/[a-z]{2}\/wallpaper\/?$/.test(pathname);
    // Orders opts into the same decorative gradient backdrop as the other core
    // surfaces (home / notifications / profile / wallet).
    const isOrders = /^\/[a-z]{2}\/orders\/?$/.test(pathname);
    // The store front door shares the home page's decorative gradient backdrop
    // so it reads as the same primary surface (not a flat white sub-page).
    const showHomeGradient = isHome || isStore || isNotifications || isProfile || isWalletGradient || isWallpaper || isOrders;
    // Wallet page renders its own TopBar inline (below the dark strip),
    // so the global overlay TopBar + chat FABs are suppressed here.
    const isWallet = /^\/[a-z]{2}\/wallet\/?$/.test(pathname);
    // Wallet opened from a redeemed gift (deep-link `?focus=`) is a locked,
    // focused view — the bottom toolbar + cart button stay visible but dead.
    const giftLocked = isWallet && new URLSearchParams(search).has('focus');
    // Pages that opt into the "full-bleed form" treatment — global TopBar,
    // bottom-nav padding, and chat FABs are all suppressed so the page can
    // own its own header / fixed CTA / chrome.
    const isFullScreenForm =
      /^\/[a-z]{2}\/wallet\/(add-payment-method|pay-intro|deal-intro|card|balance|voucher\/[^/]+)\/?$/.test(pathname) ||
      /^\/[a-z]{2}\/gift-sample\/?$/.test(pathname) ||
      /^\/[a-z]{2}\/premium\/?$/.test(pathname) ||
      /^\/[a-z]{2}\/business\/[^/]+\/site\/?$/.test(pathname);
    // Business store page owns its own collapsing header (big hero → compact
    // sticky bar) with its own back button, so the global overlay TopBar is
    // suppressed here. The bottom nav + chat FABs stay so it still reads as a
    // core in-app surface.
    const isBusinessStore = /^\/[a-z]{2}\/business\/[^/]+\/store\/?$/.test(pathname);
    // Product detail page owns its own sticky header (back + brand) and a
    // fixed bottom action bar (add to cart / buy now), so the global overlay
    // TopBar and the bottom search strip are both suppressed here.
    const isBusinessProduct = /^\/[a-z]{2}\/business\/[^/]+\/product\/[^/]+\/?$/.test(pathname);
    const isBusinessReviews = /^\/[a-z]{2}\/business\/[^/]+\/product\/[^/]+\/reviews\/?$/.test(pathname);
    // Category page pins the TopBar (user-icon row) so it stays put while the
    // page scrolls; the big category title itself is NOT sticky.
    const isCategory = /^\/[a-z]{2}\/category\//.test(pathname);
    // Checkout + order-confirmation own their own header / fixed action bar, so
    // the global TopBar, bottom search strip and chat FABs are all suppressed.
    const isBusinessCheckout = /^\/[a-z]{2}\/business\/[^/]+\/product\/[^/]+\/(checkout|order-confirmed|receipt|gift|split)\/?$/.test(pathname);
    // Referral page is a self-owned full-screen flow that pins its own fixed
    // "Share" CTA to the bottom. The global search/home/wallet strip would
    // float over it (it sits in a sibling stacking context above the page's
    // own z-index), so it's suppressed here. The global TopBar (user-icon
    // strip) is kept — it lives in the non-scrolling layout shell above the
    // fixed page, so it stays pinned at the top as the page scrolls.
    const isReferral = /^\/[a-z]{2}\/referral-stories\/?$/.test(pathname);
    return {
      isHome, isSearch, isStore, isEditProfile, isNotifications, isProfile,
      isWalletGradient, isWallpaper, isOrders,
      showHomeGradient, isWallet, giftLocked, isFullScreenForm, isBusinessStore,
      isBusinessProduct, isBusinessReviews, isCategory, isBusinessCheckout, isReferral,
    };
  }, [pathname, search]);
  const {
    isHome, isSearch, isStore, isEditProfile, isWallpaper, showHomeGradient,
    isWallet, giftLocked, isFullScreenForm,
    isBusinessStore, isBusinessProduct, isBusinessReviews, isCategory,
    isBusinessCheckout, isReferral,
  } = routeFlags;
  const [collapsed, setCollapsed] = useState(false);
  // Category page: once the user starts scrolling, a white backing fades in
  // behind the pinned TopBar strip.
  const [scrolled, setScrolled] = useState(false);
  const { me, loading: authLoading } = useAuth();

  // Global cart lift — when the cart overlay opens, the whole page card lifts
  // up (like the product quick-buy) to reveal the dark cart panel beneath.
  const cartOpen = useCartStore((s) => s.open);
  const closeCart = useCartStore((s) => s.closeCart);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  useEffect(() => {
    const u = () => setVh(window.innerHeight);
    window.addEventListener('resize', u);
    return () => window.removeEventListener('resize', u);
  }, []);
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);
  const cartLift = vh * 0.52;
  // Stable object — framer-motion treats a new `dragConstraints` reference as
  // a constraints change and recomputes drag internals, so don't rebuild it
  // every render.
  const cartDragConstraints = useMemo(() => ({ top: -cartLift, bottom: 0 }), [cartLift]);
  // The lift is a single motion value so the spring animation AND the
  // drag-to-close gesture both drive it (like the product quick-buy).
  const cartLiftY = useMotionValue(0);
  useEffect(() => {
    const controls = animate(cartLiftY, cartOpen ? -cartLift : 0, {
      type: 'spring',
      damping: 32,
      stiffness: 340,
    });
    return controls.stop;
  }, [cartOpen, cartLift, cartLiftY]);
  const onCartDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 450) {
      closeCart();
    } else {
      animate(cartLiftY, -cartLift, { type: 'spring', damping: 32, stiffness: 340 });
    }
  };

  // Live-chat state. The AI FAB is always-on; the human FAB mounts
  // only when an agent is engaged in a conversation with the user.
  const isHumanChatActive = useChatStore((s) => s.isHumanChatActive);
  const agentTyping = useChatStore((s) => s.agentTyping);
  const aiTyping = useChatStore((s) => s.aiTyping);
  // Mirrors the loading flag the home page uses for its skeleton — same query,
  // shared React Query cache, so the sticky CategoryRow stays in sync.
  const { isLoading: vouchersLoading } = useVouchers();
  // User-picked wallpaper override for the home-gradient backdrop.
  const wallpaperBg = useWallpaperStore((s) => s.selectedBackground);
  // When the product page is lifted for Quick Buy, hide the global TopBar
  // overlay so the lifted card covers the top strip (user icon / support / bell).
  const isProductLifted = useUIStore((s) => s.isProductLifted);
  // User-picked wallpaper shows on every non-full-screen-form route so
  // it reads as the user's chosen "personal theme" across the entire
  // app. The default rainbow stays opt-in (showHomeGradient pages only).
  const showWallpaperBackdrop = !isFullScreenForm && !!wallpaperBg;
  const showBackdrop = showWallpaperBackdrop || showHomeGradient;

  // Backdrop gradient + bottom-fade styles depend only on the active wallpaper,
  // so memoise them rather than allocating two style objects every render.
  const backdropGradientStyle = useMemo(
    () => ({
      background:
        wallpaperBg ??
        'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
      backgroundSize: wallpaperBg ? '220% 220%' : undefined,
      animation: wallpaperBg ? 'lava-flow 14s ease-in-out infinite' : undefined,
    }),
    [wallpaperBg],
  );
  const backdropFadeStyle = useMemo(
    () => ({
      background: wallpaperBg
        ? 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.5) 70%, var(--color-bg-light) 100%)'
        : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, var(--color-bg-light) 100%)',
    }),
    [wallpaperBg],
  );

  // Disable the browser's automatic scroll restoration so every SPA navigation
  // starts at the very top (our pathname effect below does the scroll-to-top).
  // Without this the browser can restore a prior offset after we reset it,
  // leaving the sticky header overlapping the first content on open.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Home + store both collapse their sticky header on scroll-down and
    // restore it on scroll-up; every other route keeps a static header.
    if (!isHome && !isStore) {
      setCollapsed(false);
      return;
    }
    const handleScroll = () => {
      setCollapsed(window.scrollY > COLLAPSE_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome, isStore]);

  // Category page: track scroll to fade in the white TopBar backing.
  useEffect(() => {
    if (!isCategory) {
      setScrolled(false);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCategory]);

  // Reset on page change
  useEffect(() => {
    setCollapsed(false);
    window.scrollTo(0, 0);
    // Self-heal leaked body scroll-locks. Several full-screen experiences
    // and bottom sheets lock the body via inline styles
    // (overflow:hidden / position:fixed); if one fails to clean up — e.g.
    // an unmount that races a navigation — scrolling dies app-wide on both
    // touch and wheel. Releasing any stale lock on every navigation makes
    // that unrecoverable state impossible. The one page that intentionally
    // holds the lock across its own mount (the premium-reveal full-screen
    // view) is excluded so we don't fight its own effect.
    const keepsBodyLock = /^\/[a-z]{2}\/premium-reveal\/?$/.test(pathname);
    if (!keepsBodyLock) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.inset = '';
      document.documentElement.style.overflow = '';
    }
  }, [pathname]);

  // Close the cart overlay whenever the route changes.
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  // Short-circuit the entire layout while auth bootstrap is in flight.
  if (authLoading) return <WalletLoadingScreen />;

  return (
    <div className="min-h-screen bg-surface">
      {/* Dark cart panel — sits behind the page; revealed as the page lifts. */}
      <CartOverlay />
      <motion.div
        className={`max-w-md mx-auto bg-bg-light relative shadow-sm ${isFullScreenForm ? '' : 'pb-20'} ${cartOpen ? 'overflow-hidden' : giftLocked ? 'h-dvh overflow-hidden' : 'min-h-screen'}`}
        style={
          cartOpen
            ? { position: 'fixed', top: 0, left: 0, right: 0, height: vh, zIndex: 10, y: cartLiftY, touchAction: 'none' }
            : { y: cartLiftY }
        }
        animate={{ borderRadius: cartOpen ? '0 0 28px 28px' : 0, scale: cartOpen ? 0.97 : 1 }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        drag={cartOpen ? 'y' : false}
        dragConstraints={cartDragConstraints}
        dragElastic={0.14}
        onDragEnd={onCartDragEnd}
      >
        {/* Dim scrim — darkens the lifted page so focus is on the cart; a tap
            (or drag-down) closes the cart. */}
        {cartOpen && (
          <div
            onClick={closeCart}
            className="absolute inset-0 z-[56] bg-black/40"
            style={{ touchAction: 'none' }}
            aria-hidden
          />
        )}
        {/* Decorative gradient glow — home + opted-in pages */}
        {showBackdrop && (
          <div
            className={`absolute top-0 inset-x-0 pointer-events-none z-0 ${
              wallpaperBg ? 'h-[480px]' : 'h-[280px]'
            }`}
          >
            <div
              className={`w-full h-full ${
                wallpaperBg ? 'opacity-[0.55]' : 'opacity-[0.18]'
              }`}
              style={backdropGradientStyle}
            />
            {/* Bottom fade — bleeds the backdrop into the page surface
                so content below stays readable. Stronger stop when a
                wallpaper is active so the hero area dominates. */}
            <div
              className="absolute inset-0"
              style={backdropFadeStyle}
            />
          </div>
        )}

        {isHome ? (
          /* Home: sticky header, collapses on scroll */
          <div
            className={`sticky top-0 z-50 backdrop-blur-sm transition-colors duration-300 ${
              collapsed ? 'bg-bg-light/85 shadow-sm' : 'bg-transparent'
            }`}
          >
            <TopBar collapsed={collapsed} />
            <div className="overflow-hidden">
              <CategoryRow collapsed={collapsed} loading={vouchersLoading} />
            </div>
            {/* White fade below the header — mirrors the category page's
                FilterSortBar scrim, so content softly passes under the header. */}
            <div
              className="pointer-events-none absolute inset-x-0 top-full h-5 bg-gradient-to-b from-white/70 to-transparent"
              aria-hidden
            />
          </div>
        ) : isStore ? (
          /* Store front door: primary surface — sticky header that collapses on
             scroll-down (semi-transparent, blurred, compact) and restores on
             scroll-up, exactly like home — same avatar, tenant switcher, and
             chat/bell actions. */
          <div
            className={`sticky top-0 z-50 transition-colors duration-300 ${
              collapsed ? 'bg-bg-light/85 backdrop-blur-md shadow-sm' : ''
            }`}
          >
            <TopBar collapsed={collapsed} />
            <div className="overflow-hidden">
              <CategoryRow collapsed={collapsed} loading={vouchersLoading} />
            </div>
          </div>
        ) : isSearch || isEditProfile || isWallet || isFullScreenForm || isBusinessStore || isReferral || isProductLifted || isBusinessCheckout ? (
          /* Pages that render their own header inline (or none): search +
             edit-profile (own SettingsHeader), wallet + full-screen forms +
             business store + referral (the referral page pins its own fixed
             user-icon strip outside its scroll area). */
          null
        ) : isBusinessReviews ? (
          /* Reviews page: sticky TopBar, no shadow so it blends with the sub-header */
          <div className="sticky top-0 z-50 bg-bg-light/80 backdrop-blur-md">
            <TopBar collapsed={false} showBack />
          </div>
        ) : isCategory ? (
          /* Category page: TopBar pinned (sticky) over the scrolling content;
             zero-height overlay so it doesn't add layout space (the page's own
             pt clears it). A white backing fades in once the page is scrolled. */
          <div className="sticky top-0 z-50 h-0 overflow-visible">
            <div
              aria-hidden
              className={`absolute inset-x-0 top-0 h-[72px] bg-white/95 backdrop-blur-md shadow-sm transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="relative">
              <TopBar collapsed={false} showBack />
            </div>
          </div>
        ) : (
          /* Other pages: transparent overlay back-header, does not scroll. */
          <div className="relative z-50 h-0 overflow-visible">
            <TopBar collapsed={false} showBack />
          </div>
        )}

        <main className="relative z-10">
          <Outlet />
        </main>
        {/* Profile nudge is logged-in only. */}
        {me && <ProfileNudgeBanner />}
        {/* Bottom search/home/wallet strip — FABs render for everyone so
            anonymous visitors can still navigate (search / wallet / home);
            hidden while the cart is open and on the wallpaper picker + pages
            that own their own bottom chrome. Dead (non-interactive) in the
            locked gift view. */}
        {!cartOpen && !isFullScreenForm && !isWallpaper && !isReferral && !isBusinessProduct && !isBusinessReviews && !isBusinessCheckout && (
          giftLocked ? (
            <div className="pointer-events-none"><FloatingActions /></div>
          ) : (
            <FloatingActions />
          )
        )}
        {/* AI assistant FAB — always available (suppressed on wallet
            page, which renders its own chat affordance inline). */}
        {!cartOpen && !isWallet && !isFullScreenForm && !isBusinessProduct && !isBusinessReviews && !isBusinessCheckout && (
          <SupportChatButton
            variant="ai"
            isTyping={aiTyping}
            onClick={() => console.log('Open AI chat')}
          />
        )}
        {/* Human-agent FAB — mounted only while an agent is engaged. */}
        {!isWallet && !isFullScreenForm && isHumanChatActive && (
          <SupportChatButton
            variant="human"
            isTyping={agentTyping}
            onClick={() => console.log('Open human chat')}
          />
        )}
        <NotificationToastHost />
      </motion.div>

      {/* Global draggable cart button (persists across pages). Locked (dead)
          in the gift view. */}
      {giftLocked ? (
        <div className="pointer-events-none"><CartFab /></div>
      ) : (
        <CartFab />
      )}
    </div>
  );
}
