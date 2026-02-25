import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useContactsStore } from '../../stores/contactsStore';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * ReferralBanner — compact home-page trigger card.
 *
 * Opens the fullscreen ReferralStoriesPage on tap.
 * Shows referral progress (X/2 friends) and a brief CTA.
 */
export default function ReferralBanner() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Progress state
  const friendsOnNexus = useContactsStore((s) => s.friendsOnNexus);
  const referralCount = Math.min(friendsOnNexus.length, 2);
  const goalReached = referralCount >= 2;

  // Early return AFTER all hooks
  if (!isAuthenticated || !userId) return null;

  return (
    <section className="px-5 mb-6" dir={isHe ? 'rtl' : 'ltr'}>
      <button
        onClick={() => navigate(`/${lang}/referral-stories`)}
        className="w-full relative overflow-hidden rounded-2xl p-4 text-start active:scale-[0.98] transition-transform"
        style={{
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)',
        }}
      >
        {/* Decorative blob */}
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.12)',
            filter: 'blur(24px)',
            transform: 'translate(-30%, -30%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Gift icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '26px' }}>
              card_giftcard
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm leading-tight">
              {t.registration.inviteBannerTitle}
            </p>
            <p className="text-white/70 text-xs mt-0.5 leading-snug">
              {t.registration.inviteBannerSubtitle}
            </p>
          </div>

          {/* Right side: progress or arrow */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Progress circles */}
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${referralCount >= 1 ? 'bg-white' : 'bg-white/30'}`}>
                {referralCount >= 1 ? (
                  <span className="material-symbols-outlined text-[#635bff]" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-white/60" style={{ fontSize: '12px' }}>person</span>
                )}
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${referralCount >= 2 ? 'bg-white' : 'bg-white/30'}`}>
                {referralCount >= 2 ? (
                  <span className="material-symbols-outlined text-[#635bff]" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-white/60" style={{ fontSize: '12px' }}>person</span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <span className="material-symbols-outlined text-white/80" style={{ fontSize: '20px' }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>
        </div>

        {/* Goal complete message */}
        {goalReached && (
          <div className="relative z-10 mt-2 bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-white text-xs font-bold text-center">{t.registration.inviteGoalComplete}</p>
          </div>
        )}
      </button>
    </section>
  );
}
