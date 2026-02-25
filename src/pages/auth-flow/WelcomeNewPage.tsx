import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLoginSheetStore } from '../../stores/loginSheetStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useRegistrationStore } from '../../stores/registrationStore';

const BULLETS = [
  { emoji: '⚡', key: 'welcomeNewBullet1' as const },
  { emoji: '🏢', key: 'welcomeNewBullet2' as const },
  { emoji: '🎁', key: 'welcomeNewBullet3' as const },
];

// Progress bar + top bar shared across flow pages
function FlowTopBar({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  const progress = (step / total) * 100;
  return (
    <div className="flex-shrink-0">
      {/* Progress bar */}
      <div className="h-1 w-full bg-primary/15">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Back + step indicator */}
      <div className="flex items-center justify-between px-5 py-3">
        {onBack ? (
          <button onClick={onBack} className="text-text-secondary hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              arrow_forward
            </span>
          </button>
        ) : (
          <div className="w-8" />
        )}
        <span className="text-xs text-text-muted font-medium">
          {step} / {total}
        </span>
      </div>
    </div>
  );
}

export default function WelcomeNewPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const open = useLoginSheetStore((s) => s.open);
  const tenantConfig = useTenantStore((s) => s.config);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // When the user arrived via an org link (PATH B / D), skip "how did you arrive"
  // and go straight to the Match Screen.
  const hasOrgContext = !!(tenantConfig || orgMember);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleSwitchAccount = async () => {
    try {
      await open();
    } catch {
      // dismissed
    }
  };

  return (
    <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col bg-white overflow-x-hidden">
      {/* Gradient hero top */}
      <div
        className="flex-shrink-0 w-full flex flex-col justify-end pb-8 px-6 pt-0"
        style={{
          minHeight: '38vh',
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)',
        }}
      >
        <FlowTopBar step={1} total={3} />

        <div
          className="mt-2 transition-all duration-600 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <h1 className="text-3xl font-extrabold text-white drop-shadow mb-1">
            {t.authFlow.welcomeNewTitle}
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">
            {t.authFlow.welcomeNewSubtitle}
          </p>
        </div>
      </div>

      {/* White content */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        {/* Bullets */}
        <ul className="space-y-4 mb-8">
          {BULLETS.map(({ emoji, key }, i) => (
            <li
              key={key}
              className="flex items-start gap-3 transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(16px)',
                transitionDelay: `${100 + i * 100}ms`,
              }}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
              <span className="text-text-primary font-medium leading-snug text-sm">
                {t.authFlow[key]}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-3">
          <button
            onClick={() =>
              navigate(
                `/${lang}/auth-flow/${hasOrgContext ? 'org-user' : 'how-did-you-arrive'}`
              )
            }
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            {t.authFlow.welcomeNewCta}
          </button>
          <p className="text-center text-xs text-text-muted">
            {t.authFlow.welcomeNewAlreadyMember}{' '}
            <button
              onClick={handleSwitchAccount}
              className="text-primary font-semibold hover:underline"
            >
              {t.authFlow.welcomeNewSwitchAccount}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export { FlowTopBar };
