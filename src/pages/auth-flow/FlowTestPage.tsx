/**
 * FlowTestPage — דף טסט לבדיקת ה-Auth Flows
 * גש אליו ב: /:lang/auth-flow/test
 *
 * מסמלץ את 3 מצבי הזיהוי בלי להצטרך לעבור דרך Google/Phone Auth.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide } from '../../utils/onboardingNavigation';
import { useTenantStore } from '../../stores/tenantStore';
import { mockTenants } from '../../mock/data/tenants.mock';
import { queryClient } from '../../App';
import { __devSetVouchersError } from '../../api/vouchers.api';

export default function FlowTestPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();


  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const resetRegistration = useRegistrationStore((s) => s.resetRegistration);
  const setTenant = useTenantStore((s) => s.setTenant);
  const clearTenant = useTenantStore((s) => s.clearTenant);
  const tenantId = useTenantStore((s) => s.tenantId);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // tenant עם דמי חבר (למשל acme-corp) — לסימולציית flow עם ?tenant=
  const tenantWithFee = mockTenants['acme-corp'];

  // ─── Pre-provisioned toggle ───────────────────────────────────────────
  const isPreProvisioned = !!orgMember;
  const togglePreProvisioned = () => {
    if (isPreProvisioned) {
      clearTenant();
      useRegistrationStore.setState({ orgMember: null });
    } else {
      const hapoelTenant = mockTenants['hapoel-ta'];
      if (hapoelTenant) setTenant(hapoelTenant.id, hapoelTenant);
      useRegistrationStore.setState({
        orgMember: {
          organizationId: 'org-2',
          organizationName: 'הפועל תל אביב',
          firstName: 'יוסי',
          lastName: 'כהן',
        },
      });
    }
  };

  // reset ללא firebaseSignOut — כדי לא להפעיל את onAuthStateChanged
  // שיקרא logout() שוב ב-async ויאפס את ה-state באמצע הניווט
  const reset = () => {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      userId: null,
      authMethod: null,
      isOrgMember: false,
      organizationName: null,
      marketingConsent: false,
      profileCompleted: false,
      avatarUrl: null,
    });
    resetRegistration();
    clearTenant();
  };

  // ─── Section Error Demo ───────────────────────────────────────────────
  /** Forces vouchers to fail so ActiveOffers + NearYou show SectionError */
  const simulateSectionError = () => {
    // 1. Tell the API layer to reject all future getAll() calls
    __devSetVouchersError(true);
    // 2. Temporarily disable retries so the error shows immediately (not after 2 attempts)
    queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 1000 * 60 * 5 } });
    // 3. Remove cached data so TanStack Query re-fetches (and hits the error)
    queryClient.removeQueries({ queryKey: ['vouchers'] });
    // 4. Navigate home — the re-fetch happens there, isError becomes true
    navigate(`/${lang}`);
  };

  /** Clears the error flag and refreshes voucher queries */
  const resetSectionError = () => {
    __devSetVouchersError(false);
    // Restore normal retry settings
    queryClient.setDefaultOptions({ queries: { retry: 1, staleTime: 1000 * 60 * 5 } });
    queryClient.resetQueries({ queryKey: ['vouchers'] });
    navigate(`/${lang}`);
  };

  // ─── Tenant Flows ────────────────────────────────────────────────────
  /** מגדיר tenant ומסמלץ כניסה */
  const setupTenant = () => {
    if (tenantWithFee) {
      setTenant(tenantWithFee.id, tenantWithFee);
    }
  };

  /** Flow tenant #1 — משתמש קיים ללא ארגון → דף הבית ישיר */
  const simulateTenantExisting = () => {
    reset();
    setupTenant();
    login({
      token: 'mock-token-cid-existing',
      userId: 'user-cid-existing-001',
      method: 'google',
      isOrgMember: false,
      firstName: 'רז',
    });
    useAuthStore.getState().setProfileCompleted(true);
    setTimeout(() => navigate(`/${lang}?flow=existed-user`), 50);
  };

  /** Flow tenant #2 — משתמש קיים עם ארגון (profileCompleted=true) */
  const simulateTenantExistingOrg = () => {
    reset();
    setupTenant();
    login({
      token: 'mock-token-cid-existing-org',
      userId: 'user-cid-existing-org-002',
      method: 'google',
      isOrgMember: true,
      organizationName: tenantWithFee?.nameHe ?? 'הארגון',
      firstName: 'רז',
    });
    useAuthStore.getState().setProfileCompleted(true);
    // משתמש קיים — ישירות לדף הבית, בלי WelcomeOrg
    setTimeout(() => navigate(`/${lang}?flow=existed-user`), 50);
  };

  /** Flow tenant #3 — משתמש חדש */
  const simulateTenantNewUser = () => {
    reset();
    setupTenant();
    login({
      token: 'mock-token-cid-new',
      userId: 'user-cid-new-003',
      method: 'phone',
      isOrgMember: false,
    });
    startRegistration({
      path: tenantWithFee?.requiresMembershipFee ? 'tenant-with-fee' : 'tenant-no-fee',
      phone: '050-0000001',
      missingFields: ['firstName', 'lastName', 'email', 'birthday'],
    });
    setTimeout(() => navigate(`/${lang}/auth-flow/new-user`), 50);
  };

  // ─── Flow 1: Existing User ───────────────────────────────────────────
  const simulateExistingUser = () => {
    reset();
    login({
      token: 'mock-token-existing',
      userId: 'user-existing-123',
      method: 'google',
      isOrgMember: false,
    });
    // Existing user — no registration needed, go straight to home
    navigate(`/${lang}?flow=existed-user`);
  };

  const simulateExistingOrgUser = () => {
    reset();
    login({
      token: 'mock-token-existing-org',
      userId: 'user-existing-org-456',
      method: 'google',
      isOrgMember: true,
      organizationName: 'סלקום',
      firstName: 'רז',
    });
    useAuthStore.getState().setProfileCompleted(true);
    // משתמש קיים — ישירות לדף הבית, בלי WelcomeOrg
    setTimeout(() => navigate(`/${lang}?flow=existed-user`), 50);
  };

  // ─── Flow 2: New User ─────────────────────────────────────────────────
  /** Google/Apple sign-in — phone is missing, name+email known */
  const simulateNewUserGoogle = () => {
    reset();
    login({
      token: 'mock-token-new-google',
      userId: 'user-new-google-789',
      method: 'google',
      isOrgMember: false,
      firstName: 'רז',
    });
    startRegistration({
      path: 'new-user',
      phone: '',
      missingFields: ['phone', 'firstName', 'lastName', 'email', 'birthday'],
      returnTo: `/${lang}`,
    });
    navigate(`/${lang}/auth-flow/new-user`);
  };

  /** Phone OTP sign-in — phone known, name+email missing */
  const simulateNewUserOTP = () => {
    reset();
    login({
      token: 'mock-token-new-otp',
      userId: 'user-new-otp-790',
      method: 'phone',
      isOrgMember: false,
    });
    startRegistration({
      path: 'new-user',
      phone: '050-1234567',
      missingFields: ['firstName', 'lastName', 'email', 'birthday'],
      returnTo: `/${lang}`,
    });
    navigate(`/${lang}/auth-flow/new-user`);
  };

  // ─── Flow 3: Pre-provisioned (Org) ────────────────────────────────────
  /** Google/Apple sign-in — phone missing, org has name */
  const simulatePreProvisionedGoogle = () => {
    reset();
    const hapoelTenant = mockTenants['hapoel-ta'];
    if (hapoelTenant) setTenant(hapoelTenant.id, hapoelTenant);
    login({
      token: 'mock-token-org-google',
      userId: 'user-org-google-101',
      method: 'google',
      isOrgMember: true,
      organizationName: 'הפועל תל אביב',
    });
    startRegistration({
      path: 'org-member-incomplete',
      phone: '',
      orgMember: {
        organizationId: 'org-2',
        organizationName: 'הפועל תל אביב',
        firstName: 'יוסי',
        lastName: 'כהן',
      },
      missingFields: ['phone', 'email', 'birthday'],
      returnTo: `/${lang}`,
    });
    setTimeout(() => navigate(`/${lang}/auth-flow/new-user`), 50);
  };

  /** Phone OTP sign-in — phone known, org has name */
  const simulatePreProvisionedOTP = () => {
    reset();
    const hapoelTenant = mockTenants['hapoel-ta'];
    if (hapoelTenant) setTenant(hapoelTenant.id, hapoelTenant);
    login({
      token: 'mock-token-org-otp',
      userId: 'user-org-otp-102',
      method: 'phone',
      isOrgMember: true,
      organizationName: 'הפועל תל אביב',
    });
    startRegistration({
      path: 'org-member-incomplete',
      phone: '052-9876543',
      orgMember: {
        organizationId: 'org-2',
        organizationName: 'הפועל תל אביב',
        firstName: 'יוסי',
        lastName: 'כהן',
      },
      missingFields: ['email', 'birthday'],
      returnTo: `/${lang}`,
    });
    setTimeout(() => navigate(`/${lang}/auth-flow/new-user`), 50);
  };

  return (
    <div
      className="min-h-dvh w-full max-w-md mx-auto bg-surface flex flex-col px-5 py-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-full text-xs font-bold mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            bug_report
          </span>
          DEV ONLY
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary mb-1">בדיקת Auth Flows</h1>
        <p className="text-sm text-text-muted">
          לחץ על כפתור כדי לסמלץ סוג משתמש ולראות את ה-Flow המתאים
        </p>
      </div>

      {/* Current state */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-6 text-xs font-mono text-text-secondary">
        <p className="font-bold text-text-primary mb-1">מצב נוכחי:</p>
        <p>
          מחובר:{' '}
          <span className={isAuthenticated ? 'text-success' : 'text-error'}>
            {isAuthenticated ? '✅ כן' : '❌ לא'}
          </span>
        </p>
      </div>

      {/* ── tenant badge גלובלי ── */}
      <div className="flex items-center justify-between mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 font-mono">
        <span>🔑 Tenant עם דמי חבר: <strong>{tenantWithFee?.nameHe ?? '—'}</strong></span>
        <span className="opacity-60">?tenant={tenantWithFee?.id ?? '—'}</span>
      </div>
      {tenantId && (
        <div className="mb-4 px-3 py-1.5 bg-success/10 rounded-xl text-xs text-success font-semibold">
          ✅ Tenant פעיל: {tenantId}
        </div>
      )}

      {/* ── Pre-provisioned toggle ── */}
      <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white rounded-2xl border border-border" dir="rtl">
        <div>
          <p className="text-sm font-bold text-text-primary">פרה-פרויזנד (orgMember)</p>
          <p className="text-xs text-text-muted">
            {isPreProvisioned ? 'הפועל תל אביב · יוסי כהן' : 'ללא שיוך לארגון'}
          </p>
        </div>
        <button
          onClick={togglePreProvisioned}
          className="relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors"
          style={{ background: isPreProvisioned ? '#dc2626' : '#e2e8f0' }}
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
            style={{ transform: isPreProvisioned ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* Flow 1 */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold">1</div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Flow 1 — משתמש קיים</h2>
            <p className="text-xs text-text-muted">Welcome back + redirect אוטומטי</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={simulateExistingUser} className="w-full py-3 rounded-xl bg-success text-white text-sm font-semibold active:scale-[0.98] transition-all">
            👤 משתמש קיים (ללא ארגון)
          </button>
          <button onClick={simulateExistingOrgUser} className="w-full py-3 rounded-xl bg-success/80 text-white text-sm font-semibold active:scale-[0.98] transition-all">
            🏢 משתמש קיים + ארגון (סלקום) → דף הבית
          </button>
          {/* ── עם ?tenant= ── */}
          <div className="border-t border-dashed border-orange-200 pt-2 flex flex-col gap-2">
            <p className="text-[10px] text-orange-400 font-bold">+ עם ?tenant=</p>
            <button onClick={simulateTenantExisting} className="w-full py-3 rounded-xl text-white text-sm font-semibold active:scale-[0.98] transition-all" style={{ background: tenantWithFee?.primaryColor }}>
              👤 קיים ללא ארגון + tenant → Welcome Back (נקסוס)
            </button>
            <button onClick={simulateTenantExistingOrg} className="w-full py-3 rounded-xl text-white text-sm font-semibold active:scale-[0.98] transition-all opacity-80" style={{ background: tenantWithFee?.primaryColor }}>
              🏢 קיים עם ארגון + tenant → דף הבית
            </button>
          </div>
        </div>
      </div>

      {/* Flow 2 */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Flow 2 — משתמש חדש</h2>
            <p className="text-xs text-text-muted">Welcome → איך הגעת → (ארגון) → השלמת פרטים</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={simulateNewUserGoogle} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.98] transition-all">
            🔵 חדש — Google/Apple (טלפון חסר)
          </button>
          <button onClick={simulateNewUserOTP} className="w-full py-3 rounded-xl bg-primary/80 text-white text-sm font-semibold active:scale-[0.98] transition-all">
            📱 חדש — OTP (טלפון ידוע)
          </button>
          {/* ── עם ?tenant= ── */}
          <div className="border-t border-dashed border-orange-200 pt-2 flex flex-col gap-2">
            <p className="text-[10px] text-orange-400 font-bold">+ עם ?tenant=</p>
            <button onClick={simulateTenantNewUser} className="w-full py-3 rounded-xl border-2 text-sm font-semibold active:scale-[0.98] transition-all" style={{ borderColor: tenantWithFee?.primaryColor, color: tenantWithFee?.primaryColor }}>
              🆕 חדש + ?tenant= → Welcome Nexus → דף התאמה → רישום
            </button>
          </div>
        </div>
      </div>

      {/* Flow 3 */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-accent-cyan/20 flex items-center justify-center text-primary text-xs font-bold">3</div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Flow 3 — Pre-provisioned</h2>
            <p className="text-xs text-text-muted">נמצא ברשומות הארגון → Welcome Nexus → דף התאמה → השלמת פרטים</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={simulatePreProvisionedGoogle} className="w-full py-3 rounded-xl bg-text-primary text-white text-sm font-semibold active:scale-[0.98] transition-all">
            🔵 Pre-provisioned — Google/Apple (טלפון חסר)
          </button>
          <button onClick={simulatePreProvisionedOTP} className="w-full py-3 rounded-xl bg-text-primary/80 text-white text-sm font-semibold active:scale-[0.98] transition-all">
            📱 Pre-provisioned — OTP (טלפון ידוע)
          </button>
          {/* ── עם ?tenant= ── */}
          <div className="border-t border-dashed border-orange-200 pt-2 flex flex-col gap-2">
            <p className="text-[10px] text-orange-400 font-bold">+ עם ?tenant=</p>
            <button onClick={simulateTenantNewUser} className="w-full py-3 rounded-xl border-2 text-sm font-semibold active:scale-[0.98] transition-all" style={{ borderColor: tenantWithFee?.primaryColor, color: tenantWithFee?.primaryColor }}>
              🏅 Pre-provisioned + ?tenant= → Welcome Nexus → דף התאמה → רישום
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Flow Demo */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">🎓</div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Onboarding Flow (חדש)</h2>
            <p className="text-xs text-text-muted">בדיקת שקפי האונבורדינג שנבנו</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* Phone OTP user — phone known, email missing → starts at verify-email */}
          <button
            onClick={() => {
              reset();
              login({ token: 'tok-ob-phone', userId: 'usr-ob-phone', method: 'phone', isOrgMember: false });
              startRegistration({ path: 'new-user', phone: '050-1234567', missingFields: ['firstName', 'lastName', 'email', 'birthday'], returnTo: `/${lang}` });
              navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
            }}
            className="w-full py-3 rounded-xl bg-purple-500 text-white text-sm font-semibold active:scale-[0.98] transition-all"
          >
            📱 OTP user → first-name → last-name → verify-email → consents → ...
          </button>
          {/* Google user — name+email known, phone missing → starts at verify-phone */}
          <button
            onClick={() => {
              reset();
              login({ token: 'tok-ob-google', userId: 'usr-ob-google', method: 'google', isOrgMember: false, firstName: 'שירה' });
              startRegistration({ path: 'new-user', phone: '', missingFields: ['phone'], returnTo: `/${lang}` });
              useRegistrationStore.getState().setProfileData({ firstName: 'שירה', lastName: 'לוי', email: 'shira@example.com' });
              navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(useRegistrationStore.getState())}`);
            }}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold active:scale-[0.98] transition-all"
          >
            🔵 Google user → verify-phone → consents → ...
          </button>
          {/* Org member — name+phone known, email unknown → starts at consents */}
          <button
            onClick={() => {
              reset();
              login({ token: 'tok-ob-org', userId: 'usr-ob-org', method: 'phone', isOrgMember: true, organizationName: 'הפועל ת"א', firstName: 'יוסי' });
              startRegistration({ path: 'org-member-incomplete', phone: '052-9876543', orgMember: { organizationId: 'org-1', organizationName: 'הפועל ת"א', firstName: 'יוסי', lastName: 'כהן' }, missingFields: [], returnTo: `/${lang}` });
              useRegistrationStore.getState().setProfileData({ firstName: 'יוסי', lastName: 'כהן', email: 'yossi@hapoel.co.il' });
              navigate(`/${lang}/register/onboarding/consents`);
            }}
            className="w-full py-3 rounded-xl bg-purple-700 text-white text-sm font-semibold active:scale-[0.98] transition-all"
          >
            🏢 Org member → consents (ישיר)
          </button>
          {/* Direct links to each slide */}
          <div className="border-t border-dashed border-purple-200 pt-2">
            <p className="text-[10px] text-purple-400 font-bold mb-2">קפיצה ישירה לשקף:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'verify-phone', path: 'verify-phone' },
                { label: 'first-name',   path: 'first-name' },
                { label: 'verify-email', path: 'verify-email' },
                { label: 'consents', path: 'consents' },
                { label: 'purpose', path: 'purpose' },
                { label: 'life-stage', path: 'life-stage' },
                { label: 'birthday', path: 'birthday' },
                { label: 'gender', path: 'gender' },
                { label: 'benefit-categories', path: 'benefit-categories' },
                { label: 'invite-friends',    path: 'invite-friends' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => {
                    // Ensure registration is active so RegistrationGuard lets through
                    if (!useRegistrationStore.getState().isRegistering) {
                      login({ token: 'tok-dev', userId: 'usr-dev', method: 'google', isOrgMember: false });
                      startRegistration({ path: 'new-user', phone: '', missingFields: ['phone'], returnTo: `/${lang}` });
                    }
                    navigate(`/${lang}/register/onboarding/${path}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-semibold active:scale-95 transition-all text-center"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Error Demo */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center text-error text-xs font-bold">!</div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Error States Demo</h2>
            <p className="text-xs text-text-muted">בדיקת מצב שגיאה בסקשנים של דף הבית</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={simulateSectionError}
            className="w-full py-3 rounded-xl bg-error text-white text-sm font-semibold active:scale-[0.98] transition-all"
          >
            💥 הדמה שגיאת טעינה (ActiveOffers + NearYou)
          </button>
          <button
            onClick={resetSectionError}
            className="w-full py-3 rounded-xl bg-surface border border-border text-text-muted text-sm font-semibold active:scale-[0.98] transition-all"
          >
            ↩️ שחזר — בטל שגיאת דמו
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full py-3 rounded-xl border-2 border-border text-text-muted text-sm font-semibold hover:border-error hover:text-error transition-all active:scale-[0.98]"
      >
        🔄 Reset — נקה state
      </button>

    </div>
  );
}
