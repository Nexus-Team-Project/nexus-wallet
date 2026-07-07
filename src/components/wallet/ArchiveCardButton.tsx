import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useArchiveStore } from '../../stores/archiveStore';

interface ArchiveCardButtonProps {
  /** Deck card id to archive — 'card', 'balance', or 'voucher:<id>'. */
  cardId: string;
  className?: string;
}

/**
 * "Move to archive" action shown on the card-detail pages. Tapping asks
 * for a quick confirmation (archiving has no in-app undo), then removes
 * the card from the wallet deck and returns to the wallet.
 */
export default function ArchiveCardButton({ cardId, className = '' }: ArchiveCardButtonProps) {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const archive = useArchiveStore((s) => s.archive);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className={`flex items-center gap-3 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <button
          onClick={() => {
            archive(cardId);
            navigate(`/${lang}/wallet`);
          }}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-bg-dark text-white py-3.5 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            inventory_2
          </span>
          {isRTL ? 'אישור העברה לארכיון' : 'Confirm archive'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-5 rounded-2xl bg-surface border border-border text-text-secondary py-3.5 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          {isRTL ? 'ביטול' : 'Cancel'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`w-full flex items-center justify-center gap-2 rounded-2xl bg-surface border border-border text-text-secondary py-3.5 font-semibold text-sm active:scale-[0.98] transition-transform ${className}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        inventory_2
      </span>
      {isRTL ? 'העבר לארכיון' : 'Move to archive'}
    </button>
  );
}
