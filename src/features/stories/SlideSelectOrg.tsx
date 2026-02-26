import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrgInfo } from './types';
import { MOCK_ORGS, NEXUS_ORG } from './constants';

interface SlideSelectOrgProps {
  onSelect: (org: OrgInfo) => void;
  onSkip: () => void;
}

// ── Fuzzy search helpers ──────────────────────────────────────────────────────
const EN_TO_HE: Record<string, string> = {
  a:'א', b:'ב', v:'ב', g:'ג', d:'ד', h:'ה', w:'ו', z:'ז',
  x:'ח', t:'ט', y:'י', k:'כ', l:'ל', m:'מ', n:'נ', s:'ס',
  e:'ע', p:'פ', f:'פ', c:'צ', q:'ק', r:'ר',
};

const transliterate = (str: string) =>
  str.toLowerCase()
    .replace(/sh/g,'ש').replace(/th/g,'ת').replace(/ch/g,'כ').replace(/tz/g,'צ').replace(/ts/g,'צ')
    .replace(/kh/g,'כ').replace(/ph/g,'פ')
    .split('').map(c => EN_TO_HE[c] ?? c).join('');

const norm = (s: string) =>
  s.toLowerCase().replace(/[\u05b0-\u05c7]/g,'').replace(/['"]/g,'').trim();

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
  if (nameWords.some(w => w.startsWith(q) || w.startsWith(qHe))) return true;
  if (fuzzyScore(name, q) >= 0.7 || fuzzyScore(name, qHe) >= 0.7) return true;
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
export function SlideSelectOrg({ onSelect, onSkip }: SlideSelectOrgProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('nexus');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const dragY = useRef(0);

  const allOrgs = [NEXUS_ORG, ...MOCK_ORGS];
  const selectedOrg = allOrgs.find(o => o.id === selectedId) ?? NEXUS_ORG;
  const filtered = allOrgs.filter(o => matchOrg(o, search));

  const handlePick = (org: OrgInfo) => {
    if (!org.available) return;
    setSelectedId(org.id);
    setSheetOpen(false);
  };

  const handleContinue = () => {
    onSelect(selectedOrg);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-t-2xl overflow-hidden" dir="rtl">

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col px-6 pt-20">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-hebrew)' }}>ארגון</p>
          <h1 className="text-2xl font-semibold leading-relaxed mb-1" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-hebrew)' }}>מצא את הארגון שלך</h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-hebrew)' }}>חפש את מקום העבודה או הארגון שלך</p>
        </motion.div>

        {/* Selection row */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-right transition-all bg-surface"
          style={{ border: '1.5px solid #e0e0eb' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-xs text-white"
            style={{ background: selectedOrg.color }}>
            {selectedOrg.logo
              ? <img src={selectedOrg.logo} alt={selectedOrg.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              : selectedOrg.initials}
          </div>
          <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{selectedOrg.name}</span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>expand_more</span>
        </motion.button>
      </div>

      {/* ── Continue + not-found buttons ── */}
      <div className="flex-shrink-0 px-6 pb-10 pt-4 space-y-3">
        <button
          onClick={(e) => { e.stopPropagation(); handleContinue(); }}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          המשך
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setNotFoundOpen(true); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface border border-border active:scale-[0.98] transition-all"
        >
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>לא מוצא את הארגון שלי</span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>chevron_left</span>
        </button>
      </div>

      {/* ── Sheet: org list ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onPointerDown={(e) => { dragY.current = e.clientY; }}
              onPointerUp={(e) => { if (e.clientY - dragY.current > 40) setSheetOpen(false); }}
              onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-white"
              style={{ maxHeight: '82%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 60) setSheetOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex-shrink-0 px-5 pb-3">
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-hebrew)' }}>בחר ארגון</h2>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ fontSize: '18px', color: 'var(--color-text-muted)', right: '12px' }}>search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="חיפוש ארגון..."
                    className="w-full py-3 rounded-2xl outline-none text-sm border-2 border-border focus:border-primary transition-colors bg-surface"
                    style={{ paddingRight: '40px', paddingLeft: '16px', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 min-h-0">
                <div className="space-y-2 pb-4">
                  {filtered.length === 0 ? (
                    <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>לא נמצאו ארגונים</p>
                  ) : (
                    filtered.map((org, i) => {
                      const isPicked = selectedId === org.id;
                      return (
                        <motion.button key={org.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          onClick={() => handlePick(org)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-right transition-all"
                          style={{
                            background: isPicked ? 'rgba(99,91,255,0.06)' : '#fff',
                            border: isPicked ? '2px solid #635bff' : '2px solid #ebebf0',
                            opacity: org.available ? 1 : 0.5,
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-xs text-white"
                            style={{ background: org.color }}>
                            {org.logo
                              ? <img src={org.logo} alt={org.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                              : org.initials}
                          </div>
                          <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{org.name}</span>
                          {!org.available ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.35)' }}>בקרוב</span>
                          ) : isPicked ? (
                            <span className="material-symbols-outlined flex-shrink-0 text-primary"
                              style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined flex-shrink-0 text-text-muted"
                              style={{ fontSize: '18px' }}>chevron_left</span>
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

      {/* ── Sheet: org not found (~20vh) ── */}
      <AnimatePresence>
        {notFoundOpen && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-white px-5 pb-10 pt-3"
              style={{ height: '22%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 40) setNotFoundOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-3 cursor-grab">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {/* Attach org — purple */}
                <button
                  onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); onSkip(); }}
                  className="w-full py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center text-xs font-semibold text-white shadow-md shadow-primary/20"
                  style={{ background: 'var(--color-primary)' }}
                >
                  צרף את הארגון שלי
                </button>
                {/* Continue with Nexus — white */}
                <button
                  onClick={(e) => { e.stopPropagation(); setNotFoundOpen(false); setSelectedId('nexus'); }}
                  className="w-full py-3 rounded-xl border border-border active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>המשך עם</span>
                  <img src="/nexus-logo-black.png" alt="Nexus" className="object-contain" style={{ height: '18px', maxWidth: '90px', objectPosition: 'center' }} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
