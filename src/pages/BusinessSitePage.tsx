import { useMemo, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Embedded supplier site — reached from the store page's "coupon codes" sheet.
 * Styled as a mobile in-app browser (the way a link opens inside Instagram or
 * an email client): a slim top chrome with a close button, the secure domain
 * with a lock, an "open in browser" escape hatch, and a thin loading bar — with
 * the supplier site rendered in an iframe below. When a coupon code was used, a
 * banner reminds the user it's copied and ready to paste at checkout.
 *
 * NOTE: many sites block being framed (X-Frame-Options / CSP frame-ancestors),
 * so the iframe can come up blank for those — the "open in browser" button is
 * the escape hatch, exactly like a real in-app browser. A production build would
 * use a Custom Tab / SFSafariViewController instead of an iframe.
 */
export default function BusinessSitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [loading, setLoading] = useState(true);

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  if (!business || !business.website) return <Navigate to=".." replace />;

  const name = isHe ? business.nameHe : business.name;
  const code = params.get('code');
  const domain = business.website.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="relative h-dvh bg-white flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>
      {/* ── In-app browser chrome ── */}
      <header className="flex-shrink-0 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Close (Done) */}
          <button
            onClick={() => navigate(-1)}
            aria-label={isHe ? 'סגור' : 'Close'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary active:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>

          {/* Secure domain + page title */}
          <div className="flex-1 min-w-0 text-center px-1">
            <div className="flex items-center justify-center gap-1 text-text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lock</span>
              <span className="text-[13px] font-semibold truncate" dir="ltr">{domain}</span>
            </div>
            <p className="text-[11px] text-text-muted truncate leading-tight">{name}</p>
          </div>

          {/* Open in the real browser — escape hatch for sites that block framing */}
          <button
            onClick={() => window.open(business.website, '_blank', 'noopener,noreferrer')}
            aria-label={isHe ? 'פתח בדפדפן' : 'Open in browser'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary active:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>open_in_new</span>
          </button>
        </div>
      </header>

      {/* ── Copied-code banner ── */}
      {code && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2.5 text-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span className="font-medium">{isHe ? 'הקוד הועתק:' : 'Code copied:'}</span>
          <span className="font-mono font-bold tracking-wider" dir="ltr">{code}</span>
        </div>
      )}

      {/* ── Embedded supplier site ── */}
      <div className="relative flex-1">
        {/* Thin indeterminate loading bar (hidden once the frame loads) */}
        {loading && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-primary/15 overflow-hidden z-10">
            <div
              className="h-full w-1/3 bg-primary"
              style={{ animation: 'map-shimmer 1.1s ease-in-out infinite' }}
            />
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
    </div>
  );
}
