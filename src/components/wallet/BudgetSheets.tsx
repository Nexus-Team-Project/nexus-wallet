import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, ChevronRight, ChevronLeft, BarChart3, Calendar } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Reusable bottom sheet wrapper — handles the dark scrim, the slide-up
 * animation, and the iOS-style drag handle at the top. Render any content
 * inside; padding and the bottom safe-area are managed by the caller.
 */
function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 500, damping: 42 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[100] bg-white rounded-t-[32px] pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 1 — "More" settings sheet
// ─────────────────────────────────────────────────────────────────────────

export interface BudgetConfig {
  amount: number | null;
  cycle: { mode: 'calendar' } | { mode: 'salary'; startDay: number };
}

/** Formats the active monthly-cycle window as a human-friendly date range. */
function describeCycle(cycle: BudgetConfig['cycle'], isRTL: boolean): string {
  const now = new Date();
  if (cycle.mode === 'calendar') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${formatShort(start, isRTL)} – ${formatShort(end, isRTL)}`;
  }
  // Salary month: ends on (startDay - 1) of this month if today is past
  // startDay, otherwise on (startDay - 1) of this month and starts at
  // startDay of last month.
  const day = cycle.startDay;
  let start: Date, end: Date;
  if (now.getDate() >= day) {
    start = new Date(now.getFullYear(), now.getMonth(), day);
    end = new Date(now.getFullYear(), now.getMonth() + 1, day - 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, day);
    end = new Date(now.getFullYear(), now.getMonth(), day - 1);
  }
  return `${formatShort(start, isRTL)} – ${formatShort(end, isRTL)}`;
}

function formatShort(d: Date, isRTL: boolean): string {
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

interface BudgetSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onOpenBudget: () => void;
  onOpenCycle: () => void;
}

/**
 * "More" sheet — exposes both budget configuration entry points (amount
 * and cycle). Each row navigates into its own sub-sheet.
 */
export function BudgetSettingsSheet({
  open,
  onClose,
  config,
  onOpenBudget,
  onOpenCycle,
}: BudgetSettingsSheetProps) {
  const { t, isRTL } = useLanguage();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const budgetSubtitle =
    config.amount !== null
      ? t.wallet.monthlyBudgetSubtitleCurrent.replace(
          '{amount}',
          config.amount.toString(),
        )
      : t.wallet.monthlyBudgetSubtitleSet;
  const cycleSubtitle = describeCycle(config.cycle, isRTL);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5">
        <div className="flex items-center mt-3 mb-5 relative">
          <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-text-primary">
            {t.wallet.moreSheetTitle}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`p-1 text-text-primary ${isRTL ? 'mr-auto' : 'ml-auto'}`}
          >
            <X size={22} strokeWidth={2.4} />
          </button>
        </div>

        <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-white/70">
          <button
            type="button"
            onClick={onOpenBudget}
            className="w-full flex items-center gap-4 p-4 hover:bg-border/30 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={22} strokeWidth={1.8} className="text-text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-[15px] font-semibold text-text-primary">
                {t.wallet.monthlyBudgetTitle}
              </p>
              <p className="text-[13px] text-text-muted">{budgetSubtitle}</p>
            </div>
            <Chevron size={18} strokeWidth={2.4} className="text-text-muted" />
          </button>

          <button
            type="button"
            onClick={onOpenCycle}
            className="w-full flex items-center gap-4 p-4 hover:bg-border/30 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Calendar size={22} strokeWidth={1.8} className="text-text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-[15px] font-semibold text-text-primary">
                {t.wallet.monthlyCycleTitle}
              </p>
              <p className="text-[13px] text-text-muted">{cycleSubtitle}</p>
            </div>
            <Chevron size={18} strokeWidth={2.4} className="text-text-muted" />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-32 h-1.5 bg-black rounded-full opacity-0" />
        </div>
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 2 — Set monthly cycle
// ─────────────────────────────────────────────────────────────────────────

interface CycleSheetProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  initial: BudgetConfig['cycle'];
  onSave: (cycle: BudgetConfig['cycle']) => void;
}

/**
 * Cycle sheet — calendar month vs. salary month. When salary is chosen, a
 * horizontal day-of-month picker appears for selecting the salary date.
 */
export function MonthlyCycleSheet({ open, onClose, onBack, initial, onSave }: CycleSheetProps) {
  const { t, isRTL } = useLanguage();
  const [mode, setMode] = useState<'calendar' | 'salary'>(initial.mode);
  const [salaryStartDay, setSalaryStartDay] = useState<number>(
    initial.mode === 'salary' ? initial.startDay : 25,
  );

  // Reset local state when the sheet is reopened with a different value.
  useEffect(() => {
    if (open) {
      setMode(initial.mode);
      setSalaryStartDay(initial.mode === 'salary' ? initial.startDay : 25);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (mode === 'calendar') onSave({ mode: 'calendar' });
    else onSave({ mode: 'salary', startDay: salaryStartDay });
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const currentWindow =
    mode === 'salary'
      ? describeCycle({ mode: 'salary', startDay: salaryStartDay }, isRTL)
      : describeCycle({ mode: 'calendar' }, isRTL);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5">
        <div className="flex items-center justify-between py-3">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1 text-text-primary">
            <BackIcon size={22} />
          </button>
          <h2 className="text-lg font-bold text-text-primary">
            {t.wallet.setMonthlyCycleTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-text-primary">
            <X size={22} strokeWidth={2.4} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          {/* Option: Calendar month */}
          <button
            type="button"
            onClick={() => setMode('calendar')}
            className={`w-full p-4 bg-surface rounded-2xl border transition-colors text-start ${
              mode === 'calendar' ? 'border-text-primary/20' : 'border-transparent'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                <Calendar size={22} strokeWidth={1.8} className="text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{t.wallet.calendarMonth}</p>
                <p className="text-sm text-text-muted">{t.wallet.calendarMonthDesc}</p>
              </div>
              <div className="pt-1 flex-shrink-0">
                <RadioDot active={mode === 'calendar'} />
              </div>
            </div>
          </button>

          {/* Option: Salary month — expanded UI when selected */}
          <div
            className={`w-full p-4 bg-surface rounded-2xl border transition-colors ${
              mode === 'salary' ? 'border-text-primary/20' : 'border-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode('salary')}
              className="w-full flex items-start gap-4 text-start"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '22px' }}>
                  payments
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{t.wallet.salaryMonth}</p>
                <p className="text-sm text-text-muted leading-tight">
                  {t.wallet.salaryMonthDesc}
                </p>
              </div>
              <div className="pt-1 flex-shrink-0">
                <RadioDot active={mode === 'salary'} />
              </div>
            </button>

            {mode === 'salary' && (
              <div className="mt-4">
                <span className="inline-block px-3 py-1 bg-border/70 rounded-full text-xs font-semibold text-text-primary">
                  {currentWindow}
                </span>
                <hr className="my-4 border-border" />
                <p className="text-[11px] text-text-muted leading-tight">
                  {t.wallet.cycleWeekendNotice}
                </p>
                <DayOfMonthPicker
                  selected={salaryStartDay}
                  onSelect={setSalaryStartDay}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 bg-bg-dark text-white font-bold rounded-full active:scale-[0.98] transition-transform"
          >
            {t.wallet.save}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center ${
        active ? 'bg-text-primary' : 'border-2 border-border'
      }`}
    >
      {active && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
  );
}

/**
 * Horizontal scroll of days 1-31. Selected day is filled, others are
 * outlined. The list auto-scrolls so the selected day stays in view.
 */
function DayOfMonthPicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (day: number) => void;
}) {
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar py-1" dir="ltr">
      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
        const isSel = day === selected;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
              isSel
                ? 'bg-text-primary text-white'
                : 'bg-white border border-border text-text-primary hover:bg-border/30'
            }`}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 3 — Set monthly budget amount
// ─────────────────────────────────────────────────────────────────────────

interface BudgetAmountSheetProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  initial: number | null;
  onSave: (amount: number | null) => void;
}

export function MonthlyBudgetSheet({ open, onClose, onBack, initial, onSave }: BudgetAmountSheetProps) {
  const { t, isRTL } = useLanguage();
  const [amount, setAmount] = useState<string>(initial?.toString() ?? '');

  useEffect(() => {
    if (open) setAmount(initial?.toString() ?? '');
  }, [open, initial]);

  const handleSave = () => {
    const parsed = parseInt(amount, 10);
    onSave(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5">
        <div className="flex items-center justify-between py-3">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1 text-text-primary">
            <BackIcon size={22} />
          </button>
          <h2 className="text-lg font-bold text-text-primary">
            {t.wallet.setMonthlyBudgetTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-text-primary">
            <X size={22} strokeWidth={2.4} />
          </button>
        </div>

        <div className="bg-surface rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-text-muted" dir="ltr">
              ₪
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 7))}
              placeholder={t.wallet.budgetAmountPlaceholder}
              className="flex-1 bg-transparent text-3xl font-bold text-text-primary focus:outline-none placeholder:text-text-muted/40"
              dir="ltr"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={!amount}
            className={`w-full py-4 font-bold rounded-full transition-all ${
              amount
                ? 'bg-bg-dark text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t.wallet.save}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
