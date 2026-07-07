import { useMemo, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import CouponCodesSheet from '../components/business/CouponCodesSheet';
import type { CouponCode } from '../types/search.types';

export default function BusinessSitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  if (!business || !business.website) return <Navigate to=".." replace />;

  const name   = isHe ? business.nameHe : business.name;
  const code   = params.get('code');
  const domain = business.website.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const codes: CouponCode[] = business.couponCodes?.length
    ? business.couponCodes
    : code
      ? [{ code, title: name, titleHe: name }]
      : [];

  return (
    <div className="relative h-dvh bg-white flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>
      {/* ── In-app browser chrome ── */}
      <header className="flex-shrink-0 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => navigate(-1)}
            aria-label={isHe ? 'סגור' : 'Close'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary active:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>

          <div className="flex-1 min-w-0 text-center px-1">
            <div className="flex items-center justify-center gap-1 text-text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lock</span>
              <span className="text-[13px] font-semibold truncate" dir="ltr">{domain}</span>
            </div>
            <p className="text-[11px] text-text-muted truncate leading-tight">{name}</p>
          </div>

          <button
            onClick={() => window.open(business.website, '_blank', 'noopener,noreferrer')}
            aria-label={isHe ? 'פתח בדפדפן' : 'Open in browser'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary active:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>open_in_new</span>
          </button>
        </div>
      </header>

      {/* ── Embedded supplier site ── */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-primary/15 overflow-hidden z-10">
            <div className="h-full w-1/3 bg-primary" style={{ animation: 'map-shimmer 1.1s ease-in-out infinite' }} />
          </div>
        )}
        <iframe
          src={business.website}
          title={name}
          onLoad={() => setLoading(false)}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* ── Peek tab — always visible when sheet is closed ── */}
      {codes.length > 0 && !sheetOpen && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 max-w-md mx-auto px-4 pb-0 flex justify-center"
          onPointerDown={() => setSheetOpen(true)}
        >
          <div
            className="w-full bg-white rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.10)] flex flex-col items-center pt-2.5 pb-3 gap-1.5 cursor-grab active:scale-[0.99] transition-transform select-none"
          >
            <div className="w-10 h-1 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 17 }}>local_offer</span>
              {isHe ? `${codes.length} קודי קופון` : `${codes.length} coupon code${codes.length > 1 ? 's' : ''}`}
              <span className="text-gray-400 font-normal text-[11px]">{isHe ? '↑ משוך' : '↑ pull'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Full coupon codes sheet ── */}
      {codes.length > 0 && (
        <CouponCodesSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          codes={codes}
          onUseCode={(c) => {
            navigator.clipboard.writeText(c.code).catch(() => {});
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}
