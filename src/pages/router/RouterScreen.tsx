/**
 * Post-login chooser. Visual design adapted from
 * `features/stories/SlideSelectOrg.tsx`: hero copy + a single selection
 * row that opens a scrollable bottom sheet with fuzzy HE/EN
 * transliteration search, plus a secondary "can't find" path that
 * surfaces the join-request flow.
 *
 * Now also includes a `<RouterHeroExplainer />` block that brings the
 * ReferralStoriesPage visual language (bobbing floating brand logos +
 * staggered value-prop pills) so users see WHAT the wallet does before
 * they pick a context. The whole picker + sheets are split across
 * sibling files in components/router/ to keep this file under the
 * 350-line cap.
 *
 * Router functionality is preserved end-to-end:
 *   - Nexus-Catalog (ecosystem) is pinned as the default selection.
 *   - The user's member tenants follow Nexus in the sheet.
 *   - Continue navigates to /:lang/store?tenant=<id> or ?ecosystem=1.
 *   - Admin-entry is a discreet inline link below the selection row.
 *   - "I can't find my organization" opens the not-found sheet.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 7 and 9
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';
import RouterHeroExplainer from '../../components/router/RouterHeroExplainer';
import RouterPickerSheet, {
  type PickerOption,
} from '../../components/router/RouterPickerSheet';
import RouterNotFoundSheet from '../../components/router/RouterNotFoundSheet';

// ── Fuzzy search helpers (verbatim from SlideSelectOrg) ─────────────
const EN_TO_HE: Record<string, string> = {
  a:'א', b:'ב', v:'ב', g:'ג', d:'ד', h:'ה', w:'ו', z:'ז',
  x:'ח', t:'ט', y:'י', k:'כ', l:'ל', m:'מ', n:'נ', s:'ס',
  e:'ע', p:'פ', f:'פ', c:'צ', q:'ק', r:'ר',
};

const transliterate = (str: string) =>
  str.toLowerCase()
    .replace(/sh/g,'ש').replace(/th/g,'ת').replace(/ch/g,'כ').replace(/tz/g,'צ').replace(/ts/g,'צ')
    .replace(/kh/g,'כ').replace(/ph/g,'פ')
    .split('').map((c) => EN_TO_HE[c] ?? c).join('');

const norm = (s: string) =>
  s.toLowerCase().replace(/[ְ-ׇ]/g,'').replace(/['"]/g,'').trim();

const fuzzyScore = (text: string, q: string): number => {
  if (!q) return 1;
  let ti = 0, matched = 0;
  for (let qi = 0; qi < q.length; qi++) {
    while (ti < text.length && text[ti] !== q[qi]) ti++;
    if (ti >= text.length) break;
    matched++; ti++;
  }
  return matched / q.length;
};

const matchOrg = (orgName: string, raw: string): boolean => {
  if (!raw) return true;
  const q = norm(raw);
  const qHe = norm(transliterate(raw));
  const name = norm(orgName);
  const nameWords = name.split(/\s+/);
  if (name.includes(q) || name.includes(qHe)) return true;
  if (nameWords.some((w) => w.startsWith(q) || w.startsWith(qHe))) return true;
  if (fuzzyScore(name, q) >= 0.7 || fuzzyScore(name, qHe) >= 0.7) return true;
  return false;
};

/** Two-letter initials fallback when a tenant has no logo. */
function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return [...trimmed].slice(0, 2).join('').toUpperCase();
}

/** Stable hash → color so the same tenant always renders the same tile. */
function colorFor(name: string): string {
  const PALETTE = [
    '#1e40af', '#059669', '#F97316', '#DC2626', '#2563EB',
    '#16A34A', '#CA8A04', '#0D9488', '#7C3AED', '#0284C7',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

export default function RouterScreen() {
  const { me, loading } = useAuth();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const NEXUS_OPTION: PickerOption = useMemo(() => ({
    id: 'nexus',
    name: isHe ? 'קטלוג נקסוס' : 'Nexus-Catalog',
    initials: 'NX',
    color: '#635bff',
    logo: '/nexus-icon.png',
    isNexus: true,
  }), [isHe]);

  const [selectedId, setSelectedId] = useState<string>('nexus');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center text-text-muted">
        {isHe ? 'טוען...' : 'Loading...'}
      </div>
    );
  }
  if (!me?.router) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center text-text-muted">
        {isHe ? 'יש להתחבר תחילה' : 'Please log in first'}
      </div>
    );
  }

  const r = me.router;

  const tenantOptions: PickerOption[] = r.showMemberTenants.map((t) => ({
    id: t.tenantId,
    name: t.tenantName,
    initials: deriveInitials(t.tenantName),
    color: colorFor(t.tenantName),
    isNexus: false,
  }));
  const allOptions: PickerOption[] = r.showEveryonesCatalog
    ? [NEXUS_OPTION, ...tenantOptions]
    : tenantOptions;

  const selectedOption =
    allOptions.find((o) => o.id === selectedId) ?? allOptions[0] ?? NEXUS_OPTION;

  const filtered = allOptions.filter((o) => matchOrg(o.name, search));

  const handlePick = (opt: PickerOption): void => {
    setSelectedId(opt.id);
    setSheetOpen(false);
  };

  const handleContinue = (): void => {
    if (selectedOption.isNexus) {
      void navigate(`/${lang}/store?ecosystem=1`);
    } else {
      void navigate(`/${lang}/store?tenant=${selectedOption.id}`);
    }
  };

  async function openAdminDashboard(): Promise<void> {
    try {
      const code = await api<{ code: string }>('/api/auth/create-code', { method: 'POST' });
      const dashboardUrl =
        (import.meta.env.VITE_DASHBOARD_URL as string | undefined) ?? 'http://localhost:5174';
      window.location.href = `${dashboardUrl}/auth/callback?code=${code.code}&redirect=/&lang=${lang}`;
    } catch {
      // Stay on the router; user can pick another option.
    }
  }

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,183,77,0.08) 0%, rgba(255,145,184,0.08) 50%, rgba(156,136,255,0.08) 100%), #ffffff',
      }}
    >
      {/* Ambient rotating blobs - same rhythm used in InsightsPage. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at 30% 30%, #ffb74d, transparent 60%)' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at 70% 70%, #ff91b8, transparent 60%)' }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 pb-10 pt-16 sm:px-10 sm:pt-20 lg:flex-row lg:items-center lg:gap-24 lg:px-16 lg:py-24">

        {/* ── Left column: explainer + hero ── */}
        <motion.div
          className="lg:flex-1 lg:max-w-xl"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
        >
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-3 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.1]"
          >
            {isHe ? 'מצא את הארגון שלך' : 'Find your organization'}
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8 text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl lg:mb-10 lg:leading-relaxed"
          >
            {isHe
              ? 'בחר ארגון שאליו ברצונך להיכנס או המשך עם קטלוג נקסוס'
              : 'Pick the organization you want to enter, or continue with the Nexus catalog'}
          </motion.p>

          {/* Animated explainer: floating brands + value-prop pills */}
          <RouterHeroExplainer isHe={isHe} />

          {/* Admins who ALSO hold a plain-member role in some other
              tenant get the small inline link - the picker on the
              right is their primary action and the dashboard is a
              secondary affordance. */}
          {r.showAdminEntry && r.showMemberTenants.length > 0 && (
            <motion.button
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, delay: 1.2 }}
              onClick={() => { void openAdminDashboard(); }}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline lg:text-base"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_new</span>
              <span>{isHe ? 'פתח לוח בקרה לאדמין' : 'Open admin dashboard'}</span>
            </motion.button>
          )}
        </motion.div>

        {/* ── Right column: action group ── */}
        <motion.div
          className="mt-10 flex flex-col gap-4 lg:mt-0 lg:flex-1 lg:max-w-md"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
          }}
        >
          <motion.button
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-start shadow-sm backdrop-blur transition-all hover:border-slate-300 sm:gap-4 sm:px-5 sm:py-5 lg:py-6"
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold text-white sm:h-12 sm:w-12 lg:h-14 lg:w-14 lg:text-base"
              style={{ background: selectedOption.color }}
            >
              {selectedOption.logo ? (
                <img
                  src={selectedOption.logo}
                  alt=""
                  className="h-7 w-7 object-contain sm:h-8 sm:w-8 lg:h-9 lg:w-9"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              ) : (
                selectedOption.initials
              )}
            </div>
            <span className="flex-1 text-base font-semibold text-slate-900 sm:text-lg">
              {selectedOption.name}
            </span>
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 24 }}>
              expand_more
            </span>
          </motion.button>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); handleContinue(); }}
            className="w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all sm:py-5 sm:text-lg lg:py-6 lg:text-xl"
          >
            {isHe ? 'המשך' : 'Continue'}
          </motion.button>

          {/* Admins with NO member-role tenant (the common case for
              tenant admins/owners) get a prominent "Return to your
              dashboard" CTA instead of the small inline link above.
              For them the dashboard IS the primary surface; the
              picker collapses to just Nexus-Catalog, so without this
              promotion the dashboard entry would be a near-invisible
              underline link easy to miss. */}
          {r.showAdminEntry && r.showMemberTenants.length === 0 && (
            <motion.button
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); void openAdminDashboard(); }}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur transition-all hover:border-slate-300 sm:px-5 sm:py-4 lg:py-5"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>open_in_new</span>
                {isHe ? 'חזרה ללוח הבקרה שלך' : 'Return to your dashboard'}
              </span>
              <span
                className="material-symbols-outlined text-slate-400"
                style={{ fontSize: 22 }}
              >
                {isHe ? 'chevron_left' : 'chevron_right'}
              </span>
            </motion.button>
          )}

          {r.showJoinRequest && (
            <motion.button
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); setNotFoundOpen(true); }}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur transition-all hover:border-slate-300 sm:px-5 sm:py-4 lg:py-5"
            >
              <span className="text-sm text-slate-600 sm:text-base lg:text-lg">
                {isHe ? 'לא מוצא את הארגון שלי' : "Can't find my organization"}
              </span>
              <span
                className="material-symbols-outlined text-slate-400"
                style={{ fontSize: 22 }}
              >
                {isHe ? 'chevron_left' : 'chevron_right'}
              </span>
            </motion.button>
          )}
        </motion.div>
      </div>

      <RouterPickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isHe={isHe}
        options={allOptions}
        filtered={filtered}
        selectedId={selectedId}
        search={search}
        setSearch={setSearch}
        onPick={handlePick}
      />

      <RouterNotFoundSheet
        open={notFoundOpen}
        onClose={() => setNotFoundOpen(false)}
        isHe={isHe}
        onRequestJoin={() => {
          setNotFoundOpen(false);
          void navigate(`/${lang}/wallet/join-tenant`);
        }}
        onContinueWithNexus={() => {
          setNotFoundOpen(false);
          setSelectedId('nexus');
        }}
      />
    </div>
  );
}
