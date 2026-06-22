import { useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockVouchers } from '../mock/data/vouchers.mock';
import { useLanguage } from '../i18n/LanguageContext';
import BusinessHero from '../components/business/BusinessHero';
import BusinessCardContent from '../components/business/BusinessCardContent';
import { StickyCTA } from '../components/business/BusinessContent';
import CouponCodesSheet from '../components/business/CouponCodesSheet';
import type { CouponCode } from '../types/search.types';

export default function BusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [couponHelpOpen, setCouponHelpOpen] = useState(false);
  const [dealHelpOpen, setDealHelpOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = isHe ? business?.nameHe ?? '' : business?.name ?? '';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed */
    }
  };

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  const vouchers = useMemo(
    () => mockVouchers.filter((v) => v.merchantName === business?.name),
    [business],
  );

  if (!business) {
    return <Navigate to=".." replace />;
  }

  const couponCodes = business.couponCodes ?? [];
  const hasCoupons = couponCodes.length > 0;

  // Copy the code, then open the embedded supplier site so it's ready to paste.
  const handleUseCode = async (c: CouponCode) => {
    try {
      await navigator.clipboard.writeText(c.code);
    } catch {
      /* clipboard may be unavailable — ignore */
    }
    setCouponsOpen(false);
    navigate(`/${language}/business/${business.id}/site?code=${encodeURIComponent(c.code)}`);
  };

  const handleCreateDeal = () => {
    const voucherId = vouchers[0]?.id;
    if (voucherId) {
      navigate(`/${language}/business/${business.id}/voucher/${voucherId}`);
    }
  };

  // Gray pills (checkout-style), stacked one above the other — rendered just
  // under the offers (benefits) rows inside the business content.
  const storeActions = (
    <div className="px-5 pt-2 pb-1 flex flex-col gap-3">
      <div className="relative">
        <button
          onClick={handleCreateDeal}
          className="w-full bg-surface rounded-2xl py-3.5 px-4 text-center text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
        >
          {isHe ? 'צור עסקה בתנאים שלך' : 'Make a deal on your terms'}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setDealHelpOpen(true); }}
          aria-label={isHe ? 'איך זה עובד' : 'How it works'}
          className="absolute top-1/2 -translate-y-1/2 end-3 w-8 h-8 flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>help</span>
        </button>
      </div>
      {hasCoupons && (
        <div className="relative">
          <button
            onClick={() => setCouponsOpen(true)}
            className="w-full bg-surface rounded-2xl py-3.5 px-4 text-center text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
          >
            {isHe ? 'קודי קופון' : 'Coupon codes'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCouponHelpOpen(true); }}
            aria-label={isHe ? 'איך זה עובד' : 'How it works'}
            className="absolute top-1/2 -translate-y-1/2 end-3 w-8 h-8 flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>help</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
      <div className="bg-white animate-fade-in">
        <BusinessHero business={business} />

        {/* Main content area with rounded top — like Tabby/Bloomingdale's mockup */}
        <div
          className="relative z-20 bg-white"
          style={{ marginTop: -30, borderTopLeftRadius: 36, borderTopRightRadius: 36, willChange: 'transform' }}
        >
          {/* ── Social links ── */}
          <section className="px-6 pt-5 pb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                aria-label={isHe ? 'שיתוף' : 'Share'}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface border border-border/60 text-text-primary active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>ios_share</span>
              </button>
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" aria-label="Website"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface border border-border/60 text-text-primary active:scale-95 transition-transform">
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>language</span>
                </a>
              )}
              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface border border-border/60 text-text-primary active:scale-95 transition-transform">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5.5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface border border-border/60 text-text-primary active:scale-95 transition-transform">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12Z" />
                  </svg>
                </a>
              )}
              {copied && (
                <span className="text-xs font-medium text-text-muted">
                  {isHe ? 'הקישור הועתק' : 'Link copied'}
                </span>
              )}
            </div>
          </section>

          {/* ── About us ── */}
          {(business.description || business.descriptionHe) && (
            <section className="px-6 pb-4">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {isHe ? 'עלינו' : 'About us'}
              </h2>
              <p className={`text-sm text-text-secondary leading-relaxed whitespace-pre-line ${aboutExpanded ? '' : 'line-clamp-3'}`}>
                {isHe ? business.descriptionHe : business.description}
              </p>
              <button
                onClick={() => setAboutExpanded((v) => !v)}
                className="mt-1.5 text-sm font-semibold text-primary active:opacity-70 transition-opacity"
              >
                {aboutExpanded ? (isHe ? 'פחות' : 'Less') : (isHe ? 'עוד' : 'More')}
              </button>
            </section>
          )}

          <BusinessCardContent business={business} storeActions={storeActions} />
        </div>

        {/* Sticky CTA */}
        <StickyCTA business={business} firstVoucherId={vouchers[0]?.id} />

        {/* Coupon codes sheet */}
        <CouponCodesSheet
          isOpen={couponsOpen}
          onClose={() => setCouponsOpen(false)}
          codes={couponCodes}
          onUseCode={handleUseCode}
          onHelp={() => setCouponHelpOpen(true)}
        />

        {/* How coupon codes work — explainer sheet */}
        <CouponHelpSheet isOpen={couponHelpOpen} onClose={() => setCouponHelpOpen(false)} isHe={isHe} />

        {/* How "deal on your terms" works — explainer sheet */}
        <DealHelpSheet isOpen={dealHelpOpen} onClose={() => setDealHelpOpen(false)} isHe={isHe} />
      </div>
  );
}

function DealHelpSheet({ isOpen, onClose, isHe }: { isOpen: boolean; onClose: () => void; isHe: boolean }) {
  if (!isOpen) return null;
  const steps = isHe
    ? [
        { icon: 'edit_note',     title: 'הגדירו את התנאים', body: 'ציינו את הכמות, המחיר, או כל תנאי שחשוב לכם.' },
        { icon: 'send',          title: 'שלחו הצעה לעסק', body: 'ההצעה מגיעה ישירות לבעל העסק לאישור.' },
        { icon: 'handshake',     title: 'קבלו אישור ובצעו', body: 'אושרה? תוכלו לממש את העסקה ישירות דרך האפליקציה.' },
      ]
    : [
        { icon: 'edit_note',     title: 'Set your terms', body: 'Specify the quantity, price, or any condition that matters to you.' },
        { icon: 'send',          title: 'Send your offer', body: 'The offer goes directly to the business for review.' },
        { icon: 'handshake',     title: 'Get confirmed & pay', body: 'Once accepted, you can complete the deal right in the app.' },
      ];

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[1000] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up"
        >
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">
                {isHe ? 'איך זה עובד?' : 'How it works'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-text-primary">{s.title}</p>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-snug">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CouponHelpSheet({ isOpen, onClose, isHe }: { isOpen: boolean; onClose: () => void; isHe: boolean }) {
  if (!isOpen) return null;
  const steps = isHe
    ? [
        { icon: 'content_copy', title: 'העתיקו קוד', body: 'לחצו על "העתק" ליד הקוד שבחרתם.' },
        { icon: 'language',     title: 'עברו לאתר הספק', body: 'לחצו "לאתר" — האתר ייפתח עם הקוד כבר מוכן.' },
        { icon: 'sell',         title: 'הדביקו בצ׳קאוט', body: 'בסיום הרכישה הדביקו את הקוד בשדה הקופון.' },
      ]
    : [
        { icon: 'content_copy', title: 'Copy a code', body: 'Tap "Copy" next to the code you want.' },
        { icon: 'language',     title: 'Visit the store', body: 'Tap "Visit" — the site opens with the code ready.' },
        { icon: 'sell',         title: 'Paste at checkout', body: 'Paste the code into the coupon field when you pay.' },
      ];

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[1000] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up"
        >
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">
                {isHe ? 'איך זה עובד?' : 'How it works'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-text-primary">{s.title}</p>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-snug">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
