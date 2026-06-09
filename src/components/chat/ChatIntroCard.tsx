import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';

// Welcome / intro card for the chat — small circular icon on the AI side
// followed by a white bubble with a bold title and a short description line.
// Uses the tenant name + logo when a tenant is active, otherwise Nexus.
export default function ChatIntroCard() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const tenantConfig = useTenantStore((s) => s.config);

  const brandName = tenantConfig
    ? (isHe ? tenantConfig.nameHe ?? tenantConfig.name : tenantConfig.name)
    : 'Nexus';
  const logoSrc = tenantConfig?.logo ?? '/nexus-logo.png';

  const title = isHe ? `ברוכים הבאים ל-${brandName}` : `Welcome to ${brandName}`;
  const description = isHe
    ? 'אני Nexus — כאן כדי לעזור לך למצוא את ההטבה הכי שווה בשבילך.'
    : "I'm Nexus — here to help you find the best deal tailored to you.";

  return (
    <div className="flex items-start gap-3 px-5 py-2 flex-row-reverse">
      {/* Small circular brand avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
        <img
          src={logoSrc}
          alt={brandName}
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* White bubble */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 max-w-[85%]">
        <h4 className="text-sm font-bold text-text-primary leading-snug">
          {title}
        </h4>
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
}
