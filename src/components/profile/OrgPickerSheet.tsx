import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { lookupTenantByOrg } from '../../mock/handlers/tenant.handler';
import { MOCK_ORGS, NEXUS_ORG } from '../../features/stories/constants';
import type { OrgInfo } from '../../features/stories/types';

/**
 * Bottom-sheet org switcher — same searchable list the auth flow shows
 * in SlideSelectOrg, repackaged as a portal-mounted sheet that opens
 * from anywhere in the app (currently the org pill on the profile
 * page). Picking an org updates the auth store (organizationName) and
 * loads the matching tenant config when one exists.
 *
 * Matching logic mirrors SlideSelectOrg's "fuzzy + transliterate" so the
 * same English-typed Hebrew names ("Selcom" → "סלקום") resolve here too.
 */

// ── Fuzzy search helpers (copy of SlideSelectOrg's algorithm) ────────
const EN_TO_HE: Record<string, string> = {
  a: 'א', b: 'ב', v: 'ב', g: 'ג', d: 'ד', h: 'ה', w: 'ו', z: 'ז',
  x: 'ח', t: 'ט', y: 'י', k: 'כ', l: 'ל', m: 'מ', n: 'נ', s: 'ס',
  e: 'ע', p: 'פ', f: 'פ', c: 'צ', q: 'ק', r: 'ר',
};

const transliterate = (str: string) =>
  str.toLowerCase()
    .replace(/sh/g, 'ש').replace(/th/g, 'ת').replace(/ch/g, 'כ')
    .replace(/tz/g, 'צ').replace(/ts/g, 'צ').replace(/kh/g, 'כ').replace(/ph/g, 'פ')
    .split('').map((c) => EN_TO_HE[c] ?? c).join('');

const norm = (s: string) =>
  s.toLowerCase().replace(/[ְ-ׇ]/g, '').replace(/['"]/g, '').trim();

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

const matchOrg = (org: { name: string }, raw: string): boolean => {
  if (!raw) return true;
  const q = norm(raw);
  const qHe = norm(transliterate(raw));
  const name = norm(org.name);
  const nameWords = name.split(/\s+/);
  if (name.includes(q) || name.includes(qHe)) return true;
  if (nameWords.some((w) => w.startsWith(q) || w.startsWith(qHe))) return true;
  if (fuzzyScore(name, q) >= 0.7 || fuzzyScore(name, qHe) >= 0.7) return true;
  return false;
};

interface OrgPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrgPickerSheet({ isOpen, onClose }: OrgPickerSheetProps) {
  const { isRTL } = useLanguage();
  const currentOrgName = useAuthStore((s) => s.organizationName);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setTenant = useTenantStore((s) => s.setTenant);
  const [search, setSearch] = useState('');
  const dragY = useRef(0);

  const allOrgs: OrgInfo[] = [NEXUS_ORG, ...MOCK_ORGS];
  const filtered = allOrgs.filter((o) => matchOrg(o, search));

  const handlePick = (org: OrgInfo) => {
    if (!org.available) return;
    setOrganization(org.name);
    // If the org maps to a tenant config, swap branding/copy too — same
    // behavior the login flow uses when an org member signs in.
    if (org.tenantId) {
      const orgTenant = lookupTenantByOrg(org.tenantId);
      if (orgTenant) setTenant(orgTenant.id, orgTenant);
    }
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <>
        {/* Scrim — tap to dismiss. Drag-down also dismisses via the sheet. */}
        <motion.div
          key="scrim"
          className="fixed inset-0 z-[70] bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Floating sheet — doesn't touch screen edges */}
        <div className="fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <motion.div
          key="sheet"
          className="pointer-events-auto flex flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden"
          style={{ maxHeight: '82vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onPointerDown={(e) => { dragY.current = e.clientY; }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 60) onClose();
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Title + search */}
          <div className="flex-shrink-0 px-5 pb-3">
            <h2 className="text-lg font-semibold mb-3 text-text-primary">
              {isRTL ? 'בחר ארגון' : 'Choose organization'}
            </h2>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
                style={{
                  fontSize: 18,
                  // Search icon sits at the leading edge in both writing modes.
                  [isRTL ? 'right' : 'left']: 12,
                }}
              >
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRTL ? 'חיפוש ארגון...' : 'Search organizations...'}
                className="w-full py-3 rounded-2xl outline-none text-sm border-2 border-border focus:border-primary transition-colors bg-surface text-text-primary"
                style={{
                  [isRTL ? 'paddingRight' : 'paddingLeft']: 40,
                  [isRTL ? 'paddingLeft' : 'paddingRight']: 16,
                }}
              />
            </div>
          </div>

          {/* Org list */}
          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            <div className="space-y-2 pb-6">
              {filtered.length === 0 ? (
                <p className="text-center text-sm py-8 text-text-muted">
                  {isRTL ? 'לא נמצאו ארגונים' : 'No organizations found'}
                </p>
              ) : (
                filtered.map((org, i) => {
                  const isPicked = currentOrgName === org.name;
                  return (
                    <motion.button
                      key={org.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => handlePick(org)}
                      disabled={!org.available}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                      style={{
                        background: isPicked ? 'rgba(99,91,255,0.06)' : '#fff',
                        border: isPicked ? '2px solid #635bff' : '2px solid #ebebf0',
                        opacity: org.available ? 1 : 0.5,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-xs text-white"
                        style={{ background: org.color }}
                      >
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="w-6 h-6 object-contain"
                            style={{ filter: 'brightness(0) invert(1)' }}
                          />
                        ) : (
                          org.initials
                        )}
                      </div>
                      <span className="flex-1 text-start font-semibold text-sm text-text-primary truncate">
                        {org.name}
                      </span>
                      {!org.available ? (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.35)' }}
                        >
                          {isRTL ? 'בקרוב' : 'Soon'}
                        </span>
                      ) : isPicked ? (
                        <span
                          className="material-symbols-outlined flex-shrink-0 text-primary"
                          style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      ) : (
                        <span
                          className="material-symbols-outlined flex-shrink-0 text-text-muted"
                          style={{ fontSize: 18 }}
                        >
                          {isRTL ? 'chevron_left' : 'chevron_right'}
                        </span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body,
  );
}
