import { useMemo, useState } from 'react';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { formatDate } from '../../utils/formatDate';
import { joinList, type ConditionKey, type ConditionRow } from './giftConditionRows';
import { formatCurrency } from '../../utils/formatCurrency';
import type { GiftConditions } from '../../types/giftConditions.types';

/**
 * Advanced gift conditions ("תנאים מתקדמים") — the list shown on the benefit
 * screen, and the detail screen each row opens. Rows come from
 * `buildConditionRows` (giftConditionRows.ts).
 */

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────

export function AdvancedConditionsList({
  rows,
  isRTL,
  onOpen,
}: {
  rows: ConditionRow[];
  isRTL: boolean;
  onOpen: (key: ConditionKey) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <p className="text-[13px] font-semibold text-text-muted mb-1">
        {isRTL ? 'תנאים מתקדמים' : 'Advanced conditions'}
      </p>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => onOpen(row.key)}
            className="w-full flex items-center gap-3 py-3.5 text-start active:bg-surface/70 transition-colors"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold text-text-primary">{row.title}</span>
              {row.summary.map((line) => (
                <span key={line} className="block text-[13px] text-text-muted mt-0.5 leading-snug">
                  {line}
                </span>
              ))}
            </span>
            <span className="material-symbols-outlined text-text-muted flex-shrink-0" style={{ fontSize: 20 }}>
              {isRTL ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail screens
// ─────────────────────────────────────────────────────────────────────────────

function useBrandRows(c: GiftConditions) {
  return useMemo(
    () =>
      (c.brands ?? []).flatMap((r) => {
        const biz = mockBusinesses.find((b) => b.id === r.businessId);
        return biz ? [{ ...r, biz }] : [];
      }),
    [c.brands],
  );
}

/**
 * Label/value row used by the condition detail screens — a soft round icon,
 * a quiet label, the value in bold, and an optional "?" that explains what
 * the condition means in plain words.
 */
function FactRow({
  icon,
  label,
  value,
  onHelp,
  isRTL,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  onHelp?: () => void;
  isRTL?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 py-4">
      <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: 20 }}>{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-text-muted">{label}</p>
        <div className="text-[15px] font-bold text-text-primary mt-0.5 leading-snug">{value}</div>
      </div>
      {onHelp && (
        <button
          type="button"
          onClick={onHelp}
          aria-label={isRTL ? `מה זה ${label}?` : `What is ${label}?`}
          className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>help</span>
        </button>
      )}
    </div>
  );
}

/** Plain-words explainer for one condition, opened from its "?". */
export interface ConditionHelp {
  title: string;
  body: string;
}

/**
 * Chain list — styled like the store's "participating chains" sheet:
 * search, then one row per chain (round logo, name, optional badge line).
 * Shared by "participating chains" and "what counts toward unlocking".
 */
function ChainList({
  items,
  isRTL,
}: {
  items: { id: string; name: string; nameHe: string; logoUrl?: string; badge?: React.ReactNode }[];
  isRTL: boolean;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((r) => r.name.toLowerCase().includes(q) || r.nameHe.includes(q)) : items;

  return (
    <>
      <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 h-12 mb-4">
        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isRTL ? 'חיפוש עסק' : 'Search business'}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">{isRTL ? 'לא נמצאו עסקים' : 'No businesses found'}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-full border border-border bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                {r.logoUrl ? (
                  <img src={r.logoUrl} alt={r.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <span className="text-xs font-bold text-text-muted">{r.name.slice(0, 2)}</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary text-[15px] leading-snug truncate">{isRTL ? r.nameHe : r.name}</p>
                {r.badge && <div className="mt-1 flex items-center gap-2 flex-wrap">{r.badge}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Participating chains, with the dedicated cashback rate folded in: when one
 * is set, the emerald pill shows the rate on paying from the gift, with the
 * card rate beside it — neutral, no "reduced" wording.
 */
function BrandsDetail({ c, isRTL }: { c: GiftConditions; isRTL: boolean }) {
  const rows = useBrandRows(c);
  return (
    <ChainList
      isRTL={isRTL}
      items={rows.map((r) => ({
        id: r.businessId,
        name: r.biz.name,
        nameHe: r.biz.nameHe,
        logoUrl: r.biz.logoUrl,
        badge: (
          <>
            <span
              dir="ltr"
              className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-bold whitespace-nowrap"
            >
              {c.dedicatedCashback ? r.giftRate : r.cardRate}%
            </span>
            {c.dedicatedCashback && (
              <span className="text-[11px] text-text-muted whitespace-nowrap">
                {isRTL ? 'מיתרת המתנה' : 'from the gift'}
                {' · '}
                {isRTL ? 'בכרטיס ' : 'card '}
                <span dir="ltr">{r.cardRate}%</span>
              </span>
            )}
          </>
        ),
      }))}
    />
  );
}

/** Every Nexus chain — paying there with the Nexus card counts toward unlocking. */
const UNLOCK_CHAINS = mockBusinesses.filter((b, i, all) => all.findIndex((x) => x.id === b.id) === i);

function UnlockChainsDetail({ isRTL }: { isRTL: boolean }) {
  return (
    <>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        {isRTL
          ? 'כל קאשבק שצוברים ברשתות האלה מקרב את פתיחת המתנה.'
          : 'Cashback earned at these chains brings the gift closer to unlocking.'}
      </p>
      <ChainList
        isRTL={isRTL}
        items={UNLOCK_CHAINS.map((b) => ({ id: b.id, name: b.name, nameHe: b.nameHe, logoUrl: b.logoUrl }))}
      />
    </>
  );
}

function ValidityDetail({ c, isRTL, locale }: { c: GiftConditions; isRTL: boolean; locale: string }) {
  const v = c.validity!;
  const reminders = v.remindersDaysBefore?.length
    ? joinList(v.remindersDaysBefore.map(String), isRTL) + (isRTL ? ' ימים לפני' : ' days before')
    : null;
  return (
    <div className="divide-y divide-border">
      {v.unlockBy && (
        <FactRow
          icon="lock_open"
          label={isRTL ? 'לפתוח את המתנה עד' : 'Unlock by'}
          value={formatDate(v.unlockBy, locale)}
        />
      )}
      <FactRow
        icon="event"
        label={v.unlockBy ? (isRTL ? 'לשימוש אחרי הפתיחה עד' : 'Use after unlocking by') : (isRTL ? 'בתוקף עד' : 'Valid until')}
        value={formatDate(v.expiresAt, locale)}
      />
      {(v.onExpiryHe || v.onExpiry) && (
        <FactRow icon="hourglass_bottom" label={isRTL ? 'מה קורה בפקיעה' : 'At expiry'} value={isRTL ? v.onExpiryHe : v.onExpiry} />
      )}
      {reminders && (
        <FactRow icon="notifications" label={isRTL ? 'תזכורת לפני פקיעה' : 'Reminder before expiry'} value={reminders} />
      )}
    </div>
  );
}

function MoreDetail({
  c,
  isRTL,
  locale,
  onHelp,
}: {
  c: GiftConditions;
  isRTL: boolean;
  locale: string;
  onHelp: (help: ConditionHelp) => void;
}) {
  const money = (n: number) => formatCurrency(n, 'ILS', locale);

  const facts: { key: string; icon: string; label: string; value: React.ReactNode; help: ConditionHelp }[] = [];
  if (c.transfer) {
    const label = isRTL ? 'שליחה לארנקים אחרים' : 'Sending to other wallets';
    const partial = c.transfer === 'partial';
    facts.push({
      key: 'transfer',
      icon: 'send',
      label,
      value: partial
        ? isRTL ? 'אפשר לשלוח את כל היתרה או חלק ממנה' : 'All of the balance or part of it'
        : isRTL ? 'אפשר לשלוח את כל היתרה' : 'The whole balance',
      help: {
        title: label,
        body: isRTL
          ? `אפשר לשלוח את המתנה${partial ? ', או חלק ממנה,' : ''} לארנק של משתמש אחר בנקסוס. המתנה עוברת עם כל התנאים שלה: תוקף, רשתות משתתפות, שיעור קאשבק ומינימום לעסקה. התוקף לא מתארך.`
          : `You can send this gift${partial ? ', or part of it,' : ''} to another Nexus user's wallet. It goes with all its terms — expiry, participating chains, cashback rate and minimum — and the expiry isn't extended.`,
      },
    });
  }
  if (c.minTransaction != null) {
    const label = isRTL ? 'מינימום לעסקה' : 'Minimum per purchase';
    facts.push({
      key: 'min',
      icon: 'payments',
      label,
      value: <span dir="ltr">{money(c.minTransaction)}</span>,
      help: {
        title: label,
        body: isRTL
          ? `אפשר לשלם עם המתנה רק בעסקה של ${money(c.minTransaction)} ומעלה. בעסקה קטנה יותר המתנה לא תופיע כאמצעי תשלום, והיתרה שלה נשמרת לפעם הבאה.`
          : `You can pay with this gift only on purchases of ${money(c.minTransaction)} or more. On smaller purchases it won't be offered, and its balance stays for next time.`,
      },
    });
  }
  if (c.maxSharePercent != null) {
    const label = isRTL ? 'תקרה לתשלום במתנה' : 'Gift share cap';
    facts.push({
      key: 'cap',
      icon: 'pie_chart',
      label,
      value: isRTL ? `עד ${c.maxSharePercent}% מסכום העסקה` : `Up to ${c.maxSharePercent}% of the purchase`,
      help: {
        title: label,
        body: isRTL
          ? `בכל עסקה אפשר לשלם במתנה עד ${c.maxSharePercent}% מהסכום. את השאר משלמים באמצעי תשלום אחר, למשל כרטיס נקסוס. לדוגמה: בעסקה של ₪100 אפשר לשלם במתנה עד ₪${c.maxSharePercent}.`
          : `On each purchase you can pay up to ${c.maxSharePercent}% from this gift; the rest goes on another method, like your Nexus card. E.g. on a ₪100 purchase, up to ₪${c.maxSharePercent} from the gift.`,
      },
    });
  }
  if (c.singleUse) {
    const label = isRTL ? 'ניצול' : 'Usage';
    facts.push({
      key: 'single',
      icon: 'looks_one',
      label,
      value: isRTL ? 'יש לנצל את כל היתרה בעסקה אחת' : 'Use the whole balance in one purchase',
      help: {
        title: isRTL ? 'ניצול בעסקה אחת' : 'Single use',
        body: isRTL
          ? 'צריך להשתמש בכל יתרת המתנה באותה עסקה. אי אפשר לנצל חלק ממנה ולהשאיר את השאר לפעם הבאה.'
          : 'The whole gift balance has to be used in the same purchase — you can’t use part and keep the rest for later.',
      },
    });
  }
  if (c.onLeavingOrg) {
    const label = isRTL ? 'עזיבת הארגון' : 'Leaving the organisation';
    const keeps = c.onLeavingOrg === 'keeps';
    facts.push({
      key: 'leave',
      icon: 'badge',
      label,
      value: keeps
        ? isRTL ? 'המתנה נשארת אצלך' : 'You keep the gift'
        : isRTL ? 'המתנה פוקעת בעזיבה' : 'The gift expires when you leave',
      help: {
        title: label,
        body: keeps
          ? isRTL
            ? 'גם אם תסיימו לעבוד בארגון, המתנה נשארת בארנק שלכם ואפשר להמשיך להשתמש בה עד סוף התוקף.'
            : 'Even if you stop working at the organisation, the gift stays in your wallet until it expires.'
          : isRTL
            ? 'אם תסיימו לעבוד בארגון, יתרת המתנה פוקעת ביום העזיבה. כדאי לנצל אותה לפני כן.'
            : 'If you stop working at the organisation, the gift balance expires on your last day — use it before then.',
      },
    });
  }
  if (c.onRefund) {
    const label = isRTL ? 'החזרת עסקה' : 'Refunds';
    const back = c.onRefund === 'returns_to_gift';
    facts.push({
      key: 'refund',
      icon: 'undo',
      label,
      value: back
        ? isRTL ? 'הסכום חוזר ליתרת המתנה' : 'The amount returns to the gift'
        : isRTL ? 'הסכום לא חוזר למתנה' : 'The amount does not return to the gift',
      help: {
        title: label,
        body: back
          ? isRTL
            ? 'אם מחזירים מוצר שנקנה עם המתנה, הסכום חוזר ליתרת המתנה, עם אותם תנאים ואותו תוקף.'
            : 'If you return something paid with this gift, the amount goes back to the gift balance, with the same terms and expiry.'
          : isRTL
            ? 'אם מחזירים מוצר שנקנה עם המתנה, הסכום לא חוזר ליתרת המתנה.'
            : 'If you return something paid with this gift, the amount does not go back to the gift balance.',
      },
    });
  }

  return (
    <>
      <div className="divide-y divide-border">
        {facts.map((f) => (
          <FactRow key={f.key} icon={f.icon} label={f.label} value={f.value} onHelp={() => onHelp(f.help)} isRTL={isRTL} />
        ))}
      </div>
      {c.termsUrl && (
        <a
          href={c.termsUrl}
          onClick={(e) => c.termsUrl === '#' && e.preventDefault()}
          className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5 active:bg-border/50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: 20 }}>description</span>
            <span className="text-sm font-bold text-text-primary">{isRTL ? 'לתקנון המלא' : 'Full terms'}</span>
          </span>
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>
            {isRTL ? 'chevron_left' : 'chevron_right'}
          </span>
        </a>
      )}

    </>
  );
}

export function ConditionDetail({
  kind,
  conditions,
  title,
  isRTL,
  locale,
  onBack,
  onHelp,
}: {
  kind: ConditionKey;
  conditions: GiftConditions;
  title: string;
  isRTL: boolean;
  locale: string;
  onBack: () => void;
  /** Opens an explainer as its own screen (with its own back arrow). */
  onHelp: (help: ConditionHelp) => void;
}) {
  // List screens ("participating chains", "what counts toward unlocking")
  // share one header: title, count, and a "?" that opens its explainer.
  const list =
    kind === 'brands'
      ? {
          title: isRTL ? 'רשתות משתתפות' : 'Participating chains',
          count: conditions.brands?.length ?? 0,
          help: conditions.dedicatedCashback
            ? {
                title: isRTL ? 'שיעור קאשבק' : 'Cashback rate',
                body: isRTL
                  ? 'שיעור הקאשבק על תשלום מיתרת המתנה נקבע לפי תנאי המתנה. הקאשבק נצבר לארנק ואפשר לשלם בו בכל המותגים שמשתתפים בקאשבק.'
                  : 'The cashback rate on paying from the gift balance is set by the gift terms. Cashback goes to your wallet and can be spent at every brand that offers cashback.',
              }
            : null,
        }
      : kind === 'unlock'
        ? {
            title: isRTL ? 'רשתות משתתפות' : 'Participating chains',
            count: UNLOCK_CHAINS.length,
            help: {
              title: isRTL ? 'מה נספר לפתיחה' : 'What counts toward unlocking',
              body: isRTL
                ? 'כל קאשבק שנכנס לארנק שלך מתשלום בכרטיס נקסוס נצבר לפתיחת המתנה. קאשבק מעסקה שהוחזרה יורד מהצבירה.'
                : 'Every cashback that lands in your wallet from a Nexus card payment counts toward unlocking. Cashback from refunded purchases is deducted.',
            },
          }
        : null;
  const listHelp = list?.help;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pe-12">
        <button
          type="button"
          onClick={onBack}
          aria-label={isRTL ? 'חזרה' : 'Back'}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>
            {isRTL ? 'arrow_forward' : 'arrow_back'}
          </span>
        </button>
        {list ? (
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-1.5 min-w-0">
            <span className="truncate">{list.title}</span>
            <span className="text-text-muted font-semibold">({list.count})</span>
            {listHelp && (
              <button
                type="button"
                onClick={() => onHelp(listHelp)}
                aria-label={listHelp.title}
                className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>help</span>
              </button>
            )}
          </h3>
        ) : (
          <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        )}
      </div>
      {kind === 'brands' && <BrandsDetail c={conditions} isRTL={isRTL} />}
      {kind === 'unlock' && <UnlockChainsDetail isRTL={isRTL} />}
      {kind === 'validity' && <ValidityDetail c={conditions} isRTL={isRTL} locale={locale} />}
      {kind === 'more' && <MoreDetail c={conditions} isRTL={isRTL} locale={locale} onHelp={onHelp} />}
    </div>
  );
}

/** An explainer as its own screen inside the sheet, with a back arrow. */
export function HelpView({ help, isRTL, onBack }: { help: ConditionHelp; isRTL: boolean; onBack: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pe-12">
        <button
          type="button"
          onClick={onBack}
          aria-label={isRTL ? 'חזרה' : 'Back'}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>
            {isRTL ? 'arrow_forward' : 'arrow_back'}
          </span>
        </button>
        <h3 className="text-xl font-bold text-text-primary">{help.title}</h3>
      </div>
      <p className="text-[15px] text-text-secondary leading-relaxed">{help.body}</p>
    </div>
  );
}
