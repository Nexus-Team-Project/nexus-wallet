import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { clearPostLoginReturn } from '../../lib/postLogin';

/**
 * Centered hero at the top of the profile page. Real data from /api/me:
 *  - 96px avatar = the user's Google photo, else initials on a primary tint;
 *    a functional "edit" pencil opens /profile/edit.
 *  - Name = first + last name, falling back to the account name, then the
 *    email local-part. Email shown beneath.
 *  - Two functional actions: Edit profile (-> /profile/edit) and Logout.
 *
 * Accent colors come from the page's `--color-primary` override (set by
 * ProfilePage from the active tenant), so the ring/pencil/buttons are themed.
 */
export default function ProfileHeader() {
  const { me, logout } = useAuth();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const firstName = me?.profile?.firstName ?? '';
  const lastName = me?.profile?.lastName ?? '';
  const email = me?.user.email ?? '';
  const emailPrefix = email ? email.split('@')[0]! : '';
  // Name source of truth: first+last -> account name -> email local-part.
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    (me?.user.name ?? '').trim() ||
    emailPrefix ||
    '—';
  const avatarUrl = me?.user.avatarUrl ?? null;
  const initials =
    ((firstName[0] ?? '') + (lastName[0] ?? '')).trim() ||
    fullName.replace('—', '').slice(0, 2);

  const goEdit = () => navigate(`/${lang}/profile/edit`);

  const handleLogout = async (): Promise<void> => {
    await logout();
    // Drop any stashed gated-action return, then land the now-anonymous user
    // on the public ecosystem catalog (the front door for everyone).
    clearPostLoginReturn();
    navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  };

  return (
    <section className="px-4 pt-6 pb-8 flex flex-col items-center">
      <div className="relative mb-4">
        {/* 96px disc — thick white ring separates it from the page bg. */}
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white bg-primary/10 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary">{initials.toUpperCase() || '·'}</span>
          )}
        </div>
        {/* Edit pencil — bottom-end corner. Opens the profile editor. */}
        <button
          type="button"
          onClick={goEdit}
          aria-label={t.profile.editProfile}
          className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-primary text-white border-2 border-white shadow-md flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
        </button>
      </div>

      <h2 className="text-[28px] leading-8 font-bold text-text-primary tracking-tight text-center">
        {fullName}
      </h2>
      {email && <p className="text-sm text-text-muted mt-1 text-center" dir="ltr">{email}</p>}

      {/* Functional actions: Edit profile + Logout. */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={goEdit}
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {t.profile.editProfile}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-full border border-border bg-white text-error text-sm font-semibold hover:bg-error/5 active:scale-[0.98] transition-all"
        >
          {isHe ? 'התנתק' : t.profile.logout}
        </button>
      </div>
    </section>
  );
}
