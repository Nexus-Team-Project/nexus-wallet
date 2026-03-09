import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useMyVouchers } from '../../hooks/useMyVouchers';
import FilterSheet from './FilterSheet';

export default function FloatingActions() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { data: activeVouchers } = useMyVouchers('active', { enabled: isAuthenticated });
  const activeCount = activeVouchers?.length || 0;
  const [showFilter, setShowFilter] = useState(false);

  const isHome = location.pathname === `/${lang}` || location.pathname === `/${lang}/`;
  const isWallet = location.pathname.includes('/wallet');

  const handleWallet = async () => {
    if (isAuthenticated) {
      navigate(`/${lang}/wallet`);
    } else {
      const authed = await requireAuth({ promptMessage: t.auth.memberPricePrompt });
      if (authed) navigate(`/${lang}/wallet`);
    }
  };

  return (
    <>
      {/* Search pill stays centered; wallet + home absolutely positioned beside it */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex items-center justify-center">
        {/* Search pill wrapper — relative so wallet + home can anchor to it */}
        <div className="relative">
          {/* Wallet FAB — anchored to the right of the pill (right in RTL = end) */}
          {!isWallet && (
          <div className="absolute end-full me-3 top-1/2 -translate-y-1/2">
            <button
              onClick={handleWallet}
              className="relative w-12 h-12 rounded-full bg-white shadow-lg border border-border/50 flex flex-col items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Wallet"
            >
              <span
                className="material-symbols-outlined text-text-primary"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                wallet
              </span>
              <span className="text-[8px] font-medium text-text-muted leading-none mt-0.5">{t.nav.wallet}</span>
              {isAuthenticated && activeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-[18px] h-[18px] bg-error rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                </span>
              )}
            </button>
          </div>
          )}

          {/* Home FAB — anchored to the left of the pill (left in RTL = start) */}
          {!isHome && (
            <button
              onClick={() => navigate(`/${lang}`)}
              className="absolute start-full ms-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-bg-dark shadow-lg shadow-bg-dark/30 flex flex-col items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Home"
            >
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                cottage
              </span>
              <span className="text-[8px] font-medium text-white/70 leading-none mt-0.5">{t.nav.home}</span>
            </button>
          )}

          {/* Search + Filter pill bar — centered */}
          <div className="flex items-center bg-bg-dark rounded-full shadow-lg shadow-bg-dark/30 overflow-hidden">
            {/* Search zone → opens search page */}
            <button
              onClick={() => navigate(`/${lang}/search`)}
              className="flex items-center gap-2.5 pl-4 pr-2.5 rtl:pl-2.5 rtl:pr-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '20px' }}
              >
                search
              </span>
              <span className="text-white text-sm font-medium">
                {t.common.search}
              </span>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-white/20" />

            {/* Filter zone → opens filter sheet */}
            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center px-3 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <span
                className="material-symbols-outlined text-white/70"
                style={{ fontSize: '20px' }}
              >
                tune
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter bottom sheet */}
      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </>
  );
}
