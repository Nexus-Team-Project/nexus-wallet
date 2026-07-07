import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import AnimatedNavIcon from '../layout/AnimatedNavIcon';
import navSearchUrl from '../../assets/animations/nav-search.json?url';
import navSearchBoldUrl from '../../assets/animations/nav-search-bold.json?url';

// "Find me deals" autocomplete. Starts as a white search-bubble button with
// a magnifying glass icon. Tapping it morphs the bubble into a chat-input
// pill where the user can type freely; below, a dropdown panel surfaces
// suggestions (categories + subcategories) that filter as the user types.
// Picking a suggestion fires onComplete with the matching filter.

export interface DiscountFinderResult {
  category: VoucherCategory;
  subcategory: string;
  minDiscount: number;
}

interface DiscountFinderCardProps {
  onComplete: (result: DiscountFinderResult) => void;
  /** Fired the first time the user picks/types something in the finder.
   *  Used by the parent chat page to collapse the welcome content. */
  onInteract?: () => void;
  /** Popular query strings shown as suggestions when the search input is
   *  active and empty (replaces the old bottom-sheet popular searches row). */
  popularSearches?: string[];
  /** Sent when the user picks a popular-search suggestion — treated as a
   *  regular chat query. */
  onSearchQuery?: (query: string) => void;
  /** Optional pre-selected category — when the user opens the finder from a
   *  category page, we seed the category chip so they don't have to pick
   *  it again. */
  initialCategory?: VoucherCategory;
  /** Optional pre-selected item type for the header button (deals / products /
   *  businesses / places). Defaults to 'deals'. The store page seeds this to
   *  'businesses' so the finder reads "מצא לי … עסקים …" out of the box. */
  initialItemType?: ItemType;
  /** Fired when the user changes the category chip (the "בקטגוריות [הכל]"
   *  selector). Lets a host page react to category changes directly — the
   *  store page uses it to switch between the Nexus-picks view (when 'all')
   *  and a category-filtered list. */
  onCategoryChange?: (category: VoucherCategory | 'all') => void;
}

// Palette borrowed from the iOS picker mockup
const HEADER_MAIN = '#5A5C7F';
const CHIP_BLUE = '#78A1FF';
const ITEM_TEXT = '#929292';
const ITEM_SUBTITLE = '#C5C5C5';
// Sky-tinted "+ סינון" button — softer than the chip blue so the user
// reads it as an "add more" affordance, not as a selected value.
const ADD_FILTER_BG = '#BDE3FF';
const ADD_FILTER_TEXT = '#1E5C9E';

// What kind of thing is the user searching for? Drives the "הטבות" button
// in the header (which switches between deals / products / businesses / places).
export type ItemType = 'deals' | 'products' | 'businesses' | 'places';
const ITEM_TYPE_META: Record<ItemType, { he: string; en: string; emoji: string }> = {
  deals:      { he: 'הטבות',  en: 'Deals',      emoji: '🎁' },
  products:   { he: 'מוצרים', en: 'Products',   emoji: '🛍️' },
  businesses: { he: 'עסקים',  en: 'Businesses', emoji: '🏢' },
  places:     { he: 'מקומות', en: 'Places',     emoji: '📍' },
};
const ITEM_TYPE_ORDER: ItemType[] = ['deals', 'products', 'businesses', 'places'];

// Extra filters the user can add via the "+ סינון" button. The chip in
// the header carries the filter's label; later we can expand each entry
// into its own popover for setting a value.
type ExtraFilterId = 'discount' | 'price' | 'brand' | 'location' | 'distance' | 'rating';
const EXTRA_FILTER_META: Record<ExtraFilterId, { he: string; en: string }> = {
  discount: { he: 'הנחה',  en: 'Discount' },
  price:    { he: 'מחיר',  en: 'Price' },
  brand:    { he: 'מותג',  en: 'Brand' },
  location: { he: 'מיקום', en: 'Location' },
  distance: { he: 'מרחק ממני', en: 'Distance from me' },
  rating:   { he: 'דירוג', en: 'Rating' },
};
const EXTRA_FILTER_ORDER: ExtraFilterId[] = ['discount', 'price', 'brand', 'location', 'distance', 'rating'];

const CATEGORY_META: Record<
  VoucherCategory,
  { en: string; he: string; emoji: string }
> = {
  food:          { en: 'Food',          he: 'אוכל',      emoji: '🍔' },
  shopping:      { en: 'Shopping',      he: 'קניות',     emoji: '👕' },
  entertainment: { en: 'Entertainment', he: 'בידור',     emoji: '🎬' },
  tech:          { en: 'Tech',          he: 'טכנולוגיה', emoji: '💻' },
  travel:        { en: 'Travel',        he: 'טיולים',    emoji: '✈️' },
  health:        { en: 'Health',        he: 'בריאות',    emoji: '💊' },
  education:     { en: 'Education',     he: 'לימודים',   emoji: '📚' },
};
const CATEGORY_ORDER = Object.keys(CATEGORY_META) as VoucherCategory[];

const SUBCATEGORIES: Record<VoucherCategory, { he: string; en: string }[]> = {
  food: [
    { he: 'מסעדות', en: 'Restaurants' },
    { he: 'בתי קפה', en: 'Cafes' },
    { he: 'אוכל מהיר', en: 'Fast food' },
    { he: 'משלוחים', en: 'Delivery' },
  ],
  shopping: [
    { he: 'אופנה', en: 'Fashion' },
    { he: 'נעליים', en: 'Shoes' },
    { he: 'אקססוריז', en: 'Accessories' },
    { he: 'הבית', en: 'Home' },
  ],
  entertainment: [
    { he: 'קולנוע', en: 'Cinema' },
    { he: 'הופעות', en: 'Concerts' },
    { he: 'משחקים', en: 'Games' },
  ],
  tech: [
    { he: 'מחשבים', en: 'Computers' },
    { he: 'טלפונים', en: 'Phones' },
    { he: 'אביזרים', en: 'Accessories' },
  ],
  travel: [
    { he: 'מלונות', en: 'Hotels' },
    { he: 'טיסות', en: 'Flights' },
    { he: 'חבילות', en: 'Packages' },
  ],
  health: [
    { he: 'פארם', en: 'Pharmacy' },
    { he: 'יופי', en: 'Beauty' },
    { he: 'כושר', en: 'Fitness' },
  ],
  education: [
    { he: 'קורסים', en: 'Courses' },
    { he: 'ספרים', en: 'Books' },
    { he: 'הכשרות', en: 'Training' },
  ],
};

interface Suggestion {
  key: string;
  label: string;
  subtitle?: string;
  emoji?: string;
  category: VoucherCategory;
  subcategory: string; // 'הכל' / 'All' for category-only picks
}

export default function DiscountFinderCard({
  onComplete,
  onInteract,
  popularSearches,
  onSearchQuery,
  initialCategory,
  initialItemType = 'deals',
  onCategoryChange,
}: DiscountFinderCardProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  // The submitted term, kept on display as a "locked" gray chip (as if in quotes).
  const [committedQuery, setCommittedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Category filter — defaults to "all" or the category passed in by the
  // parent (e.g. when the finder is launched from a category page).
  // The category dropdown is closed initially; opens when the user taps
  // the category chip.
  const [categoryFilter, setCategoryFilter] = useState<VoucherCategory | 'all'>(
    initialCategory ?? 'all',
  );
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Item-type filter — what kind of thing is being searched. Defaults to
  // "deals". The "הטבות" button in the header opens its picker.
  const [itemType, setItemType] = useState<ItemType>(initialItemType);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // User-added extra filters. Each entry shows as another chip in the
  // header. The "+ סינון" button opens a dropdown of available types.
  const [extraFilters, setExtraFilters] = useState<ExtraFilterId[]>([]);
  const [addFilterPickerOpen, setAddFilterPickerOpen] = useState(false);
  const availableExtras = EXTRA_FILTER_ORDER.filter(
    (id) => !extraFilters.includes(id),
  );

  // Focus the input the moment it morphs in from the search button.
  useEffect(() => {
    if (searchActive) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [searchActive]);

  // Build the searchable index — each category + each subcategory becomes
  // its own suggestion, with the category name as the subtitle.
  const allOptions = useMemo<Suggestion[]>(() => {
    const opts: Suggestion[] = [];
    CATEGORY_ORDER.forEach((cat) => {
      const meta = CATEGORY_META[cat];
      const catLabel = isHe ? meta.he : meta.en;
      // Top-level category entry
      opts.push({
        key: `cat:${cat}`,
        label: catLabel,
        emoji: meta.emoji,
        category: cat,
        subcategory: isHe ? 'הכל' : 'All',
      });
      // Subcategory entries
      SUBCATEGORIES[cat].forEach((sub) => {
        const subLabel = isHe ? sub.he : sub.en;
        opts.push({
          key: `sub:${cat}:${sub.en}`,
          label: subLabel,
          subtitle: catLabel,
          category: cat,
          subcategory: subLabel,
        });
      });
    });
    return opts;
  }, [isHe]);

  // Filter by query (substring match, case-insensitive). No suggestions
  // until the user types something — the dropdown only surfaces matches
  // for what they're actively writing.
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allOptions
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 3);
  }, [query, allOptions]);

  // Matching stores for the "חנויות" section in the search dropdown. When the
  // input is empty we surface a few stores as a discovery shortcut; while
  // typing we filter by name (EN + HE). Capped at three either way.
  const storeMatches = useMemo(() => {
    const q = query.trim();
    if (!q) return mockBusinesses.slice(0, 3);
    const ql = q.toLowerCase();
    return mockBusinesses
      .filter((b) => b.name.toLowerCase().includes(ql) || b.nameHe.includes(q))
      .slice(0, 3);
  }, [query]);

  // Popular searches for the dropdown — filtered by the typed text so the
  // section narrows as the user writes, like the others. Capped at three.
  const popularMatches = useMemo(() => {
    const all = popularSearches ?? [];
    const q = query.trim().toLowerCase();
    const list = q === '' ? all : all.filter((t) => t.toLowerCase().includes(q));
    return list.slice(0, 3);
  }, [popularSearches, query]);

  const handlePick = (s: Suggestion) => {
    onInteract?.();
    // Close the search input + dropdown so the autocomplete panel doesn't
    // linger over the results that are about to load in the sheet.
    setQuery('');
    setSearchActive(false);
    onComplete({
      category: s.category,
      subcategory: s.subcategory,
      minDiscount: 0,
    });
  };

  return (
    <div className="flex gap-3 px-5 py-2 flex-row-reverse animate-fade-up">
      <div className="flex-shrink-0 w-8" aria-hidden="true" />

      <div dir={isHe ? 'rtl' : 'ltr'} className="max-w-[90%] w-full flex flex-col gap-3">
        {/* Header sentence — every noun chip is clickable:
            "מצא לי [הטבות] [חיפוש] בקטגוריות [הכל]" */}
        <h4
          className="text-[22px] leading-tight font-semibold flex flex-wrap items-center gap-x-2 gap-y-2"
          style={{ color: HEADER_MAIN }}
        >
          <span>{isHe ? 'מצא לי' : 'Find me'}</span>

          {searchActive ? (
            <SearchPillInput
              ref={inputRef}
              value={query}
              onChange={(v) => {
                if (v) onInteract?.();
                setQuery(v);
              }}
              onClear={() => {
                setQuery('');
                setSearchActive(false);
              }}
              onSubmit={() => {
                const q = query.trim();
                if (!q) return;
                onInteract?.();
                setCommittedQuery(q);
                setQuery('');
                setSearchActive(false);
                onSearchQuery?.(q);
              }}
              placeholder={isHe ? 'חפש…' : 'Search…'}
            />
          ) : committedQuery ? (
            <LockedSearchChip
              label={committedQuery}
              onEdit={() => {
                onInteract?.();
                setQuery(committedQuery);
                setCommittedQuery('');
                setSearchActive(true);
                setCategoryPickerOpen(false);
                setTypePickerOpen(false);
              }}
              onClear={() => {
                onInteract?.();
                setCommittedQuery('');
                setQuery('');
                setSearchActive(true);
                setCategoryPickerOpen(false);
                setTypePickerOpen(false);
              }}
            />
          ) : (
            <SearchBubble
              label={isHe ? 'חיפוש' : 'Search'}
              onClick={() => {
                onInteract?.();
                setSearchActive(true);
                setCategoryPickerOpen(false);
                setTypePickerOpen(false);
              }}
            />
          )}

          <CategoryButton
            label={isHe ? ITEM_TYPE_META[itemType].he : ITEM_TYPE_META[itemType].en}
            active={typePickerOpen}
            onClick={() => {
              onInteract?.();
              setTypePickerOpen((open) => !open);
              setCategoryPickerOpen(false);
              setSearchActive(false);
            }}
          />

          <span>{isHe ? 'בקטגוריות' : 'in categories'}</span>

          <CategoryButton
            label={
              categoryFilter === 'all'
                ? (isHe ? 'הכל' : 'All')
                : (isHe ? CATEGORY_META[categoryFilter].he : CATEGORY_META[categoryFilter].en)
            }
            active={categoryPickerOpen}
            onClick={() => {
              onInteract?.();
              setCategoryPickerOpen((open) => !open);
              setSearchActive(false);
              setTypePickerOpen(false);
              setAddFilterPickerOpen(false);
            }}
          />

          {/* User-added extra filters — each one is its own static chip
              with a × to remove. */}
          {extraFilters.map((id) => (
            <ExtraFilterChip
              key={id}
              label={isHe ? EXTRA_FILTER_META[id].he : EXTRA_FILTER_META[id].en}
              onClear={() => setExtraFilters((prev) => prev.filter((x) => x !== id))}
            />
          ))}

          {/* + סינון button — sky-tinted "add another filter" affordance */}
          {availableExtras.length > 0 && (
            <AddFilterButton
              label={isHe ? 'סינון' : 'Filter'}
              active={addFilterPickerOpen}
              onClick={() => {
                onInteract?.();
                setAddFilterPickerOpen((open) => !open);
                setSearchActive(false);
                setCategoryPickerOpen(false);
                setTypePickerOpen(false);
              }}
            />
          )}
        </h4>

        {/* Type-picker dropdown — appears when the "הטבות" button is tapped */}
        {typePickerOpen && (
          <ListPanel>
            {ITEM_TYPE_ORDER.map((t) => {
              const meta = ITEM_TYPE_META[t];
              return (
                <ListItem
                  key={t}
                  label={isHe ? meta.he : meta.en}
                  onClick={() => {
                    onInteract?.();
                    setItemType(t);
                    setTypePickerOpen(false);
                  }}
                />
              );
            })}
          </ListPanel>
        )}

        {/* Category dropdown — appears when the category button is tapped */}
        {categoryPickerOpen && (
          <ListPanel isHe={isHe}>
            <ListItem
              label={isHe ? 'הכל' : 'All'}
              onClick={() => {
                setCategoryFilter('all');
                setCategoryPickerOpen(false);
                onCategoryChange?.('all');
              }}
            />
            {CATEGORY_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <ListItem
                  key={cat}
                  label={isHe ? meta.he : meta.en}
                  onClick={() => {
                    onInteract?.();
                    setCategoryFilter(cat);
                    setCategoryPickerOpen(false);
                    onCategoryChange?.(cat);
                  }}
                />
              );
            })}
          </ListPanel>
        )}

        {/* Add-filter dropdown — list of extra filters the user can add.
            Each row, once picked, adds a chip to the header. */}
        {addFilterPickerOpen && availableExtras.length > 0 && (
          <ListPanel>
            {availableExtras.map((id) => {
              const meta = EXTRA_FILTER_META[id];
              return (
                <ListItem
                  key={id}
                  label={isHe ? meta.he : meta.en}
                  onClick={() => {
                    onInteract?.();
                    setExtraFilters((prev) => [...prev, id]);
                    setAddFilterPickerOpen(false);
                  }}
                />
              );
            })}
          </ListPanel>
        )}

        {/* Search dropdown — when the user is typing, autocomplete matches
            sit on top; a short list of popular searches stays below as a
            secondary section. When the input is empty, only the popular
            searches show (with the same header). */}
        {searchActive && (suggestions.length > 0 || storeMatches.length > 0 || popularMatches.length > 0) && (
          <ListPanel isHe={isHe}>
            {/* Autocomplete matches — only when there's typed text */}
            {query.trim() !== '' &&
              suggestions.map((s) => (
                <ListItem
                  key={s.key}
                  label={s.label}
                  subtitle={s.subtitle}
                  onClick={() => handlePick(s)}
                />
              ))}

            {/* Stores section — small brand logos, tap to open the business
                page. Full handful when empty, narrowed by name while typing. */}
            {storeMatches.length > 0 && (
              <>
                <div className="px-4 py-2.5 bg-gray-50/60">
                  <h4
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: ITEM_SUBTITLE }}
                  >
                    {isHe ? 'חנויות' : 'Stores'}
                  </h4>
                </div>
                {storeMatches.map((b) => (
                  <StoreRow
                    key={b.id}
                    logoUrl={b.logoUrl}
                    emoji={b.logo}
                    name={isHe ? b.nameHe : b.name}
                    onClick={() => {
                      onInteract?.();
                      navigate(`/${lang}/business/${b.id}`);
                    }}
                  />
                ))}
              </>
            )}

            {/* Popular searches section — filtered by the typed text, capped
                at three. */}
            {popularMatches.length > 0 && (
              <>
                <div className="px-4 py-2.5 bg-gray-50/60">
                  <h4
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: ITEM_SUBTITLE }}
                  >
                    {isHe ? 'חיפושים פופולריים' : 'Popular searches'}
                  </h4>
                </div>
                {popularMatches.map((text) => (
                  <ListItem
                    key={text}
                    icon="search"
                    label={text}
                    onClick={() => {
                      onInteract?.();
                      setQuery('');
                      setSearchActive(false);
                      onSearchQuery?.(text);
                    }}
                  />
                ))}
              </>
            )}
          </ListPanel>
        )}
      </div>
    </div>
  );
}

// ── "+ סינון" button — sky-tinted pill that opens the add-filter dropdown.
//    Visually softer than the white chips so it reads as an action, not a
//    selected value. ───────────────────────────────────────────────────────
function AddFilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full shadow-sm transition-colors active:scale-95"
      style={{ backgroundColor: ADD_FILTER_BG }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '16px', color: ADD_FILTER_TEXT }}
        aria-hidden="true"
      >
        add
      </span>
      <span className="text-[14px] font-medium" style={{ color: ADD_FILTER_TEXT }}>
        {label}
      </span>
    </button>
  );
}

// ── Static chip representing an added extra filter — shows the filter
//    name + × to remove. Same blue as the picker chips. ──────────────────
function ExtraFilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-white shadow-sm"
      style={{ backgroundColor: CHIP_BLUE }}
    >
      <span className="text-[14px] font-medium">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="remove"
        className="w-4 h-4 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
          close
        </span>
      </button>
    </span>
  );
}

// ── Category filter button — same chip footprint as the search bubble,
//    with optional emoji + label. Active state highlights it with the
//    mockup's blue tint so the user can tell which panel is open. ──────────
function CategoryButton({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm transition-colors active:scale-95 ${
        active
          ? 'text-white border'
          : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
      style={
        active
          ? { backgroundColor: CHIP_BLUE, borderColor: CHIP_BLUE }
          : undefined
      }
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      <span
        className="text-[14px] font-medium"
        style={{ color: active ? '#ffffff' : HEADER_MAIN }}
      >
        {label}
      </span>
      <span
        className={`material-symbols-outlined transition-transform ${active ? 'rotate-180' : ''}`}
        style={{ fontSize: '16px', color: active ? '#ffffff' : HEADER_MAIN }}
        aria-hidden="true"
      >
        expand_more
      </span>
    </button>
  );
}

// ── White search bubble button — magnifying glass icon + "חיפוש" label.
//    Sized like a chip, sits inline. ────────────────────────────────────────
function SearchBubble({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
    >
      {/* Same wired Lottie search icon used by the floating nav pill, so the
          finder's search bubble matches the bottom-bar search button exactly. */}
      <AnimatedNavIcon src={navSearchUrl} boldSrc={navSearchBoldUrl} active size={18} />
      <span className="text-[14px] font-medium" style={{ color: HEADER_MAIN }}>
        {label}
      </span>
    </button>
  );
}

// ── Locked search chip — the submitted term, displayed in quotes as a
//    standard gray chip. Tapping the label re-opens editing; X clears it.
function LockedSearchChip({
  label,
  onEdit,
  onClear,
}: {
  label: string;
  onEdit: () => void;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={onEdit}
        className="text-[14px] font-medium active:scale-95 transition-transform"
        style={{ color: HEADER_MAIN }}
      >
        {`"${label}"`}
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear search"
        className="flex items-center justify-center -me-1 active:scale-90 transition-transform"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', color: HEADER_MAIN }}
          aria-hidden="true"
        >
          close
        </span>
      </button>
    </span>
  );
}

// ── Active search input — compact rounded pill that replaces the bubble.
//    Same blue as the mockup chip, ~same horizontal footprint as the button
//    so it stays on the same line. ─────────────────────────────────────────
const SearchPillInput = ({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder,
  ref,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  placeholder: string;
  ref: React.Ref<HTMLInputElement>;
}) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-sm"
    style={{ backgroundColor: CHIP_BLUE }}
  >
    {/* Same wired nav-search Lottie as the bubble — replays its animation on
        mount, so tapping the bubble (which swaps it for this pill) plays the
        animation again, not only on the card's initial entry. */}
    <AnimatedNavIcon src={navSearchUrl} boldSrc={navSearchBoldUrl} active size={18} />
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      // Fixed compact width so the pill stays on a single line, no matter
      // what the user types (text scrolls inside the input).
      style={{ width: '120px' }}
      className="bg-transparent outline-none text-white text-[14px] font-normal placeholder:text-white/70 caret-white"
    />
    <button
      type="button"
      onClick={onClear}
      aria-label="clear"
      className="w-5 h-5 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
        close
      </span>
    </button>
  </span>
);

// ── Dropdown panel — in-flow, horizontally centered (sits just below the
//    trigger chip) and popped in with a small scale bounce. Briefly shows
//    skeleton placeholders so the options feel like they're being fetched.
function ListPanel({
  children,
  skeletonCount = 5,
}: {
  children: React.ReactNode;
  /** how many skeleton rows to show on mount; 0 disables the skeleton */
  skeletonCount?: number;
  isHe?: boolean;
}) {
  const [loading, setLoading] = useState(skeletonCount > 0);

  useEffect(() => {
    if (!loading) return;
    const id = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(id);
  }, [loading]);

  return (
    // The finder card is indented by an avatar gutter (a w-8 spacer + gap-3 =
    // 44px on the inline-end side). Centering inside that indented column
    // leaves the panel hugging one edge. Reclaim the gutter with a negative
    // inline-end margin so this wrapper spans the full card width, then
    // justify-center to center the panel on the page rather than the column.
    <div className="flex justify-center -me-11">
      <div
        className="w-[min(92vw,380px)]"
        style={{
          animation: 'panel-pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          transformOrigin: 'top center',
        }}
      >
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden divide-y divide-gray-100 max-h-[40dvh] overflow-y-auto subtle-scrollbar">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            : children}
        </div>
      </div>
    </div>
  );
}

// Single skeleton row — matches the height of a real ListItem (px-4 py-3.5
// + ~h-3 bar) so the panel doesn't jump in size when real options arrive.
function SkeletonRow() {
  return (
    <div className="px-4 py-3.5 animate-pulse">
      <div className="h-3 w-1/2 bg-gray-200 rounded" />
    </div>
  );
}

// Compact store row — small brand logo (falls back to the emoji glyph if the
// image is missing) plus the store name. Used in the search dropdown's
// "חנויות" section.
function StoreRow({
  logoUrl,
  emoji,
  name,
  onClick,
}: {
  logoUrl?: string;
  emoji: string;
  name: string;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-start px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
    >
      <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-contain p-0.5"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-base leading-none">{emoji}</span>
        )}
      </span>
      <span
        className="text-[15px] font-normal leading-tight truncate"
        style={{ color: ITEM_TEXT }}
      >
        {name}
      </span>
    </button>
  );
}

function ListItem({
  emoji,
  icon,
  label,
  subtitle,
  onClick,
}: {
  emoji?: string;
  /** Material-symbols icon name (rendered before label when no emoji) */
  icon?: string;
  label: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-start px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
    >
      {emoji ? (
        <span className="text-lg leading-none">{emoji}</span>
      ) : icon ? (
        <span
          className="material-symbols-outlined text-gray-400 leading-none"
          style={{ fontSize: '18px' }}
        >
          {icon}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-normal leading-tight truncate" style={{ color: ITEM_TEXT }}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: ITEM_SUBTITLE }}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
