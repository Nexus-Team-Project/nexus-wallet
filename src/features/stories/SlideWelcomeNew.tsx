import { useLanguage } from '../../i18n/LanguageContext';

export function SlideWelcomeNew() {
  const { t } = useLanguage();

  const BULLETS = [
    { emoji: '⚡', text: t.authFlow.welcomeNewBullet1 },
    { emoji: '🏢', text: t.authFlow.welcomeNewBullet2 },
    { emoji: '🎁', text: t.authFlow.welcomeNewBullet3 },
  ];

  return (
    <div className="absolute inset-0 bg-white flex flex-col" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-4">
        {/* Visual hero */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)' }}
        >
          <span style={{ fontSize: '56px' }}>🎉</span>
        </div>

        <h1 className="text-3xl font-extrabold text-text-primary text-center mb-3 leading-tight">
          {t.authFlow.welcomeNewTitle}
        </h1>
        <p className="text-sm text-text-muted text-center leading-relaxed mb-8">
          {t.authFlow.welcomeNewSubtitle}
        </p>

        {/* Benefit bullets */}
        <div className="w-full space-y-3">
          {BULLETS.map(({ emoji, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3"
            >
              <span className="text-xl flex-shrink-0">{emoji}</span>
              <span className="text-text-primary font-medium text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
