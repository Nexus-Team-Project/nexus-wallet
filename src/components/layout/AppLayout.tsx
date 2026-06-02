import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import ProfileNudgeBanner from '../profile/ProfileNudgeBanner';
import WalletLoadingScreen from '../wallet/WalletLoadingScreen';
import { useAuth } from '../../contexts/AuthContext';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  const isSearch = /^\/[a-z]{2}\/search\/?$/.test(pathname);
  // The store front door is a primary surface (like home): it gets the sticky
  // TopBar (app chrome - avatar / Log in / switcher) above StorePage's own
  // StoreHeader (page title + search), and no overlay back-header.
  const isStore = /^\/[a-z]{2}\/store\/?$/.test(pathname);
  // Settings/form pages render their own minimal SettingsHeader (back + title),
  // so AppLayout must not also stamp the heavy overlay TopBar on top of them.
  const isEditProfile = /^\/[a-z]{2}\/profile\/edit\/?$/.test(pathname);
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
        ) : isStore ? (
          /* Store front door: primary surface. Sticky TopBar (avatar / Log in /
             switcher) sits above StorePage's own StoreHeader - app chrome plus
             page content, like home's TopBar + CategoryRow. No back button. */
          <div className="sticky top-0 z-50">
            <TopBar collapsed={false} />
          </div>
        ) : isSearch || isEditProfile ? null : (
          /* Other pages: transparent overlay back-header, does not scroll.
             (Edit Profile renders its own SettingsHeader instead.) */
          <div className="relative z-50 h-0 overflow-visible">
            <TopBar collapsed={false} showBack />
          </div>
        )}

        <main className="relative z-10">
          <Outlet />
        </main>
        {/* Profile nudge is logged-in only; FABs render for everyone so
            anonymous visitors can still navigate (search / wallet / home). */}
        {me && <ProfileNudgeBanner />}
        <FloatingActions />
      </div>
    </div>
  );
}
