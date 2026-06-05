import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useUser } from '../hooks/useUser';

/**
 * SplitBillPage — "Split bill" screen reached from the checkout's
 * "Split this order between people" card. Lets the payer choose who shares the
 * order and shows each person's share. Rebuilt from the provided split-bill
 * mockup in the nexus design language (RTL, app frame).
 */

interface Participant {
  id: string;
  name: string;
  selected: boolean;
  you?: boolean;
  avatar?: string;
  initial?: string;
  color?: string;
}

/** Distribute `total` across `n` people in whole agorot, summing exactly. */
function splitAmounts(total: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
}

const fmt = (n: number) => `₪${n.toFixed(2)}`;

export default function SplitBillPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { data: user } = useUser();

  const navState = location.state as { total?: number } | null;
  const total = Math.max(0, navState?.total ?? 0);

  const youName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (isHe ? 'אני' : 'You');

  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'you', name: youName, selected: true, you: true, avatar: user?.avatar },
    { id: 'p1', name: isHe ? 'אלכס' : 'Alex', selected: true, initial: isHe ? 'א' : 'A', color: '#00c2cb' },
    { id: 'p2', name: isHe ? 'יותם' : 'Jordan', selected: true, initial: isHe ? 'י' : 'J', color: '#7c5cff' },
  ]);
  const [tab, setTab] = useState<'amount' | 'percent' | 'share'>('amount');
  // Per-person manual overrides (₪); the rest split the remainder equally.
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Map each selected participant to a share amount (summing to total).
  // Overridden people keep their amount; the remainder is split equally.
  const shares = useMemo(() => {
    const selected = participants.filter((p) => p.selected);
    const map: Record<string, number> = {};
    let remainingCents = Math.round(total * 100);
    const autoIds: string[] = [];
    selected.forEach((p) => {
      const ov = overrides[p.id];
      if (ov != null) {
        map[p.id] = ov;
        remainingCents -= Math.round(ov * 100);
      } else {
        autoIds.push(p.id);
      }
    });
    const auto = splitAmounts(Math.max(0, remainingCents) / 100, autoIds.length);
    autoIds.forEach((id, i) => { map[id] = auto[i]; });
    return map;
  }, [participants, total, overrides]);

  const editingParticipant = participants.find((p) => p.id === editingId) ?? null;

  const toggle = (id: string) =>
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));

  // Add a participant — from the device contacts where available, else a guest.
  const addFromContacts = async () => {
    type ContactInfo = { name?: string[] };
    type ContactsManager = { select: (props: string[], opts?: { multiple?: boolean }) => Promise<ContactInfo[]> };
    const contacts = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
    let name = isHe ? 'אורח/ת' : 'Guest';
    if (contacts?.select) {
      try {
        const [picked] = await contacts.select(['name'], { multiple: false });
        if (picked?.name?.[0]) name = picked.name[0];
      } catch { /* cancelled */ }
    }
    const palette = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#06b6d4'];
    setParticipants((prev) => [
      ...prev,
      {
        id: `p${prev.length + 1}-${name}`,
        name,
        selected: true,
        initial: name.trim().charAt(0),
        color: palette[prev.length % palette.length],
      },
    ]);
  };

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'amount', label: isHe ? 'סכום' : 'Amount' },
    { id: 'percent', label: isHe ? 'אחוז' : 'Percent' },
    { id: 'share', label: isHe ? 'חלק' : 'Share' },
  ];

  return (
    <div className="relative min-h-dvh flex flex-col bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Decorative gradient glow — identical to the gift / home page wash. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0">
        <div
          className="w-full h-full opacity-[0.18]"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label={isHe ? 'חזרה' : 'Back'}
          className="mb-4 inline-flex active:opacity-60 transition-opacity"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 26 }}>
            {isHe ? 'arrow_forward' : 'arrow_back'}
          </span>
        </button>
        <h1 className="text-3xl font-extrabold text-text-primary">
          {isHe ? 'פיצול חשבון' : 'Split bill'}
        </h1>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 px-6 space-y-6 overflow-y-auto pb-6">
        {/* Payment summary */}
        <div className="bg-primary/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">
                  {youName.charAt(0)}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{youName}</p>
              <p className="text-xs text-text-muted">{isHe ? 'שילמת' : 'You paid'}</p>
            </div>
          </div>
          <span className="text-xl font-bold text-text-primary">{fmt(total)}</span>
        </div>

        {/* Segmented control */}
        <div className="flex gap-3 items-center text-sm font-medium">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                tab === t.id ? 'bg-bg-dark text-white' : 'text-text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Participants list */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-4 min-w-0">
                <input
                  type="checkbox"
                  checked={p.selected}
                  onChange={() => toggle(p.id)}
                  className="split-checkbox"
                />
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: p.color ?? '#635bff' }}
                  >
                    {p.initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary truncate">{p.name}</p>
                  {!p.you && <p className="text-xs text-text-muted">{isHe ? 'חייב/ת לך' : 'Owes you'}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(p.id)}
                disabled={!p.selected}
                className={`font-semibold text-text-primary border-b border-border pb-0.5 active:opacity-60 transition-opacity ${p.selected ? '' : 'opacity-30'}`}
              >
                {fmt(p.selected ? shares[p.id] ?? 0 : 0)}
              </button>
            </div>
          ))}

          {/* Add from contacts */}
          <button
            type="button"
            onClick={addFromContacts}
            className="w-full flex items-center gap-4 p-4 active:bg-surface transition-colors text-start"
          >
            <span className="w-[18px]" />
            <span className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted shrink-0">
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>add</span>
            </span>
            <span className="font-medium text-primary">{isHe ? 'הוספה מאנשי הקשר' : 'Add from contacts'}</span>
          </button>
        </div>
      </main>

      {/* Footer — button matches the gift / checkout primary action. */}
      <footer className="relative z-10 p-6 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full bg-bg-dark text-white py-4 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
        >
          {isHe ? 'פצל עם הקבוצה' : 'Split with group'}
        </button>
        <div className="mt-8 flex justify-center">
          <div className="w-32 h-1 bg-border rounded-full" />
        </div>
      </footer>

      {/* Edit a participant's amount — bottom sheet (budget-sheet structure). */}
      <AmountSheet
        open={editingId !== null}
        isHe={isHe}
        name={editingParticipant?.name}
        initial={editingId ? shares[editingId] ?? 0 : 0}
        onClose={() => setEditingId(null)}
        onSave={(amt) => {
          if (editingId) setOverrides((o) => ({ ...o, [editingId]: amt }));
          setEditingId(null);
        }}
      />
    </div>
  );
}

/** Bottom sheet to edit one person's amount — mirrors the budget amount sheet. */
function AmountSheet({
  open,
  isHe,
  name,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  isHe: boolean;
  name?: string;
  initial: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    setAmount(initial ? String(initial) : '');
    const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(id);
    };
  }, [open, initial]);

  const handleSave = () => {
    const parsed = parseFloat(amount);
    onSave(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/40"
          />
          <motion.div
            key="sheet"
            dir={isHe ? 'rtl' : 'ltr'}
            initial={{ y: '120%' }}
            animate={{ y: 0 }}
            exit={{ y: '120%' }}
            transition={{ type: 'spring', stiffness: 500, damping: 42 }}
            className="fixed bottom-6 inset-x-0 mx-auto z-[100] w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] bg-white rounded-[28px] pb-8 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="px-5">
              <div className="flex items-center justify-between py-3">
                <span className="w-6" />
                <h2 className="text-lg font-bold text-text-primary">{isHe ? 'עריכת סכום' : 'Edit amount'}</h2>
                <button type="button" onClick={onClose} aria-label={isHe ? 'סגירה' : 'Close'} className="p-1 text-text-primary">
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>close</span>
                </button>
              </div>

              {name && (
                <p className="text-sm text-text-muted mb-3 text-start">
                  {isHe ? `הסכום של ${name}` : `${name}'s share`}
                </p>
              )}

              <div className="bg-surface rounded-2xl p-4">
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-3xl font-bold text-text-muted shrink-0">₪</span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 8))}
                    placeholder="0"
                    className="flex-1 min-w-0 bg-transparent text-3xl font-bold text-text-primary text-left focus:outline-none placeholder:text-text-muted/40"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-4 bg-bg-dark text-white font-bold rounded-full active:scale-[0.98] transition-transform"
                >
                  {isHe ? 'שמירה' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
