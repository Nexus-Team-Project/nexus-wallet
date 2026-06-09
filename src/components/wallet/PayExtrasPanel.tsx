import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface PayExtrasPanelProps {
  /** Closes the pay session (used by the "maximize cashback" nav-away). */
  onClose: () => void;
}

/**
 * Extras half of the in-store payment UI — stacking toggle, maximize
 * cashback and the how-it-works card. Rendered BELOW the balance square
 * so it slides down into place when the pay session opens.
 */
export default function PayExtrasPanel({ onClose }: PayExtrasPanelProps) {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [includesStacking, setIncludesStacking] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="bg-white rounded-3xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-6 py-5"
      dir={lang === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Stacking toggle */}
      <div className="bg-surface rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          {/* Title + info icon inline */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary">
              {includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
            </span>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-0.5 rounded-full transition-colors"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: 'var(--color-text-muted)', opacity: 0.5 }}
              >
                info
              </span>
            </button>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setIncludesStacking(!includesStacking)}
            className={`w-12 h-7 rounded-full transition-colors relative ${includesStacking ? 'bg-primary' : 'bg-border'}`}
          >
            <div
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all"
              style={{ insetInlineStart: includesStacking ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Info explanation */}
        {showInfo && (
          <p className="mt-3 text-sm text-text-secondary bg-white rounded-xl p-3 border border-border animate-fade-in">
            {t.wallet.stackingExplanation}
          </p>
        )}
      </div>

      {/* How does it work? — navigates to the intro page */}
      <button
        onClick={() => {
          onClose();
          navigate(`/${lang}/wallet/pay-intro`);
        }}
        className="w-full flex items-center justify-between bg-surface rounded-2xl border border-border p-4 active:scale-[0.98] transition-transform"
      >
        <span className="text-sm font-bold text-primary">
          {t.wallet.howItWorks}
        </span>
        <ChevronLeft size={20} className="text-primary" style={{ transform: lang === 'he' ? 'rotate(180deg)' : undefined }} />
      </button>
    </div>
  );
}
