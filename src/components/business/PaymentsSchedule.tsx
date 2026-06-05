import { useLanguage } from '../../i18n/LanguageContext';

/**
 * PaymentsSchedule — a horizontal slide of sub-cards, one per installment.
 * Each is a pie circle showing cumulative progress, with the amount charged
 * and when it's charged (first today, then every two weeks). Shared between
 * the payments-plan sheet (selection) and the checkout card (confirmed view).
 */

interface PaymentsScheduleProps {
  currency: string;
  total: number;
  count: number;
  /** Smaller circles/typography for the inline card view. */
  compact?: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function PaymentsSchedule({ currency, total, count, compact = false }: PaymentsScheduleProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  const fmt = (n: number) =>
    `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Split the total into `count` installments; the last absorbs the rounding
  // remainder so the parts always sum back to the total.
  const per = round2(total / count);
  const amounts = Array.from({ length: count }, (_, i) =>
    i === count - 1 ? round2(total - per * (count - 1)) : per,
  );

  const whenLabel = (i: number) => {
    if (i === 0) return isHe ? 'היום' : 'Today';
    const weeks = i * 2;
    if (isHe) return weeks === 2 ? 'בעוד שבועיים' : `בעוד ${weeks} שבועות`;
    return `In ${weeks} weeks`;
  };

  const circle = compact ? 'w-9 h-9' : 'w-11 h-11';
  const cardW = compact ? 'w-[76px]' : 'w-[88px]';
  const amountCls = compact ? 'text-[13px]' : 'text-sm';

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x scroll-px-1 pb-1">
      {amounts.map((amt, i) => {
        const frac = (i + 1) / count;
        return (
          <div
            key={i}
            className={`flex-none snap-start ${cardW} rounded-2xl bg-surface px-3 py-3 flex flex-col items-center text-center`}
          >
            <span
              className={`${circle} rounded-full mb-2`}
              style={{ background: `conic-gradient(#635bff ${frac * 360}deg, #dcdde6 0deg)` }}
              aria-hidden
            />
            <span className={`block ${amountCls} font-bold text-text-primary leading-none`}>{fmt(amt)}</span>
            <span className="block text-[11px] text-text-muted mt-1 leading-tight">{whenLabel(i)}</span>
          </div>
        );
      })}
    </div>
  );
}
