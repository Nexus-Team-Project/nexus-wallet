import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import ProfileNudgeBanner from '../profile/ProfileNudgeBanner';
import NotificationToastHost from '../notifications/NotificationToastHost';
import SupportChatButton from '../SupportChatButton';
import { useChatStore } from '../../stores/chatStore';
import { useVouchers } from '../../hooks/useVouchers';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  // Pages that opt into the home-page decorative gradient backdrop.
  const isNotifications = /^\/[a-z]{2}\/notifications\/?$/.test(pathname);
  const isProfile = /^\/[a-z]{2}\/profile\/?$/.test(pathname);
  const showHomeGradient = isHome || isNotifications || isProfile;
  // Wallet page renders its own TopBar inline (below the dark strip),
  // so the global overlay TopBar + chat FABs are suppressed here.
  const isWallet = /^\/[a-z]{2}\/wallet\/?$/.test(pathname);
  // Add-payment-method page: standalone — its own back button and fixed
  // footer CTA. Suppress the global TopBar overlay, the bottom-nav padding,
  // and the chat FABs so the page reads as a single full-bleed form.
  const isFullScreenForm = /^\/[a-z]{2}\/wallet\/add-payment-method\/?$/.test(pathname);
  const [collapsed, setCollapsed] = useState(false);

  // Live-chat state. The AI FAB is always-on; the human FAB mounts
  // only when an agent is engaged in a conversation with the user.
  const isHumanChatActive = useChatStore((s) => s.isHumanChatActive);
  const agentTyping = useChatStore((s) => s.agentTyping);
  const aiTyping = useChatStore((s) => s.aiTyping);
  // Mirrors the loading flag the home page uses for its skeleton — same query,
  // shared React Query cache, so the sticky CategoryRow stays in sync.
  const { isLoading: vouchersLoading } = useVouchers();

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
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <div className={`max-w-md mx-auto bg-bg-light min-h-screen relative shadow-sm ${isFullScreenForm ? '' : 'pb-20'}`}>
        {/* Decorative gradient glow — home + opted-in pages */}
        {showHomeGradient && (
          <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0">
            <div
              className="w-full h-full opacity-[0.12]"
              style={{
                background:
                  'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-light" />
          </div>
        )}

        {isHome ? (
          /* Home: sticky header, collapses on scroll */
          <div className="sticky top-0 z-50">
            <TopBar collapsed={collapsed} />
            <div className="overflow-hidden">
              <CategoryRow collapsed={collapsed} loading={vouchersLoading} />
            </div>
          </div>
        ) : isWallet || isFullScreenForm ? (
          /* Wallet + full-screen forms: page renders its own header inline. */
          null
        ) : (
          /* Other pages: transparent overlay, does not scroll */
          <div className="relative z-50 h-0 overflow-visible">
            <TopBar collapsed={false} showBack />
          </div>
        )}

        <main className="relative z-10">
          <Outlet />
        </main>
        {!isFullScreenForm && <ProfileNudgeBanner />}
        {!isFullScreenForm && <FloatingActions />}
        {/* AI assistant FAB — always available (suppressed on wallet
            page, which renders its own chat affordance inline). */}
        {!isWallet && !isFullScreenForm && (
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
