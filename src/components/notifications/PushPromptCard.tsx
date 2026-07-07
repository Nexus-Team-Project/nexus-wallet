import { useLanguage } from '../../i18n/LanguageContext';

interface PushPromptCardProps {
  onDismiss: () => void;
}

// Visual twin of the home page's "Add to Home Screen" card —
// rounded-[2rem] white card with decorative blurred glows behind the
// icon and a two-button action row. Push notifications are not live yet, so
// both action buttons read "Coming soon" and simply dismiss the card.
export default function PushPromptCard({ onDismiss }: PushPromptCardProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-3 mt-3 mb-3 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
      {/* Close (× icon) */}
      <button
        onClick={onDismiss}
        className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
      </button>

      <div className="flex items-start gap-4 mb-6">
        {/* Bell icon with decorative glows — mirrors the A2HS card's app
            icon treatment so the two cards feel like a family. */}
        <div className="relative flex-shrink-0">
          <div className="absolute -top-3 -left-3 w-16 h-16 bg-purple-500/20 rounded-full blur-xl" />
          <div className="absolute top-1 left-0 w-12 h-12 bg-indigo-500/15 rounded-full blur-lg" />
          <div className="relative w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/60 overflow-hidden flex items-center justify-center -rotate-[10deg]">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '34px', fontVariationSettings: "'FILL' 1" }}
            >
              notifications_active
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 pe-6">
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
            {t.notifications.pushPromptTitle}
          </h2>
          <p className="text-[15px] text-gray-500 leading-snug">
            {t.notifications.pushPromptBody}
          </p>
        </div>
      </div>

      {/* Action buttons — push is not live yet, so both read "Coming soon"
          and just dismiss the card. */}
      <div className="flex gap-3">
        <button
          onClick={onDismiss}
          className="flex-1 py-3.5 bg-[#e5e7eb] text-slate-900 font-semibold rounded-full text-base active:scale-95 transition-transform"
        >
          {t.notifications.comingSoon}
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-3.5 bg-[#0a0a0b] text-white font-semibold rounded-full text-base active:scale-95 transition-transform"
        >
          {t.notifications.comingSoon}
        </button>
      </div>
    </div>
  );
}
