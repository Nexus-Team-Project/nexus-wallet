import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher, VoucherCategory } from '../../types/voucher.types';

const CASHBACK_MIN = 0;
const CASHBACK_MAX = 100;
const DISTANCE_MIN = 0;
const DISTANCE_MAX = 50; // km

// Filter summary view, shown in the chat content area once the user has
// search results and pulls the recommendations sheet back down. Based on
// the food-app filters mockup: header sentence with inline picked chips,
// horizontal cuisine row, service toggle, sort/filter list.

interface SearchFiltersViewProps {
  vouchers: Voucher[];
  selectedCategory?: VoucherCategory | 'all';
  onCategoryChange?: (cat: VoucherCategory | 'all') => void;
  /** Render the "סינון ומיון" block with the business-store design — a
   *  "הצג" chip row (all / on-sale / in-stock) plus "מיון" sort rows with a
   *  check_circle marker — instead of the default sort/toggle rows. The
   *  voucher-search page uses it so its filter card matches the store page. */
  storeFilters?: boolean;
  /** Fired by the "סיום" (Done) button — the voucher-search page uses it to
   *  close the filter panel and reveal the results. */
  onDone?: () => void;
  /** Fired by the "?" help button on the filter/sort card. */
  onHelp?: () => void;
}

// Emoji + pastel background per category — mirrors the sheet's CategoryChip
// (RecommendationsSheet) and the home-page CategoryRow squares so the styled
// squares read identically across the app.
const CATEGORY_LABELS: Record<VoucherCategory, { he: string; en: string; emoji: string; bg: string }> = {
  food:          { he: 'אוכל',      en: 'Food',          emoji: '🍔', bg: 'bg-orange-50' },
  shopping:      { he: 'קניות',     en: 'Shopping',      emoji: '👕', bg: 'bg-pink-50' },
  entertainment: { he: 'בידור',     en: 'Entertainment', emoji: '🎬', bg: 'bg-purple-50' },
  tech:          { he: 'טכנולוגיה', en: 'Tech',          emoji: '💻', bg: 'bg-blue-50' },
  travel:        { he: 'טיולים',    en: 'Travel',        emoji: '✈️', bg: 'bg-sky-50' },
  health:        { he: 'בריאות',    en: 'Health',        emoji: '💊', bg: 'bg-emerald-50' },
  education:     { he: 'לימודים',   en: 'Education',     emoji: '📚', bg: 'bg-amber-50' },
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
  storeFilters = false,
  onDone,
  onHelp,
}: SearchFiltersViewProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Local state for the demo toggles — wires up later when each filter
  // gets a real implementation.
  const [openNow, setOpenNow] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);

  // Business-store-style filter + sort (used when `storeFilters` is set).
  const [stacking, setStacking] = useState<'with' | 'without'>('with');
  const [onlineWorks, setOnlineWorks] = useState<'online' | 'offline'>('online');
  const [sortDir, setSortDir] = useState<'cashback-asc' | 'cashback-desc' | 'relevant' | 'new' | 'recently-viewed' | 'repeat-purchase'>('relevant');
  // Cashback is also a filter — tapping its row turns the "סינון ומיון" card
  // itself into a range-slider view (in place, not a bottom sheet).
  // Which sub-panel of the "סינון ומיון" card is showing.
  const [panel, setPanel] = useState<'menu' | 'filter' | 'sort' | 'cashback' | 'rating' | 'distance'>('menu');
  const [cashbackRange, setCashbackRange] = useState<[number, number]>([CASHBACK_MIN, CASHBACK_MAX]);
  const cashbackFiltered = cashbackRange[0] > CASHBACK_MIN || cashbackRange[1] < CASHBACK_MAX;
  // Rating is also a filter — its row turns the card into a ratings selector.
  // 0 = all ratings; 4/3/2/1 = that many stars "& up".
  const [ratingFilter, setRatingFilter] = useState(0);
  const ratingFiltered = ratingFilter > 0;
  // Distance is also a filter — its row turns the card into a km range slider.
  const [distanceRange, setDistanceRange] = useState<[number, number]>([DISTANCE_MIN, DISTANCE_MAX]);
  const distanceFiltered = distanceRange[0] > DISTANCE_MIN || distanceRange[1] < DISTANCE_MAX;
  const distanceTrackRef = useRef<HTMLDivElement>(null);
  const distanceDragThumb = useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const thumb = distanceDragThumb.current;
      const el = distanceTrackRef.current;
      if (!thumb || !el) return;
      const rect = el.getBoundingClientRect();
      let ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      // Track is dir=ltr — no RTL inversion (drag right raises the value).
      const v = Math.round(DISTANCE_MIN + ratio * (DISTANCE_MAX - DISTANCE_MIN));
      setDistanceRange(([lo, hi]) =>
        thumb === 'min' ? [Math.min(v, hi), hi] : [lo, Math.max(v, lo)],
      );
    };
    const onUp = () => { distanceDragThumb.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isHe]);

  const dMinPct = ((distanceRange[0] - DISTANCE_MIN) / (DISTANCE_MAX - DISTANCE_MIN)) * 100;
  const dMaxPct = ((distanceRange[1] - DISTANCE_MIN) / (DISTANCE_MAX - DISTANCE_MIN)) * 100;

  // Smoothly animate the "סינון ומיון" card's height when it swaps between the
  // filter/sort view and the cashback / rating / distance editors — mirrors the
  // category filter sheet's panel transition.
  const sortCardRef = useRef<HTMLDivElement>(null);
  const [sortCardHeight, setSortCardHeight] = useState<number | 'auto'>('auto');
  useLayoutEffect(() => {
    const el = sortCardRef.current;
    if (el) setSortCardHeight(el.scrollHeight);
  }, [panel, storeFilters]);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragThumb = useRef<'min' | 'max' | null>(null);

  // Cashback range slider — drag a thumb anywhere on the page so it keeps
  // tracking past the track edges. Functional setState → no range in deps.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const thumb = dragThumb.current;
      const el = trackRef.current;
      if (!thumb || !el) return;
      const rect = el.getBoundingClientRect();
      let ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      // Slider track is forced dir=ltr (0 on the left, max on the right) so
      // no RTL inversion — drag right raises the value, matching the labels.
      const v = Math.round(CASHBACK_MIN + ratio * (CASHBACK_MAX - CASHBACK_MIN));
      setCashbackRange(([lo, hi]) =>
        thumb === 'min' ? [Math.min(v, hi), hi] : [lo, Math.max(v, lo)],
      );
    };
    const onUp = () => { dragThumb.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isHe]);

  const cbMinPct = ((cashbackRange[0] - CASHBACK_MIN) / (CASHBACK_MAX - CASHBACK_MIN)) * 100;
  const cbMaxPct = ((cashbackRange[1] - CASHBACK_MIN) / (CASHBACK_MAX - CASHBACK_MIN)) * 100;
  const stackingOptions: { key: 'with' | 'without'; he: string; en: string }[] = [
    { key: 'with', he: 'כולל כפל מבצעים', en: 'Stacking deals' },
    { key: 'without', he: 'לא כולל כפל מבצעים', en: 'No stacking' },
  ];
  const onlineOptions: { key: 'online' | 'offline'; he: string; en: string }[] = [
    { key: 'online', he: 'עובד באונליין', en: 'Works online' },
    { key: 'offline', he: 'לא עובד באונליין', en: 'Not online' },
  ];
  const sortDirOptions: { key: 'cashback-asc' | 'cashback-desc' | 'relevant' | 'new' | 'recently-viewed' | 'repeat-purchase'; he: string; en: string }[] = [
    { key: 'cashback-asc', he: 'מהקאשבק הנמוך לגבוה', en: 'Cashback: low to high' },
    { key: 'cashback-desc', he: 'מהקאשבק הגבוה לנמוך', en: 'Cashback: high to low' },
    { key: 'relevant', he: 'רלוונטי ביותר', en: 'Most relevant' },
    { key: 'new', he: 'חדש ביותר', en: 'Newest' },
    { key: 'recently-viewed', he: 'נצפה לאחרונה', en: 'Recently viewed' },
    { key: 'repeat-purchase', he: 'רכישה נוספת', en: 'Repeat purchase' },
  ];
  // Value-based filters that live in the "סינון" panel (each drills into its
  // own editor). Cashback / rating / distance moved here from the sort list.
  const filterDrillItems = [
    { key: 'cashback' as const, label: isHe ? 'גובה קאשבק' : 'Cashback %', active: cashbackFiltered, summary: `${cashbackRange[0]}%–${cashbackRange[1]}%` },
    { key: 'rating' as const, label: isHe ? 'דירוג' : 'Rating', active: ratingFiltered, summary: `${ratingFilter}★+` },
    { key: 'distance' as const, label: isHe ? 'מרחק ממני' : 'Distance', active: distanceFiltered, summary: `${distanceRange[0]}–${distanceRange[1]} ${isHe ? 'ק״מ' : 'km'}` },
  ];
  const activeFilterCount = filterDrillItems.filter((f) => f.active).length;

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

  // Label of the currently-picked sort, shown as a gray hint on the menu's
  // "מיין לפי" row.
  const sortLabel = (() => {
    const o = sortDirOptions.find((x) => x.key === sortDir);
    return o ? (isHe ? o.he : o.en) : '';
  })();

  // Card sub-panel header: title + optional close/back (X) button.
  const panelHeader = (title: string, onBack?: () => void) => (
    <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
      <h2 className="text-xs uppercase tracking-wide font-medium" style={{ color: LABEL_DIM }}>
        {title}
      </h2>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={isHe ? 'חזרה' : 'Back'}
          className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
        </button>
      )}
    </div>
  );

  // "הצג" filter chips (stacking + online) — shown in the filter sub-panel.
  const filterChips = (
    <div className="px-5 pt-4 pb-5">
      <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">
        {isHe ? 'הצג' : 'Show'}
      </p>
      <div className="flex flex-wrap gap-2 mb-2.5">
        {stackingOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setStacking(opt.key)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
              stacking === opt.key ? 'bg-bg-dark text-white' : 'bg-surface text-text-secondary border border-border'
            }`}
          >
            {isHe ? opt.he : opt.en}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {onlineOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setOnlineWorks(opt.key)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
              onlineWorks === opt.key ? 'bg-bg-dark text-white' : 'bg-surface text-text-secondary border border-border'
            }`}
          >
            {isHe ? opt.he : opt.en}
          </button>
        ))}
      </div>
    </div>
  );

  // "מיין לפי" — sort direction (high→low / low→high), simple single-select.
  const sortDirRows = (
    <div className="px-5 py-1 space-y-1">
      {sortDirOptions.map((opt) => {
        const active = sortDir === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSortDir(opt.key)}
            className="w-full flex items-center justify-between py-3 text-start"
          >
            <span className={`text-[15px] ${active ? 'font-semibold text-primary' : 'text-text-primary'}`}>
              {isHe ? opt.he : opt.en}
            </span>
            {active && (
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>check</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // "סינון" value filters — cashback / rating / distance, each drilling into
  // its editor panel; shows the picked value in gray beside the label.
  const filterDrills = (
    <div className="px-5 pb-4 divide-y divide-gray-50">
      {filterDrillItems.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setPanel(f.key)}
          className="w-full flex items-center justify-between py-3 text-start"
        >
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-[15px] text-text-primary">{f.label}</span>
            {f.active && <span className="text-xs text-text-muted" dir="ltr">{f.summary}</span>}
          </span>
          <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>
            {isHe ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="flex flex-col flex-1 px-4 pt-2 pb-4 space-y-4"
      style={{
        // Drop the whole filter & sort panel down from the top of the
        // screen on entry, instead of rising with the sheet from below.
        animation: 'filters-drop-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        willChange: 'transform',
      }}
    >
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

      {/* ── Category row — no white card behind it; the pastel squares sit
          directly on the page like the home / sheet category rows. ── */}
      <section className="px-1" style={popStyle(1)}>
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
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
          {presentCategories.map((cat) => {
            const meta = CATEGORY_LABELS[cat];
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange?.(cat)}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
              >
                <div
                  className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-sm border-2 transition-colors duration-100 ${meta.bg} ${
                    active ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <span className="text-4xl drop-shadow-sm">{meta.emoji}</span>
                </div>
                <span className="text-[11px] font-semibold text-text-primary leading-tight text-center max-w-[72px]">
                  {isHe ? meta.he : meta.en}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Filter and sort by ── */}
      <section
        className="relative bg-white rounded-[16px] shadow-sm overflow-hidden"
        style={popStyle(3)}
      >
        {/* Help "?" — top-left corner of the card (menu view only, so it
            doesn't clash with the sub-panels' back button on the same side). */}
        {onHelp && panel === 'menu' && (
          <button
            type="button"
            aria-label={isHe ? 'איך זה עובד' : 'How it works'}
            onClick={onHelp}
            className="absolute z-20 top-2.5 left-2.5 w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>help</span>
          </button>
        )}
        <motion.div
          animate={{ height: sortCardHeight }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
        <div ref={sortCardRef}>
        {panel === 'cashback' ? (
          // In-place cashback range editor — this same card becomes the slider
          // (not a bottom sheet). "סיום" / back returns to the filter+sort view.
          <>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide font-medium" style={{ color: LABEL_DIM }}>
                {isHe ? 'אחוז קאשבק' : 'Cashback %'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="px-7 pt-7 pb-4">
              <div className="text-center mb-7 text-base font-bold text-text-primary" dir="ltr">
                {cashbackRange[0]}% – {cashbackRange[1]}%
              </div>
              <div ref={trackRef} dir="ltr" className="relative h-5 flex items-center select-none touch-none">
                <div className="absolute inset-x-0 h-1 rounded-full bg-border/70" />
                <div
                  className="absolute h-1 rounded-full bg-primary"
                  style={{ insetInlineStart: `${cbMinPct}%`, insetInlineEnd: `${100 - cbMaxPct}%` }}
                />
                <button
                  type="button"
                  aria-label={isHe ? 'מינימום' : 'Minimum'}
                  onPointerDown={() => { dragThumb.current = 'min'; }}
                  className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                  style={{ insetInlineStart: `${cbMinPct}%`, marginInlineStart: -9 }}
                />
                <button
                  type="button"
                  aria-label={isHe ? 'מקסימום' : 'Maximum'}
                  onPointerDown={() => { dragThumb.current = 'max'; }}
                  className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                  style={{ insetInlineStart: `${cbMaxPct}%`, marginInlineStart: -9 }}
                />
              </div>
              <div className="flex justify-between mt-3 text-[10px] text-text-muted" dir="ltr">
                <span>{CASHBACK_MIN}%</span>
                <span>{CASHBACK_MAX}%</span>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setCashbackRange([CASHBACK_MIN, CASHBACK_MAX])}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
              >
                {isHe ? 'איפוס' : 'Reset'}
              </button>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                className="flex-1 py-3 rounded-2xl bg-bg-dark text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                {isHe ? 'סיום' : 'Done'}
              </button>
            </div>
          </>
        ) : panel === 'rating' ? (
          // In-place rating filter — same card becomes a ratings selector.
          <>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide font-medium" style={{ color: LABEL_DIM }}>
                {isHe ? 'דירוג' : 'Rating'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="px-5 py-1">
              {[0, 4, 3, 2, 1].map((val) => {
                const selected = ratingFilter === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRatingFilter(val)}
                    className="w-full flex items-center justify-between py-3 text-start"
                  >
                    {val === 0 ? (
                      <span className="text-[15px] text-text-primary">
                        {isHe ? 'כל הדירוגים' : 'All ratings'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`material-symbols-rounded ${s <= val ? 'text-black' : 'text-gray-200'}`}
                              style={{ fontSize: 16, fontVariationSettings: s <= val ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                        </span>
                        <span className="text-[13px] text-text-secondary">
                          {isHe ? 'ומעלה' : '& Up'}
                        </span>
                      </span>
                    )}
                    <span
                      className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-primary' : 'border-border'
                      }`}
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-5 pb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setRatingFilter(0)}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
              >
                {isHe ? 'איפוס' : 'Reset'}
              </button>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                className="flex-1 py-3 rounded-2xl bg-bg-dark text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                {isHe ? 'סיום' : 'Done'}
              </button>
            </div>
          </>
        ) : panel === 'distance' ? (
          // In-place distance filter — same card becomes a km range slider.
          <>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide font-medium" style={{ color: LABEL_DIM }}>
                {isHe ? 'מרחק ממני' : 'Distance from me'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="px-7 pt-7 pb-4">
              <div className="text-center mb-7 text-base font-bold text-text-primary" dir="ltr">
                {distanceRange[0]} – {distanceRange[1]} {isHe ? 'ק״מ' : 'km'}
              </div>
              <div ref={distanceTrackRef} dir="ltr" className="relative h-5 flex items-center select-none touch-none">
                <div className="absolute inset-x-0 h-1 rounded-full bg-border/70" />
                <div
                  className="absolute h-1 rounded-full bg-primary"
                  style={{ insetInlineStart: `${dMinPct}%`, insetInlineEnd: `${100 - dMaxPct}%` }}
                />
                <button
                  type="button"
                  aria-label={isHe ? 'מינימום' : 'Minimum'}
                  onPointerDown={() => { distanceDragThumb.current = 'min'; }}
                  className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                  style={{ insetInlineStart: `${dMinPct}%`, marginInlineStart: -9 }}
                />
                <button
                  type="button"
                  aria-label={isHe ? 'מקסימום' : 'Maximum'}
                  onPointerDown={() => { distanceDragThumb.current = 'max'; }}
                  className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                  style={{ insetInlineStart: `${dMaxPct}%`, marginInlineStart: -9 }}
                />
              </div>
              <div className="flex justify-between mt-3 text-[10px] text-text-muted" dir="ltr">
                <span>{DISTANCE_MIN} {isHe ? 'ק״מ' : 'km'}</span>
                <span>{DISTANCE_MAX} {isHe ? 'ק״מ' : 'km'}</span>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setDistanceRange([DISTANCE_MIN, DISTANCE_MAX])}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
              >
                {isHe ? 'איפוס' : 'Reset'}
              </button>
              <button
                type="button"
                onClick={() => setPanel('filter')}
                className="flex-1 py-3 rounded-2xl bg-bg-dark text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                {isHe ? 'סיום' : 'Done'}
              </button>
            </div>
          </>
        ) : panel === 'sort' ? (
          <>
            {panelHeader(isHe ? 'מיין לפי' : 'Sort by', () => setPanel('menu'))}
            {sortDirRows}
          </>
        ) : panel === 'filter' ? (
          <>
            {panelHeader(isHe ? 'סינון' : 'Filter', () => setPanel('menu'))}
            {filterChips}
            {filterDrills}
          </>
        ) : storeFilters ? (
          // Menu — two drill rows: filter + sort by.
          <>
            {panelHeader(isHe ? 'סינון ומיון' : 'Filter and sort')}
            <div className="px-5 py-1 space-y-1">
              <button
                type="button"
                onClick={() => setPanel('filter')}
                className="w-full flex items-center justify-between py-3 text-start"
              >
                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[15px] text-text-primary">{isHe ? 'סינון' : 'Filter'}</span>
                  {activeFilterCount > 0 && (
                    <span className="text-xs text-text-muted">
                      {activeFilterCount} {isHe ? 'פעילים' : 'active'}
                    </span>
                  )}
                </span>
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
                  {isHe ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPanel('sort')}
                className="w-full flex items-center justify-between py-3 text-start"
              >
                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[15px] text-text-primary">{isHe ? 'מיין לפי' : 'Sort by'}</span>
                  {sortLabel && <span className="text-xs text-text-muted">{sortLabel}</span>}
                </span>
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
                  {isHe ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </div>
          </>
        ) : (
          // Non-store variant (chat page): simple default view.
          <>
            {panelHeader(isHe ? 'סינון ומיון' : 'Filter and sort')}
            <div className="divide-y divide-gray-50">
              <Row label={isHe ? 'מיין לפי' : 'Sort by'}>
                <span className="font-medium" style={{ color: LABEL_DIM }}>
                  {isHe ? 'ההתאמה הטובה ביותר' : 'Best Match'}
                </span>
              </Row>
              <RowToggle label={isHe ? 'פתוח עכשיו' : 'Open Now'} checked={openNow} onChange={setOpenNow} />
              <RowToggle label={isHe ? 'משלוח חינם' : 'Free Delivery'} checked={freeShipping} onChange={setFreeShipping} />
            </div>
          </>
        )}
        </div>
        </motion.div>
      </section>

      {/* ── Clear-all / Done actions — mirrors the category filter sheet's
          footer buttons (outline "נקה הכל" + dark "סיום"). Hidden while the
          cashback editor owns the card (it has its own Reset/Done). ── */}
      {storeFilters && panel === 'menu' && (
        <section className="flex gap-3" style={popStyle(4)}>
          <button
            type="button"
            onClick={() => {
              setStacking('with');
              setOnlineWorks('online');
              setSortDir('relevant');
              setCashbackRange([CASHBACK_MIN, CASHBACK_MAX]);
              setRatingFilter(0);
              setDistanceRange([DISTANCE_MIN, DISTANCE_MAX]);
              onCategoryChange?.('all');
            }}
            className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
          >
            {isHe ? 'נקה הכל' : 'Clear all'}
          </button>
          <button
            type="button"
            onClick={() => onDone?.()}
            className="flex-1 py-3.5 rounded-2xl bg-bg-dark text-white text-sm font-semibold transition-colors active:scale-[0.98]"
          >
            {isHe ? 'סיום' : 'Done'}
          </button>
        </section>
      )}
    </div>
  );
}

// ── Local row helpers ───────────────────────────────────────────────────
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

