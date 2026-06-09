import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { useTenantStore } from '../stores/tenantStore';
import { useWallpaperStore } from '../stores/wallpaperStore';

/**
 * WalletActionsPage — a dedicated "all actions" gallery.
 *
 * Reached from the "עוד" button on the wallet's widgets section. Lays out
 * every action the app exposes as a circular icon, three per row, grouped
 * into labelled sections (payments / offers / my account). Tapping a
 * circle navigates to the relevant route.
 */

interface ActionDef {
  /** Emoji rendered inside the disk (native colour glyph). */
  emoji: string;
  he: string;
  en: string;
  /** Route relative to the language prefix, e.g. "wallet/add-money". */
  route: string;
}

interface ActionGroup {
  he: string;
  en: string;
  actions: ActionDef[];
}

const GROUPS: ActionGroup[] = [
  {
    he: 'תשלומים וארנק',
    en: 'Payments & wallet',
    actions: [
      { emoji: '🏪', he: 'שלם בחנות', en: 'Pay in store', route: 'wallet/pay-intro' },
      { emoji: '➕', he: 'טעינת כסף', en: 'Add money', route: 'wallet/add-money' },
      { emoji: '💳', he: 'אמצעי תשלום', en: 'Payment methods', route: 'wallet/payment-methods' },
      { emoji: '🧾', he: 'היסטוריה', en: 'History', route: 'wallet/history' },
      { emoji: '🎴', he: 'הנפקת כרטיס', en: 'Issue a card', route: 'card-issuance' },
      { emoji: '📊', he: 'תובנות', en: 'Insights', route: 'insights' },
    ],
  },
  {
    he: 'הטבות וחנות',
    en: 'Offers & store',
    actions: [
      { emoji: '🏷️', he: 'מבצעים', en: 'Offers', route: 'store' },
      { emoji: '📍', he: 'קרוב אליי', en: 'Near you', route: 'near-you-map' },
      { emoji: '🗺️', he: 'מפת הטבות', en: 'Offers map', route: 'map-demo' },
      { emoji: '🎁', he: 'השוברים שלי', en: 'My vouchers', route: 'wallet' },
      { emoji: '📖', he: 'סטוריז', en: 'Stories', route: 'stories' },
      { emoji: '🧑‍🤝‍🧑', he: 'הזמנת חברים', en: 'Invite friends', route: 'referral-stories' },
    ],
  },
  {
    he: 'החשבון שלי',
    en: 'My account',
    actions: [
      { emoji: '👤', he: 'הפרופיל שלי', en: 'My profile', route: 'profile' },
      { emoji: '🏟️', he: 'הארגון שלי', en: 'My organization', route: 'profile' },
      { emoji: '📈', he: 'הפעילות שלי', en: 'My activity', route: 'activity' },
      { emoji: '🔔', he: 'התראות', en: 'Notifications', route: 'notifications' },
      { emoji: '🎨', he: 'רקע הארנק', en: 'Wallpaper', route: 'wallpaper' },
      { emoji: '⚙️', he: 'התאמת הארנק', en: 'Customize wallet', route: 'wallet/customize' },
      { emoji: '💬', he: 'עוזר חכם', en: 'AI assistant', route: 'chat' },
    ],
  },
];

export default function WalletActionsPage() {
  const { language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const tenantConfig = useTenantStore((s) => s.config);
  // Same signature brand gradient backdrop as the wallet page — follows
  // the user's chosen wallpaper when set, else the signature rainbow.
  const wallpaperBg = useWallpaperStore((s) => s.selectedBackground);
  const isHe = language === 'he';

  return (
    <div
      className="relative min-h-dvh bg-white flex flex-col max-w-md mx-auto pt-24 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative brand gradient — anchored at the top hero area. */}
      <div
        aria-hidden
        className={`absolute top-0 inset-x-0 pointer-events-none z-0 ${
          wallpaperBg ? 'h-[480px]' : 'h-[280px]'
        }`}
      >
        <div
          className={`w-full h-full ${wallpaperBg ? 'opacity-[0.55]' : 'opacity-[0.12]'}`}
          style={{
            background:
              wallpaperBg ??
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
            // Gradually fade the gradient out toward the bottom so it melts
            // into the white page instead of ending in a hard edge.
            maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <main className="relative z-10 flex-grow px-5 pb-10">
        <h1 className="text-2xl font-bold text-text-primary mb-1 mt-2">
          {isHe ? 'כל הפעולות' : 'All actions'}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {isHe ? 'כל מה שאפשר לעשות באפליקציה, במקום אחד' : 'Everything you can do in the app, in one place'}
        </p>

        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.en}>
              <h2 className="text-sm font-bold text-text-secondary mb-4">
                {isHe ? group.he : group.en}
              </h2>
              <div className="grid grid-cols-3 gap-y-5 gap-x-2">
                {group.actions.map((action) => {
                  const label = isHe ? action.he : action.en;
                  // The "My organization" tile shows the real tenant logo on a
                  // brand-coloured disk when one is configured.
                  const isOrg = action.route === 'profile' && action.emoji === '🏟️';
                  const showLogo = isOrg && !!tenantConfig?.logo;
                  return (
                    <button
                      key={`${action.route}-${action.emoji}`}
                      type="button"
                      onClick={() => navigate(`/${lang}/${action.route}`)}
                      aria-label={label}
                      className="flex flex-col items-center gap-2 active:opacity-80"
                    >
                      <span
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border overflow-hidden"
                        style={{
                          backgroundColor: showLogo
                            ? tenantConfig?.primaryColor ?? 'var(--color-surface)'
                            : 'var(--color-surface)',
                        }}
                      >
                        {showLogo ? (
                          <motion.img
                            src={tenantConfig!.logo}
                            alt={label}
                            className="w-11 h-11 object-contain"
                            whileTap={{ scale: 1.15, y: -3 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                          />
                        ) : (
                          <motion.span
                            className="inline-block"
                            style={{ fontSize: '30px', lineHeight: 1 }}
                            whileTap={{ scale: 1.15, y: -3 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                          >
                            {action.emoji}
                          </motion.span>
                        )}
                      </span>
                      <span className="text-[12px] font-medium text-text-secondary leading-tight text-center line-clamp-2">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
