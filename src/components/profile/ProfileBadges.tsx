import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';

/**
 * Grid of achievement medallions. Each badge is a 96px circle with a
 * subtle silver ring (locked) or a primary-tinted ring (unlocked),
 * a large icon at the center, and a small caption beneath. Layout is
 * two columns on mobile, matching the design's vertical pairs.
 */

interface Badge {
  icon: string; // material-symbols-outlined name
  labelKey:
    | 'badgeFirstHundred'
    | 'badgeThousandSaved'
    | 'badgeFiveVouchers'
    | 'badgeStreak30'
    | 'badgeFiftyBuys'
    | 'badgeReferralPro';
  /** Unlocked badges read in primary; locked badges read in muted gray. */
  unlocked: boolean;
}

const BADGES: Badge[] = [
  { icon: 'paid',              labelKey: 'badgeFirstHundred',  unlocked: true  },
  { icon: 'savings',           labelKey: 'badgeThousandSaved', unlocked: true  },
  { icon: 'confirmation_number', labelKey: 'badgeFiveVouchers', unlocked: false },
  { icon: 'local_fire_department', labelKey: 'badgeStreak30',   unlocked: false },
  { icon: 'shopping_bag',      labelKey: 'badgeFiftyBuys',     unlocked: false },
  { icon: 'group_add',         labelKey: 'badgeReferralPro',   unlocked: false },
];

export default function ProfileBadges() {
  const { t } = useLanguage();

  return (
    <section className="px-4 mt-6">
      <h3 className="text-base font-bold text-text-primary mb-3">
        {t.profile.badges}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {BADGES.map((badge) => (
          <div key={badge.labelKey} className="flex flex-col items-center">
            <div
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                // Inner medallion treatment — soft inset + double ring
                // gives the "coin" look from the design without leaning
                // on an image asset.
                badge.unlocked
                  ? 'bg-primary/10 ring-4 ring-primary/30 ring-offset-2 ring-offset-bg-light'
                  : 'bg-surface ring-4 ring-border ring-offset-2 ring-offset-bg-light',
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined',
                  badge.unlocked ? 'text-primary' : 'text-text-muted/70',
                )}
                style={{
                  fontSize: 44,
                  fontVariationSettings: "'FILL' 1, 'wght' 500",
                }}
              >
                {badge.icon}
              </span>
            </div>
            <p
              className={cn(
                'text-sm font-semibold mt-3 text-center',
                badge.unlocked ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              {t.profile[badge.labelKey]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
