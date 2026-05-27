import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatCurrency';
import WalletTabs from '../components/wallet/WalletTabs';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import PayInStoreSheet from '../components/wallet/PayInStoreSheet';
import MoreActionsSheet from '../components/wallet/MoreActionsSheet';
import type { UserVoucher } from '../types/voucher.types';

// Logos
import MastercardLogo from '../assets/logos/mastercard-logo-transperant.png';
import NexusWideLogo from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';

export default function WalletPage() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const [activeTab, setActiveTab] = useState<UserVoucher['status']>('active');

  // Collapsible section states
  const [cardOpen, setCardOpen] = useState(true);
  const [vouchersOpen, setVouchersOpen] = useState(true);

  // Sheet states
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, _setNotificationType] = useState<'success' | 'declined'>('success');
  const [merchantName, _setMerchantName] = useState('');

  if (walletLoading) {
    return <WalletPageSkeleton />;
  }

  return (
    <div className="animate-fade-in pt-16">
      {/* ══════ BALANCE CARD (Klarna-style) ══════ */}
      <section className="mt-4 mb-8 px-5">
        <div className="relative bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          {/* New badge — top-start corner */}
          <span className="absolute top-4 start-4 bg-success/20 text-success text-xs font-bold px-2.5 py-0.5 rounded-full">
            {t.wallet.newBadge}
          </span>

          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-text-secondary font-medium">
              <span>יתרת</span>
              <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden" style={{ transform: 'scale(0.873)' }}>
                <img
                  src="/nexus-logo-black.png"
                  alt="Nexus"
                  className="h-7 w-auto object-contain"
                  style={{ transform: 'scale(1.373)' }}
                />
              </span>
            </span>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
          </div>

          {/* Balance Amount */}
          <h1 className="text-6xl font-bold text-text-primary mb-1 tracking-tight">
            {formatCurrency(wallet?.balance || 0, 'ILS', locale)}
          </h1>

          {/* Action Buttons Row + Cashback */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate(`/${lang}/wallet/add-money`)}
              className="bg-bg-dark text-white px-8 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform"
            >
              {t.wallet.addMoney}
            </button>
            <button
              onClick={() => setShowPaySheet(true)}
              className="bg-surface text-text-primary px-6 py-3.5 rounded-full font-bold text-base active:scale-95 transition-transform border border-border"
            >
              {t.wallet.payment}
            </button>
            <button
              onClick={() => setShowMoreSheet(true)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-surface border border-border active:scale-95 transition-transform flex-shrink-0"
            >
              <span className="material-symbols-outlined text-text-secondary rotate-90" style={{ fontSize: '20px' }}>more_horiz</span>
            </button>
          </div>

          {/* Cashback Text — attached to buttons */}
          <p className="text-success font-semibold text-sm mt-2">{t.wallet.earnCashback}</p>
        </div>
      </section>

      {/* ══════ DIGITAL CARD SECTION (collapsible) ══════ */}
      <div className="mb-6">
        <button
          onClick={() => setCardOpen(!cardOpen)}
          className="flex items-center justify-between w-full px-5 mb-3 active:opacity-70 transition-opacity"
        >
          <h2 className="text-lg font-bold text-text-primary">
            {t.wallet.digitalCards}
          </h2>
          <span
            className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${cardOpen ? 'rotate-180' : ''}`}
            style={{ fontSize: '20px' }}
          >
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${cardOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {/* Single Centered Card */}
          <div className="px-5">
            <div className="w-full aspect-[1.7/1] rounded-2xl shadow-2xl relative p-5 flex flex-col justify-between bg-black overflow-hidden">
              {/* Decorative background K */}
              <div
                className="absolute -bottom-10 left-3 text-[200px] font-extrabold leading-none text-white/[0.04] select-none pointer-events-none"
                aria-hidden="true"
              >
                N
              </div>

              {/* Top row: Nexus wide logo (white) */}
              <div className="flex items-start z-10">
                <img
                  src={NexusWideLogo}
                  alt="Nexus"
                  className="h-10"
                  style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
                />
              </div>

              {/* Bottom row: Mastercard (scheme) + contactless */}
              <div className="flex justify-between items-end z-10">
                <div className="relative ml-8">
                  <img
                    src={MastercardLogo}
                    alt="Mastercard"
                    className="h-20 opacity-90"
                    style={{ transform: 'translate(16px, 16px)' }}
                  />
                </div>
                <span className="material-symbols-outlined text-white/40 text-2xl rotate-90 -mr-1">
                  contactless
                </span>
              </div>
            </div>
          </div>

          {/* Issue Card Button */}
          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate(`/${lang}/card-issuance`)}
              className="px-6 py-3 rounded-full bg-bg-dark text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              {t.wallet.issueCard}
            </button>
          </div>
        </div>
      </div>

      {/* ══════ DIVIDER ══════ */}
      <div className="h-px bg-border mx-5 mb-5" />

      {/* ══════ VOUCHERS SECTION (collapsible) ══════ */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setVouchersOpen(!vouchersOpen)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <h2 className="text-lg font-bold text-text-primary">{t.wallet.myVouchers}</h2>
            <span
              className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${vouchersOpen ? 'rotate-180' : ''}`}
              style={{ fontSize: '20px' }}
            >
              expand_more
            </span>
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface text-text-secondary text-xs font-medium active:scale-95 transition-transform">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
            {t.wallet.filterVouchers}
          </button>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${vouchersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <WalletTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* ══════ BOTTOM SHEETS ══════ */}
      {showPaySheet && <PayInStoreSheet onClose={() => setShowPaySheet(false)} />}
      {showMoreSheet && <MoreActionsSheet onClose={() => setShowMoreSheet(false)} />}

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
