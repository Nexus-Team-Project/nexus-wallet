import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function AddMoneyLoadingPage() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const amount = (location.state as { amount?: number })?.amount || 0;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        navigate(`/${lang}/wallet`, { replace: true, state: { addedAmount: amount } });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [done, navigate, lang, amount]);

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center max-w-md mx-auto">
      {!done ? (
        <div className="text-center animate-fade-in">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-text-primary mb-2">{t.wallet.processing}</h2>
          <p className="text-text-secondary">₪{amount}</p>
        </div>
      ) : (
        <div className="text-center animate-scale-in">
          <CheckCircle2 size={72} className="mx-auto text-success mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">{t.wallet.addedSuccessfully}</h2>
          <p className="text-lg text-text-secondary">₪{amount}</p>
        </div>
      )}
    </div>
  );
}
