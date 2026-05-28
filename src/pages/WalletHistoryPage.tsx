import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  BarChart3, PieChart, LineChart as LineChartIcon, Sliders, ChevronDown, MoreHorizontal,
  // Category icons — thin-stroke, monochrome, banking-app style
  Utensils, Shirt, Film, Pill, Laptop, ShoppingCart, Hotel, Dumbbell, Package,
  // Transaction-type fallback icons
  ShoppingBag, Banknote, Gift, Undo2, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTransactions } from '../hooks/useTransactions';
import { useTenantStore } from '../stores/tenantStore';
import { mockBusinesses } from '../mock/data/businesses.mock';
import WalletHistorySkeleton from '../components/wallet/WalletHistorySkeleton';
import {
  BudgetSettingsSheet,
  MonthlyCycleSheet,
  MonthlyBudgetSheet,
  type BudgetConfig,
} from '../components/wallet/BudgetSheets';
import type { Transaction } from '../types/transaction.types';

/**
 * merchant-name → logo lookup. Matches by both the English `name` and the
 * Hebrew `nameHe` (lowercased + trimmed) so a transaction recorded with
 * either form resolves to the same logo. Built once at module load.
 */
const MERCHANT_LOGO_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const b of mockBusinesses) {
    if (!b.logoUrl) continue;
    const en = b.name?.toLowerCase().trim();
    const he = b.nameHe?.toLowerCase().trim();
    if (en) map[en] = b.logoUrl;
    if (he) map[he] = b.logoUrl;
  }
  return map;
})();

function findMerchantLogo(merchantName?: string): string | undefined {
  if (!merchantName) return undefined;
  return MERCHANT_LOGO_MAP[merchantName.toLowerCase().trim()];
}

/**
 * merchant-name → category lookup (English + Hebrew). Used by the Categories
 * tab to roll spending up to the business category level.
 */
const MERCHANT_CATEGORY_MAP: Record<string, { name: string; nameHe: string }> = (() => {
  const map: Record<string, { name: string; nameHe: string }> = {};
  for (const b of mockBusinesses) {
    if (!b.category) continue;
    const entry = { name: b.category, nameHe: b.categoryHe || b.category };
    const en = b.name?.toLowerCase().trim();
    const he = b.nameHe?.toLowerCase().trim();
    if (en) map[en] = entry;
    if (he) map[he] = entry;
  }
  return map;
})();

/**
 * Lucide icon picker for category rollups — thin-stroke, monochrome SVGs
 * (banking-app style) instead of emoji. Returns the component itself so
 * the consumer can size + colour it via className.
 */
function categoryIcon(catName: string): LucideIcon {
  const n = catName.toLowerCase();
  if (n.includes('food') || n.includes('cafe') || n.includes('restaurant') || n.includes('מזון') || n.includes('מסעדה') || n.includes('קפה') || n.includes('אוכל')) return Utensils;
  if (n.includes('cloth') || n.includes('fashion') || n.includes('apparel') || n.includes('ביגוד') || n.includes('אופנה')) return Shirt;
  if (n.includes('entertainment') || n.includes('cinema') || n.includes('בילוי') || n.includes('קולנוע')) return Film;
  if (n.includes('health') || n.includes('pharm') || n.includes('בריאות') || n.includes('פארם')) return Pill;
  if (n.includes('electronics') || n.includes('tech') || n.includes('אלקטרוניקה') || n.includes('טכנולוגיה')) return Laptop;
  if (n.includes('grocery') || n.includes('super') || n.includes('סופר') || n.includes('מכולת')) return ShoppingCart;
  if (n.includes('hotel') || n.includes('travel') || n.includes('מלון') || n.includes('נסיע')) return Hotel;
  if (n.includes('fitness') || n.includes('gym') || n.includes('כושר')) return Dumbbell;
  return Package;
}

/**
 * Lucide icon for the transaction-row avatar fallback (when the merchant
 * has no logo, or for cashback/bonus/refund with no merchant at all).
 */
function txFallbackIcon(tx: Transaction): LucideIcon {
  if (tx.type === 'cashback') return Banknote;
  if (tx.type === 'bonus') return Gift;
  if (tx.type === 'refund') return Undo2;
  if (tx.type === 'redemption') return CheckCircle2;
  return ShoppingBag;
}

type Range = '1W' | '1M' | '6M' | '1Y';
type ChartMode = 'bar' | 'pie' | 'line';
type TabMode = 'categories' | 'transactions';

/** Locale-aware month label (e.g. "Oct" / "אוק" / "October" / "אוקטובר"). */
function monthLabel(t: ReturnType<typeof useLanguage>['t'], month: number, long: boolean): string {
  const keysShort = [
    'monthShortJan', 'monthShortFeb', 'monthShortMar', 'monthShortApr',
    'monthShortMay', 'monthShortJun', 'monthShortJul', 'monthShortAug',
    'monthShortSep', 'monthShortOct', 'monthShortNov', 'monthShortDec',
  ] as const;
  const keysLong = [
    'monthJan', 'monthFeb', 'monthMar', 'monthApr',
    'monthMay', 'monthJun', 'monthJul', 'monthAug',
    'monthSep', 'monthOct', 'monthNov', 'monthDec',
  ] as const;
  const k = (long ? keysLong : keysShort)[month];
  return t.wallet[k as keyof typeof t.wallet] as string;
}

/** Filter transactions that fall inside [from, to). */
function transactionsInRange(txs: Transaction[], from: Date, to: Date): Transaction[] {
  return txs.filter((tx) => {
    const d = new Date(tx.createdAt);
    return d >= from && d < to;
  });
}

interface ChartBucket {
  /** Stable identity used by selection state. */
  key: string;
  /** X-axis label under the bar. */
  label: string;
  /** Sum of spending in this bucket. */
  total: number;
  /** All transactions (incl. non-spending) that landed in this window. */
  items: Transaction[];
  /** True when this bucket is the most recent (the "current" one). */
  isCurrent: boolean;
  from: Date;
  to: Date;
}

/**
 * Build chart buckets driven by the selected time range:
 *  - 1W → 7 daily buckets
 *  - 1M → 4 weekly buckets
 *  - 6M → 6 monthly buckets
 *  - 1Y → 12 monthly buckets
 */
function buildBuckets(
  range: '1W' | '1M' | '6M' | '1Y',
  transactions: Transaction[],
  t: ReturnType<typeof useLanguage>['t'],
  isRTL: boolean,
): ChartBucket[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets: ChartBucket[] = [];

  if (range === '1W') {
    const dayNames = isRTL
      ? ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 6; i >= 0; i--) {
      const from = new Date(today);
      from.setDate(from.getDate() - i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const items = transactionsInRange(transactions, from, to);
      const total = items.reduce(
        (s, tx) => (tx.amount < 0 ? s + Math.abs(tx.amount) : s),
        0,
      );
      buckets.push({
        key: `d-${from.toISOString().slice(0, 10)}`,
        label: dayNames[from.getDay()],
        total,
        items,
        isCurrent: i === 0,
        from,
        to,
      });
    }
    return buckets;
  }

  if (range === '1M') {
    // 4 weekly buckets ending today.
    for (let i = 3; i >= 0; i--) {
      const to = new Date(today);
      to.setDate(to.getDate() - i * 7 + 1);
      const from = new Date(to);
      from.setDate(from.getDate() - 7);
      const items = transactionsInRange(transactions, from, to);
      const total = items.reduce(
        (s, tx) => (tx.amount < 0 ? s + Math.abs(tx.amount) : s),
        0,
      );
      buckets.push({
        key: `w-${from.toISOString().slice(0, 10)}`,
        label: `${from.getDate()}`,
        total,
        items,
        isCurrent: i === 0,
        from,
        to,
      });
    }
    return buckets;
  }

  // 6M / 1Y → monthly buckets.
  const months = range === '6M' ? 6 : 12;
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const items = transactionsInRange(transactions, from, to);
    const total = items.reduce(
      (s, tx) => (tx.amount < 0 ? s + Math.abs(tx.amount) : s),
      0,
    );
    buckets.push({
      key: `m-${from.toISOString().slice(0, 7)}`,
      label: monthLabel(t, from.getMonth(), false),
      total,
      items,
      isCurrent: i === 0,
      from,
      to,
    });
  }
  return buckets;
}

/** Group a date-sorted (desc) transaction list into day buckets. */
function groupByDay(txs: Transaction[], t: ReturnType<typeof useLanguage>['t']): Array<{
  key: string;
  label: string;
  total: number;
  items: Transaction[];
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets: Record<string, { label: string; total: number; items: Transaction[]; sortKey: number }> = {};
  for (const tx of txs) {
    const d = new Date(tx.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    let label: string;
    if (d.getTime() === today.getTime()) label = t.wallet.historyToday;
    else if (d.getTime() === yesterday.getTime()) label = t.wallet.historyYesterday;
    else {
      const day = d.getDate();
      const mon = monthLabel(t, d.getMonth(), false);
      label = `${day} ${mon}`;
    }
    if (!buckets[key]) buckets[key] = { label, total: 0, items: [], sortKey: d.getTime() };
    buckets[key].items.push(tx);
    if (tx.amount < 0) buckets[key].total += Math.abs(tx.amount);
  }

  return Object.entries(buckets)
    .sort((a, b) => b[1].sortKey - a[1].sortKey)
    .map(([key, b]) => ({ key, label: b.label, total: b.total, items: b.items }));
}

/** Locale-aware merchant title (Hebrew if available, else English). */
function txTitle(tx: Transaction, isRTL: boolean): string {
  return isRTL ? (tx.titleHe || tx.title) : (tx.title || tx.titleHe);
}

/**
 * Donut/pie chart of the current category breakdown — slices are clickable
 * to filter the rows below. Uses straight SVG arcs, no chart library.
 * Slice colours come from a fixed muted palette so they read as bankerly
 * rather than as a rainbow.
 */
// Softer banker palette — leads with the brand purple instead of the harsh
// near-black navy so the ring reads as "premium fintech" rather than
// "tax software". Greys are slate-tone, never pure black.
const PIE_PALETTE = [
  '#635bff', // primary
  '#00d4ff', // accent-cyan
  '#7dd3a8', // accent-green
  '#f59e0b', // warning
  '#ef4444', // error
  '#5649d8', // primary-dark
  '#475569', // slate-600 — soft dark, replaces the old harsh #0a2540
  '#94a3b8', // slate-400 — neutral last resort
];

/**
 * PieRing — the stroked-arc ring on its own, *no* center label. Designed
 * to wrap around the spending-summary headline number so the existing
 * "₪X" text serves as the pie's centre.
 */
function PieRing({
  slices,
  grandTotal,
  selectedKey,
  onSelect,
  isRTL,
}: {
  slices: { key: string; labelHe: string; labelEn: string; total: number }[];
  grandTotal: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  isRTL: boolean;
}) {
  if (grandTotal <= 0 || slices.length === 0) return null;

  // Single-radius ring of stroked arc segments with rounded ends and small
  // gaps between segments — matches the reference design exactly.
  const R = 40;
  const CX = 50;
  const CY = 50;
  const STROKE = 4;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const SEGMENT_GAP = 4;

  let cumulative = 0;
  const arcs = slices.map((s, i) => {
    const share = s.total / grandTotal;
    const fullArc = share * CIRCUMFERENCE;
    const arcLen = Math.max(fullArc - SEGMENT_GAP, 1);
    const offset = -cumulative;
    cumulative += fullArc;
    return {
      key: s.key,
      label: isRTL ? s.labelHe : s.labelEn,
      total: s.total,
      color: PIE_PALETTE[i % PIE_PALETTE.length],
      arcLen,
      offset,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {arcs.map((a, i) => {
        const dimmed = selectedKey !== null && selectedKey !== a.key;
        return (
          <motion.circle
            key={a.key}
            cx={CX}
            cy={CY}
            r={R}
            fill="transparent"
            stroke={a.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDashoffset={a.offset}
            opacity={dimmed ? 0.25 : 1}
            onClick={() => onSelect(a.key)}
            style={{
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              pointerEvents: 'auto',
            }}
            // "Draw-in" — each arc grows from length 0 to its final length
            // along its own contour. Staggered by index so segments unfurl
            // sequentially clockwise from 12 o'clock (the -90deg rotation
            // above puts the start of the dash pattern there).
            initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
            animate={{ strokeDasharray: `${a.arcLen} ${CIRCUMFERENCE}` }}
            transition={{
              duration: 0.55,
              delay: 0.1 + i * 0.12,
              ease: [0.32, 0.72, 0, 1],
            }}
          />
        );
      })}
    </svg>
  );
}

/**
 * Single transaction row — extracted as its own component so we can hold
 * per-row state (the image-load error flag that triggers the emoji fallback
 * when the merchant's logo URL can't be loaded).
 */
function TransactionRow({ tx, isRTL }: { tx: Transaction; isRTL: boolean }) {
  const [imgError, setImgError] = useState(false);

  const logoUrl = findMerchantLogo(tx.merchantName);
  const FallbackIcon = txFallbackIcon(tx);
  const displayName = tx.merchantName ?? (isRTL ? tx.titleHe : tx.title);
  const titleText = isRTL ? tx.titleHe : tx.title;
  const bodyText = isRTL ? tx.descriptionHe : tx.description;

  // Per-type corner badge — same lockup as NotificationCard's catIcon.
  const badge =
    tx.amount < 0
      ? { color: 'bg-text-primary', icon: 'shopping_bag' }
      : tx.type === 'cashback'
        ? { color: 'bg-success', icon: 'redeem' }
        : tx.type === 'bonus'
          ? { color: 'bg-warning', icon: 'card_giftcard' }
          : tx.type === 'refund'
            ? { color: 'bg-accent-cyan', icon: 'undo' }
            : { color: 'bg-success', icon: 'check' };

  const dateLabel = new Date(tx.createdAt).toLocaleDateString(
    isRTL ? 'he-IL' : 'en-US',
    { day: 'numeric', month: 'short' },
  );

  return (
    <div className="w-full flex gap-3 items-start">
      {/* Avatar — real merchant logo when we have one, emoji fallback
          otherwise. Same 44px circle + corner badge as NotificationCard. */}
      <div className="flex-shrink-0 relative">
        <div className="rounded-full flex items-center justify-center w-11 h-11 overflow-hidden bg-surface text-text-secondary">
          {logoUrl && !imgError ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackIcon size={20} strokeWidth={1.6} />
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${badge.color} ${
            isRTL ? '-start-0.5' : '-end-0.5'
          }`}
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
          >
            {badge.icon}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="text-[13px] font-bold text-text-primary leading-tight truncate">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-text-muted font-medium whitespace-nowrap">
              {dateLabel}
            </span>
            <span
              className={`text-[13px] font-bold whitespace-nowrap ${
                tx.amount < 0 ? 'text-text-primary' : 'text-success'
              }`}
              dir="ltr"
            >
              {tx.amount < 0 ? '−' : '+'}₪{Math.abs(tx.amount).toFixed(2)}
            </span>
          </div>
        </div>
        <p className="text-[13px] font-semibold text-text-primary leading-tight mb-1 truncate">
          {titleText}
        </p>
        <p className="text-[12px] text-text-secondary leading-snug line-clamp-2">{bodyText}</p>
      </div>
    </div>
  );
}

/**
 * WalletHistoryPage
 *
 * The spending-insights screen surfaced by the Wallet → More actions →
 * "היסטוריה" entry. Adapted from the provided reference mock:
 *  - This-month spend headline + budget progress bar
 *  - 6-month spending bar chart, current month highlighted
 *  - Range selector (1W/1M/6M/1Y) — visual; chart fixes on 6 months
 *  - Categories ↔ Transactions tab
 *  - Day-grouped transaction list using the project's mock data
 */
export default function WalletHistoryPage() {
  const { t, isRTL } = useLanguage();
  // `lang` left available for future deep-links from this page (e.g. tapping
  // a transaction → voucher detail). Currently unused but kept to match the
  // pattern of other wallet sub-routes that use `/${lang}/...` navigation.
  useParams();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  // Brand colour drives all the highlight tints in the chart (line stroke,
  // area gradient, selected dot, halo). Falls back to the project's primary
  // purple when no tenant is active.
  const tenantConfig = useTenantStore((s) => s.config);
  const brandColor = tenantConfig?.primaryColor ?? '#635bff';

  const [range, setRange] = useState<Range>('6M');
  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [tab, setTab] = useState<TabMode>('transactions');
  // Selected chart segment — clicking a bar / pie-slice / list-row narrows
  // the lists below to that bucket (time bucket for bar+list, category for
  // pie). Clicking the same segment again clears the filter.
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  // Budget config — amount + monthly cycle. Starts unconfigured so the
  // user lands on the "Set budget" prompt; the settings sheets below
  // populate it.
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
    amount: null,
    cycle: { mode: 'calendar' },
  });
  const monthlyBudget = budgetConfig.amount;

  // Which budget-related sheet is open. Only one at a time — going from
  // settings → cycle/budget hides settings, going back shows it again.
  const [openSheet, setOpenSheet] = useState<'none' | 'settings' | 'cycle' | 'budget'>('none');

  // Date "now" is recomputed each render — used by buildBuckets below as
  // the right edge of the active range.
  const now = new Date();

  // === Pie mode helper: ring is shown wrapping the headline number. ===
  const isPieMode = chartMode === 'pie';

  // === Range-driven chart buckets ===
  const buckets = useMemo(
    () => buildBuckets(range, transactions, t, isRTL),
    [range, transactions, t, isRTL],
  );
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  // Clear stale bucket selection when the user switches range — the keys
  // are no longer addressable.
  useMemo(() => {
    if (
      selectedBucketKey &&
      !buckets.some((b) => b.key === selectedBucketKey)
    ) {
      setSelectedBucketKey(null);
    }
  }, [buckets, selectedBucketKey]);

  // === Filtered scope ===
  // Everything below the chart is computed against this slice: either the
  // full range of buckets, or — when the user clicks a bar — just that
  // single bucket.
  const scopeTransactions = useMemo(() => {
    if (selectedBucketKey) {
      const b = buckets.find((b) => b.key === selectedBucketKey);
      return b?.items ?? [];
    }
    // No selection → union of all bucket items (i.e. the active range).
    return buckets.flatMap((b) => b.items);
  }, [buckets, selectedBucketKey]);

  // === Category rollup ===
  const categoryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; nameHe: string; total: number; count: number; items: Transaction[] }
    >();
    for (const tx of scopeTransactions) {
      if (tx.amount >= 0) continue;
      const lookup = tx.merchantName
        ? MERCHANT_CATEGORY_MAP[tx.merchantName.toLowerCase().trim()]
        : undefined;
      const cat = lookup ?? { name: 'Other', nameHe: 'אחר' };
      const key = cat.name;
      const entry = map.get(key) ?? {
        name: cat.name,
        nameHe: cat.nameHe,
        total: 0,
        count: 0,
        items: [],
      };
      entry.total += Math.abs(tx.amount);
      entry.count += 1;
      entry.items.push(tx);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scopeTransactions]);
  const categoryGrandTotal = categoryBreakdown.reduce((s, c) => s + c.total, 0);

  // Filtered transactions for the Transactions tab — narrows further if a
  // pie slice / category is selected.
  const filteredTransactions = useMemo(() => {
    if (!selectedCategoryKey) return scopeTransactions;
    const cat = categoryBreakdown.find((c) => c.name === selectedCategoryKey);
    return cat?.items ?? [];
  }, [scopeTransactions, categoryBreakdown, selectedCategoryKey]);

  // === Headline number (the BIG ₪ at the top of the page). Reflects the
  // currently-active filters so the pie's centre and the summary stay in
  // sync without a second number. ===
  const headlineTotal = useMemo(() => {
    return filteredTransactions.reduce(
      (s, tx) => (tx.amount < 0 ? s + Math.abs(tx.amount) : s),
      0,
    );
  }, [filteredTransactions]);

  /** Caption above the headline number — names what we're summing. */
  const headlineCaption = useMemo(() => {
    if (selectedCategoryKey) {
      const cat = categoryBreakdown.find((c) => c.name === selectedCategoryKey);
      if (cat) return isRTL ? cat.nameHe : cat.name;
    }
    if (selectedBucketKey) {
      const b = buckets.find((b) => b.key === selectedBucketKey);
      if (b) return b.label;
    }
    // No filter → name the active range.
    if (range === '1W') return isRTL ? 'השבוע' : 'This week';
    if (range === '1M') return isRTL ? 'החודש' : 'This month';
    if (buckets.length === 0) return '';
    const first = buckets[0];
    const last = buckets[buckets.length - 1];
    return `${monthLabel(t, first.from.getMonth(), false)} – ${monthLabel(
      t,
      last.from.getMonth(),
      false,
    )}`;
  }, [
    selectedCategoryKey,
    selectedBucketKey,
    categoryBreakdown,
    buckets,
    range,
    isRTL,
    t,
  ]);

  // Which category is currently expanded in the Categories tab.
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // === Day-grouped transactions list ===
  const sortedTxs = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filteredTransactions],
  );
  const dayGroups = useMemo(() => groupByDay(sortedTxs, t), [sortedTxs, t]);

  // Show the skeleton while the transactions query is in flight so the
  // chart / lists don't briefly render with zero data before the real
  // numbers arrive. All hooks above run unconditionally — the bail-out
  // happens here, just before the JSX.
  if (txLoading) {
    return <WalletHistorySkeleton />;
  }

  return (
    // pt-20 pushes the page below the AppLayout TopBar overlay (h-0 z-50)
    // — same trick NotificationsPage uses to avoid being covered by the
    // avatar / chat / bell strip.
    <div className="min-h-dvh bg-white animate-fade-in pt-20">
      {/* Header — back button lives in the AppLayout TopBar overlay
          above, so we only render the page title + view toggle here. */}
      <header className="flex items-center justify-between px-6 pb-4">
        <h1 className="text-lg font-bold text-text-primary">{t.wallet.historyTitle}</h1>
        <div className="flex bg-surface rounded-full p-1 items-center" data-purpose="view-toggle">
          {(['bar', 'pie', 'line'] as const).map((m) => {
            const Icon = m === 'bar' ? BarChart3 : m === 'pie' ? PieChart : LineChartIcon;
            const active = chartMode === m;
            return (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                aria-label={m}
                className={`p-1.5 flex items-center justify-center rounded-full transition-all ${
                  active ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted'
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </header>

      {/* Spending summary — headline + budget UI sit at the centre; in pie
          mode the ring wraps the whole stack. Container is sized to leave
          enough breathing room inside the ring for all the budget text. */}
      <section className="flex flex-col items-center mt-4 px-6">
        <div className="relative w-72 h-72 flex flex-col items-center justify-center">
          {/* Pie ring — animates in around the centre stack. */}
          <AnimatePresence>
            {isPieMode && (
              <motion.div
                key="pie-ring"
                // Wrapper just fades in/out quickly. The visible movement
                // is the staggered "draw-in" of each pie segment inside
                // PieRing, so keeping the wrapper static here lets that
                // animation read clearly.
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <PieRing
                  slices={categoryBreakdown.map((c) => ({
                    key: c.name,
                    labelHe: c.nameHe,
                    labelEn: c.name,
                    total: c.total,
                  }))}
                  grandTotal={categoryGrandTotal}
                  selectedKey={selectedCategoryKey}
                  onSelect={(key) =>
                    setSelectedCategoryKey(selectedCategoryKey === key ? null : key)
                  }
                  isRTL={isRTL}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Centre stack — caption, headline number, budget bar, "left X".
              Stays visible in every mode (incl. pie), since the ring is
              sized to wrap around it. */}
          <p className="text-text-secondary text-xs font-medium mb-1">
            {headlineCaption}
          </p>
          <h2 className="text-5xl font-bold text-text-primary leading-none" dir="ltr">
            ₪{headlineTotal.toFixed(0)}
          </h2>
          {monthlyBudget !== null ? (
            <>
              <div className="w-[140px] h-1.5 bg-border rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-bg-dark transition-[width] duration-500"
                  style={{
                    width: `${Math.min((headlineTotal / monthlyBudget) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <p className="text-primary text-xs font-semibold">
                  {t.wallet.leftOfBudget
                    .replace(
                      '{left}',
                      Math.max(monthlyBudget - headlineTotal, 0).toFixed(0),
                    )
                    .replace('{total}', monthlyBudget.toString())}
                </p>
                {/* Kebab — opens the budget settings sheet. */}
                <button
                  type="button"
                  onClick={() => setOpenSheet('settings')}
                  aria-label="Budget options"
                  className="p-1 rounded-full text-text-muted hover:bg-surface transition-colors"
                >
                  <MoreHorizontal size={14} strokeWidth={2.25} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpenSheet('settings')}
              className="mt-4 text-primary text-xs font-semibold hover:underline"
            >
              {t.wallet.setBudget}
            </button>
          )}
        </div>
      </section>

      {/* Chart — switches between bar/pie/list per the view-toggle in the
          header. Bar bars and pie slices are clickable filters.
          Line mode gets reduced horizontal padding so the chart breathes
          wider across the device frame; bar/list still use the normal
          gutter via per-mode wrappers below. */}
      <section
        className={`mt-12 mb-2 ${chartMode === 'line' ? 'px-2' : 'px-6'}`}
        data-purpose="chart"
      >
        {chartMode === 'bar' && (() => {
          // Bar width + gap scale with bucket count so a 12-bar (1Y) chart
          // doesn't blow past the container. Tighter / thinner / less
          // rounded as the count goes up — same visual language though.
          const n = buckets.length;
          const barWidthClass =
            n >= 12 ? 'w-4' : n >= 8 ? 'w-7' : 'w-11';
          const radiusClass =
            n >= 12 ? 'rounded-sm' : n >= 8 ? 'rounded-md' : 'rounded-lg';
          const gapClass = n >= 12 ? 'gap-1' : n >= 8 ? 'gap-2' : 'gap-3';
          // Drop the value label above each bar when there are too many —
          // they collide otherwise.
          const showValueLabel = n <= 8;
          // Smaller axis labels for dense charts.
          const axisLabelClass = n >= 12 ? 'text-[10px]' : 'text-xs';
          return (
            <div className={`flex justify-between items-end ${gapClass}`} dir="ltr">
              {buckets.map((b) => {
                const MAX_BAR_PX = 170;
                const MIN_BAR_PX = 14;
                const MIN_EMPTY_PX = 8;
                const barPx =
                  b.total > 0
                    ? Math.max((b.total / maxBucket) * MAX_BAR_PX, MIN_BAR_PX)
                    : MIN_EMPTY_PX;
                const isSelected = selectedBucketKey === b.key;
                const hasSelection = selectedBucketKey !== null;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() =>
                      setSelectedBucketKey(isSelected ? null : b.key)
                    }
                    className="flex flex-col items-center gap-2.5 flex-1 min-w-0 active:scale-95 transition-transform"
                    aria-pressed={isSelected}
                  >
                    {showValueLabel ? (
                      <span
                        className={`text-xs font-bold ${
                          isSelected || b.isCurrent
                            ? 'text-text-primary'
                            : 'text-text-muted'
                        }`}
                      >
                        {b.total > 0 ? Math.round(b.total) : '0'}
                      </span>
                    ) : null}
                    <div
                      className={`${barWidthClass} ${radiusClass} transition-all ${
                        isSelected
                          ? 'bg-primary shadow-md shadow-primary/25'
                          : b.isCurrent && !hasSelection
                            ? 'bg-bg-dark shadow-md shadow-bg-dark/15'
                            : hasSelection
                              ? 'bg-border/60'
                              : 'bg-border'
                      }`}
                      style={{ height: `${barPx}px` }}
                    />
                    <span
                      className={`${axisLabelClass} ${
                        isSelected || b.isCurrent
                          ? 'font-bold text-text-primary'
                          : 'font-medium text-text-muted'
                      }`}
                    >
                      {b.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Pie mode renders no chart here — the ring is rendered around
            the headline number in the spending-summary section above. */}

        {chartMode === 'line' && (() => {
          // === Line-chart geometry ===
          // Taller viewBox = more dramatic vertical movement. The data
          // area uses the top portion (above the dashed zero axis), the
          // bottom holds the axis labels.
          const W = 320;
          const H = 210;
          const PAD_X = 16;
          const PAD_Y_TOP = 22;
          const PAD_Y_BOTTOM = 34; // room for x-axis labels
          const innerW = W - PAD_X * 2;
          const innerH = H - PAD_Y_TOP - PAD_Y_BOTTOM;

          const n = Math.max(buckets.length, 1);
          // Data lives in the top ~70% of the available height. Combined
          // with the larger H above, this gives the curve nearly twice the
          // vertical range it had before → much more pronounced motion.
          const dataInnerH = innerH * 0.7;
          const points = buckets.map((b, i) => {
            const x = PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
            const y =
              PAD_Y_TOP + (1 - b.total / maxBucket) * dataInnerH;
            return { x, y, bucket: b };
          });


          // Monotonic cubic Bézier (Fritsch-Carlson) through every point.
          // Unlike Catmull-Rom, this is guaranteed not to overshoot between
          // data points — local extrema sit *on* the points, never in the
          // empty space between them. Result: smooth curve, but every
          // bend happens at an actual time-axis tick.
          const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
            if (pts.length === 0) return '';
            if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
            const n = pts.length;
            // Secant slopes between consecutive points.
            const dx: number[] = new Array(n - 1);
            const m: number[] = new Array(n - 1);
            for (let i = 0; i < n - 1; i++) {
              dx[i] = pts[i + 1].x - pts[i].x;
              m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
            }
            // Tangents at each point — Fritsch-Carlson weighted harmonic.
            const t: number[] = new Array(n);
            t[0] = m[0];
            t[n - 1] = m[n - 2];
            for (let i = 1; i < n - 1; i++) {
              if (m[i - 1] * m[i] <= 0) {
                // Sign change → local extremum at point i, flatten tangent
                // so the curve doesn't shoot past it.
                t[i] = 0;
              } else {
                const w1 = 2 * dx[i] + dx[i - 1];
                const w2 = dx[i] + 2 * dx[i - 1];
                t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
              }
            }
            // Build cubic Béziers using the tangents.
            let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
            for (let i = 0; i < n - 1; i++) {
              const segDx = dx[i] / 3;
              const c1x = pts[i].x + segDx;
              const c1y = pts[i].y + t[i] * segDx;
              const c2x = pts[i + 1].x - segDx;
              const c2y = pts[i + 1].y - t[i + 1] * segDx;
              d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
            }
            return d;
          };

          // ONE smooth curve through every point — the shape never changes
          // when the user clicks. The selection just splits the rendering
          // via clip-paths so the same path is drawn twice (grey + purple)
          // in different halves.
          const linePath = buildSmoothPath(points);
          // Area baseline = the bottom of the data range (where value 0
          // maps to). Used to seal the gradient fill under the curve.
          const dataBottomY = PAD_Y_TOP + dataInnerH;
          const areaPath = points.length
            ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${dataBottomY} L ${points[0].x.toFixed(2)} ${dataBottomY} Z`
            : '';

          const selectedIdx = selectedBucketKey
            ? points.findIndex((p) => p.bucket.key === selectedBucketKey)
            : -1;
          // X coordinate where the colour transition happens. When no
          // selection, the "left" clip is empty and the whole line is
          // coloured.
          const splitX = selectedIdx >= 0 ? points[selectedIdx].x : PAD_X;

          return (
            <motion.svg
              // Re-keying on range remounts the chart when the user
              // switches 1W/1M/6M/1Y — combined with the fade-in below
              // this smooths the transition between bucket counts.
              key={range}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-72"
              dir="ltr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <defs>
                <linearGradient id="line-area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brandColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={brandColor} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="line-area-fill-muted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#9ca3af" stopOpacity="0" />
                </linearGradient>
                {/* Clip rectangles split the chart at the selected point.
                    Both halves are rendered against the same underlying
                    path, so the curve shape never changes. The boundary
                    is animated (framer-motion) so clicking a point makes
                    the past half visually "fill in" from the left to that
                    point instead of snapping instantly. */}
                <clipPath id="line-clip-past">
                  <motion.rect
                    x={0}
                    y={0}
                    height={H}
                    initial={false}
                    animate={{ width: splitX }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  />
                </clipPath>
                <clipPath id="line-clip-future">
                  <motion.rect
                    y={0}
                    height={H}
                    initial={false}
                    animate={{ x: splitX, width: W - splitX }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  />
                </clipPath>
              </defs>

              {/* Background grid — horizontal & vertical dashed reference
                  lines. Subtle so they read as "ruler ticks" behind the
                  data, never competing with the curve itself. */}
              {[0.25, 0.5, 0.75].map((frac) => {
                const gy = PAD_Y_TOP + dataInnerH * frac;
                return (
                  <line
                    key={`hgrid-${frac}`}
                    x1={PAD_X}
                    y1={gy}
                    x2={W - PAD_X}
                    y2={gy}
                    stroke="#e5e7eb"
                    strokeWidth="0.6"
                    strokeDasharray="2 4"
                  />
                );
              })}
              {points.map((p) => (
                <line
                  key={`vgrid-${p.bucket.key}`}
                  x1={p.x}
                  y1={PAD_Y_TOP}
                  x2={p.x}
                  y2={dataBottomY}
                  stroke="#e5e7eb"
                  strokeWidth="0.6"
                  strokeDasharray="2 4"
                />
              ))}
              {/* Dashed zero-axis along the data baseline — slightly darker
                  than the grid so it reads as the "0 line". */}
              <line
                x1={PAD_X}
                y1={dataBottomY}
                x2={W - PAD_X}
                y2={dataBottomY}
                stroke="#cbd5e1"
                strokeWidth="0.9"
                strokeDasharray="3 4"
              />

              {/* Area fills — same path, clipped into past/future halves. */}
              {areaPath && (
                <>
                  <path d={areaPath} fill="url(#line-area-fill-muted)" clipPath="url(#line-clip-past)" />
                  <path d={areaPath} fill="url(#line-area-fill)" clipPath="url(#line-clip-future)" />
                </>
              )}

              {/* Line — thin and refined. Past half is dashed grey, future
                  half is a solid coloured line so the eye reads "this
                  happened" vs "this is current/coming". */}
              <path
                d={linePath}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                clipPath="url(#line-clip-past)"
              />
              <path
                d={linePath}
                fill="none"
                stroke={brandColor}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath="url(#line-clip-future)"
              />
              {/* Data points + invisible tap targets — recoloured to match
                  the split: past points grey, future-from-selection coloured. */}
              {points.map((p, i) => {
                const isSelected = selectedBucketKey === p.bucket.key;
                const isPast = selectedIdx >= 0 && i < selectedIdx;
                const pointColor = isPast ? '#9ca3af' : brandColor;
                return (
                  <g key={p.bucket.key}>
                    {/* Pulsing halo on the currently-selected point —
                        ripples out and fades, looping forever, so the eye
                        is drawn to the active selection. Sits behind the
                        dot. */}
                    {isSelected && (
                      <>
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          fill={brandColor}
                          initial={{ r: 3, opacity: 0.55 }}
                          animate={{ r: 14, opacity: 0 }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          fill={brandColor}
                          initial={{ r: 3, opacity: 0.45 }}
                          animate={{ r: 14, opacity: 0 }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 0.8,
                          }}
                        />
                      </>
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 5 : 3}
                      fill={isSelected ? pointColor : '#fff'}
                      stroke={pointColor}
                      strokeWidth={1.5}
                      style={{ transition: 'all 0.2s' }}
                    />
                    {/* invisible larger hit area for easier tapping */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={16}
                      fill="transparent"
                      onClick={() =>
                        setSelectedBucketKey(isSelected ? null : p.bucket.key)
                      }
                      style={{ cursor: 'pointer' }}
                    />
                    {/* X-axis label */}
                    <text
                      x={p.x}
                      y={H - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isSelected || p.bucket.isCurrent ? 700 : 500}
                      fill={
                        isSelected || p.bucket.isCurrent
                          ? '#0a2540'
                          : '#6b7280'
                      }
                    >
                      {p.bucket.label}
                    </text>
                  </g>
                );
              })}
            </motion.svg>
          );
        })()}
      </section>

      {/* Time range selector */}
      <section className="mt-8 px-6 flex items-center gap-2">
        <div className="flex-grow flex bg-surface rounded-full p-1">
          {(['1W', '1M', '6M', '1Y'] as const).map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                  active ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
        <button
          className="p-3 bg-surface rounded-full text-text-secondary hover:bg-border/40 transition-colors"
          aria-label="Filter"
        >
          <Sliders size={16} />
        </button>
      </section>

      {/* Categories / Transactions tab */}
      <section className="mt-6 px-6 flex gap-3" data-purpose="toggle-buttons">
        <button
          onClick={() => setTab('categories')}
          className={`flex-1 py-2 rounded-full border text-sm font-semibold transition-all ${
            tab === 'categories'
              ? 'bg-bg-dark text-white border-bg-dark'
              : 'bg-white text-text-primary border-border'
          }`}
        >
          {t.wallet.historyCategories}
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`flex-1 py-2 rounded-full border text-sm font-semibold transition-all ${
            tab === 'transactions'
              ? 'bg-bg-dark text-white border-bg-dark'
              : 'bg-white text-text-primary border-border'
          }`}
        >
          {t.wallet.historyTransactions}
        </button>
      </section>

      {/* Transactions list */}
      {tab === 'transactions' && (
        <section className="mt-8 px-6 space-y-7 mb-bottom-nav" data-purpose="transactions-list">
          {dayGroups.length === 0 && (
            <p className="text-center text-text-muted py-12">{t.wallet.historyNoData}</p>
          )}
          {dayGroups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center text-sm mb-4">
                <span className="font-bold text-text-primary">{group.label}</span>
                {group.total > 0 && (
                  <>
                    <span className="mx-2 opacity-30 text-xs">•</span>
                    <span className="text-text-muted" dir="ltr">
                      ₪{group.total.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div className="space-y-4 px-1">
                {group.items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Categories — clickable rows that expand to reveal the transactions
          inside the category. No percentages or progress bars; just total
          + count, with a chevron that rotates to indicate state. */}
      {tab === 'categories' && (
        <section className="mt-8 px-6 space-y-5 mb-bottom-nav">
          {categoryBreakdown.length === 0 && (
            <p className="text-center text-text-muted py-12">{t.wallet.historyNoData}</p>
          )}
          {categoryBreakdown.map((c) => {
            const label = isRTL ? c.nameHe : c.name;
            const CatIcon = categoryIcon(c.name);
            const isOpen = expandedCategory === c.name;
            return (
              <div key={c.name} className="w-full">
                {/* Header row — clickable. Same flat NotificationCard
                    layout but with a chevron sitting where the body's
                    second muted line would go. */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategory(isOpen ? null : c.name)
                  }
                  aria-expanded={isOpen}
                  className="w-full flex gap-3 items-center text-start hover:opacity-80 active:scale-[0.995] transition-all"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                    <CatIcon size={20} strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-[13px] font-bold text-text-primary leading-tight truncate">
                        {label}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[13px] font-bold text-text-primary whitespace-nowrap"
                          dir="ltr"
                        >
                          ₪{c.total.toFixed(2)}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-text-muted transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-snug mt-0.5">
                      {c.count}{' '}
                      {c.count === 1
                        ? isRTL
                          ? 'עסקה'
                          : 'transaction'
                        : isRTL
                          ? 'עסקאות'
                          : 'transactions'}
                    </p>
                  </div>
                </button>

                {/* Expanded drill-down — uses the same TransactionRow as
                    the main list so the visual language stays consistent. */}
                {isOpen && (
                  <div
                    className={`mt-4 space-y-4 animate-fade-in ${
                      isRTL ? 'pr-14' : 'pl-14'
                    }`}
                  >
                    {c.items
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Budget settings sheets — only one open at a time. Going from the
          "More" sheet into a sub-sheet hides it and clicking back returns. */}
      <BudgetSettingsSheet
        open={openSheet === 'settings'}
        onClose={() => setOpenSheet('none')}
        config={budgetConfig}
        onOpenBudget={() => setOpenSheet('budget')}
        onOpenCycle={() => setOpenSheet('cycle')}
      />
      <MonthlyBudgetSheet
        open={openSheet === 'budget'}
        onClose={() => setOpenSheet('none')}
        onBack={() => setOpenSheet('settings')}
        initial={budgetConfig.amount}
        onSave={(amount) => {
          setBudgetConfig((c) => ({ ...c, amount }));
          setOpenSheet('none');
        }}
      />
      <MonthlyCycleSheet
        open={openSheet === 'cycle'}
        onClose={() => setOpenSheet('none')}
        onBack={() => setOpenSheet('settings')}
        initial={budgetConfig.cycle}
        onSave={(cycle) => {
          setBudgetConfig((c) => ({ ...c, cycle }));
          setOpenSheet('none');
        }}
      />
    </div>
  );
}
