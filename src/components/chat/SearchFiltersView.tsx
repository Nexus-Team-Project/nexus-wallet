import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher, VoucherCategory } from '../../types/voucher.types';

// Filter summary view, shown in the chat content area once the user has
// search results and pulls the recommendations sheet back down. Based on
// the food-app filters mockup: header sentence with inline picked chips,
// horizontal cuisine row, service toggle, sort/filter list.

interface SearchFiltersViewProps {
  vouchers: Voucher[];
  selectedCategory?: VoucherCategory | 'all';
  onCategoryChange?: (cat: VoucherCategory | 'all') => void;
}

const CATEGORY_LABELS: Record<VoucherCategory, { he: string; en: string; emoji: string }> = {
  food:          { he: 'אוכל',      en: 'Food',          emoji: '🍔' },
  shopping:      { he: 'קניות',     en: 'Shopping',      emoji: '🛍️' },
  entertainment: { he: 'בידור',     en: 'Entertainment', emoji: '🎬' },
  tech:          { he: 'טכנולוגיה', en: 'Tech',          emoji: '💻' },
  travel:        { he: 'טיולים',    en: 'Travel',        emoji: '✈️' },
  health:        { he: 'בריאות',    en: 'Health',        emoji: '💊' },
  education:     { he: 'לימודים',   en: 'Education',     emoji: '📚' },
};

// Palette from the supplied mockup
const PRIMARY = '#6B90FF';
const HEADER_DIM = '#8E90B0';
const HEADER_MAIN = '#6C719F';
const LABEL_DIM = '#9CA3AF';

export default function SearchFiltersView({
  vouchers,
  selectedCategory = 'all',
  onCategoryChange,
}: SearchFiltersViewProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Local state for the demo toggles — wires up later when each filter
  // gets a real implementation.
  const [mode, setMode] = useState<'online' | 'in_store'>('online');
  const [openNow, setOpenNow] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);

  // Categories actually present in the current results
  const presentCategories = useMemo<VoucherCategory[]>(() => {
    const set = new Set<VoucherCategory>();
    vouchers.forEach((v) => set.add(v.category));
    return Array.from(set);
  }, [vouchers]);

  const visibleCategory =
    selectedCategory !== 'all' ? selectedCategory : presentCategories[0];
  const categoryLabel = visibleCategory
    ? (isHe ? CATEGORY_LABELS[visibleCategory].he : CATEGORY_LABELS[visibleCategory].en)
    : (isHe ? 'הכל' : 'All');

  // Each section pops in from inside-out (scale 0.7 → 1) with a tight
  // stagger so the parts cascade in *during* the sheet's collapse — by the
  // time the sheet finishes sliding down, all sections are visible.
  // Timing: 280ms per section, 50ms stagger → last section finishes at
  // 150 + 280 = 430ms ≈ sheet collapse duration (420ms).
  const popStyle = (index: number): React.CSSProperties => ({
    animation: `panel-pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 50}ms both`,
    transformOrigin: 'top center',
  });

  return (
    <div dir={isHe ? 'rtl' : 'ltr'} className="flex flex-col flex-1 px-4 pt-2 pb-4 space-y-4">
      {/* ── Header sentence ── */}
      <section className="px-2 flex items-start gap-3" style={popStyle(0)}>
        <h1
          className="text-2xl font-semibold leading-tight"
          style={{ color: HEADER_DIM }}
        >
          {isHe ? 'מצא לי הטבות ב' : 'Find me deals in '}
          <span style={{ color: HEADER_MAIN }}>{categoryLabel}</span>
        </h1>
      </section>

      {/* ── Category row ── */}
      <section className="bg-white rounded-[24px] p-5 shadow-sm" style={popStyle(1)}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-medium" style={{ color: LABEL_DIM }}>
            {isHe ? 'קטגוריה' : 'Category'}
          </h2>
          <button
            type="button"
            className="text-sm"
            style={{ color: LABEL_DIM }}
            onClick={() => onCategoryChange?.('all')}
          >
            {isHe ? 'הצג הכל' : 'View all'}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-end pb-1">
          {presentCategories.map((cat) => {
            const meta = CATEGORY_LABELS[cat];
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange?.(cat)}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl">
                  {meta.emoji}
                </div>
                {active ? (
                  <span
                    className="text-white text-[11px] font-semibold px-4 py-2 rounded-full shadow-lg"
                    style={{
                      backgroundColor: PRIMARY,
                      boxShadow: '0 6px 14px -4px rgba(107,144,255,0.45)',
                    }}
                  >
                    {isHe ? meta.he : meta.en}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: LABEL_DIM }}>
                    {isHe ? meta.he : meta.en}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Service toggle: Online / In-store ── */}
      <section
        className="bg-white rounded-[16px] flex shadow-sm overflow-hidden"
        style={popStyle(2)}
      >
        <ToggleHalf
          active={mode === 'online'}
          icon="public"
          label={isHe ? 'אונליין' : 'Online'}
          onClick={() => setMode('online')}
          borderEnd
        />
        <ToggleHalf
          active={mode === 'in_store'}
          icon="storefront"
          label={isHe ? 'בחנות' : 'In store'}
          onClick={() => setMode('in_store')}
        />
      </section>

      {/* ── Filter and sort by ── */}
      <section
        className="bg-white rounded-[16px] shadow-sm overflow-hidden"
        style={popStyle(3)}
      >
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-xs uppercase tracking-wide font-medium" style={{ color: LABEL_DIM }}>
            {isHe ? 'סינון ומיון' : 'Filter and sort by'}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          <Row label={isHe ? 'מיין לפי' : 'Sort by'}>
            <span className="font-medium" style={{ color: LABEL_DIM }}>
              {isHe ? 'ההתאמה הטובה ביותר' : 'Best Match'}
            </span>
          </Row>
          <RowToggle
            label={isHe ? 'פתוח עכשיו' : 'Open Now'}
            checked={openNow}
            onChange={setOpenNow}
          />
          <RowToggle
            label={isHe ? 'משלוח חינם' : 'Free Delivery'}
            checked={freeShipping}
            onChange={setFreeShipping}
          />
        </div>
      </section>
    </div>
  );
}

// ── Local row helpers ───────────────────────────────────────────────────
function ToggleHalf({
  active,
  icon,
  label,
  onClick,
  borderEnd,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  borderEnd?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-4 flex items-center justify-center gap-3 ${borderEnd ? 'border-e border-gray-100' : ''}`}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '20px', color: active ? PRIMARY : '#D1D5DB' }}
      >
        {icon}
      </span>
      <span className="font-semibold" style={{ color: active ? HEADER_MAIN : '#D1D5DB' }}>
        {label}
      </span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-5 flex justify-between items-center">
      <span className="font-medium" style={{ color: HEADER_MAIN }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function RowToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full p-5 flex justify-between items-center text-start active:bg-gray-50 transition-colors"
    >
      <span className="font-medium" style={{ color: HEADER_MAIN }}>
        {label}
      </span>
      {checked ? (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', color: PRIMARY, fontVariationSettings: "'FILL' 1, 'wght' 700" }}
        >
          check
        </span>
      ) : (
        <span className="w-6 h-6" aria-hidden="true" />
      )}
    </button>
  );
}

