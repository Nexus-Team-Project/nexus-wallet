import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';

export default function WelcomeBackPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const organizationName = useAuthStore((s) => s.organizationName);
  const firstName = useAuthStore((s) => s.firstName);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const returnTo = useRegistrationStore((s) => s.returnTo);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 60);
    const redirectTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        navigate(returnTo ?? `/${lang}`, { replace: true });
      }, 450);
    }, 2200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, lang, returnTo]);

  const orgLine = organizationName
    ? t.authFlow.welcomeBackOrg.replace('{{orgName}}', organizationName)
    : null;

  return (
    <div className="relative min-h-dvh w-full max-w-md mx-auto flex flex-col items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 50%, #00d4ff 100%)',
        }}
      />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-20"
          style={{
            background: 'rgba(255,255,255,0.3)',
            top: '-10%',
            right: '-10%',
            animation: 'blob1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-15"
          style={{
            background: 'rgba(255,255,255,0.2)',
            bottom: '10%',
            left: '-5%',
            animation: 'blob2 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8 transition-all duration-700 ease-out"
        style={{
          opacity: visible && !leaving ? 1 : 0,
          transform: visible && !leaving ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
        }}
      >
        {/* תמונת משתמש או check circle */}
        <div
          className="w-24 h-24 rounded-3xl border-4 border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 overflow-hidden"
          style={{
            animation: visible ? 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={firstName ?? ''} className="w-full h-full object-cover" />
          ) : (
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path
                d="M10 22L19 31L34 13"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: visible ? 0 : 50,
                  transition: 'stroke-dashoffset 0.5s ease 0.4s',
                }}
              />
            </svg>
          )}
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
          {firstName ? `${firstName}, טוב שחזרת 👋` : t.authFlow.welcomeBackTitle}
        </h1>
        <p className="text-lg text-white/85 mb-2">{t.authFlow.welcomeBackSubtitle}</p>
        {orgLine && (
          <p className="text-sm text-white/70 mt-1 bg-white/10 px-4 py-1.5 rounded-full">
            {orgLine}
          </p>
        )}

        {/* Redirect indicator */}
        <div className="mt-12 flex items-center gap-2.5 text-white/60 text-sm">
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span>{t.authFlow.redirecting}</span>
        </div>
      </div>

      <style>{`
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px, 15px) scale(1.1); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(15px, -20px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
