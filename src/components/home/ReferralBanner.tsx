import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLanguage } from '../../i18n/LanguageContext';

// Same face-cropped Unsplash portraits used on the ReferralStoriesPage, so the
// banner reads as a preview of that page. Mix of women and men.
const AV = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=120&h=120&fit=crop&crop=faces&q=80`;
const BANNER_AVATARS = [
  AV('1494790108377-be9c29b29330'), // woman
  AV('1500648767791-00dcc994a43e'), // man
  AV('1534528741775-53994a69daeb'), // woman
];

/**
 * ReferralBanner — compact home-page trigger card.
 *
 * Opens the fullscreen ReferralStoriesPage on tap. Styled to match that page:
 * navy (#0a2540) card, sky-blue (#7dd3fc) accents, large rounded corners, and
 * the same overlapping friend-avatar cluster.
 * Shows referral progress (X/2 friends) and a brief CTA.
 */
export default function ReferralBanner() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Early return AFTER all hooks
  if (!isAuthenticated || !userId) return null;

  return (
    <section className="px-5 mb-6" dir={isHe ? 'rtl' : 'ltr'}>
      <button
        onClick={() => navigate(`/${lang}/referral-stories`)}
        className="w-full relative overflow-hidden rounded-[28px] p-4 text-start active:scale-[0.98] transition-transform bg-[#0a2540]"
      >
        {/* Content — text on one side (centred horizontally within its space,
            two lines) and the avatar cluster + arrow on the other. */}
        <div className="relative z-10 flex items-center gap-2">
          {/* Text — two lines, centred horizontally; page font + sky-blue,
              rectangular Nexus logo chip in place of the word "נקסוס". */}
          <p className="flex-1 text-center text-[#7dd3fc] font-black tracking-tighter text-lg leading-snug">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <span>שתפו את</span>
              <span className="inline-flex items-center bg-sky-300 rounded-lg px-2 py-0.5 overflow-hidden">
                <img
                  src="/nexus-logo-black.png"
                  alt="נקסוס"
                  className="h-6 w-auto object-contain"
                  style={{ transform: 'scale(1.4)' }}
                />
              </span>
            </span>
            <br />
            <span>וקבלו 100 ש"ח</span>
          </p>

          {/* Avatar cluster + arrow — nudged inward toward the centre */}
          <div className="flex-shrink-0 flex items-center gap-2 me-3">
            <div className="flex -space-x-3">
              {BANNER_AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Friend ${i + 1}`}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#0a2540]"
                />
              ))}
              <div className="w-6 h-6 rounded-full bg-[#7dd3fc] border-2 border-[#0a2540] flex items-center justify-center self-end -ms-1">
                <span className="material-symbols-outlined text-[#0a2540]" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>add</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#7dd3fc]" style={{ fontSize: '20px' }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
