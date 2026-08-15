import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import TopBar from '../components/layout/TopBar';
import GiftCardsCarousel from '../components/onboarding/GiftCardsCarousel';

/** Navy brand tone used for the headline + primary CTA (matches PaymentIntroPage). */
const NAVY = '#0a153f';

/**
 * Intro page for the "create a deal on your terms" flow. Same Klarna-style
 * layout as the Nexus-balance pay-intro (hero → headline → three points → CTA),
 * but the hero is the onboarding gift-cards 3D carousel. Full-screen: AppLayout
 * suppresses the global chrome for this route so the page owns its own back
 * button and footer CTA.
 */
export default function DealIntroPage() {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const features = [
    {
      icon: 'savings',
      title: isRTL ? 'מקסמו כל תשלום עם עד 60% קאשבק' : 'Maximize every payment with up to 60% cashback',
      body: isRTL
        ? 'בחרו את תנאי השובר בהתאם למבצעים בחנות, שלמו וצברו כסף בחזרה ליתרת ה-Nexus שלכם.'
        : 'Set the voucher terms to match the deals in store, pay, and earn money back into your Nexus balance.',
    },
    {
      icon: 'storefront',
      title: isRTL ? 'מאות מותגים שאתם אוהבים' : 'Hundreds of brands you love',
      body: isRTL
        ? 'שלמו במותגים מובילים, והמשיכו לצבור קאשבק שוב ושוב — גם כשאתם משתמשים בקאשבק שכבר צברתם.'
        : 'Pay at leading brands, and keep earning cashback again and again — even when you spend the cashback you already earned.',
    },
    {
      icon: 'credit_card',
      title: isRTL ? 'נהנים מכל העולמות' : 'The best of both worlds',
      body: isRTL
        ? 'מצרפים את כרטיס האשראי האישי לתוך Nexus ונהנים גם מההטבות שלנו וגם מההטבות של כרטיס האשראי שלכם.'
        : 'Link your personal credit card to Nexus and enjoy both our benefits and your card’s benefits.',
    },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Brand strip — own back button (AppLayout suppresses the global chrome).
          Floated as a zero-height overlay so the hero reaches the top. */}
      <div className="relative z-20 h-0 overflow-visible">
        <TopBar collapsed={false} showBack hideGreeting />
      </div>

      <main className="flex-grow overflow-y-auto px-6">
        {/* Hero — the onboarding gift-cards 3D carousel on a soft brand glow */}
        {/* No overflow-hidden here: the front card pulses (scale 1.15) and its
            shadow must spill past the stage without a clipped edge. Extra bottom
            padding keeps that shadow clear of the headline below. */}
        <section className="relative -mx-6 pt-4 pb-0">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(156,136,255,0.18) 0%, rgba(128,222,234,0.12) 45%, rgba(255,255,255,0) 75%)',
            }}
          />
          <div className="relative z-[1]">
            <GiftCardsCarousel height={250} showNotifications={false} />
          </div>
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        </section>

        {/* Headline */}
        <section className="text-center -mt-2 mb-7">
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight" style={{ color: NAVY }}>
            {isRTL ? 'צרו שובר' : 'Create a voucher'}
            <br />
            {isRTL ? 'בתנאים שלכם' : 'on your terms'}
          </h1>
        </section>

        {/* Three points — same structure as the balance pay-intro */}
        <section className="space-y-4 mb-12">
          {features.map((f, i) => (
            <div key={f.icon}>
              <div className="flex items-start gap-4">
                <span
                  className="material-symbols-outlined flex-shrink-0 mt-0.5"
                  style={{ fontSize: '26px', color: NAVY }}
                >
                  {f.icon}
                </span>
                <div>
                  <h3 className="font-bold text-[17px]" style={{ color: NAVY }}>
                    {f.title}
                  </h3>
                  <p className="text-text-secondary text-[15px] leading-relaxed">{f.body}</p>
                </div>
              </div>
              {i < features.length - 1 && <hr className="border-gray-100 mt-4" />}
            </div>
          ))}
        </section>
      </main>

      {/* Footer actions */}
      <footer className="p-6 pb-10 space-y-3 bg-white">
        <div
          className="p-1 rounded-[28px]"
          style={{ border: '2px solid #3B82F6', boxShadow: '0 0 10px rgba(59,130,246,0.2)' }}
        >
          <button
            onClick={() => navigate(`/${lang}/store`)}
            className="w-full text-white font-bold py-4 rounded-[24px] text-[17px] active:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
          >
            {isRTL ? 'בואו נתחיל' : 'Get started'}
          </button>
        </div>
        {/* "איך זה עובד?" → the how-to-create-a-voucher stories sequence */}
        <button
          onClick={() => navigate(`/${lang}/wallet/voucher-stories`)}
          className="w-full bg-white border border-gray-300 font-bold py-4 rounded-[28px] text-[17px] active:bg-gray-50 transition-colors"
          style={{ color: NAVY }}
        >
          {isRTL ? 'איך זה עובד?' : 'How it works'}
        </button>
      </footer>
    </div>
  );
}
