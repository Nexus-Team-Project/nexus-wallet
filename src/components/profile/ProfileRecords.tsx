import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Two side-by-side stat cards highlighting the user's personal-best
 * records. Background is `bg-surface` (the soft light-gray that the
 * profile page lives on), card content is a colored icon + a big
 * number and a small unit/qualifier line beneath it.
 *
 * Values are placeholder zeros for now — when the activity feed lands
 * the parent can pass real numbers in via props.
 */

interface RecordCardProps {
  icon: string;
  iconColor: string;
  value: string;
  caption: string;
  /** Filled material symbols read as colored "tokens"; outlined ones
   *  read as monochrome glyphs. Default = filled. */
  filled?: boolean;
}

function RecordCard({ icon, iconColor, value, caption, filled = true }: RecordCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-4 flex items-start gap-3">
      <span
        className={`material-symbols-outlined ${iconColor} flex-shrink-0`}
        style={{
          fontSize: 24,
          fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold text-text-primary leading-tight">{value}</p>
        <p className="text-xs text-text-muted leading-tight mt-0.5">{caption}</p>
      </div>
    </div>
  );
}

export default function ProfileRecords() {
  const { t } = useLanguage();

  return (
    <section className="px-4 mt-6">
      <h3 className="text-base font-bold text-text-primary mb-3">
        {t.profile.records}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <RecordCard
          icon="local_fire_department"
          iconColor="text-orange-500"
          value={`0 ${t.profile.days}`}
          caption={t.profile.longestStreak}
        />
        <RecordCard
          icon="savings"
          iconColor="text-primary"
          value={`0 ${t.profile.points}`}
          caption={t.profile.bestDay}
        />
      </div>
    </section>
  );
}
