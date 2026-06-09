import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowRight, Plus, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';

export default function AddMoneySourcePage() {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const amount = (location.state as { amount?: number })?.amount || 0;

  const { data: cards } = usePaymentMethods();
  const [selectedId, setSelectedId] = useState<string | undefined>(cards[0]?.id);

  const handleContinue = () => {
    if (!selectedId) return;
    navigate(`/${lang}/wallet/add-money/loading`, { state: { amount, sourceId: selectedId } });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col max-w-md mx-auto pt-16">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:bg-surface rounded-full"
        >
          <ArrowRight size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-text-primary">{t.wallet.addMoneyTitle}</h1>
          <p className="text-sm font-medium text-text-secondary">₪{amount}</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Content — selectable list of the user's saved cards. */}
      <main className="flex-grow px-4 pb-28">
        <h2 className="text-2xl font-bold text-text-primary mb-5 mt-2">
          {t.wallet.fromWhere}
        </h2>

        <div className="space-y-3">
          {cards.map((card) => {
            const selected = card.id === selectedId;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedId(card.id)}
                aria-pressed={selected}
                className={`w-full rounded-2xl p-4 flex items-center gap-3 border-2 transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white hover:bg-surface'
                }`}
              >
                <PaymentBrandMark brand={card.brand} />
                <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="text-base font-bold text-text-primary truncate">
                    {isRTL ? card.labelHe : card.label}
                  </div>
                </div>
                {/* Selection indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected ? 'bg-primary text-white' : 'border-2 border-border'
                  }`}
                >
                  {selected && <Check size={14} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* "Add another card" tile — dashed, navigates to the add-card flow. */}
        <button
          type="button"
          onClick={() => navigate(`/${lang}/wallet/add-payment-method`)}
          className="mt-3 w-full bg-white border-2 border-dashed border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-surface transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
            <Plus size={20} className="text-text-primary" strokeWidth={2.4} />
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="text-text-primary font-bold text-base">
              {t.wallet.addAnotherCard}
            </div>
            <div className="text-text-muted text-xs">
              {t.wallet.addCardDescription}
            </div>
          </div>
        </button>
      </main>

      {/* Fixed Continue button at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white max-w-md mx-auto">
        <button
          onClick={handleContinue}
          disabled={!selectedId}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
            selectedId
              ? 'bg-bg-dark text-white active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t.wallet.continueBtn}
        </button>
      </div>
    </div>
  );
}
