/**
 * DeleteAccountCard - the "delete account" entry on the Edit Profile screen.
 * Intentionally DISABLED and unpressable: account deletion is not built yet, so
 * the button is non-interactive and shows a "Soon" badge. Styled as a
 * destructive action (red accent) so its eventual purpose reads clearly, but
 * dimmed + `cursor-not-allowed` to signal it cannot be used. Lives in its own
 * file so wiring the real flow later is a localized change.
 */
import { useLanguage } from '../../../i18n/LanguageContext';
import { CARD_CLASS, SECTION_LABEL_CLASS } from './editProfile.constants';

/**
 * Render the disabled delete-account card.
 * @returns the delete-account section element.
 */
export default function DeleteAccountCard() {
  const { t } = useLanguage();

  return (
    <section className={CARD_CLASS}>
      <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionDelete}</h2>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={t.profile.editSoonBadge}
        className="flex w-full items-center gap-3 rounded-2xl border border-error/30 bg-error/5 p-3 text-start opacity-60 cursor-not-allowed"
      >
        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '20px' }}>
            delete
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-error">
            {t.profile.editDeleteTitle}
          </span>
          <span className="block text-xs text-text-muted">{t.profile.editDeleteSubtitle}</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error uppercase tracking-wide flex-shrink-0">
          {t.profile.editSoonBadge}
        </span>
      </button>
    </section>
  );
}
