/**
 * ReferralStoriesPage — the Wise referral flow, reproduced from the provided
 * design. Three screens combined into one vertically-scrolling page:
 *   1. Promo card  (SHARE NEXUS AND EARN …)
 *   2. Invite illustration
 *   3. Important information + action links
 *
 * Two referral tracks share the layout, picked by the segmented switch above
 * the CTA (same pattern as the billing switch on PremiumPage):
 *   • friends — ₪100 for 3 friends; each friend gets +5% cashback on their
 *     first ₪500. Self-funding: the 3 friends push ₪1,500 of qualifying spend
 *     through the platform before the ₪100 is released.
 *   • orgs    — ₪1,000 for referring an organisation, released when that org
 *     buys an annual wallet plan or sends >₪100,000 of budget through Nexus.
 *
 * Reached from the home ReferralBanner (route: /:lang/referral-stories).
 */

import { useRef, useState } from 'react';
import TopBar from '../components/layout/TopBar';
import { cn } from '../utils/cn';

// Stylish, well-lit portrait photos with a deliberate mix of women and men —
// younger / editorial look. Sourced from Unsplash's CDN (stable, hot-linkable),
// face-cropped to square so they sit cleanly in the avatar circles.
const AV = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&crop=faces&q=80`;

const AVATARS_1 = [
  AV('1494790108377-be9c29b29330'), // woman, warm smile
  AV('1500648767791-00dcc994a43e'), // man, beard
  AV('1534528741775-53994a69daeb'), // woman, curly hair
];

const AVATARS_2 = [
  AV('1517841905240-472988babdf9'), // woman
  AV('1506794778202-cad84cf45f1d'), // man
  AV('1544005313-94ddf0286df2'), // woman
];

const PARTNERSHIP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCtLVoYU4uIPyfE0cvRMndHu6J32CJ2e6VIGjEHZ6fn2b03_IhSLgS6ZRFabahbBC_hyiLl-mj_bEDoqEzW87EP5ffSbIoqrCbH6qQzePJJ59WzeVOfvqMeEYn4Fi7RB-FrfH5FRMIJLrKK0NPLDKZlT1VQrTE801x4M18ojL10F8wB34gVuAvoWavMCwvIfasZ8YX8ux1BV_HsY6UihT3gTnfAXjEJPiI0gJh5YKU20Fnxnu_4W2sWy_pipmzRH7K_5dysOZnsZBI';

// ═══════════════════════ Track definitions ═══════════════════════

type Track = 'friends' | 'orgs';

/** One bullet in the "מידע חשוב" list. `ok` picks the navy check vs red X. */
type InfoItem = { ok: boolean; text: React.ReactNode };

type TrackContent = {
  switchLabel: string;
  /** Headline reward, rendered after "שתפו את [Nexus] והרוויחו". */
  rewardLine: string;
  subtitle: string;
  inviteUrl: string;
  /** Masked link shown inside the promo card's copy field. */
  inviteDisplay: string;
  screen2Title: string;
  screen2Body: string;
  /** Hidden for orgs — the paid-partnership pitch IS the org track. */
  showPartnershipBanner: boolean;
  info: InfoItem[];
  shareText: string;
};

const CONTENT: Record<Track, TrackContent> = {
  friends: {
    switchLabel: 'הפניית חברים',
    rewardLine: '100 ₪',
    subtitle:
      'שתפו את Nexus עם 3 חברים והרוויחו 100 ₪ לעצמכם. החברים שלכם מקבלים אקסטרה 5% קאשבק על 500 השקלים הראשונים שלהם.',
    inviteUrl: 'https://nexus.app/invite/ihpc',
    inviteDisplay: 'nexus.app/invite/ihpc/********',
    screen2Title: 'הזמינו 3 חברים',
    screen2Body:
      'תקבלו תגמול על כל 3 חברים שנרשמים דרך הקישור הייחודי שלכם. תוכלו לעקוב אחר ההתקדמות בכל רגע.',
    showPartnershipBanner: true,
    info: [
      {
        ok: true,
        text: 'כל אחד מהחברים שלכם יצטרך להעביר ו/או להוציא בכרטיס Nexus לפחות 500 ₪ . אפשר להגיע לסכום הזה במספר עסקאות.',
      },
      { ok: false, text: 'רכישת כרטיסים רב-מותגיים וקרובי-מזומן אינה נספרת.' },
      {
        ok: false,
        text: (
          <>
            משיכות כספומט, הימורים, קריפטו ו
            <a className="underline font-semibold underline-offset-2" href="#">
              תשלומים מסוימים נוספים
            </a>{' '}
            אינם נספרים.
          </>
        ),
      },
    ],
    shareText: 'הצטרפו אליי ל-Nexus וקבלו 5% קאשבק על 500 ₪ הראשונים שלכם:',
  },
  orgs: {
    switchLabel: 'הפניית ארגונים',
    rewardLine: '1,000 ₪',
    subtitle:
      'מכירים מנהל.ת רווחה, HR או כספים? הפנו את הארגון שלהם ל-Nexus והרוויחו 1,000 ₪ לעצמכם. הארגון מקבל ליווי מלא בהטמעה.',
    inviteUrl: 'https://nexus.app/invite/org/ihpc',
    inviteDisplay: 'nexus.app/invite/org/ihpc/********',
    screen2Title: 'מספיק ארגון אחד',
    screen2Body:
      'אין צורך במספר הפניות — תגמול מלא על הארגון הראשון שמצטרף דרך הקישור שלכם. תוכלו לעקוב אחר סטטוס ההפניה בכל רגע.',
    showPartnershipBanner: false,
    info: [
      {
        ok: true,
        text: 'התגמול משתלם כשהארגון רוכש תוכנית שנתית של הארנק.',
      },
      {
        ok: true,
        text: 'לחלופין — כשהארגון מעביר תקציב של מעל 100,000 ₪ דרך המערכת. אפשר להגיע לסכום הזה במספר טעינות במהלך השנה.',
      },
      {
        ok: false,
        text: 'ארגון שכבר נמצא בתהליך מול Nexus או שהיה לקוח בעבר אינו נספר.',
      },
      {
        ok: false,
        text: 'הארגון שאתם מועסקים בו אינו נספר.',
      },
    ],
    shareText: 'הכירו את Nexus — ארנק ההטבות לארגונים. אשמח לחבר ביניכם:',
  },
};

// ═══════════ Screen 1 — Promo card ═══════════
function Screen1({ c }: { c: TrackContent }) {
  return (
    <section className="w-full flex flex-col bg-white">
      {/* Main Promotion Card */}
      <main className="flex-grow p-4 flex flex-col">
        <section className="flex-grow bg-[#0a2540] rounded-[40px] p-8 flex flex-col items-center text-center relative overflow-hidden">
          <h1 className="text-[#7dd3fc] text-4xl font-black leading-tight mb-6 tracking-tighter" style={{ fontSize: '2.6rem' }}>
            <span className="inline-flex items-center gap-2 align-middle">
              <span>שתפו את</span>
              <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1.5 overflow-hidden">
                <img src="/nexus-logo-black.png" alt="Nexus" className="h-8 w-auto object-contain" style={{ transform: 'scale(1.5)' }} />
              </span>
            </span>
            <br />והרוויחו<br />{c.rewardLine}
          </h1>
          <p className="text-white text-base font-medium leading-relaxed mb-12">
            {c.subtitle}
          </p>

          <div className="relative bg-white rounded-[40px] px-8 py-6 mb-12 flex justify-center items-center">
            <div className="flex -space-x-4 relative">
              {AVATARS_1.map((src, i) => (
                <img key={i} alt={`Friend ${i + 1}`} className="w-16 h-16 rounded-full object-cover border-2 border-white" src={src} />
              ))}
              <div className="absolute -top-1 -right-2 w-8 h-8 bg-[#7dd3fc] rounded-full border-2 border-white flex items-center justify-center text-[#0a2540]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.5v15m7.5-7.5H4.5M12 4.5a3 3 0 110 6 3 3 0 110-6z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>

          <div className="w-full mt-auto text-right">
            <label className="text-white text-sm block mb-2 font-medium">שתפו את הקישור שלכם</label>
            <div className="border border-white/50 rounded-2xl p-1 pr-4 flex items-center justify-between bg-transparent">
              <span className="text-[#7dd3fc] text-sm truncate pl-2" dir="ltr">{c.inviteDisplay}</span>
              <button className="bg-[#7dd3fc] text-[#0a2540] px-6 py-2 rounded-xl font-bold text-sm">העתקה</button>
            </div>
          </div>
        </section>
      </main>
    </section>
  );
}

// ═══════════ Screen 2 — Invite illustration ═══════════
function Screen2({ c }: { c: TrackContent }) {
  return (
    <section className="w-full bg-white">
      <main className="px-4 pb-8">
        <section className="mt-8 flex flex-col items-center text-center">
          <div className="relative mb-10">
            <div className="bg-[#f2f2f7] rounded-full pr-6 pl-2 py-2 inline-flex items-center">
              <div className="flex -space-x-4">
                {AVATARS_2.map((src, i) => (
                  <img key={i} alt={`Friend ${i + 1}`} className="inline-block h-24 w-24 rounded-full ring-4 ring-[#f2f2f7] object-cover" src={src} />
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-2 bg-[#7dd3fc] p-2.5 rounded-full shadow-md">
              <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 13V11a2 2 0 00-2-2H6a2 2 0 00-2 2v10m16 0H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
            </div>
          </div>
          <h2 className="text-[32px] text-[#0a2540]" style={{ fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {c.screen2Title}
          </h2>
          <p className="mt-4 text-gray-600 text-base leading-relaxed px-4">
            {c.screen2Body}
          </p>
        </section>
      </main>
    </section>
  );
}

// ═══════════ Screen 3 — Important information ═══════════
function Screen3({ c }: { c: TrackContent }) {
  return (
    <section className="w-full bg-white text-[#0a2540]">
      <main className="px-5 pt-4 pb-8">
        {/* Partnership Banner */}
        {c.showPartnershipBanner && (
          <div className="relative bg-[#f2f5f7] rounded-2xl p-4 flex items-start space-x-4 mb-10 overflow-hidden">
            <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-green-300 rounded-lg relative overflow-hidden flex items-center justify-center">
              <img alt="Partnership Illustration" className="object-cover w-full h-full opacity-90" src={PARTNERSHIP_IMG} />
            </div>
            <div className="flex-1 pl-6 pt-1">
              <p className="text-sm font-semibold text-[#0a2540] leading-tight mb-2">רוצים לקבל תשלום על קידום Nexus?</p>
              <a className="text-sm font-bold text-[#0a2540] underline decoration-1 underline-offset-4" href="#">גלו שותפויות</a>
            </div>
            <button aria-label="Dismiss banner" className="absolute top-3 left-3 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}

        {/* Important Information */}
        <section>
          <h2 className="text-[#5d7079] text-base font-normal mb-1">מידע חשוב</h2>
          <hr className="border-[#e2e8f0] mb-6" />
          <ul className="space-y-6 mb-10">
            {c.info.map((item, i) => (
              <li key={i} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className={cn('rounded-full p-0.5', item.ok ? 'bg-[#0a2540]' : 'bg-[#c33737]')}>
                    {item.ok ? (
                      <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" fillRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    )}
                  </div>
                </div>
                <p className="text-[15px] leading-snug text-[#0a2540]">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Action Links */}
        <div className="space-y-6">
          <a className="block text-[#0a2540] font-bold text-base underline decoration-1 underline-offset-4" href="#">הזנת קישור הזמנה</a>
          <a className="block text-[#0a2540] font-bold text-base underline decoration-1 underline-offset-4" href="#">איך תוכנית ההזמנות עובדת?</a>
          <a className="block text-[#0a2540] font-bold text-base underline decoration-1 underline-offset-4" href="#">תנאים והגבלות</a>
        </div>
      </main>
    </section>
  );
}

async function handleShare(c: TrackContent) {
  const nav = navigator as Navigator & {
    contacts?: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<unknown[]> };
  };

  // 1) Open the phone's contact picker (asks permission to access contacts).
  //    Supported on Chrome for Android over HTTPS.
  if (nav.contacts?.select) {
    try {
      await nav.contacts.select(['name', 'tel'], { multiple: true });
      return;
    } catch {
      // user cancelled or picker unavailable — fall through to share sheet
    }
  }

  // 2) Native share sheet (includes Google, WhatsApp, etc.).
  if (nav.share) {
    try {
      await nav.share({ title: 'Nexus', text: c.shareText, url: c.inviteUrl });
      return;
    } catch {
      // user cancelled — fall through to clipboard
    }
  }

  // 3) Last resort: copy the invite link.
  try {
    await navigator.clipboard.writeText(c.inviteUrl);
  } catch {
    /* nothing more we can do */
  }
}

const TRACKS: Track[] = ['friends', 'orgs'];

export default function ReferralStoriesPage() {
  const [track, setTrack] = useState<Track>('friends');
  const scrollRef = useRef<HTMLDivElement>(null);
  const c = CONTENT[track];

  // Switching track swaps the whole page copy, so send the reader back to the
  // promo card instead of leaving them mid-way through the other track.
  const pickTrack = (next: Track) => {
    setTrack(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 max-w-md mx-auto bg-white z-[100] flex flex-col" dir="rtl">
      {/* Scroll area — the user-icon strip is the FIRST item INSIDE here, in
          normal flow (not pinned). So as the user scrolls down it simply
          scrolls up and off the screen and disappears, like any other page
          content. `flex-1 min-h-0` makes this the single scrolling region.
          Only the bottom action stack below stays fixed. */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-40"
        style={{ overscrollBehavior: 'contain' }}
      >
        <TopBar showBack />
        <Screen1 c={c} />
        <Screen2 c={c} />
        <Screen3 c={c} />
      </div>

      {/* Floating action area — overlays the scrolling content with a fully
          transparent background (no white panel behind it). The wrapper passes
          touches through; only the controls themselves are interactive. */}
      <div className="absolute bottom-0 inset-x-0" style={{ padding: '12px 24px 24px', pointerEvents: 'none' }}>
        {/* Track switch — friends vs organisations. Same compact glass pill as
            the billing switch on PremiumPage, recoloured to this page's navy. */}
        <div className="flex justify-center mb-3">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-md border border-[#e2e8f0] shadow-sm p-0.5">
            {TRACKS.map((id) => {
              const selected = track === id;
              return (
                <button
                  key={id}
                  onClick={() => pickTrack(id)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all',
                    selected ? 'bg-[#0a2540] text-white shadow-sm' : 'text-[#5d7079]',
                  )}
                >
                  {CONTENT[id].switchLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Share CTA — navy fill, white text, Nexus logo chip on sky-blue,
            matching the dark pill CTA on the business page. */}
        <button
          onClick={() => handleShare(c)}
          className="pointer-events-auto relative w-full overflow-hidden bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 flex items-center justify-center gap-1.5"
        >
          <span>שתפו את</span>
          <span className="inline-flex items-center bg-sky-300 rounded-xl px-3 py-1 overflow-hidden" style={{ transform: 'scale(0.873)' }}>
            <img
              src="/nexus-logo-black.png"
              alt="Nexus"
              className="h-7 w-auto object-contain"
              style={{ transform: 'scale(1.373)' }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
