import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

interface BusinessActionBarProps {
  business: Business;
}

interface ActionItem {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function BusinessActionBar({ business }: BusinessActionBarProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isHe ? business.nameHe : business.name,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    }
  };

  const actions: ActionItem[] = [];

  if (business.phone) {
    actions.push({
      icon: 'call',
      label: t.business.call,
      onClick: () => window.open(`tel:${business.phone}`),
    });
  }

  if (business.website) {
    actions.push({
      icon: 'language',
      label: t.business.visitWebsite,
      onClick: () => window.open(business.website!, '_blank'),
    });
  }

  if (business.whatsapp) {
    actions.push({
      icon: 'chat',
      label: 'WhatsApp',
      onClick: () => window.open(`https://wa.me/${business.whatsapp}`),
    });
  }

  // Share always available
  actions.push({
    icon: 'share',
    label: t.business.share,
    onClick: handleShare,
  });

  return (
    <div className="bg-white border-b border-border/50 py-4 px-6">
      <div className={`flex ${actions.length <= 2 ? 'justify-center' : 'justify-around'} gap-4`}>
        {actions.map((action) => (
          <button
            key={action.icon}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
                {action.icon}
              </span>
            </div>
            <span className="text-[10px] font-medium text-text-secondary max-w-[60px] text-center line-clamp-1">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
