import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const MAX_ADD = 19329;

export default function AddMoneyPage() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount > 0 && numericAmount <= MAX_ADD;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    // Only one decimal point
    const parts = val.split('.');
    if (parts.length > 2) return;
    // Max 2 decimal places
    if (parts[1] && parts[1].length > 2) return;
    // Max length
    if (val.length > 8) return;
    setAmount(val);
  };

  const handleContinue = () => {
    if (!isValid) return;
    navigate(`/${lang}/wallet/add-money/source`, { state: { amount: numericAmount } });
  };

  const displayAmount = amount || '0';

  return (
    <div className="min-h-dvh bg-white flex flex-col max-w-md mx-auto pt-16">
      {/* Header */}
      <header className="flex items-center px-4 py-3">
        <button
          onClick={() => navigate(`/${lang}/wallet`)}
          className="p-2 text-text-secondary hover:bg-surface rounded-full"
        >
          <X size={24} />
        </button>
        <h1 className="flex-grow text-center text-lg font-bold text-text-primary mr-10">
          {t.wallet.addMoneyTitle}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-grow p-4 overflow-y-auto pb-28">
        {/* Amount Card */}
        <section
          className="rounded-3xl p-6 mb-6 cursor-text"
          style={{ background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 50%, #5649d8 100%)' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex justify-end">
            <span className="text-3xl font-bold text-white">{t.wallet.howMuch}</span>
          </div>
          <div className="mt-8 flex items-baseline justify-end border-b-2 border-white/40 pb-2 relative">
            <div className="text-7xl font-medium text-white" dir="ltr">{displayAmount}</div>
            <div className="text-2xl font-bold text-white/80 mr-2">₪</div>
            <div className="absolute right-0 bottom-3 w-0.5 h-16 bg-white animate-pulse" />
          </div>
          {/* Hidden native input for device keyboard */}
          <input
            ref={inputRef}
            type="decimal"
            inputMode="decimal"
            value={amount}
            onChange={handleChange}
            autoFocus
            className="sr-only"
          />
        </section>

        {/* Info text */}
        <div className="text-center mt-6">
          <p className="text-text-secondary font-medium">
            {t.wallet.canAddMore.replace('{amount}', MAX_ADD.toLocaleString())}
          </p>
        </div>
      </main>

      {/* Fixed Continue button at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white max-w-md mx-auto">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
            isValid
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
