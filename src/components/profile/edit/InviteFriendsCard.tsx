/**
 * InviteFriendsCard - the "invite friends" entry on the Edit Profile screen.
 * Present in the UI but intentionally NOT wired to any backend yet: tapping it
 * just shows a "Soon" toast. Lives in its own file so the placeholder is easy
 * to replace with the real flow later.
 */
import { appToast } from '../../../lib/appToast';
import { useLanguage } from '../../../i18n/LanguageContext';
import { CARD_CLASS, SECTION_LABEL_CLASS } from './editProfile.constants';

/**
 * Render the non-functional invite-friends card.
 * @returns the invite section element.
 */
export default function InviteFriendsCard() {
  const { t } = useLanguage();

  return (
    <section className={CARD_CLASS}>
      <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionInvite}</h2>
      <button
        type="button"
        onClick={() => appToast.info(t.profile.editSoonBadge)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/60 p-3 text-start opacity-90"
      >
        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
            group_add
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-text-primary">
            {t.profile.editInviteTitle}
          </span>
          <span className="block text-xs text-text-muted">{t.profile.editInviteSubtitle}</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide flex-shrink-0">
          {t.profile.editSoonBadge}
        </span>
      </button>
    </section>
  );
}
