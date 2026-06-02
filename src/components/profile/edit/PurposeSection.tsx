/**
 * PurposeSection - the "how you'll use it" multi-select chip grid for the Edit
 * Profile screen. Renders the same grouped chips as the onboarding PurposeSlide
 * so a user can edit what they picked (or never picked). Selection state is
 * owned by the parent; this component is purely presentational.
 */
import { useLanguage } from '../../../i18n/LanguageContext';
import { PURPOSE_CATEGORIES, CARD_CLASS, SECTION_LABEL_CLASS } from './editProfile.constants';

interface PurposeSectionProps {
  /** Currently selected purpose chip ids. */
  selected: string[];
  /** Toggle one chip id in/out of the selection. */
  onToggle: (id: string) => void;
}

/**
 * Render the purpose section card.
 * @param selected selected chip ids.
 * @param onToggle handler to flip a chip.
 * @returns the purpose section element.
 */
export default function PurposeSection({ selected, onToggle }: PurposeSectionProps) {
  const { t } = useLanguage();

  return (
    <section className={CARD_CLASS}>
      <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionPurpose}</h2>
      <div className="space-y-6">
        {PURPOSE_CATEGORIES.map((cat) => (
          <div key={cat.titleKey}>
            <h3
              className="text-base font-bold tracking-tight mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {t.registration[cat.titleKey]}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {cat.chips.map((chip) => {
                const isSelected = selected.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onToggle(chip.id)}
                    aria-pressed={isSelected}
                    className={`flex h-11 items-center gap-2 rounded-xl border ps-3 pe-4 transition-all active:scale-95 ${
                      isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface border-border'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined flex-shrink-0"
                      style={{
                        fontSize: '20px',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {chip.icon}
                    </span>
                    <span
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {t.registration[chip.labelKey]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
