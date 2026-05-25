import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import ProfileNudgeBanner from '../profile/ProfileNudgeBanner';
import AnonymousSplash from '../auth/AnonymousSplash';
import WalletLoadingScreen from '../wallet/WalletLoadingScreen';
import { useAuth } from '../../contexts/AuthContext';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  const isSearch = /^\/[a-z]{2}\/search\/?$/.test(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const { me, loading: authLoading } = useAuth();

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

  // Short-circuit the entire layout while auth bootstrap is in flight.
  // The previous version rendered AppLayout's chrome (TopBar, max-w
  // column with shadow, etc.) and put a small spinner in the main slot,
  // which made manual /store URLs flash a half-loaded page before the
  // redirect to /:lang/router fired. Now we render NOTHING but the
  // full-viewport WalletLoadingScreen until /api/me resolves, so users
  // never see page chrome until we know which page actually belongs to
  // them.
  if (authLoading) return <WalletLoadingScreen />;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto bg-bg-light min-h-screen pb-20 relative shadow-sm">
        {/* Decorative gradient glow — home only */}
        {isHome && (
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
              <CategoryRow collapsed={collapsed} />
            </div>
          </div>
        ) : isSearch ? null : (
          /* Other pages: transparent overlay, does not scroll */
          <div className="relative z-50 h-0 overflow-visible">
            <TopBar collapsed={false} showBack />
          </div>
        )}

        <main className="relative z-10">
          {/* Anonymous wallet visitors must log in before browsing.
              Render the splash + login CTA in place of any page
              content until they sign in. */}
          {!me ? <AnonymousSplash /> : <Outlet />}
        </main>
        {me && <ProfileNudgeBanner />}
        {me && <FloatingActions />}
      </div>
    </div>
  );
}
