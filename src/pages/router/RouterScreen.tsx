/**
 * Post-login chooser. Visual design adapted from
 * `features/stories/SlideSelectOrg.tsx` (the original mock-auth-era
 * org picker): hero copy + a single selection row that opens a
 * scrollable bottom sheet with fuzzy search, plus a secondary
 * "can't find my organization" path that surfaces the join-request
 * flow. The original component's transliteration + fuzzy matching is
 * reused verbatim so HE/EN search behaves the same.
 *
 * Router functionality is preserved end-to-end:
 *   - Nexus-Catalog (ecosystem) is pinned as the default selection.
 *   - The user's member tenants follow Nexus in the sheet.
 *   - "Continue" navigates to /:lang/store?tenant=<id> for a tenant
 *     or /:lang/store?ecosystem=1 for Nexus.
 *   - Admin-entry is a small dashboard handoff button below the
 *     primary action (only when /api/me.router.showAdminEntry).
 *   - "I can't find my organization" opens a secondary sheet with
 *     a "Request to join an organization" CTA (when showJoinRequest)
 *     and a "Continue with Nexus" shortcut.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 7 and 9
 */
import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

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

// ── Internal option shape ──────────────────────────────────────────
interface PickerOption {
  /** 'nexus' for the ecosystem option, tenantId otherwise. */
  id: string;
  /** Localized display name. */
  name: string;
  /** Two-letter fallback initials when no logo is set. */
  initials: string;
  /** Solid background color behind the logo / initials. */
  color: string;
  /** Optional logo asset (white-filtered inline by the avatar tile). */
  logo?: string;
  /** True for the Nexus-Catalog ecosystem option. */
  isNexus: boolean;
}

/** Initials helper used when a tenant has no logo (which is currently every tenant). */
function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return [...trimmed].slice(0, 2).join('').toUpperCase();
}

/** Stable hash → color, so the same tenant gets the same tile color across loads. */
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

  // Selected option lives in state so the picker sheet can update it
  // without committing a navigation. Default = Nexus-Catalog (matches
  // SlideSelectOrg's default of NEXUS_ORG).
  const [selectedId, setSelectedId] = useState<string>('nexus');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const dragY = useRef(0);

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

  // Build the picker option list. Nexus-Catalog pinned first when the
  // backend says the ecosystem option is available, then the user's
  // real tenant memberships. Tenants without a configured logo fall
  // back to deriveInitials + colorFor so the avatar still renders.
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
    // Soft warm gradient backdrop drawn from the stories page palette
    // (#ffb74d → #ff91b8 → #9c88ff), heavily faded to a 5% tint so the
    // page reads as "white with a warm aura" rather than purple-coded.
    // Two ambient rotating blobs add motion without dominating - same
    // 12s linear rotation rhythm used in InsightsPage.
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,183,77,0.08) 0%, rgba(255,145,184,0.08) 50%, rgba(156,136,255,0.08) 100%), #ffffff',
      }}
    >
      {/* Ambient rotating blobs - taken from the stories page rhythm.
          They sit behind everything (-z-10 would clip in flex), so we
          mark them aria-hidden and let pointer events fall through. */}
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

        {/* ── Left column on desktop: hero text ── */}
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
            className="text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl lg:leading-relaxed"
          >
            {isHe
              ? 'בחר ארגון שאליו ברצונך להיכנס או המשך עם קטלוג נקסוס'
              : 'Pick the organization you want to enter, or continue with the Nexus catalog'}
          </motion.p>

          {r.showAdminEntry && (
            <motion.button
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5 }}
              onClick={() => { void openAdminDashboard(); }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline lg:mt-8 lg:text-base"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_new</span>
              <span>{isHe ? 'פתח לוח בקרה לאדמין' : 'Open admin dashboard'}</span>
            </motion.button>
          )}
        </motion.div>

        {/* ── Right column on desktop: action group ── */}
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

      {/* ── Sheet: org list ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onPointerDown={(e) => { dragY.current = e.clientY; }}
              onPointerUp={(e) => { if (e.clientY - dragY.current > 40) setSheetOpen(false); }}
              onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-xl lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
              style={{ maxHeight: '82vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 60) setSheetOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex-shrink-0 px-5 pb-3 sm:px-8">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">
                  {isHe ? 'בחר ארגון' : 'Choose an organization'}
                </h2>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      fontSize: 18,
                      color: 'var(--color-text-muted)',
                      [isHe ? 'right' : 'left']: 12,
                    } as React.CSSProperties}
                  >
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={isHe ? 'חיפוש ארגון...' : 'Search organization...'}
                    className="w-full rounded-2xl border-2 border-border bg-surface py-3 text-sm outline-none transition-colors focus:border-primary sm:py-4 sm:text-base"
                    style={{
                      [isHe ? 'paddingRight' : 'paddingLeft']: 40,
                      [isHe ? 'paddingLeft' : 'paddingRight']: 16,
                      color: 'var(--color-text-primary)',
                    } as React.CSSProperties}
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
                <div className="space-y-2 pb-4 sm:space-y-3">
                  {filtered.length === 0 ? (
                    <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                      {isHe ? 'לא נמצאו ארגונים' : 'No organizations found'}
                    </p>
                  ) : (
                    filtered.map((opt, i) => {
                      const isPicked = selectedId === opt.id;
                      return (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          onClick={() => handlePick(opt)}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all sm:gap-4 sm:px-5 sm:py-4"
                          style={{
                            // Slate-coded selected state instead of the
                            // old purple #635bff so the picker matches
                            // the page's new neutral palette.
                            background: isPicked ? 'rgba(15,23,42,0.04)' : '#fff',
                            border: isPicked ? '2px solid #0f172a' : '2px solid #ebebf0',
                          }}
                        >
                          <div
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                            style={{ background: opt.color }}
                          >
                            {opt.logo ? (
                              <img
                                src={opt.logo}
                                alt=""
                                className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                                style={{ filter: 'brightness(0) invert(1)' }}
                              />
                            ) : (
                              opt.initials
                            )}
                          </div>
                          <span
                            className="flex-1 text-sm font-semibold sm:text-base"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {opt.name}
                          </span>
                          {isPicked ? (
                            <span
                              className="material-symbols-outlined flex-shrink-0 text-slate-900"
                              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                          ) : (
                            <span
                              className="material-symbols-outlined flex-shrink-0 text-text-muted"
                              style={{ fontSize: 18 }}
                            >
                              {isHe ? 'chevron_left' : 'chevron_right'}
                            </span>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sheet: org not found ── */}
      <AnimatePresence>
        {notFoundOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); }}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex min-h-[180px] w-full max-w-xl flex-col rounded-t-3xl bg-white px-5 pb-10 pt-3 shadow-2xl sm:min-h-[220px] sm:max-w-xl sm:px-8 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:px-10 lg:pb-10 lg:pt-6"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 40) setNotFoundOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex cursor-grab justify-center">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="flex w-full flex-1 flex-col gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotFoundOpen(false);
                    void navigate(`/${lang}/wallet/join-tenant`);
                  }}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition-all active:scale-[0.98] sm:py-4 sm:text-base"
                >
                  {isHe ? 'בקש להצטרף לארגון' : 'Request to join an organization'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotFoundOpen(false);
                    setSelectedId('nexus');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 transition-all active:scale-[0.98] sm:py-4"
                >
                  <span
                    className="text-sm font-semibold sm:text-base"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {isHe ? 'המשך עם' : 'Continue with'}
                  </span>
                  <img
                    src="/nexus-logo-black.png"
                    alt="Nexus"
                    className="object-contain"
                    style={{ height: 20, maxWidth: 100, objectPosition: 'center' }}
                  />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
