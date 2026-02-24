import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * ReferralBanner — compact home-page card for inviting friends.
 * Shows only when the user is authenticated.
 *
 * Features:
 * - Generated referral link based on userId
 * - Copy to clipboard with 2s "הועתק ✓" feedback
 * - Native share via navigator.share() — graceful fallback to copy-only
 */
export default function ReferralBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const { language } = useLanguage();
  const isHe = language === 'he';

  const [copied, setCopied] = useState(false);

  if (!isAuthenticated || !userId) return null;

  // Build referral link — first 8 chars of userId as ref code
  const refCode = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
  const referralUrl = `https://nexus.app/join?ref=${refCode}`;

  const shareTitle = isHe ? 'הצטרף לנקסוס ותחסוך יותר' : 'Join Nexus and save more';
  const shareText = isHe
    ? 'גלה הטבות בלעדיות, קאשבק ועוד — בוא להצטרף בחינם!'
    : 'Discover exclusive benefits, cashback and more — join for free!';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('input');
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: referralUrl });
      } catch {
        // User cancelled or share failed — silently ignore
      }
    } else {
      // Fallback: copy
      await handleCopy();
    }
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <section className="px-5 mb-6" dir={isHe ? 'rtl' : 'ltr'}>
      <div
        className="relative overflow-hidden rounded-2xl p-4"
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
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-white font-extrabold text-base leading-tight">
                {isHe ? '🎁 הזמן חבר וקבל קרדיט' : '🎁 Invite a friend, earn credit'}
              </p>
              <p className="text-white/75 text-xs mt-0.5 leading-snug">
                {isHe
                  ? 'שתף את הלינק שלך — כל הצטרפות מזכה אותך בקרדיט'
                  : 'Share your link — every signup earns you credit'}
              </p>
            </div>
          </div>

          {/* Referral link pill */}
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 mb-3">
            <span className="flex-1 text-white text-xs font-mono truncate" dir="ltr">
              {referralUrl}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 text-white text-xs font-semibold active:scale-[0.97] transition-all"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', fontVariationSettings: copied ? "'FILL' 1" : "'FILL' 0" }}
              >
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              {copied ? (isHe ? 'הועתק ✓' : 'Copied ✓') : (isHe ? 'העתק' : 'Copy')}
            </button>

            {canShare && (
              <button
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-primary text-xs font-bold active:scale-[0.97] transition-all"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px' }}
                >
                  share
                </span>
                {isHe ? 'שתף' : 'Share'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
