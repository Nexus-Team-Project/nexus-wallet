import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useVouchers } from '../hooks/useVouchers';
import { mockBusinesses } from '../mock/data/businesses.mock';
import DiscountFinderCard, { type DiscountFinderResult } from '../components/chat/DiscountFinderCard';
import RecommendationsContent from '../components/chat/RecommendationsSheet';
import SearchFiltersView from '../components/chat/SearchFiltersView';
import StoreFeaturedRow from '../components/store/StoreFeaturedRow';
import VoucherDetail from '../components/store/VoucherDetail';
import PayCodeInfoSheet from '../components/wallet/PayCodeInfoSheet';
import { useTopBarBackStore } from '../stores/topBarBackStore';
import { useTransitionCurtainStore } from '../stores/transitionCurtainStore';
import type { Voucher, StoreFilter, SpecialFilter, VoucherCategory } from '../types/voucher.types';

const SPECIAL_FILTERS = new Set<SpecialFilter>([
  'coming-soon', 'expiring', 'online', 'new', 'popular', 'recommended',
]);
const isSpecialFilter = (f: StoreFilter): f is SpecialFilter =>
  SPECIAL_FILTERS.has(f as SpecialFilter);

const POPULAR_HE = ['פיצה', 'נעלי ספורט', 'גיפט קארד', 'קפה', 'מלון', 'מחשב נייד'];
const POPULAR_EN = ['Pizza', 'Sneakers', 'Gift card', 'Coffee', 'Hotel', 'Laptop'];

// ── Draggable-sheet mechanic (ported from AiChatPage) ─────────────────────
const SHEET_TRANSITION_MS = 560;
const SHEET_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SHEET_EXPANDED_FRAC = 0.79; // open sheet sits just below the search bar
                                  // (small gap — "facing" it, not overlapping)
const SHEET_EXPANDED_HEIGHT = `${SHEET_EXPANDED_FRAC * 100}dvh`;
// Drag past the expanded ceiling by more than this many (post-rubber-band)
// px → navigate away (home, or the full map page when in map mode).
const SHEET_NAVIGATE_OVERDRAG_PX = 30;
const SHEET_OVERDRAG_CEILING_PX = 180;
const SHEET_OVERDRAG_RESISTANCE = 0.7;
// Collapsed "peek" — the sheet never fully leaves the screen; it stays docked
// fairly high (drag handle + results header + a couple of rows) rather than a
// sliver at the very bottom, so it can be read and pulled back up.
// Collapsed peek shows ONLY the drag handle — the results header + map toggle
// sit at ~56px, so keep the peek below that so they stay hidden when docked.
const SHEET_PEEK_PX = 44;

// DEMO: artificially hold the loading skeleton for a beat every time the
// results card rises, so the colorful skeleton is actually visible (mock data
// otherwise resolves instantly). Set to 0 to disable.
const ARTIFICIAL_LOADING_MS = 2500;

// 'normal'      — sheet collapsed; the SearchFiltersView panel fills the top
// 'expanded'    — results list visible, sheet at SHEET_EXPANDED_HEIGHT
// 'collapsing'  — list still rendered but sheet is animating back down
type SheetState = 'normal' | 'expanded' | 'collapsing';

export default function VoucherSearch() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const location = useLocation();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const initialFilter = (location.state as { filter?: StoreFilter } | null)?.filter;
  const [selectedFilter, setSelectedFilter] = useState<StoreFilter | undefined>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  // Brand-pick leave transition: the results card slides up (revealing white
  // behind it), then the global curtain reveals the destination from the bottom.
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const dropCurtain = useTransitionCurtainStore((s) => s.cover);
  // Which help explainer is open: 'results' (floating "?" on the results card)
  // or 'filters' (the "?" on the filter/sort card) — each shows its own text.
  const [helpView, setHelpView] = useState<'results' | 'filters' | null>(null);
  // True while the user is actively using the finder (search input open / a
  // picker dropdown open). Keeps the finder visible even while the sheet is
  // collapsed, so its dropdowns aren't covered by the results card.
  const [finderActive, setFinderActive] = useState(false);

  // Sheet starts expanded so the results list is visible on landing — the
  // user pulls the drag handle down to reveal the SearchFiltersView panel.
  const [sheetState, setSheetState] = useState<SheetState>('expanded');
  // True once the entrance (chat-card-drop) has played, so it isn't re-run on
  // every expand — after that the card animation is the collapsed "bob" or none.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 760);
    return () => window.clearTimeout(id);
  }, []);

  // Warm the brand-pick destination chunk on mount so the reveal isn't stalled
  // waiting on a lazy import mid-transition (the "stuck in the middle" beat).
  useEffect(() => {
    import('./VoucherPurchasePage').catch(() => {});
  }, []);

  // Re-run the loading skeleton each time the results card rises (expands),
  // not just on first landing.
  const [artificialLoading, setArtificialLoading] = useState(ARTIFICIAL_LOADING_MS > 0);
  useEffect(() => {
    if (ARTIFICIAL_LOADING_MS <= 0) return;
    if (sheetState !== 'expanded') return;
    setArtificialLoading(true);
    const id = window.setTimeout(() => setArtificialLoading(false), ARTIFICIAL_LOADING_MS);
    return () => window.clearTimeout(id);
  }, [sheetState]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const collapseTimeout = useRef<number | null>(null);
  // Mirrors RecommendationsContent's view mode so an over-drag past the
  // sheet's ceiling routes to the full map page when viewing the map.
  const sheetViewModeRef = useRef<'list' | 'map'>('list');

  const sheetExpanded = sheetState === 'expanded';
  // Collapsed → swap the finder for the filter-summary panel, UNLESS the finder
  // is actively in use (then keep the finder so its dropdowns have room).
  const showSearchFilters = sheetState !== 'expanded' && !finderActive;

  // Tapping a store goes straight to that business's "create a deal on your
  // terms" page. Match the merchant to a business by name — case-insensitive
  // and tolerant of name variants (e.g. "Aroma" ↔ "Aroma Espresso Bar"), in
  // both English and Hebrew. Falls back to the voucher detail sheet only when
  // the merchant has no partner business at all.
  // Play the card-rise, then hand off to the global reveal curtain + run the
  // actual navigation once the screen is fully white.
  const RISE_MS = 170;
  const runLeaveTransition = (go: () => void) => {
    if (leaving) return;
    setLeaving(true);
    leaveTimer.current = window.setTimeout(() => {
      dropCurtain(); // seamless white hand-off (matches the risen card's white)
      go();
    }, RISE_MS);
  };

  const handleSelectStore = (v: Voucher) => {
    const mn = v.merchantName.trim().toLowerCase();
    const biz = mockBusinesses.find((b) => {
      const n = b.name.trim().toLowerCase();
      const nh = b.nameHe.trim().toLowerCase();
      return (
        n === mn || nh === mn ||
        n.startsWith(mn) || mn.startsWith(n) ||
        nh.startsWith(mn) || mn.startsWith(nh)
      );
    });
    if (biz) {
      runLeaveTransition(() => navigate(`/${lang}/business/${biz.id}/voucher/${v.id}`));
    } else {
      runLeaveTransition(() => setSelectedVoucher(v));
    }
  };

  // Fetch everything once and filter client-side so the list reacts instantly
  // to finder / search changes.
  const { data: vouchers = [], isLoading } = useVouchers();

  // Finder interaction started (search input / a picker opened) → collapse the
  // results sheet down so the finder + its dropdown have room; keep the finder
  // on screen (finderActive suppresses the SearchFiltersView swap).
  const handleFinderInteract = () => {
    setFinderActive(true);
    collapseSheet();
  };

  // Finder "picked a category/subcategory" → filter the list, reveal results.
  const handleFinderComplete = (result: DiscountFinderResult) => {
    setSearchQuery('');
    setSelectedFilter(result.category);
    setFinderActive(false);
    expandSheet();
  };

  // Finder free-text / popular-search query → search, reveal results.
  const handleFinderSearch = (query: string) => {
    setSearchQuery(query);
    setFinderActive(false);
    expandSheet();
  };

  // Category selector → filter (or clear, on 'all'). Used by SearchFiltersView
  // (stay put) and, via handleFinderCategoryPick, by the finder (reveal results).
  const handleFinderCategory = (category: VoucherCategory | 'all') => {
    setSearchQuery('');
    setSelectedFilter(category === 'all' ? undefined : category);
  };
  const handleFinderCategoryPick = (category: VoucherCategory | 'all') => {
    handleFinderCategory(category);
    setFinderActive(false);
    expandSheet();
  };

  const filtered = useMemo(() => {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const result = vouchers.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          v.title.toLowerCase().includes(q) ||
          v.titleHe.includes(searchQuery) ||
          v.merchantName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (!selectedFilter) return true;

      if (isSpecialFilter(selectedFilter)) {
        switch (selectedFilter) {
          case 'coming-soon': return !!v.comingSoon;
          case 'expiring': {
            const expiry = new Date(v.validUntil);
            return expiry >= today && expiry <= oneMonthLater;
          }
          case 'online': return !!v.isOnline;
          case 'new': return !!v.isNew;
          case 'popular': return !!v.popular;
          case 'recommended': return true;
          default: return true;
        }
      }

      return v.category === selectedFilter;
    });

    // Default ordering — biggest discount first (the cashback list's
    // "Recommended" sort).
    result.sort((a, b) => b.discountPercent - a.discountPercent);
    return result;
  }, [vouchers, searchQuery, selectedFilter]);

  // "My brands" strip — popular vouchers with real artwork. Shown on the
  // default view; hidden once the user searches or picks a category.
  const featured = useMemo(
    () => vouchers.filter((v) => v.imageUrl && v.popular && v.inStock).slice(0, 8),
    [vouchers]
  );
  const showFeatured = !searchQuery && !selectedFilter;

  const initialCategory =
    initialFilter && !isSpecialFilter(initialFilter)
      ? (initialFilter as VoucherCategory)
      : undefined;

  // Category currently reflected in the SearchFiltersView panel — mapped from
  // the store filter (special filters read as "all" there).
  const filtersCategory: VoucherCategory | 'all' =
    selectedFilter && !isSpecialFilter(selectedFilter)
      ? (selectedFilter as VoucherCategory)
      : 'all';

  // ── Sheet open/close helpers ────────────────────────────────────────────
  const collapseSheet = useCallback(() => {
    setSheetState((prev) => (prev === 'expanded' ? 'collapsing' : prev));
    if (collapseTimeout.current) window.clearTimeout(collapseTimeout.current);
    collapseTimeout.current = window.setTimeout(() => {
      setSheetState('normal');
      collapseTimeout.current = null;
    }, SHEET_TRANSITION_MS);
  }, []);

  const expandSheet = useCallback(() => {
    if (collapseTimeout.current) {
      window.clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }
    setSheetState('expanded');
  }, []);

  useEffect(() => () => {
    if (collapseTimeout.current) window.clearTimeout(collapseTimeout.current);
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
  }, []);

  // Intercept the TopBar back button: while the results card is pulled down
  // (filter panel showing), "back" first re-opens the results card. Only from
  // the results-open state does back actually leave the page.
  const setBackHandler = useTopBarBackStore((s) => s.setHandler);
  useEffect(() => {
    setBackHandler(() => {
      if (sheetState !== 'expanded') {
        setFinderActive(false);
        expandSheet();
        return true; // consumed — stay on the page
      }
      return false; // let the router navigate away
    });
    return () => setBackHandler(null);
  }, [sheetState, expandSheet, setBackHandler]);

  // Drag handle gesture — bidirectional. Drag up rises (clamped to the
  // expanded height, with rubber-band past the ceiling); drag down shrinks and
  // collapses past the 40% threshold, else snaps back. A tap toggles. An
  // over-drag past the ceiling navigates away.
  useEffect(() => {
    const handle = dragHandleRef.current;
    const wrapper = wrapperRef.current;
    if (!handle || !wrapper) return;

    let startY = 0;
    let dragging = false;
    let delta = 0;
    let startHeight = 0;
    let maxHeight = 0;
    let lastHeight = 0;

    const computeHeight = (raw: number): number => {
      if (raw <= SHEET_PEEK_PX) return SHEET_PEEK_PX;
      if (raw <= maxHeight) return raw;
      const overshoot = raw - maxHeight;
      return maxHeight + Math.min(SHEET_OVERDRAG_CEILING_PX, overshoot * SHEET_OVERDRAG_RESISTANCE);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Manually grabbing the sheet exits finder-mode, so a drag-down reveals
      // the SearchFiltersView panel rather than keeping the finder.
      setFinderActive(false);
      startY = e.clientY;
      dragging = true;
      delta = 0;
      startHeight = wrapper.getBoundingClientRect().height;
      lastHeight = startHeight;
      maxHeight = window.innerHeight * SHEET_EXPANDED_FRAC;
      wrapper.style.transition = 'none';
      try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      delta = e.clientY - startY;
      // delta > 0 → drag down → shrink. delta < 0 → drag up → grow.
      lastHeight = computeHeight(startHeight - delta);
      wrapper.style.height = `${lastHeight}px`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      wrapper.style.transition = `height ${SHEET_TRANSITION_MS}ms ${SHEET_EASING}`;

      const TAP_PX = 5;
      const SNAP_FRAC = 0.4;

      // Over-drag past the ceiling → leave the page. In map mode keep the
      // spatial context by going to the full map; otherwise fall back home.
      if (lastHeight > maxHeight + SHEET_NAVIGATE_OVERDRAG_PX) {
        wrapper.style.height = `${SHEET_PEEK_PX}px`;
        if (sheetExpanded) collapseSheet();
        navigate(
          sheetViewModeRef.current === 'map'
            ? `/${lang}/near-you-map`
            : `/${lang}`,
        );
        delta = 0;
        return;
      }

      if (Math.abs(delta) < TAP_PX) {
        // Tap — toggle
        if (sheetExpanded) {
          wrapper.style.height = `${SHEET_PEEK_PX}px`;
          collapseSheet();
        } else {
          wrapper.style.height = `${maxHeight}px`;
          expandSheet();
        }
      } else if (lastHeight >= maxHeight * SNAP_FRAC) {
        // Past 40% open — snap to expanded
        wrapper.style.height = `${maxHeight}px`;
        if (!sheetExpanded) expandSheet();
      } else {
        // Below 40% open — snap closed
        wrapper.style.height = `${SHEET_PEEK_PX}px`;
        if (sheetExpanded) collapseSheet();
      }
      delta = 0;
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
    };
  }, [sheetExpanded, collapseSheet, expandSheet, navigate, lang]);

  return (
    <div className="flex flex-col relative overflow-hidden h-[100dvh]">
      {/* Gradient curtain — same aurora gradient + softness as the home page
          backdrop (AppLayout), curtaining down on entry and fading into the
          white card below it. */}
      <div
        className="absolute inset-x-0 top-0 h-[380px] pointer-events-none z-0"
        style={{
          animation: 'chat-pink-curtain 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
          willChange: 'transform',
        }}
      >
        <div
          className="w-full h-full opacity-[0.2]"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, var(--color-bg-light) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Top region — the finder while expanded, the filter-summary panel
            once the sheet is pulled back down. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
          {showSearchFilters ? (
            <div className="pt-16 pb-4">
              <SearchFiltersView
                vouchers={filtered}
                selectedCategory={filtersCategory}
                onCategoryChange={handleFinderCategory}
                storeFilters
                onDone={expandSheet}
                onHelp={() => setHelpView('filters')}
              />
            </div>
          ) : (
            <div className="pt-3 ps-14">
              <DiscountFinderCard
                onInteract={handleFinderInteract}
                onComplete={handleFinderComplete}
                onSearchQuery={handleFinderSearch}
                onCategoryChange={handleFinderCategoryPick}
                popularSearches={isHe ? POPULAR_HE : POPULAR_EN}
                initialCategory={initialCategory}
                hideItemType
                onOpenFilters={() => {
                  setFinderActive(false);
                  collapseSheet();
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom sheet — hosts the results list. The expansion is driven by an
            inner wrapper whose height animates from 0 → expanded height. The
            drag handle floats as an absolute overlay at the top. */}
        <div
          className={`bg-white rounded-t-[28px] relative flex flex-col transition-shadow duration-500 ${
            sheetState !== 'expanded'
              ? 'shadow-[0_-8px_32px_rgba(0,0,0,0.22)]'
              : 'shadow-[0_-2px_24px_rgba(0,0,0,0.06)]'
          }`}
          style={{
            maxHeight: SHEET_EXPANDED_HEIGHT,
            animation: leaving
              ? 'none'
              : !entered
                ? 'chat-card-drop 700ms cubic-bezier(0.22, 1, 0.36, 1) both'
                : sheetState === 'normal'
                  ? 'peek-bob 3s ease-in-out infinite'
                  : 'none',
            transform: leaving ? 'translateY(-110vh)' : undefined,
            transition: leaving ? `transform ${RISE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : undefined,
            willChange: 'transform',
          }}
        >
          {/* White foot bleeding below the sheet — clipped off-screen normally,
              it covers the sliver that would otherwise show under the card when
              the peek bobs up. While leaving, it grows to a full screen of white
              so the rising card reveals white behind it (bottom → top). */}
          <div
            className={`absolute inset-x-0 top-full bg-white pointer-events-none ${leaving ? 'h-[120vh]' : 'h-6'}`}
            aria-hidden
          />
          {/* Drag handle — absolute overlay. Pointer events drive drag; a tap
              toggles the sheet open/closed. */}
          <button
            ref={dragHandleRef}
            type="button"
            aria-label={
              isHe
                ? (sheetExpanded ? 'סגור תוצאות' : 'פתח תוצאות')
                : (sheetExpanded ? 'Close results' : 'Open results')
            }
            className="absolute top-0 inset-x-0 z-30 flex justify-center pt-3 pb-3 w-full pointer-events-auto"
            style={{ touchAction: 'none' }}
          >
            <div className="w-9 h-[3px] rounded-full bg-gray-300/80 pointer-events-none" />
          </button>

          {/* Floating help button — same treatment as the card-back help
              (white circle + Material "help" glyph), bottom-left corner. Shown
              while the results are open. */}
          {sheetExpanded && (
            <button
              type="button"
              aria-label={isHe ? 'איך זה עובד' : 'How it works'}
              onClick={() => setHelpView('results')}
              className="absolute z-30 bottom-4 left-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: '22px' }}>
                help
              </span>
            </button>
          )}

          {/* Animated content wrapper — height drives the rise. */}
          <div
            ref={wrapperRef}
            className="overflow-hidden flex-shrink-0 flex flex-col"
            style={{
              height: sheetExpanded ? SHEET_EXPANDED_HEIGHT : `${SHEET_PEEK_PX}px`,
              transition: `height ${SHEET_TRANSITION_MS}ms ${SHEET_EASING}`,
              willChange: 'height',
            }}
          >
            <RecommendationsContent
              vouchers={filtered}
              loading={isLoading || artificialLoading}
              onSelect={handleSelectStore}
              variant="stores"
              hideCategorySlider
              onViewModeChange={(mode) => { sheetViewModeRef.current = mode; }}
              afterCategories={
                showFeatured ? (
                  // "My Brands" slider — sits directly below the category row
                  // (heading removed per request).
                  <div className="pb-1 pt-1">
                    <StoreFeaturedRow vouchers={featured} onSelect={handleSelectStore} />
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {selectedVoucher && (
        <VoucherDetail
          voucher={selectedVoucher}
          onClose={() => { setSelectedVoucher(null); setLeaving(false); }}
        />
      )}

      {/* "How it works" explainer — same sheet the card backs use. The floating
          results "?" and the filter-card "?" show different text. */}
      <PayCodeInfoSheet
        isOpen={helpView !== null}
        onClose={() => setHelpView(null)}
        morePath="wallet/deal-intro"
        intro={
          helpView === 'filters'
            ? (isHe
                ? 'הגדירו את אופן הסינון והמיון, ולחצו "סיום" לצפייה בכרטיסיית התוצאות — או "נקה הכל" כדי להתחיל מחדש.'
                : 'Set how to filter and sort, then tap "Done" to view the results — or "Clear all" to start over.')
            : (isHe
                ? 'כאן מוצגות החנויות ש-Nexus עובד איתן. שלמו עם Nexus וצברו קאשבק — כפול עם Premium.'
                : 'These are the stores Nexus works with. Pay with Nexus and earn cashback — double with Premium.')
        }
        sections={
          helpView === 'filters'
            ? (isHe
                ? [
                    { title: 'מיין לפי', text: 'הגדירו את הסדר שבו יוצגו בפניכם התוצאות.' },
                    { title: 'סינון', text: 'הגדירו אילו תוצאות יוצגו בפניכם.' },
                    { title: 'קטגוריה', text: 'בחרו אילו קטגוריות יוצגו בפניכם.' },
                  ]
                : [
                    { title: 'Sort by', text: 'Set the order in which results are shown.' },
                    { title: 'Filter', text: 'Set which results are shown.' },
                    { title: 'Category', text: 'Choose which categories are shown.' },
                  ])
            : (isHe
                ? [
                    { title: 'חיפוש וסינון', text: 'גללו את כרטיסיית תוצאות החיפוש למטה כדי לפתוח יכולות סינון מתקדמות.' },
                    { title: 'בחירה', text: 'בחרו את החנות שאתם מעוניינים לשלם בה ועברו לדף יצירת שובר.' },
                  ]
                : [
                    { title: 'Search & filter', text: 'Scroll the search-results card down to open advanced filtering.' },
                    { title: 'Selection', text: 'Pick the store you want to pay at and continue to the voucher page.' },
                  ])
        }
      />
    </div>
  );
}
