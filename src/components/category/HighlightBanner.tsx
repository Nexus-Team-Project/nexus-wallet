import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

interface HighlightBannerProps {
  categoryId: VoucherCategory;
}

const CATEGORY_CONFIG: Record<VoucherCategory, { gradient: string; emoji: string; titleKey: string; subtitleKey: string }> = {
  food: { gradient: 'from-orange-500 to-red-500', emoji: '🍔', titleKey: 'highlightTitleFood', subtitleKey: 'highlightSubtitleFood' },
  shopping: { gradient: 'from-pink-500 to-rose-600', emoji: '🛍️', titleKey: 'highlightTitleShopping', subtitleKey: 'highlightSubtitleShopping' },
  entertainment: { gradient: 'from-purple-500 to-indigo-600', emoji: '🎬', titleKey: 'highlightTitleEntertainment', subtitleKey: 'highlightSubtitleEntertainment' },
  travel: { gradient: 'from-sky-500 to-blue-600', emoji: '✈️', titleKey: 'highlightTitleTravel', subtitleKey: 'highlightSubtitleTravel' },
  health: { gradient: 'from-emerald-500 to-teal-600', emoji: '💊', titleKey: 'highlightTitleHealth', subtitleKey: 'highlightSubtitleHealth' },
  education: { gradient: 'from-amber-500 to-orange-600', emoji: '📚', titleKey: 'highlightTitleEducation', subtitleKey: 'highlightSubtitleEducation' },
  tech: { gradient: 'from-blue-500 to-violet-600', emoji: '💻', titleKey: 'highlightTitleTech', subtitleKey: 'highlightSubtitleTech' },
};

export default function HighlightBanner({ categoryId }: HighlightBannerProps) {
  const { t } = useLanguage();
  const config = CATEGORY_CONFIG[categoryId];

  const title = t.category[config.titleKey as keyof typeof t.category] || '';
  const subtitle = t.category[config.subtitleKey as keyof typeof t.category] || '';

  return (
    <section className="px-4 max-w-md mx-auto">
      <div
        className={`w-full rounded-2xl overflow-hidden bg-gradient-to-r ${config.gradient} flex items-center justify-between px-5 shadow-sm`}
        style={{ height: '120px' }}
      >
        <div className="flex-1">
          <h3 className="text-white text-lg font-bold leading-snug">{title}</h3>
          <p className="text-white/80 text-xs mt-1">{subtitle}</p>
          <button className="mt-2.5 px-4 py-1.5 bg-white rounded-full text-xs font-semibold text-text-primary shadow-sm active:scale-95 transition-transform">
            {t.category.highlightCta}
          </button>
        </div>
        <span className="text-5xl ms-3 opacity-90">{config.emoji}</span>
      </div>
    </section>
  );
}
