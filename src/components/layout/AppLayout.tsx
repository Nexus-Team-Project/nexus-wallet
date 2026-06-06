import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import NotificationToastHost from '../notifications/NotificationToastHost';
import SupportChatButton from '../SupportChatButton';
import { useChatStore } from '../../stores/chatStore';
import { useVouchers } from '../../hooks/useVouchers';
import { useWallpaperStore } from '../../stores/wallpaperStore';
import { useUIStore } from '../../stores/uiStore';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  // Pages that opt into the home-page decorative gradient backdrop.
  const isNotifications = /^\/[a-z]{2}\/notifications\/?$/.test(pathname);
  const isProfile = /^\/[a-z]{2}\/profile\/?$/.test(pathname);
  // Wallet opted into the same decorative gradient backdrop the home /
  // notifications / profile pages use, so the wallet feels like part of
  // the "core surfaces" family rather than a flat sub-page.
  const isWalletGradient = /^\/[a-z]{2}\/wallet\/?$/.test(pathname);
  const isWallpaper = /^\/[a-z]{2}\/wallpaper\/?$/.test(pathname);
  const showHomeGradient = isHome || isNotifications || isProfile || isWalletGradient || isWallpaper;
  // Wallet page renders its own TopBar inline (below the dark strip),
  // so the global overlay TopBar + chat FABs are suppressed here.
  const isWallet = /^\/[a-z]{2}\/wallet\/?$/.test(pathname);
  // Pages that opt into the "full-bleed form" treatment — global TopBar,
  // bottom-nav padding, and chat FABs are all suppressed so the page can
  // own its own header / fixed CTA / chrome.
  const isFullScreenForm = /^\/[a-z]{2}\/wallet\/(add-payment-method|pay-intro|card|balance)\/?$/.test(pathname);
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
  // Checkout + order-confirmation own their own header / fixed action bar, so
  // the global TopBar, bottom search strip and chat FABs are all suppressed.
  const isBusinessCheckout = /^\/[a-z]{2}\/business\/[^/]+\/product\/[^/]+\/(checkout|order-confirmed|gift|split)\/?$/.test(pathname);
  // Referral page is a self-owned full-screen flow that pins its own fixed
  // "Share" CTA to the bottom. The global search/home/wallet strip would
  // float over it (it sits in a sibling stacking context above the page's
  // own z-index), so it's suppressed here. The global TopBar (user-icon
  // strip) is kept — it lives in the non-scrolling layout shell above the
  // fixed page, so it stays pinned at the top as the page scrolls.
  const isReferral = /^\/[a-z]{2}\/referral-stories\/?$/.test(pathname);
  const [collapsed, setCollapsed] = useState(false);

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

  useEffect(() => {
    if (!isHome) {
      setCollapsed(false);
      return;
    }
    const handleScroll = () => {
      setCollapsed(window.scrollY > COLLAPSE_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

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

  return (
    <div className="min-h-screen bg-surface">
      <div className={`max-w-md mx-auto bg-bg-light min-h-screen relative shadow-sm ${isFullScreenForm ? '' : 'pb-20'}`}>
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
              style={{
                background:
                  wallpaperBg ??
                  'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
                backgroundSize: wallpaperBg ? '220% 220%' : undefined,
                animation: wallpaperBg ? 'lava-flow 14s ease-in-out infinite' : undefined,
              }}
            />
            {/* Bottom fade — bleeds the backdrop into the page surface
                so content below stays readable. Stronger stop when a
                wallpaper is active so the hero area dominates. */}
            <div
              className="absolute inset-0"
              style={{
                background: wallpaperBg
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.5) 70%, var(--color-bg-light) 100%)'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, var(--color-bg-light) 100%)',
              }}
            />
          </div>
        )}

        {isHome ? (
          /* Home: sticky header, collapses on scroll */
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
        ) : isWallet || isFullScreenForm || isBusinessStore || isReferral || isProductLifted || isBusinessCheckout ? (
          /* Wallet + full-screen forms + business store + referral: page
             renders its own header inline (the referral page pins its own
             fixed user-icon strip outside its scroll area). */
          null
        ) : isBusinessReviews ? (
          /* Reviews page: sticky TopBar, no shadow so it blends with the sub-header */
          <div className="sticky top-0 z-50 bg-bg-light/80 backdrop-blur-md">
            <TopBar collapsed={false} showBack />
          </div>
        ) : (
          /* Other pages: transparent overlay, does not scroll */
          <div className="relative z-50 h-0 overflow-visible">
            <TopBar collapsed={false} showBack />
          </div>
        )}

        <main className="relative z-10">
          <Outlet />
        </main>
        {/* Bottom search/home/wallet strip — hidden on the wallpaper
            picker so the picker grid + CTA own the screen. */}
        {!isFullScreenForm && !isWallpaper && !isReferral && !isBusinessProduct && !isBusinessReviews && !isBusinessCheckout && <FloatingActions />}
        {/* AI assistant FAB — always available (suppressed on wallet
            page, which renders its own chat affordance inline). */}
        {!isWallet && !isFullScreenForm && !isBusinessProduct && !isBusinessReviews && !isBusinessCheckout && (
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
      </div>
    </div>
  );
}
