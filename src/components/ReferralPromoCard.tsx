import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * ReferralPromoCard — the navy "שתפו את Nexus והרוויחו" promo card from
 * ReferralStoriesPage (its Screen1), plus that page's friends/orgs track
 * switch, packaged as a single section for the About page.
 *
 * The copy is duplicated from ReferralStoriesPage rather than imported: its
 * CONTENT map is module-private there, and importing from that page module
 * would pull the whole referral page (TopBar, all three screens) into this
 * page's chunk. Both are lazy routes, so that would be a real download cost
 * for a card. If the strings start drifting, lift CONTENT into a shared
 * module and have both read from it.
 */

const AV = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&crop=faces&q=80`;

const AVATARS = [
  AV('1494790108377-be9c29b29330'), // woman, warm smile
  AV('1500648767791-00dcc994a43e'), // man, beard
  AV('1534528741775-53994a69daeb'), // woman, curly hair
];

type Track = 'friends' | 'orgs';

const TRACKS: Track[] = ['friends', 'orgs'];

const CONTENT: Record<Track, {
  switchLabel: string;
  switchLabelEn: string;
  rewardLine: string;
  subtitle: string;
  subtitleEn: string;
}> = {
  friends: {
    switchLabel: 'הפניית חברים',
    switchLabelEn: 'Refer friends',
    rewardLine: '100 ₪',
    subtitle:
      'שתפו את Nexus עם 3 חברים והרוויחו 100 ₪ לעצמכם. החברים שלכם מקבלים אקסטרה 5% קאשבק על 500 השקלים הראשונים שלהם.',
    subtitleEn:
      'Share Nexus with 3 friends and earn ₪100 for yourself. Your friends get an extra 5% cashback on their first ₪500.',
  },
  orgs: {
    switchLabel: 'הפניית ארגונים',
    switchLabelEn: 'Refer organizations',
    rewardLine: '1,000 ₪',
    subtitle:
      'מכירים מנהל.ת רווחה, HR או כספים? הפנו את הארגון שלהם ל-Nexus והרוויחו 1,000 ₪ לעצמכם. הארגון מקבל ליווי מלא בהטמעה.',
    subtitleEn:
      'Know a welfare, HR or finance manager? Refer their organization to Nexus and earn ₪1,000 for yourself. The organization gets full onboarding support.',
  },
};

export default function ReferralPromoCard() {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track>('friends');
  const c = CONTENT[track];

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className="px-4">
      {/* Track switch — friends vs organisations. Same compact glass pill as
          the referral page's, moved above the card: there it floats over the
          content, which only works because that page owns the whole screen. */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-md border border-[#e2e8f0] shadow-sm p-0.5">
          {TRACKS.map((id) => {
            const selected = track === id;
            return (
              <button
                key={id}
                onClick={() => setTrack(id)}
                aria-pressed={selected}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
                  selected ? 'bg-[#0a2540] text-white shadow-sm' : 'text-[#5d7079]'
                }`}
              >
                {isRTL ? CONTENT[id].switchLabel : CONTENT[id].switchLabelEn}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0a2540] rounded-[40px] p-8 flex flex-col items-center text-center relative overflow-hidden">
        <h2
          className="text-[#7dd3fc] font-black leading-tight mb-6 tracking-tighter"
          style={{ fontSize: '2.6rem' }}
        >
          <span className="inline-flex items-center gap-2 align-middle">
            <span>{isRTL ? 'שתפו את' : 'Share'}</span>
            <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1.5 overflow-hidden">
              <img
                src="/nexus-logo-black.png"
                alt="Nexus"
                className="h-8 w-auto object-contain"
                style={{ transform: 'scale(1.5)' }}
              />
            </span>
          </span>
          <br />
          {isRTL ? 'והרוויחו' : 'and earn'}
          <br />
          {c.rewardLine}
        </h2>

        <p className="text-white text-base font-medium leading-relaxed mb-12">
          {isRTL ? c.subtitle : c.subtitleEn}
        </p>

        {/* Invite illustration — overlapping avatars with an "add" badge. */}
        <div className="relative bg-white rounded-[40px] px-8 py-6 mb-12 flex justify-center items-center">
          <div className="flex -space-x-4 relative">
            {AVATARS.map((src, i) => (
              <img
                key={i}
                alt=""
                aria-hidden
                className="w-16 h-16 rounded-full object-cover border-2 border-white"
                src={src}
                loading="lazy"
              />
            ))}
            <div className="absolute -top-1 -right-2 w-8 h-8 bg-[#7dd3fc] rounded-full border-2 border-white flex items-center justify-center text-[#0a2540]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.5v15m7.5-7.5H4.5M12 4.5a3 3 0 110 6 3 3 0 110-6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer — the page's "learn more" row (label + circled arrow)
            instead of the referral page's copy-link field: the invite link is
            personal and only exists once you have an account, so on a public
            explainer it belongs behind the referral page, not printed here. */}
        <button
          onClick={() => navigate(`/${lang}/referral-stories`)}
          className="w-full mt-auto flex items-center justify-between active:opacity-80 transition-opacity"
        >
          <span className="text-sm font-medium text-white/70">
            {isRTL ? 'למד עוד' : 'Learn more'}
          </span>
          <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-white/90 block" style={{ fontSize: 22 }}>
              {isRTL ? 'arrow_back' : 'arrow_forward'}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
