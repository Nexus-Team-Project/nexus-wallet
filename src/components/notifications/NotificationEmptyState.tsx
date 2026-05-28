import { useLanguage } from '../../i18n/LanguageContext';

// Mailbox illustration matching the design — a blue post-mounted mailbox
// with a red raised flag and a white check inside, rendered with divs +
// gradients so it stays crisp at any size and tracks the theme color.
function MailboxIllustration() {
  return (
    <div className="relative w-32 h-32" aria-hidden="true">
      {/* Vertical post */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-10 bg-indigo-700 rounded-sm" />
      {/* Mailbox body */}
      <div
        className="absolute top-4 left-0 w-full h-24 rounded-xl shadow-md overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #8E9AFE 0%, #4B5EFC 100%)' }}
      >
        {/* Interior shadow */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-black/10" />
        {/* Check */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      {/* Raised red flag */}
      <div className="absolute top-0 right-4 w-4 h-10 flex flex-col items-center">
        <div className="w-1 h-8 bg-indigo-900" />
        <div className="w-4 h-3 bg-red-500 rounded-sm -mt-8 translate-x-1" />
      </div>
    </div>
  );
}

export default function NotificationEmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 text-center py-16">
      <div className="mb-8">
        <MailboxIllustration />
      </div>
      <h2 className="text-[22px] font-bold text-text-primary mb-2">{t.notifications.emptyTitle}</h2>
      <p className="text-[15px] text-text-secondary leading-snug">{t.notifications.emptyBody}</p>
    </div>
  );
}
