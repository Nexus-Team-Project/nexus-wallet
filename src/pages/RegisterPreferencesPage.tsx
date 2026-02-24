import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useRegistrationStore } from '../stores/registrationStore';
import { useTenantStore } from '../stores/tenantStore';
import { useAuthStore } from '../stores/authStore';
import { questionnaireQuestions } from '../mock/data/questionnaire.mock';
import { savePreferences } from '../services/registration.service';

export default function RegisterPreferencesPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const tenantConfig = useTenantStore((s) => s.config);
  const userId = useAuthStore((s) => s.userId);
  const setProfileCompleted = useAuthStore((s) => s.setProfileCompleted);
  const { setPreferences, completeRegistration } = useRegistrationStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = questionnaireQuestions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const finishAndNavigate = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      setPreferences(finalAnswers);
      await savePreferences(userId ?? '', finalAnswers);
      setProfileCompleted(true);
      completeRegistration();
      navigate(`/${lang}`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (isLastQuestion) {
        finishAndNavigate(newAnswers);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 300);
  };

  const handleSkip = () => {
    setPreferences(answers);
    setProfileCompleted(true);
    completeRegistration();
    navigate(`/${lang}`, { replace: true });
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const questionTitle = isHe ? currentQuestion.titleHe : currentQuestion.titleEn;
  const selectedValue = answers[currentQuestion.id];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>

      {/* ── Progress bars (one per question) ── */}
      <div className="flex-shrink-0 flex gap-1 px-3 pt-3 pb-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: i <= currentIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* ── White content card ── */}
      <div className="flex-1 bg-white rounded-t-2xl flex flex-col overflow-hidden">

        {/* Top navigation */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-1">
          {currentIndex > 0 ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px', fontVariationSettings: "'wght' 500" }}>
                {isHe ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}

          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-text-muted px-3 py-1.5 rounded-xl hover:bg-surface active:scale-95 transition-all"
          >
            {t.registration.skipForNow}
          </button>
        </div>

        {/* Question content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" key={currentQuestion.id}>
          {/* Header */}
          <div className="mb-6">
            {tenantConfig ? (
              <img
                src={tenantConfig.logo}
                alt={isHe ? tenantConfig.nameHe : tenantConfig.name}
                className="h-8 mb-4 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
              {isHe ? 'העדפות' : 'Preferences'} {currentIndex + 1} / {questions.length}
            </p>
            <h2 className="text-xl font-extrabold text-text-primary leading-tight">
              {questionTitle}
            </h2>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedValue === option.value;
              const label = isHe ? option.labelHe : option.labelEn;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  disabled={isSubmitting}
                  className={`relative p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.97] ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  {isSelected && (
                    <span
                      className="absolute top-2 end-2 material-symbols-outlined text-primary"
                      style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pb-10 pt-3">
          {isSubmitting && (
            <div className="flex justify-center py-3">
              <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: '24px' }}>
                progress_activity
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
