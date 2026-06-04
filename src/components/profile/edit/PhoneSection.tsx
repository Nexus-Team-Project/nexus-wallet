/**
 * PhoneSection — profile row showing the user's phone (or "not set") with an
 * add/update action that opens PhoneUpdateSheet. Every change goes through an
 * OTP (or the test path while SMS is off); the backend propagates the new
 * number to all the user's tenant contact rows.
 */
import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import PhoneUpdateSheet from './PhoneUpdateSheet';

export default function PhoneSection() {
  const { t } = useLanguage();
  const { me, reload } = useAuth();
  const [open, setOpen] = useState(false);
  const phone = me?.phone ?? null;

  return (
    <div>
      <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">{t.profile.phone}</p>
          <p className="text-sm font-semibold text-text-primary truncate" dir="ltr">
            {phone ?? t.profile.phoneNotSet}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-shrink-0 text-sm font-semibold text-primary"
        >
          {phone ? t.profile.phoneUpdate : t.profile.phoneAdd}
        </button>
      </div>
      {open && (
        <PhoneUpdateSheet onClose={() => setOpen(false)} onUpdated={() => { void reload(); }} />
      )}
    </div>
  );
}
