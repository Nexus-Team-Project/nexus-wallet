import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { formatDate } from '../utils/formatDate';


export default function VoucherDetailPage() {
  const { lang = 'he', voucherId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { data: vouchers } = useMyVouchers();
  const [copied, setCopied] = useState(false);

  // Filter active vouchers for the carousel
  const activeVouchers = vouchers?.filter(v => v.status === 'active') || [];
  const initialIndex = activeVouchers.findIndex(v => v.id === voucherId);
  const [activeIndex, setActiveIndex] = useState(Math.max(initialIndex, 0));

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update activeIndex when initialIndex changes (e.g. data loads)
  useEffect(() => {
    if (initialIndex >= 0) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  // Scroll to active card on mount / index change
  useEffect(() => {
    const container = scrollRef.current;
    const card = cardRefs.current[activeIndex];
    if (container && card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeIndex, activeVouchers.length]);

  // Handle scroll snap - detect which card is centered
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  }, [activeIndex]);

  // Debounced scroll handler
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(handleScroll, 50);
  }, [handleScroll]);

  const uv = activeVouchers[activeIndex];

  if (!uv) {
    return (
      <div className="min-h-dvh bg-[#F2F2F7] flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  const { voucher, redemptionCode, purchasedAt } = uv;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(redemptionCode);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = redemptionCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-[#F2F2F7] flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Background image - extends from top to center of voucher card */}
      <div className="absolute top-0 left-0 right-0 h-[55%] z-0">
        {voucher.imageUrl ? (
          <img
            src={voucher.imageUrl}
            alt={voucher.merchantName}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: voucher.brandColor || '#1a1a2e' }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#F2F2F7]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(`/${lang}/wallet`)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-white">{t.wallet.paymentTicket}</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <span className="material-symbols-outlined text-white">share</span>
        </button>
      </header>

      {/* Horizontal snap-scroll carousel */}
      <div className="relative z-10 mt-4">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[calc(50%-140px)]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeVouchers.map((userVoucher, index) => (
            <div
              key={userVoucher.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              className={`flex-shrink-0 w-[280px] snap-center transition-all duration-300 ${
                index === activeIndex ? 'scale-100 opacity-100' : 'scale-90 opacity-60'
              }`}
            >
              {/* Ticket card */}
              <div className="w-full bg-white rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col ticket-card">
                {/* QR section */}
                <div className="p-6 flex flex-col items-center gap-3">
                  {/* Brand logo */}
                  {userVoucher.voucher.brandLogo && (
                    <img
                      src={userVoucher.voucher.brandLogo}
                      alt={userVoucher.voucher.merchantName}
                      className="h-8 w-auto object-contain mb-1"
                    />
                  )}
                  <div className="relative">
                    <div className="bg-white p-3 rounded-2xl">
                      <img src="/qr-code.png" alt="QR Code" width={160} height={160} style={{ display: 'block' }} />
                      {/* Center badge */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                        <img src="/nexus-icon.png" alt="Nexus" className="w-6 h-6 rounded-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-[0.2em]">{t.wallet.scanAtRegister}</p>
                </div>

                {/* Perforation line */}
                <div className="relative h-px w-full px-4">
                  <div className="h-px w-full" style={{ backgroundImage: 'linear-gradient(to right, #D1D1D6 50%, transparent 50%)', backgroundSize: '12px 1px', backgroundRepeat: 'repeat-x' }} />
                </div>

                {/* Barcode section */}
                <div className="p-6 pt-4 flex flex-col items-center bg-slate-50/50">
                  <img src="/barcode.png" alt="Barcode" width={180} height={48} style={{ display: 'block' }} />
                  <span className="mt-3 font-mono text-xs tracking-[0.2em] text-text-muted">{userVoucher.redemptionCode}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content below carousel - for the selected voucher */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-12 gap-5 mt-6">
        {/* Copy row */}
        <div className="w-full flex items-center gap-3">
          <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-border/50 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-text-secondary">share</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-between px-4 h-12 bg-white rounded-2xl border border-border/50 shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="text-sm font-semibold tracking-wide text-text-secondary">{redemptionCode}</span>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white border border-border/50 shadow-sm active:bg-surface transition-colors">
            <span className="material-symbols-outlined text-text-muted mb-2">receipt_long</span>
            <span className="text-xs font-semibold text-text-secondary">{t.wallet.receipt}</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white border border-border/50 shadow-sm active:bg-surface transition-colors">
            <span className="material-symbols-outlined text-text-muted mb-2">description</span>
            <span className="text-xs font-semibold text-text-secondary">{t.wallet.termsLabel}</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white border border-border/50 shadow-sm active:bg-surface transition-colors">
            <span className="material-symbols-outlined text-text-muted mb-2">query_stats</span>
            <span className="text-xs font-semibold text-text-secondary">{t.wallet.statusLabel}</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500/10 rounded-full">
          <span className="material-symbols-outlined text-green-600" style={{ fontSize: '14px' }}>verified_user</span>
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">{t.wallet.securePayment}</span>
        </div>
        <p className="text-[10px] text-text-muted">
          {t.wallet.issuedOn} {formatDate(purchasedAt, locale)}
        </p>
      </footer>

      {/* Ticket cutout CSS + hide scrollbar */}
      <style>{`
        .ticket-card {
          mask-image: radial-gradient(circle at 0 68%, transparent 10px, black 11px),
                      radial-gradient(circle at 100% 68%, transparent 10px, black 11px);
          mask-composite: intersect;
          -webkit-mask-image: radial-gradient(circle at 0 68%, transparent 10px, black 11px),
                             radial-gradient(circle at 100% 68%, transparent 10px, black 11px);
          -webkit-mask-composite: destination-in;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
