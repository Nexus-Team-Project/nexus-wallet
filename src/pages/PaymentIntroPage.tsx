import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import TopBar from '../components/layout/TopBar';

/** Navy brand tone used for the headline + primary CTA. */
const NAVY = '#0a153f';

/**
 * Klarna-style intro page for the in-store payment flow. Reached from
 * the "How it works" button in the pay panel. Full-screen: AppLayout
 * suppresses the global chrome for this route so the page owns its own
 * close button and footer CTA.
 */
export default function PaymentIntroPage() {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const features = [
    { icon: 'account_balance_wallet', title: t.wallet.payIntroFeature1Title, body: t.wallet.payIntroFeature1Body },
    { icon: 'savings', title: t.wallet.payIntroFeature2Title, body: t.wallet.payIntroFeature2Body },
    { icon: 'near_me', title: t.wallet.payIntroFeature3Title, body: t.wallet.payIntroFeature3Body },
  ];

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Brand strip — logo / avatar, chat, bell + back button. Rendered
          inline because AppLayout suppresses the global chrome for this
          full-screen route. Floated as a zero-height overlay so the hero
          hand image still reaches all the way up from the top of the
          screen instead of being pushed down. */}
      <div className="relative z-20 h-0 overflow-visible">
        <TopBar collapsed={false} showBack hideGreeting />
      </div>

      {/* Scrollable content */}
      <main className="flex-grow overflow-y-auto px-6">
        {/* Hero — transparent product render on a soft brand glow */}
        <section className="relative -mx-6 overflow-hidden">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(156,136,255,0.18) 0%, rgba(128,222,234,0.12) 45%, rgba(255,255,255,0) 75%)',
            }}
          />
          <img
            src="/wallet-in-hand.png"
            alt=""
            aria-hidden
            className="relative z-[1] mx-auto h-80 w-auto object-contain"
          />
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        </section>

        {/* Headline */}
        <section className="text-center mt-6 mb-10">
          <h1
            className="text-[32px] leading-tight font-extrabold tracking-tight"
            style={{ color: NAVY }}
          >
            {t.wallet.payIntroTitle}
            <br />
            {t.wallet.payIntroTitleHighlight}
          </h1>
        </section>

        {/* Features list */}
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
                  <p className="text-text-secondary text-[15px] leading-relaxed">
                    {f.body}
                  </p>
                </div>
              </div>
              {i < features.length - 1 && <hr className="border-gray-100 mt-4" />}
            </div>
          ))}
        </section>
      </main>

      {/* Footer actions */}
      <footer className="p-6 pb-10 space-y-3 bg-white">
        {/* Primary CTA with blue glow container */}
        <div
          className="p-1 rounded-[28px]"
          style={{ border: '2px solid #3B82F6', boxShadow: '0 0 10px rgba(59,130,246,0.2)' }}
        >
          <button
            onClick={() => navigate(`/${lang}/wallet`)}
            className="w-full text-white font-bold py-4 rounded-[24px] text-[17px] active:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
          >
            {t.wallet.payIntroGetStarted}
          </button>
        </div>
        {/* Secondary */}
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="w-full bg-white border border-gray-300 font-bold py-4 rounded-[28px] text-[17px] active:bg-gray-50 transition-colors"
          style={{ color: NAVY }}
        >
          {t.wallet.payIntroExplore}
        </button>
      </footer>
    </div>
  );
}
