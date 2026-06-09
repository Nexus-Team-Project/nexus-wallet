/**
 * EditProfilePage - lets a logged-in member view and edit every profile field
 * they would have filled in during the onboarding slide chain (which they may
 * have skipped). Prefills from /api/me (me.profile), tracks unsaved changes, and
 * flushes only the changed fields through the wallet profile API.
 *
 * Reuses the exact field UIs from the onboarding slides (SelectionCard for
 * gender + life stage, ConsentToggleCard for marketing consent, the PurposeSlide
 * chip pattern for purpose) so this screen feels like part of the same flow.
 *
 * Backend boundary: every persistent change goes through
 * src/services/walletProfile.service.ts -> /api/v1/wallet/*. No direct DB access.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../lib/appToast';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import SelectionCard from '../components/ui/SelectionCard';
import ConsentToggleCard from '../components/ui/ConsentToggleCard';
import SettingsHeader from '../components/layout/SettingsHeader';
import PurposeSection from '../components/profile/edit/PurposeSection';
import DeleteAccountCard from '../components/profile/edit/DeleteAccountCard';
import InviteFriendsCard from '../components/profile/edit/InviteFriendsCard';
import PhoneSection from '../components/profile/edit/PhoneSection';
import {
  type GenderValue,
  normaliseGender,
  maxBirthday,
  INPUT_CLASS,
  CARD_CLASS,
  SECTION_LABEL_CLASS,
} from '../components/profile/edit/editProfile.constants';
import {
  saveWalletProfile,
  saveMarketingConsent,
  type WalletProfilePatch,
} from '../services/walletProfile.service';

/**
 * Edit Profile screen. AppLayout already supplies the overlay back-TopBar for
 * this non-home route, so the page renders only its scrollable content plus a
 * sticky Save bar.
 */
export default function EditProfilePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { me, reload } = useAuth();
  const isHe = language === 'he';

  const profile = me?.profile ?? null;

  // ── Prefilled baseline (memoised from the loaded profile) ──────────────────
  const initial = useMemo(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      birthday: profile?.birthday ? profile.birthday.split('T')[0] : '',
      gender: normaliseGender(profile?.gender),
      lifeStage: profile?.lifeStage ?? null,
      purpose: profile?.purpose ?? [],
    }),
    [profile],
  );

  // ── Local editable state ───────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [birthday, setBirthday] = useState(initial.birthday);
  const [gender, setGender] = useState<GenderValue | null>(initial.gender);
  const [lifeStage, setLifeStage] = useState<string | null>(initial.lifeStage);
  const [purpose, setPurpose] = useState<string[]>(initial.purpose);
  // Marketing consent is not exposed by /api/me, so it defaults OFF and is only
  // persisted when the user actively toggles it.
  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const genderOptions: Array<{ value: GenderValue; emoji: string; label: string }> = [
    { value: 'male', emoji: '👨', label: t.registration.genderMale },
    { value: 'female', emoji: '👩', label: t.registration.genderFemale },
    { value: 'prefer_not_to_say', emoji: '😊', label: t.registration.genderPreferNot },
  ];
  const lifeStageOptions = [
    { value: 'just-me', emoji: '🧍', label: t.registration.lifeStageJustMe },
    { value: 'relationship', emoji: '👫', label: t.registration.lifeStageRelationship },
    { value: 'kids', emoji: '👨‍👩‍👧‍👦', label: t.registration.lifeStageKids },
  ];

  /** Toggle a purpose chip id in/out of the selection. */
  const togglePurpose = (id: string) =>
    setPurpose((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const purposeChanged =
    purpose.length !== initial.purpose.length ||
    purpose.some((id) => !initial.purpose.includes(id));

  const dirty =
    firstName !== initial.firstName ||
    lastName !== initial.lastName ||
    birthday !== initial.birthday ||
    gender !== initial.gender ||
    lifeStage !== initial.lifeStage ||
    purposeChanged ||
    consentTouched;

  /**
   * Builds a patch containing only the fields that changed from the prefilled
   * baseline, persists it, optionally records the consent change, refreshes
   * /api/me, then navigates back to the profile page.
   */
  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const patch: WalletProfilePatch = {};
      if (firstName !== initial.firstName) patch.firstName = firstName.trim();
      if (lastName !== initial.lastName) patch.lastName = lastName.trim();
      if (birthday !== initial.birthday) patch.birthday = birthday;
      if (gender !== initial.gender && gender) patch.gender = gender;
      if (lifeStage !== initial.lifeStage && lifeStage) patch.lifeStage = lifeStage;
      if (purposeChanged) patch.purpose = purpose;

      if (Object.keys(patch).length > 0) {
        await saveWalletProfile(patch);
      }
      if (consentTouched) {
        await saveMarketingConsent(consent, 'wallet_settings');
      }
      await reload();
      appToast.success(t.profile.editSavedToast);
      navigate(-1);
    } catch (err) {
      console.error('[edit-profile] save failed:', err);
      appToast.error(t.profile.editFailedToast);
      setSaving(false);
    }
  };

  const align = isHe ? 'text-right' : 'text-left';

  return (
    <div className="animate-fade-in pb-28">
      {/* Minimal back + title bar (replaces the heavy overlay TopBar here). */}
      <SettingsHeader title={t.profile.editProfileTitle} />

      <div className="px-4 space-y-5 pt-4">
      {/* 1. Name */}
      <section className={CARD_CLASS}>
        <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionName}</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="ep-first" className="block text-xs text-text-muted mb-1.5">
              {t.registration.firstNameLabel}
            </label>
            <input
              id="ep-first"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="ep-last" className="block text-xs text-text-muted mb-1.5">
              {t.registration.lastNameLabel}
            </label>
            <input
              id="ep-last"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* Phone — add/update with OTP; propagates to the user's tenant rows. */}
      <section className={CARD_CLASS}>
        <h2 className={SECTION_LABEL_CLASS}>{t.profile.phone}</h2>
        <PhoneSection />
      </section>

      {/* 2. Birthday */}
      <section className={CARD_CLASS}>
        <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionBirthday}</h2>
        <label htmlFor="ep-birthday" className="block text-xs text-text-muted mb-1.5">
          {t.registration.birthdayLabel}
        </label>
        <input
          id="ep-birthday"
          type="date"
          dir="ltr"
          value={birthday}
          max={maxBirthday()}
          onChange={(e) => setBirthday(e.target.value)}
          autoComplete="bday"
          aria-label={t.registration.birthdayLabel}
          className={`${INPUT_CLASS} text-center`}
        />
      </section>

      {/* 3. About you - gender + household */}
      <section className={CARD_CLASS}>
        <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionAbout}</h2>

        <p className={`text-xs text-text-muted mb-2.5 ${align}`}>
          {t.profile.editSectionGender}
        </p>
        <div className="space-y-2.5">
          {genderOptions.map((opt) => (
            <SelectionCard
              key={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              selected={gender === opt.value}
              onClick={() => setGender(opt.value)}
              multiSelect={false}
            />
          ))}
        </div>

        <div className="my-4 border-t border-border/60" />

        <p className={`text-xs text-text-muted mb-2.5 ${align}`}>
          {t.profile.editSectionHousehold}
        </p>
        <div className="space-y-2.5">
          {lifeStageOptions.map((opt) => (
            <SelectionCard
              key={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              selected={lifeStage === opt.value}
              onClick={() => setLifeStage(opt.value)}
              multiSelect={false}
            />
          ))}
        </div>
      </section>

      {/* 4. How you'll use it (purpose) */}
      <PurposeSection selected={purpose} onToggle={togglePurpose} />

      {/* 5. Notifications - marketing consent */}
      <section className={CARD_CLASS}>
        <h2 className={SECTION_LABEL_CLASS}>{t.profile.editSectionNotifications}</h2>
        <ConsentToggleCard
          icon="campaign"
          title={t.registration.marketingConsentTitle}
          description={t.registration.marketingConsentDesc}
          checked={consent}
          onChange={(val) => {
            setConsent(val);
            setConsentTouched(true);
          }}
        />
        <p className="text-xs text-text-muted mt-2 leading-relaxed">
          {t.profile.editConsentNote}
        </p>
      </section>

      {/* 6. Invite friends - present but non-functional (Soon) */}
      <InviteFriendsCard />

      {/* 7. Delete account - disabled placeholder (Soon) */}
      <DeleteAccountCard />
      </div>

      {/* Sticky Save bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-bg-light/95 backdrop-blur border-t border-border/60 px-4 py-3">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="w-full bg-primary text-white rounded-2xl py-3.5 font-semibold shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {saving ? t.profile.editSaving : t.profile.editSave}
          </button>
        </div>
      </div>
    </div>
  );
}
