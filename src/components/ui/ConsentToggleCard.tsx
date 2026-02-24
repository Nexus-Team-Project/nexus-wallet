interface ConsentToggleCardProps {
  icon: string;           // material-symbols icon name
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  required?: boolean;     // shows "required" badge — visually indicated
  disabled?: boolean;     // for when browser has blocked the permission
  disabledNote?: string;  // note shown when disabled
}

/**
 * Toggle card for consent options in the ConsentsSlide.
 * RTL-aware: icon + text on the right, toggle pill on the left.
 */
export default function ConsentToggleCard({
  icon,
  title,
  description,
  checked,
  onChange,
  required = false,
  disabled = false,
  disabledNote,
}: ConsentToggleCardProps) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${
        checked && !disabled
          ? 'border-primary bg-primary/5'
          : disabled
            ? 'border-border/50 bg-surface/50 opacity-60'
            : 'border-border bg-white'
      }`}
    >
      {/* Icon badge */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 ${
          checked && !disabled ? 'bg-primary/10' : 'bg-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined ${checked && !disabled ? 'text-primary' : 'text-text-muted'}`}
          style={{ fontSize: '20px' }}
        >
          {icon}
        </span>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`text-sm font-semibold leading-snug ${
              checked && !disabled ? 'text-primary' : 'text-text-primary'
            }`}
          >
            {title}
          </span>
          {required && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
              חובה
            </span>
          )}
        </div>
        <span className="block text-xs text-text-muted leading-relaxed">
          {disabled && disabledNote ? disabledNote : description}
        </span>
      </div>

      {/* Toggle pill */}
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`flex-shrink-0 mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked && !disabled ? 'bg-primary' : 'bg-border'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
