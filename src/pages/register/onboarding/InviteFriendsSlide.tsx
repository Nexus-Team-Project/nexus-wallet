/**
 * InviteFriendsSlide — optional onboarding slide.
 *
 * Core message: "צרף 2 חברים → תן לכל אחד ₪25 → קבל ₪50 ליתרה"
 *
 * Two zones:
 * 1. **Sharing** (always visible) — WhatsApp / SMS / native share / copy link
 * 2. **Import contacts** (conditional) — Google People API or Contact Picker
 */
import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuthStore } from '../../../stores/authStore';
import { useTenantStore } from '../../../stores/tenantStore';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { useContactsStore } from '../../../stores/contactsStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';
import {
  getContactsStrategy,
  fetchGoogleContacts,
  pickDeviceContacts,
  buildReferralUrl,
  shareViaWhatsApp,
  shareViaSMS,
  shareNative,
  copyToClipboard,
  type NexusContact,
  type ContactsStrategy,
} from '../../../services/contacts.service';

export default function InviteFriendsSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const userId = useAuthStore((s) => s.userId);
  const authMethod = useAuthStore((s) => s.authMethod);
  const tenantId = useTenantStore((s) => s.tenantId);
  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('invite-friends', storeState);

  // Contacts store
  const { contacts, contactsImported, setContacts } = useContactsStore();

  // Local state
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Strategy detection
  const strategy: ContactsStrategy = getContactsStrategy(authMethod);
  const canImport = strategy !== 'share-only';

  // Referral URL — tenant-scoped
  const referralUrl = buildReferralUrl(userId ?? 'user', tenantId);
  const shareTitle = t.registration.inviteShareTitle;
  const shareText = t.registration.inviteShareText;

  // ── Sharing handlers ──────────────────────────────────────────────────────

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

  // ── Contact import handler ────────────────────────────────────────────────

  const handleImportContacts = useCallback(async () => {
    setImporting(true);
    setImportError(null);

    let imported: NexusContact[] | null = null;

    if (strategy === 'google') {
      imported = await fetchGoogleContacts();
    } else if (strategy === 'device-picker') {
      imported = await pickDeviceContacts();
    }

    setImporting(false);

    if (imported === null) return;

    if (imported.length === 0) {
      setImportError(t.registration.inviteNoContacts);
      return;
    }

    const source = strategy === 'google' ? 'google' as const : 'device' as const;
    setContacts(imported, source);

    // Mock: mark random ~15% as "already on Nexus"
    const mockFriends = imported
      .filter(() => Math.random() < 0.15)
      .map((c) => c.id);
    useContactsStore.getState().setFriendsOnNexus(mockFriends);
  }, [strategy, t, setContacts]);

  // ── Selection toggle ──────────────────────────────────────────────────────

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSendInvite = () => {
    const text = `${shareText}\n${referralUrl}`;
    if (selectedIds.length > 0) {
      shareNative(shareTitle, text, referralUrl);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const advance = () => {
    const next = getNextOnboardingSlide('invite-friends', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleContinue = () => advance();
  const handleSkip = () => advance();

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('invite-friends', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  // Friends already on Nexus
  const friendsOnNexus = useContactsStore((s) => s.friendsOnNexus);

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={t.registration.onboardingContinue}
    >
      <div className="pt-4 pb-2">
        {/* Header */}
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.inviteFriendsTitle}
        </h1>
        <p
          className="text-sm mb-4 leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.registration.inviteFriendsSubtitle}
        </p>

        {/* ── Reward visual ── */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {/* Friend 1 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                person_add
              </span>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              ₪25
            </span>
          </div>

          <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>+</span>

          {/* Friend 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                person_add
              </span>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              ₪25
            </span>
          </div>

          <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>=</span>

          {/* Your reward */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">₪50</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>
              {isHe ? 'ליתרה' : 'balance'}
            </span>
          </div>
        </div>

        {/* ── Referral link pill ── */}
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5 mb-4">
          <span className="flex-1 text-xs font-mono truncate" dir="ltr" style={{ color: 'var(--color-text-primary)' }}>
            {referralUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? t.registration.inviteCopied : t.registration.inviteCopyLink}
          </button>
        </div>

        {/* ── Share buttons row ── */}
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
          {t.registration.inviteShareLink}
        </p>
        <div className="flex gap-2 mb-5">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#25D366]/10 active:scale-95 transition-transform"
          >
            <span className="text-[#25D366] text-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t.registration.inviteWhatsApp}
            </span>
          </button>

          {/* SMS */}
          <button
            onClick={handleSMS}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-500/10 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '22px' }}>
              sms
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t.registration.inviteSMS}
            </span>
          </button>

          {/* Native Share */}
          <button
            onClick={handleNativeShare}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-500/10 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}>
              share
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t.registration.inviteShare}
            </span>
          </button>
        </div>

        {/* ── Import contacts section (conditional) ── */}
        {canImport && !contactsImported && (
          <div className="mb-4">
            <div className="h-px bg-border mb-4" />
            <button
              onClick={handleImportContacts}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-primary/30 text-primary font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {importing ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
                    progress_activity
                  </span>
                  {isHe ? 'מייבא...' : 'Importing...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    contacts
                  </span>
                  {strategy === 'google'
                    ? t.registration.inviteImportFromGoogle
                    : t.registration.inviteImportFromDevice}
                </>
              )}
            </button>
            {importError && (
              <p className="text-xs text-error text-center mt-2">{importError}</p>
            )}
          </div>
        )}

        {/* ── Imported contacts list ── */}
        {contactsImported && contacts.length > 0 && (
          <div className="mb-4">
            <div className="h-px bg-border mb-4" />

            {/* Friends on Nexus badge */}
            {friendsOnNexus.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                  group
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {t.registration.inviteFriendsOnNexus.replace('{count}', String(friendsOnNexus.length))}
                </span>
              </div>
            )}

            {/* Contact cards */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {contacts.slice(0, 50).map((contact) => {
                const isOnNexus = friendsOnNexus.includes(contact.id);
                const isSelected = selectedIds.includes(contact.id);

                return (
                  <button
                    key={contact.id}
                    onClick={() => !isOnNexus && toggleContact(contact.id)}
                    disabled={isOnNexus}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-start ${
                      isSelected
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : isOnNexus
                        ? 'bg-surface opacity-60'
                        : 'bg-surface active:scale-[0.99]'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background: isOnNexus
                          ? 'var(--color-primary)'
                          : 'linear-gradient(135deg, #94a3b8, #64748b)',
                      }}
                    >
                      {isOnNexus ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                          check
                        </span>
                      ) : (
                        contact.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name & detail */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {contact.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {isOnNexus
                          ? (isHe ? 'כבר בנקסוס ✓' : 'Already on Nexus ✓')
                          : (contact.phones[0] || contact.emails[0] || '')}
                      </p>
                    </div>

                    {/* Checkbox */}
                    {!isOnNexus && (
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'wght' 600" }}>
                            check
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Send invite to selected */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleSendInvite}
                className="w-full mt-3 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  send
                </span>
                {t.registration.inviteSendInvite}
                <span className="text-xs opacity-70">
                  ({t.registration.inviteSelected.replace('{count}', String(selectedIds.length))})
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </OnboardingSlideLayout>
  );
}
