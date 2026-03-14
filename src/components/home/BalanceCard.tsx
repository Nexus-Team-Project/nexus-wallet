import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useWallet } from '../../hooks/useWallet';
import { useTenantStore } from '../../stores/tenantStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Skeleton from '../ui/Skeleton';

/** Darken a hex colour by a percentage (0-100). */
function darkenHex(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(2.55 * percent));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * percent));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default function BalanceCard() {
  const { t, language } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { data: wallet, isLoading } = useWallet({ enabled: isAuthenticated });
  const tenantConfig = useTenantStore((s) => s.config);
  const locale = language === 'he' ? 'he-IL' : 'en-IL';

  const gradientStyle = tenantConfig?.primaryColor
    ? {
        background: `linear-gradient(135deg, ${tenantConfig.primaryColor} 0%, ${darkenHex(tenantConfig.primaryColor, 12)} 50%, ${darkenHex(tenantConfig.primaryColor, 25)} 100%)`,
      }
    : undefined;
  const gradientClass = tenantConfig?.primaryColor ? '' : 'balance-gradient';

  // Anonymous teaser card
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => requireAuth({ promptMessage: t.auth.eligibilityPrompt })}
        className={`w-full ${gradientClass} rounded-2xl p-6 text-white text-start animate-fade-up`}
        style={gradientStyle}
      >
        <p className="text-white/80 text-sm font-medium mb-1">
          {tenantConfig?.nameHe || tenantConfig?.name || 'Nexus'}
        </p>
        <h2 className="text-xl font-bold mb-2">{t.auth.loginSheetSubtitle}</h2>
        <div className="flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold">
            {t.auth.checkEligibility}
          </span>
          <span
            className="material-symbols-outlined text-white/70"
            style={{ fontSize: '18px' }}
          >
            arrow_forward
          </span>
        </div>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className={`${gradientClass} rounded-2xl p-6 text-white`} style={gradientStyle}>
        <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
        <Skeleton className="h-10 w-40 bg-white/20 mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-24 bg-white/20 rounded-xl" />
          <Skeleton className="h-12 w-24 bg-white/20 rounded-xl" />
          <Skeleton className="h-12 w-24 bg-white/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${gradientClass} rounded-2xl p-6 text-white animate-fade-up`} style={gradientStyle}>
      <p className="text-white/80 text-sm font-medium mb-1">{t.home.yourBalance}</p>
      <h1 className="text-4xl font-bold mb-6 tracking-tight">
        {formatCurrency(wallet?.balance || 0, 'ILS', locale)}
      </h1>

      <div className="flex gap-3">
        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-white/80" />
            <span className="text-[11px] text-white/80">{t.home.totalEarned}</span>
          </div>
          <p className="text-sm font-semibold">{formatCurrency(wallet?.totalEarned || 0, 'ILS', locale)}</p>
        </div>

        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={14} className="text-white/80" />
            <span className="text-[11px] text-white/80">{t.home.totalSpent}</span>
          </div>
          <p className="text-sm font-semibold">{formatCurrency(wallet?.totalSpent || 0, 'ILS', locale)}</p>
        </div>

        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <PiggyBank size={14} className="text-white/80" />
            <span className="text-[11px] text-white/80">{t.home.totalSaved}</span>
          </div>
          <p className="text-sm font-semibold">{formatCurrency(wallet?.totalSaved || 0, 'ILS', locale)}</p>
        </div>
      </div>
    </div>
  );
}
