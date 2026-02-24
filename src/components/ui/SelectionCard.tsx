interface SelectionCardProps {
  emoji?: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  /** true = multi-select (checkmark badge), false = single-select (radio dot) */
  multiSelect?: boolean;
}

/**
 * Reusable card for single/multi-select choices in onboarding slides.
 * - Selected: primary border + tinted background + indicator filled
 * - Unselected: border-border + white background
 */
export default function SelectionCard({
  emoji,
  label,
  description,
  selected,
  onClick,
  multiSelect = false,
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-white hover:border-primary/30'
      }`}
    >
      {/* Emoji badge */}
      {emoji && (
        <span
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
            selected ? 'bg-primary/10' : 'bg-surface'
          }`}
        >
          {emoji}
        </span>
      )}

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm font-semibold leading-snug ${
            selected ? 'text-primary' : 'text-text-primary'
          }`}
        >
          {label}
        </span>
        {description && (
          <span className="block text-xs text-text-muted mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </div>

      {/* Selection indicator */}
      {multiSelect ? (
        /* Multi-select: filled checkmark when selected, empty square when not */
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            selected ? 'border-primary bg-primary' : 'border-border bg-white'
          }`}
        >
          {selected && (
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          )}
        </div>
      ) : (
        /* Single-select: filled circle when selected, empty circle when not */
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected ? 'border-primary' : 'border-border'
          }`}
        >
          {selected && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </div>
      )}
    </button>
  );
}
