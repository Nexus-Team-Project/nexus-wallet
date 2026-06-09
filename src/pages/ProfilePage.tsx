import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs, { type ProfileTab } from '../components/profile/ProfileTabs';
import ProfileRecords from '../components/profile/ProfileRecords';
import ProfileBadges from '../components/profile/ProfileBadges';
import MenuList from '../components/profile/MenuList';

/**
 * Profile page — flat M3-style layout:
 *  1. Page header with title + settings shortcut (sits under the
 *     overlay TopBar that AppLayout renders globally, hence the pt-20).
 *  2. Centered avatar + name + email hero.
 *  3. Tab strip (Activity / Saved / Help / Settings) — controls which
 *     section is shown below.
 *     - Activity → Records + Badges
 *     - Settings → full options list (notifications, language, help,
 *                  about, logout, …)
 *     - Saved / Help → empty for now (placeholder shown).
 */
export default function ProfilePage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ProfileTab>('activity');

  return (
    <div className="animate-fade-in pb-10">
      {/* Page header — mirrors the notifications page pattern. pt-20
          clears the global TopBar overlay (avatar + chat + bell). The
          gear here is a shortcut that jumps the tab strip to Settings. */}
      <header className="relative px-4 pt-20 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t.profile.title}</h1>
        <button
          type="button"
          aria-label="Profile settings"
          onClick={() => setTab('settings')}
          className="p-2 rounded-full text-text-secondary hover:bg-surface transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            settings
          </span>
        </button>
      </header>

      <ProfileHeader />
      <ProfileTabs selected={tab} onChange={setTab} />

      {tab === 'activity' && (
        <>
          <ProfileRecords />
          <ProfileBadges />
        </>
      )}

      {tab === 'settings' && <MenuList />}

      {(tab === 'saved' || tab === 'help') && (
        <div className="px-4 pt-12 text-center text-sm text-text-muted">
          {/* Lightweight placeholder — keeps layout from collapsing while
              these tabs are still empty. */}
          —
        </div>
      )}
    </div>
  );
}
