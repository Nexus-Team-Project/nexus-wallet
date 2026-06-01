/**
 * ReferralStoriesPage — the Wise referral flow, reproduced from the provided
 * design. Three screens combined into one horizontally-swipeable page:
 *   1. Promo card  (SHARE WISE AND EARN SGD 100)
 *   2. Invite 3 friends illustration
 *   3. Important information + action links
 *
 * Markup/colours/copy are transcribed verbatim from the supplied HTML. The
 * only structural change: the original `position: fixed` footers are pinned
 * via flex layout instead, so the three slides don't overlap in the pager.
 *
 * Reached from the home ReferralBanner (route: /:lang/referral-stories).
 */

import TopBar from '../components/layout/TopBar';

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

// ═══════════ Screen 1 — Promo card ═══════════
function Screen1() {
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
            <br />והרוויחו<br />100 ₪
          </h1>
          <p className="text-white text-base font-medium leading-relaxed mb-12">
            שתפו את Nexus עם 3 חברים והרוויחו 100 ₪ לעצמכם. החברים שלכם מקבלים אקסטרה 5% קאשבק על 500 השקלים הראשונים שלהם.
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
              <span className="text-[#7dd3fc] text-sm truncate pl-2" dir="ltr">nexus.app/invite/ihpc/********</span>
              <button className="bg-[#7dd3fc] text-[#0a2540] px-6 py-2 rounded-xl font-bold text-sm">העתקה</button>
            </div>
          </div>
        </section>
      </main>
    </section>
  );
}

// ═══════════ Screen 2 — Invite 3 friends ═══════════
function Screen2() {
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
            הזמינו 3 חברים
          </h2>
          <p className="mt-4 text-gray-600 text-base leading-relaxed px-4">
            תקבלו תגמול על כל 3 חברים שנרשמים דרך הקישור הייחודי שלכם. תוכלו לעקוב אחר ההתקדמות בכל רגע.
          </p>
        </section>
      </main>
    </section>
  );
}

// ═══════════ Screen 3 — Important information ═══════════
function Screen3() {
  return (
    <section className="w-full bg-white text-[#0a2540]">
      <main className="px-5 pt-4 pb-8">
        {/* Partnership Banner */}
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

        {/* Important Information */}
        <section>
          <h2 className="text-[#5d7079] text-base font-normal mb-1">מידע חשוב</h2>
          <hr className="border-[#e2e8f0] mb-6" />
          <ul className="space-y-6 mb-10">
            <li className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="bg-[#0a2540] rounded-full p-0.5">
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" fillRule="evenodd" /></svg>
                </div>
              </div>
              <p className="text-[15px] leading-snug text-[#0a2540]">
                כל אחד מהחברים שלכם יצטרך להעביר ו/או להוציא בכרטיס Nexus לפחות 500 ₪ . אפשר להגיע לסכום הזה במספר עסקאות.
              </p>
            </li>
            <li className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="bg-[#c33737] rounded-full p-0.5">
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </div>
              </div>
              <p className="text-[15px] leading-snug text-[#0a2540]">העברות באותו מטבע אינן נספרות.</p>
            </li>
            <li className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="bg-[#c33737] rounded-full p-0.5">
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </div>
              </div>
              <p className="text-[15px] leading-snug text-[#0a2540]">
                משיכות כספומט, הימורים, קריפטו ו<a className="underline font-semibold underline-offset-2" href="#">תשלומים מסוימים נוספים</a> אינם נספרים.
              </p>
            </li>
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

const INVITE_URL = 'https://nexus.app/invite/ihpc';
const INVITE_TEXT = 'הצטרפו אליי ל-Nexus וקבלו 5% קאשבק על 500 ₪ הראשונים שלכם:';

async function handleShare() {
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
      await nav.share({ title: 'Nexus', text: INVITE_TEXT, url: INVITE_URL });
      return;
    } catch {
      // user cancelled — fall through to clipboard
    }
  }

  // 3) Last resort: copy the invite link.
  try {
    await navigator.clipboard.writeText(INVITE_URL);
  } catch {
    /* nothing more we can do */
  }
}

export default function ReferralStoriesPage() {
  return (
    <div className="fixed inset-0 max-w-md mx-auto bg-white z-[100] flex flex-col" dir="rtl">
      {/* Scroll area — the user-icon strip is the FIRST item INSIDE here, in
          normal flow (not pinned). So as the user scrolls down it simply
          scrolls up and off the screen and disappears, like any other page
          content. `flex-1 min-h-0` makes this the single scrolling region.
          Only the bottom action button below stays fixed. */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-28" style={{ overscrollBehavior: 'contain' }}>
        <TopBar showBack />
        <Screen1 />
        <Screen2 />
        <Screen3 />
      </div>

      {/* Floating action button — overlays the scrolling content with a fully
          transparent background (no white panel behind it). Matches the dark
          pill CTA on the business page: navy fill, white text, Nexus logo
          chip on sky-blue. The wrapper passes touches through; only the
          button itself is interactive. */}
      <div className="absolute bottom-0 inset-x-0" style={{ padding: '16px 24px 24px', pointerEvents: 'none' }}>
        <button onClick={handleShare} className="pointer-events-auto relative w-full overflow-hidden bg-bg-dark text-white py-3.5 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 flex items-center justify-center gap-1.5">
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
