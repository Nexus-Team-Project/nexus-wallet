import { User, Bell, Globe, HelpCircle, Info, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';

export default function MenuList() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const logout = useAuthStore((s) => s.logout);
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  const handleLogout = () => {
    logout();
    navigate(`/${lang || 'he'}`, { replace: true });
  };

  const menuItems = [
    { icon: User, label: t.profile.editProfile, action: () => navigate(`/${lang}/profile/edit`) },
    { icon: Bell, label: t.profile.notifications, action: () => {} },
    {
      icon: Globe,
      label: t.profile.language,
      action: () => setLanguage(language === 'he' ? 'en' : 'he'),
      detail: language === 'he' ? 'עברית' : 'English',
    },
    { icon: HelpCircle, label: t.profile.help, action: () => {} },
    { icon: Info, label: t.profile.about, action: () => {} },
  ];

  return (
    <div className="space-y-3">
      <Card padding="none">
        {menuItems.map(({ icon: Icon, label, action, detail }, index) => (
          <button
            key={label}
            onClick={action}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3.5 hover:bg-surface transition-colors text-start',
              index < menuItems.length - 1 && 'border-b border-border/50'
            )}
          >
            <Icon size={20} className="text-text-secondary flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
            {detail && <span className="text-xs text-text-secondary">{detail}</span>}
            <Arrow size={16} className="text-text-muted flex-shrink-0" />
          </button>
        ))}
      </Card>

      <Card padding="none">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-error/5 transition-colors text-start"
        >
          <LogOut size={20} className="text-error flex-shrink-0" />
          <span className="text-sm font-medium text-error">{t.profile.logout}</span>
        </button>
      </Card>

      <p className="text-center text-xs text-text-muted pt-2">
        {t.profile.version} 1.0.0
      </p>
    </div>
  );
}
