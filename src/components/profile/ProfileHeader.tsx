import { useState } from 'react';
import { useUser } from '../../hooks/useUser';
import { useAuthStore } from '../../stores/authStore';
import Skeleton from '../ui/Skeleton';
import OrgPickerSheet from './OrgPickerSheet';

/**
 * Centered hero block at the top of the profile page:
 *  - 96px circular avatar (user image if present, otherwise initials on
 *    a soft primary tint) with a small "edit" pencil badge tucked into
 *    the bottom-end corner.
 *  - Display name + email.
 *  - Organization pill — tapping it opens the same org list shown
 *    during the auth flow (SlideSelectOrg). Picking a different org
 *    updates the auth store and swaps tenant branding when applicable.
 */
export default function ProfileHeader() {
  const { data: user, isLoading } = useUser();
  // The name typed during login/registration is the source of truth —
  // it overrides whatever the mock /me endpoint returns.
  const authFirstName = useAuthStore((s) => s.firstName);
  // Live-bound org name — updates instantly when the picker writes to
  // the auth store, so the pill re-renders with the new selection.
  const authOrgName = useAuthStore((s) => s.organizationName);
  const firstName = authFirstName ?? user?.firstName;
  const lastName = user?.lastName;
  const orgName = authOrgName ?? user?.organizationName;

  const [pickerOpen, setPickerOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="px-4 pt-6 pb-16 flex flex-col items-center">
        <Skeleton variant="circular" className="w-24 h-24 mb-4" />
        <Skeleton className="h-7 w-40 mb-2 rounded" />
        <Skeleton className="h-4 w-52 mb-4 rounded" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </section>
    );
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <section className="px-4 pt-6 pb-16 flex flex-col items-center">
      <div className="relative mb-4">
        {/* 96px disc — thick white ring separates it from the page bg. */}
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white bg-primary/10 flex items-center justify-center">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">{initials || '·'}</span>
          )}
        </div>
        {/* Edit pencil badge — bottom-end corner. */}
        <button
          type="button"
          aria-label="Edit profile picture"
          className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-primary text-white border-2 border-white shadow-md flex items-center justify-center hover:bg-primary-dark transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            edit
          </span>
        </button>
      </div>
      <h2 className="text-[28px] leading-8 font-bold text-text-primary tracking-tight text-center">
        {fullName || '—'}
      </h2>
      {user?.email && (
        <p className="text-sm text-text-muted mt-1 text-center">{user.email}</p>
      )}
      {/* Organization pill — opens the same picker the auth flow uses. */}
      {orgName && (
        <button
          type="button"
          aria-label="Switch organization"
          onClick={() => setPickerOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm hover:bg-surface active:scale-[0.98] transition-all"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
          >
            apartment
          </span>
          <span className="text-sm font-semibold text-text-primary truncate max-w-[180px]">
            {orgName}
          </span>
          <span
            className="material-symbols-outlined text-text-muted"
            style={{ fontSize: 18 }}
          >
            unfold_more
          </span>
        </button>
      )}

      <OrgPickerSheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </section>
  );
}
