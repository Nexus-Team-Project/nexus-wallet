/**
 * StoryJoinOtherLink — the bottom "continue with another organization" link
 * shown on every auth-flow story step. Tapping it opens the join picker so the
 * user can affiliate with an org we didn't match. Lives in its own component so
 * the exact label + behavior stay identical across the promo slides, the
 * match-screen, and the join-prompt.
 */
import { useLanguage } from '../../i18n/LanguageContext';

interface StoryJoinOtherLinkProps {
  /** Opens the join picker. */
  onClick: () => void;
  /** 'onDark' for gradient/dark slides (default), 'onLight' for light surfaces. */
  variant?: 'onDark' | 'onLight';
}

/**
 * @returns the tappable "join another organization" text link.
 */
export function StoryJoinOtherLink({ onClick, variant = 'onDark' }: StoryJoinOtherLinkProps) {
  const { t } = useLanguage();
  const color = variant === 'onDark' ? 'text-white/90' : 'text-text-secondary';
  return (
    <div className="flex justify-start">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`${color} text-xs font-medium underline underline-offset-2 active:scale-95`}
      >
        {t.authFlow.joinOtherLink}
      </button>
    </div>
  );
}
