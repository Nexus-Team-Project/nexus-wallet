/**
 * ComingSoonBadge — small bilingual "Soon / בקרוב" pill used to mark profile
 * UI that is not wired up yet. Neutral grey so it reads as inactive.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';

export default function ComingSoonBadge({ className }: { className?: string }) {
  const { language } = useLanguage();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-text-muted/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted',
        className,
      )}
    >
      {language === 'he' ? 'בקרוב' : 'Soon'}
    </span>
  );
}
