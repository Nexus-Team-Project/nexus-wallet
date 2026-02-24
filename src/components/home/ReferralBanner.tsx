import { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useContactsStore } from '../../stores/contactsStore';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  getContactsStrategy,
  fetchGoogleContacts,
  pickDeviceContacts,
  buildReferralUrl,
  shareViaWhatsApp,
  shareViaSMS,
  shareNative,
  copyToClipboard,
} from '../../services/contacts.service';

/**
 * ReferralBanner — compact home-page card for inviting friends.
 * Shows only when the user is authenticated.
 *
 * Features:
 * - Generated referral link based on userId
 * - Share via WhatsApp / SMS / native share / copy
 * - Import contacts (Google People API or Contact Picker — platform-aware)
 * - "X friends already on Nexus" badge after import
 */
export default function ReferralBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const authMethod = useAuthStore((s) => s.authMethod);
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Contacts state
  const contactsImported = useContactsStore((s) => s.contactsImported);
  const friendsOnNexus = useContactsStore((s) => s.friendsOnNexus);
  const setContacts = useContactsStore((s) => s.setContacts);

  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!isAuthenticated || !userId) return null;

  const referralUrl = buildReferralUrl(userId);
  const shareTitle = t.registration.inviteShareTitle;
  const shareText = t.registration.inviteShareText;

  // Platform strategy
  const strategy = getContactsStrategy(authMethod);
  const canImport = strategy !== 'share-only';

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(referralUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralUrl]);

  const handleWhatsApp = useCallback(() => {
    shareViaWhatsApp(shareText, referralUrl);
  }, [shareText, referralUrl]);

  const handleSMS = useCallback(() => {
    shareViaSMS(shareText, referralUrl);
  }, [shareText, referralUrl]);

  const handleNativeShare = useCallback(async () => {
    const ok = await shareNative(shareTitle, shareText, referralUrl);
    if (!ok) await copyToClipboard(referralUrl);
  }, [shareTitle, shareText, referralUrl]);

  const handleImportContacts = useCallback(async () => {
    setImporting(true);
    let imported = null;

    if (strategy === 'google') {
      imported = await fetchGoogleContacts();
    } else if (strategy === 'device-picker') {
      imported = await pickDeviceContacts();
    }

    setImporting(false);
    if (!imported || imported.length === 0) return;

    const source = strategy === 'google' ? 'google' as const : 'device' as const;
    setContacts(imported, source);

    // Mock: ~15% are "already on Nexus"
    const mockFriends = imported
      .filter(() => Math.random() < 0.15)
      .map((c) => c.id);
    useContactsStore.getState().setFriendsOnNexus(mockFriends);
  }, [strategy, setContacts]);

  return (
    <section className="px-5 mb-6" dir={isHe ? 'rtl' : 'ltr'}>
      <div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, #635bff 0%, #9c88ff 60%, #00d4ff 100%)',
        }}
      >
        {/* Decorative blob */}
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.12)',
            filter: 'blur(24px)',
            transform: 'translate(-30%, -30%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-white font-extrabold text-base leading-tight">
                {isHe ? '🎁 הזמן חבר וקבל קרדיט' : '🎁 Invite a friend, earn credit'}
              </p>
              <p className="text-white/75 text-xs mt-0.5 leading-snug">
                {isHe
                  ? 'שתף את הלינק שלך — כל הצטרפות מזכה אותך בקרדיט'
                  : 'Share your link — every signup earns you credit'}
              </p>
            </div>
          </div>

          {/* Friends on Nexus badge */}
          {contactsImported && friendsOnNexus.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                group
              </span>
              <span className="text-white text-xs font-semibold">
                {t.registration.inviteFriendsOnNexus.replace('{count}', String(friendsOnNexus.length))}
              </span>
            </div>
          )}

          {/* Referral link pill */}
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 mb-3">
            <span className="flex-1 text-white text-xs font-mono truncate" dir="ltr">
              {referralUrl}
            </span>
          </div>

          {/* Action buttons — row 1: Copy + Share */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 text-white text-xs font-semibold active:scale-[0.97] transition-all"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', fontVariationSettings: copied ? "'FILL' 1" : "'FILL' 0" }}
              >
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              {copied ? t.registration.inviteCopied : t.registration.inviteCopyLink}
            </button>

            <button
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-[#635bff] text-xs font-bold active:scale-[0.97] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                share
              </span>
              {t.registration.inviteShare}
            </button>
          </div>

          {/* Action buttons — row 2: WhatsApp + SMS + Import */}
          <div className="flex gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/30 text-white text-xs font-semibold active:scale-[0.97] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t.registration.inviteWhatsApp}
            </button>

            <button
              onClick={handleSMS}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/20 text-white text-xs font-semibold active:scale-[0.97] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                sms
              </span>
              {t.registration.inviteSMS}
            </button>

            {canImport && !contactsImported && (
              <button
                onClick={handleImportContacts}
                disabled={importing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 text-white text-xs font-semibold active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {importing ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    contacts
                  </span>
                )}
                {t.registration.inviteImportContacts}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
