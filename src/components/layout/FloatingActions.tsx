import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useMyVouchers } from '../../hooks/useMyVouchers';
import AnimatedNavIcon from './AnimatedNavIcon';
import navWalletUrl from '../../assets/animations/nav-wallet.json?url';
import navWalletBoldUrl from '../../assets/animations/nav-wallet-bold.json?url';
import navSearchUrl from '../../assets/animations/nav-search.json?url';
import navSearchBoldUrl from '../../assets/animations/nav-search-bold.json?url';
import navHomeUrl from '../../assets/animations/nav-home.json?url';
import navHomeBoldUrl from '../../assets/animations/nav-home-bold.json?url';

export default function FloatingActions({ force = false }: { force?: boolean } = {}) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { data: activeVouchers } = useMyVouchers('active', { enabled: isAuthenticated });
  const activeCount = activeVouchers?.length || 0;

  const isHome = location.pathname === `/${lang}` || location.pathname === `/${lang}/`;
  const isWallet = location.pathname.includes('/wallet');
  const isSearch = /\/(chat|search)/.test(location.pathname);
  const isBusiness = /\/business\/[^/]+/.test(location.pathname);
  const isVoucherPurchase = /\/business\/[^/]+\/voucher\//.test(location.pathname);
  // The add-money flow owns its own fixed continue button at the bottom;
  // the floating nav would collide with it.
  const isAddMoney = location.pathname.includes('/wallet/add-money');
  // On the chat / search pages, the recommendations sheet (with full-bleed
  // map) sits at the bottom — the white gradient backdrop would obscure the
  // map's bottom edge. Hide the backdrop there; the nav still floats on top.
  const isChatOrSearch = /\/(chat|search)/.test(location.pathname);
  // The search button always lands the user on the dedicated discount-finder
  // path. On a category page it also pre-selects that category in the finder.
  const categoryMatch = location.pathname.match(/\/category\/([^/?]+)/);
  const categoryId = categoryMatch?.[1];

  // Search-pill click → open the discount finder at /search. On a category
  // page, carry the category as ?finder=<categoryId> so the finder opens
  // pre-selected; elsewhere it opens empty.
  const handleSearchClick = () => {
    if (categoryId) {
      // Preserve existing query params (e.g. tenant) and add finder=<categoryId>.
      const params = new URLSearchParams(location.search);
      params.set('finder', categoryId);
      navigate(`/${lang}/search?${params.toString()}`);
    } else {
      navigate(`/${lang}/search${location.search}`);
    }
  };

  if (!force && (isBusiness || isVoucherPurchase || isAddMoney)) return null;

  const handleWallet = async () => {
    if (isAuthenticated) {
      navigate(`/${lang}/wallet`);
    } else {
      const authed = await requireAuth({ promptMessage: t.auth.memberPricePrompt });
      if (authed) navigate(`/${lang}/wallet`);
    }
  };

  // Shared styling for the three pill items. The active page's icon shows in
  // full ink (and replays its animation); the rest sit muted.
  const itemClass =
    'nav-btn relative w-11 h-11 flex items-center justify-center rounded-full transition-transform active:scale-90';

  return (
    <>
      {/* White fade backdrop behind the floating nav. Skipped on the chat /
          search page so the recommendations sheet's full-bleed map stays
          visible all the way down. */}
      {!isChatOrSearch && (
        <div className="fixed bottom-0 inset-x-0 h-8 z-40 pointer-events-none flex justify-center">
          <div
            className="w-full max-w-md h-full"
            style={{
              background:
                'linear-gradient(to top, rgba(255,255,255,0.8) 20%, rgba(255,255,255,0.4) 60%, transparent)',
            }}
          />
        </div>
      )}

      {/* Floating nav: a white pill holding home / search / wallet, centered,
          styled after the Rhode aesthetic. */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex items-center justify-center">
        <div className="relative">
        {/* Pill nav bar */}
        <nav className="h-12 bg-white rounded-full flex items-center gap-1 px-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {/* Wallet (with active-voucher badge) */}
          <button onClick={handleWallet} aria-label={t.nav.wallet} className={itemClass}>
            <AnimatedNavIcon src={navWalletUrl} boldSrc={navWalletBoldUrl} active={isWallet} />
            {isAuthenticated && activeCount > 0 && (
              <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] px-1 bg-error rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-white leading-none">
                  {activeCount > 9 ? '9+' : activeCount}
                </span>
              </span>
            )}
          </button>

          {/* Search */}
          <button onClick={handleSearchClick} aria-label={t.common.search} className={itemClass}>
            <AnimatedNavIcon src={navSearchUrl} boldSrc={navSearchBoldUrl} active={isSearch} />
          </button>

          {/* Home */}
          <button onClick={() => navigate(`/${lang}`)} aria-label={t.nav.home} className={itemClass}>
            <AnimatedNavIcon src={navHomeUrl} boldSrc={navHomeBoldUrl} active={isHome} />
          </button>
        </nav>
        </div>
      </div>
    </>
  );
}
