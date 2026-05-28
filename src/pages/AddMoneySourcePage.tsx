import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function AddMoneySourcePage() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const amount = (location.state as { amount?: number })?.amount || 0;

  // Mock: check if user has a card
  const hasCard = true;

  const handleContinue = () => {
    navigate(`/${lang}/wallet/add-money/loading`, { state: { amount } });
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

      {/* Content */}
      <main className="flex-grow p-4 pb-28">
        {/* Source Selection Card */}
        <section
          className="rounded-[2rem] p-6 pb-8"
          style={{ background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 50%, #5649d8 100%)' }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">{t.wallet.fromWhere}</h2>

          {hasCard ? (
            /* Payment Method Card */
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="text-right">
                <div className="text-lg font-bold text-text-primary">כרטיס 7526</div>
                <div className="text-sm text-text-secondary">{t.wallet.mainCard}</div>
              </div>
              <div className="border border-border rounded-lg p-2">
                <svg height={25} viewBox="0 0 32 20" width={40}>
                  <circle cx={10} cy={10} r={9} fill="#eb001b" opacity={0.8} />
                  <circle cx={22} cy={10} r={9} fill="#f79e1b" opacity={0.8} />
                </svg>
              </div>
            </div>
          ) : (
            /* No card - prompt to add */
            <button
              onClick={() => {/* TODO: navigate to add card flow */}}
              className="w-full bg-white/20 border-2 border-dashed border-white/50 rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>add_card</span>
              <span className="text-white font-bold text-lg">{t.wallet.addCard}</span>
              <span className="text-white/70 text-sm">{t.wallet.addCardDescription}</span>
            </button>
          )}
        </section>
      </main>

      {/* Fixed Continue button at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white max-w-md mx-auto">
        <button
          onClick={handleContinue}
          disabled={!hasCard}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
            hasCard
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
