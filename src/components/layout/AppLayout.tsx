import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import FloatingActions from './FloatingActions';
import CategoryRow from '../home/CategoryRow';
import ProfileNudgeBanner from '../profile/ProfileNudgeBanner';

const COLLAPSE_THRESHOLD = 40;

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setCollapsed(window.scrollY > COLLAPSE_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset on page change
  useEffect(() => {
    setCollapsed(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto bg-bg-light min-h-screen pb-20 relative shadow-sm">
        {/* Decorative gradient glow */}
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

        {/* Sticky header */}
        <div className={`sticky top-0 z-50 transition-shadow duration-300 ${collapsed ? 'bg-bg-light/95 backdrop-blur-sm shadow-sm' : ''}`}>
          <TopBar collapsed={collapsed} />
          {isHome && (
            <div className="overflow-hidden">
              <CategoryRow collapsed={collapsed} />
            </div>
          )}
        </div>

        <main className="relative z-10">
          <Outlet />
        </main>
        <ProfileNudgeBanner />
        <FloatingActions />
      </div>
    </div>
  );
}
