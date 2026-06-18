import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
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
        <nav className="h-12 bg-white rounded-full flex items-center gap-1 px-3 shadow-[0_6px_16px_rgba(0,0,0,0.14)]">
          {/* Wallet (with active-voucher badge) */}
          <PillButton
            onClick={handleWallet}
            ariaLabel={t.nav.wallet}
            badge={
              isAuthenticated && activeCount > 0 ? (
                <span className="absolute top-0.5 end-0.5 z-20 min-w-[18px] h-[18px] px-1 bg-error rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                </span>
              ) : null
            }
          >
            <AnimatedNavIcon
              src={navWalletUrl}
              boldSrc={navWalletBoldUrl}
              active={isWallet}
              filledEl={
                <svg viewBox="0 0 24 24" width={26} height={26} fill="#1c1c1c">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              }
            />
          </PillButton>

          {/* Search */}
          <PillButton onClick={handleSearchClick} ariaLabel={t.common.search}>
            <AnimatedNavIcon src={navSearchUrl} boldSrc={navSearchBoldUrl} active={isSearch} />
          </PillButton>

          {/* Home */}
          <PillButton onClick={() => navigate(`/${lang}`)} ariaLabel={t.nav.home}>
            <AnimatedNavIcon
              src={navHomeUrl}
              boldSrc={navHomeBoldUrl}
              active={isHome}
              filledEl={
                <svg viewBox="0 0 24 24" width={26} height={26} fill="#1c1c1c">
                  <path d="M2 12 L12 3 L22 12 L22 20 Q22 22 20 22 L4 22 Q2 22 2 20 Z"/>
                </svg>
              }
            />
          </PillButton>
        </nav>
        </div>
      </div>
    </>
  );
}

/**
 * A single round nav item in the floating pill. On press it raises a soft
 * grey ripple from the finger point — the same touch feedback the wallet
 * cards use — clipped inside the button's circle, then fading out. Keeps the
 * existing active:scale-90 squeeze on top.
 */
function PillButton({
  onClick,
  ariaLabel,
  children,
  badge,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  // Changing `key` remounts the ripple so a re-tap re-plays it from frame 0.
  const seq = useRef(0);
  const [ripple, setRipple] = useState<{ xPct: number; yPct: number; key: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    seq.current += 1;
    setRipple({ xPct, yPct, key: seq.current });
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      aria-label={ariaLabel}
      className="nav-btn relative w-11 h-11 flex items-center justify-center rounded-full transition-transform active:scale-90"
    >
      {/* Ripple, clipped to the button's circle. Kept under the icon (z-0) and
          behind the badge so neither is dimmed by the wash. */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {ripple && (
          <motion.span
            key={ripple.key}
            aria-hidden
            className="absolute rounded-full"
            style={{
              left: `${ripple.xPct}%`,
              top: `${ripple.yPct}%`,
              width: 56,
              height: 56,
              background:
                'radial-gradient(circle, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.07) 45%, transparent 70%)',
            }}
            initial={{ scale: 0.3, opacity: 0.9, x: '-50%', y: '-50%' }}
            animate={{ scale: 1, opacity: 0, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </span>
      <span className="relative z-10 flex items-center justify-center">{children}</span>
      {badge}
    </button>
  );
}
