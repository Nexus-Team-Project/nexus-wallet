/**
 * UserMenu - small dropdown anchored to the TopBar avatar.
 *
 * Opens on avatar click when the user is authenticated. Shows the
 * user's display name + email, a "default view on login" entry that
 * opens the DefaultTenantSheet (members only), and a Logout button.
 * Closes on outside-click or after an action fires.
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { clearPostLoginReturn } from '../../lib/postLogin';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens the default-tenant bottom sheet (rendered by the parent). */
  onOpenDefaultSheet: () => void;
}

export default function UserMenu({ isOpen, onClose, onOpenDefaultSheet }: UserMenuProps) {
  const { me, logout } = useAuth();
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const ref = useRef<HTMLDivElement>(null);

  // The default-view entry only makes sense for 'member'-role tenants
  // (privileged/admin tenants are dashboard contexts, not wallet catalogs).
  const memberships = (me?.memberships ?? []).filter((m) => m.isMember);

  // Close on outside-click. Re-attaches on every isOpen toggle so we
  // never run a stale handler.
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Listen on the next tick so the click that opened the menu
    // doesn't immediately re-trigger close.
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName =
    me?.profile?.firstName ??
    me?.user.name ??
    useAuthStore.getState().firstName ??
    '';
  const email = me?.user.email ?? '';

  const handleLogout = async (): Promise<void> => {
    onClose();
    await logout();
    // Clear any stashed gated-action return so a later login never
    // misfires to a stale page, then drop the now-anonymous user on the
    // public ecosystem catalog (the front door for everyone).
    clearPostLoginReturn();
    navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  };

  return (
    <div
      ref={ref}
      className="absolute top-12 z-50 min-w-[220px] rounded-2xl bg-white shadow-xl border border-border/60 overflow-hidden"
      style={{
        // Anchor the menu to the start edge of the avatar (RTL: right; LTR: left).
        insetInlineStart: 0,
      }}
    >
      {/* Header: name + email */}
      <div className="px-4 py-3 border-b border-border/60">
        <div className="text-sm font-bold text-text-primary truncate" dir={isHe ? 'rtl' : 'ltr'}>
          {displayName || (isHe ? 'משתמש' : 'User')}
        </div>
        {email && (
          <div className="text-xs text-text-muted truncate" dir="ltr">
            {email}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="py-1">
        {/* Default landing view — members only. Opens the bottom sheet. */}
        {memberships.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDefaultSheet();
            }}
            className="w-full text-start px-4 py-2.5 text-sm text-text-primary hover:bg-surface flex items-center gap-2"
          >
            {/* Inline SVG layers/view icon. */}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-text-muted flex-shrink-0" aria-hidden="true"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>{isHe ? 'תצוגת ברירת מחדל בכניסה' : 'Default view on login'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-start px-4 py-2.5 text-sm text-text-primary hover:bg-surface flex items-center gap-2"
        >
          {/* Inline SVG logout icon - the wallet does not load
              material-icons (only material-symbols-outlined) and using
              a font ligature here showed the literal word 'logout'
              next to the localized label. */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>{isHe ? 'התנתק' : 'Log out'}</span>
        </button>
      </div>
    </div>
  );
}
