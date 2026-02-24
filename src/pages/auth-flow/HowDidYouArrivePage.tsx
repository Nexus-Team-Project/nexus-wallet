import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { FlowTopBar } from './WelcomeNewPage';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';
import { useRegistrationStore } from '../../stores/registrationStore';

export default function HowDidYouArrivePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<'direct' | 'org' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (choice: 'direct' | 'org') => {
    setSelected(choice);
    setTimeout(() => {
      if (choice === 'direct') {
        const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
        navigate(`/${lang}/register/onboarding/${firstSlide}`);
      } else {
        navigate(`/${lang}/auth-flow/select-org`);
      }
    }, 350);
  };

  const options = [
    {
      id: 'direct' as const,
      emoji: '🚀',
      title: t.authFlow.howArriveDirectTitle,
      desc: t.authFlow.howArriveDirectDesc,
    },
    {
      id: 'org' as const,
      emoji: '🏢',
      title: t.authFlow.howArriveOrgTitle,
      desc: t.authFlow.howArriveOrgDesc,
    },
  ];

  return (
    <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col bg-white overflow-x-hidden">
      {/* Gradient hero */}
      <div
        className="flex-shrink-0 w-full flex flex-col justify-end pb-8 px-6 pt-0"
        style={{
          minHeight: '32vh',
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)',
        }}
      >
        <FlowTopBar
          step={2}
          total={3}
          onBack={() => navigate(`/${lang}/auth-flow/welcome-new`)}
        />
        <div
          className="mt-2 transition-all duration-500 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
            {t.authFlow.howArriveSubtitle}
          </p>
          <h1 className="text-2xl font-extrabold text-white drop-shadow">
            {t.authFlow.howArriveTitle}
          </h1>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-8 gap-4">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className="w-full text-right transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: `${i * 80 + 60}ms`,
              }}
            >
              <div
                className={`
                  bg-white rounded-2xl p-5 border-2 shadow-sm transition-all duration-200
                  flex items-start gap-4
                  ${isSelected
                    ? 'border-primary shadow-primary/20 scale-[0.98]'
                    : 'border-border hover:border-primary/40 hover:shadow-md'
                  }
                `}
              >
                <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary text-sm mb-0.5 leading-snug">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">{opt.desc}</p>
                </div>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-primary' : 'bg-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${isSelected ? 'text-white' : 'text-text-muted'}`}
                    style={{ fontSize: '16px' }}
                  >
                    arrow_back
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
