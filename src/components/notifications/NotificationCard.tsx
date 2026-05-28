import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDate } from '../../utils/formatDate';
import { cn } from '../../utils/cn';
import { CATEGORY_ICON, PRIORITY_DOT } from './notificationMeta';
import type { Notification } from '../../types/notification.types';

interface NotificationCardProps {
  notification: Notification;
}

export default function NotificationCard({ notification: n }: NotificationCardProps) {
  const { language, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const [imgError, setImgError] = useState(false);

  const title = language === 'he' ? n.titleHe : n.title;
  const body = language === 'he' ? n.bodyHe : n.body;
  const { icon: catIcon, color: catColor } = CATEGORY_ICON[n.category];
  const dotColor = PRIORITY_DOT[n.priority];

  // When the notification has a subject (business/product), the avatar
  // shows that subject. Otherwise the sender takes the avatar slot. The
  // Nexus platform sender gets a special black + white-ring treatment
  // mirroring the wallet QR card so it reads as "from us, not a brand".
  const hasSubject = !!n.subject;
  const isNexusAvatar = !hasSubject && n.sender.id === 'nexus';
  const displayName = hasSubject
    ? (language === 'he' ? n.subject!.nameHe : n.subject!.name)
    : (language === 'he' ? n.sender.nameHe : n.sender.name);
  const avatarImage = hasSubject ? n.subject!.imageUrl : n.sender.logo;
  const avatarFallback = hasSubject
    ? (n.subject!.fallback ?? n.subject!.nameHe.charAt(0))
    : n.sender.initial;
  const avatarColor = hasSubject
    ? 'bg-surface text-text-primary'
    : (n.sender.brandColor ?? 'bg-surface text-text-primary');

  const handleClick = () => {
    if (n.deepLink) navigate(`/${lang}${n.deepLink}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-start bg-white rounded-2xl p-4 flex gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-transform',
        !n.isRead && 'ring-1 ring-primary/10',
      )}
    >
      {/* Subject (or sender) avatar with a small category badge tucked
          into the corner. Image loads with an emoji fallback if the URL
          fails or is absent. */}
      <div className="flex-shrink-0 relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold text-base',
            // Nexus disc is tighter — the logo nearly fills it, with
            // only the 2px white border as breathing room. Other senders
            // use the full 44px to align with the rest of the card.
            isNexusAvatar ? 'w-10 h-10' : 'w-11 h-11',
            !isNexusAvatar && 'overflow-hidden',
            avatarColor,
            isNexusAvatar && 'shadow-md border-2 border-white',
          )}
        >
          {avatarImage && !imgError ? (
            <img
              src={avatarImage}
              alt={displayName}
              className={cn(
                'rounded-full',
                // Slightly larger than the QR card's centre — w-9 fills
                // more of the disc so the swirl reads at a glance, while
                // the white border + shadow still frame it cleanly.
                isNexusAvatar ? 'w-9 h-9 object-cover' : 'w-full h-full object-cover',
              )}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-lg leading-none">{avatarFallback}</span>
          )}
        </div>
        <div
          className={cn(
            'absolute -bottom-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white',
            catColor,
            isRTL ? '-start-0.5' : '-end-0.5',
          )}
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
          >
            {catIcon}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="text-[13px] font-bold text-text-primary leading-tight truncate">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-text-muted font-medium whitespace-nowrap">
              {formatDate(n.createdAt, locale)}
            </span>
            {!n.isRead && <span className={cn('w-2 h-2 rounded-full', dotColor)} />}
          </div>
        </div>
        <p className="text-[13px] font-semibold text-text-primary leading-tight mb-1 truncate">
          {title}
        </p>
        <p className="text-[12px] text-text-secondary leading-snug line-clamp-2">{body}</p>
      </div>
    </button>
  );
}
