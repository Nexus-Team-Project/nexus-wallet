import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { daysLeftLabel, daysUntil } from '../../utils/daysLeft';
import { mockGiftConditions } from '../../mock/data/giftConditions.mock';
import { mockUserVouchers } from '../../mock/data/vouchers.mock';
import { AdvancedConditionsList, ConditionDetail, HelpView, type ConditionHelp } from './GiftConditions';
import { buildConditionRows, type ConditionKey } from './giftConditionRows';
import type { Voucher } from '../../types/voucher.types';
import type { SubBalance } from '../../types/wallet.types';

interface VoucherTermsSheetProps {
  voucher: Voucher;
  /** The sub-balance row this sheet was opened from — supplies event / amounts. */
  subBalance?: SubBalance;
  onClose: () => void;
}

/**
 * Benefit sheet for a sub-balance row — the voucher card face large and
 * centered, the gift's details (event, original amount, balance), and its
 * advanced conditions. Each condition opens its own detail screen inside the
 * sheet (back arrow returns to the list). Vouchers without conditions fall
 * back to their plain terms text.
 */
export default function VoucherTermsSheet({ voucher, subBalance, onClose }: VoucherTermsSheetProps) {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const [actionsOpen, setActionsOpen] = useState(false);
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const money = (n: number) => formatCurrency(n, 'ILS', locale);
  const bg = voucher.brandColor || '#0a2540';
  const [openKey, setOpenKey] = useState<ConditionKey | null>(null);
  // Explainer screen ("?" / "what counts…") — opens on its own, back returns
  // to wherever it was opened from.
  const [help, setHelp] = useState<ConditionHelp | null>(null);
  // Locked gift (Nexus joining gift): shown, greyed, with progress to unlock.
  const lock = subBalance?.lock && subBalance.lock.progress < subBalance.lock.threshold ? subBalance.lock : null;
  const title = subBalance?.source === 'nexus_gift' ? (isRTL ? 'מתנה מנקסוס' : 'Gift from Nexus') : voucher.merchantName;

  const conditions = mockGiftConditions[voucher.id];
  // Validity is shown up top with the balance, not as its own condition row.
  const rows = [
    // Locked gift: how it opens, as a row like the other conditions.
    ...(lock
      ? [{
          key: 'unlock' as const,
          title: isRTL ? 'רשתות משתתפות' : 'Participating chains',
          summary: [isRTL ? 'הקאשבק שצוברים ברשתות האלה פותח את המתנה' : 'Cashback earned at these chains unlocks the gift'],
        }]
      : []),
    ...buildConditionRows(conditions, isRTL, locale).filter((r) => r.key !== 'validity'),
  ];
  const openRow = rows.find((r) => r.key === openKey);

  const details: { label: string; value: string; ltr?: boolean }[] = [];
  const event = isRTL ? subBalance?.eventHe : subBalance?.event;
  if (event) details.push({ label: isRTL ? 'אירוע' : 'Occasion', value: event });
  if (subBalance && lock) {
    details.push({ label: isRTL ? 'תיפתח לניצול' : 'Unlocks for use', value: money(subBalance.amount), ltr: true });
  } else if (subBalance) {
    // One row: what's left, over what it started with — "₪120 / ₪150".
    const hasOriginal = subBalance.originalAmount != null;
    details.push({
      label: hasOriginal ? (isRTL ? 'יתרה / סכום מקורי' : 'Balance / original') : isRTL ? 'יתרה' : 'Balance',
      value: hasOriginal ? `${money(subBalance.amount)} / ${money(subBalance.originalAmount!)}` : money(subBalance.amount),
      ltr: true,
    });
  }
  // Validity — next to the balance. While a gift is locked the only date that
  // matters is the unlock deadline; the use-by date appears once it's open.
  const unlockBy = conditions?.validity?.unlockBy ?? subBalance?.lock?.unlockBy;
  const expiresAt = conditions?.validity?.expiresAt ?? subBalance?.validUntil;
  if (lock) {
    if (unlockBy) details.push({ label: isRTL ? 'לפתיחה עד' : 'Unlock by', value: formatDate(unlockBy, locale) });
  } else if (expiresAt) {
    details.push({
      label: unlockBy ? (isRTL ? 'לשימוש עד' : 'Use by') : isRTL ? 'בתוקף עד' : 'Valid until',
      value: formatDate(expiresAt, locale),
    });
  }

  // ⋮ actions. "View gift" opens the gift's own page when it has one.
  const userVoucher = mockUserVouchers.find((u) => u.voucherId === voucher.id);
  const actions: { icon: string; label: string; hint: string; onClick: () => void }[] = [];
  if (userVoucher) {
    actions.push({
      icon: 'visibility',
      label: isRTL ? 'לצפייה במתנה' : 'View gift',
      hint: isRTL ? 'ברקוד, קוד ופרטי המתנה' : 'Barcode, code and gift details',
      onClick: () => {
        onClose();
        navigate(`/${lang}/wallet/voucher/${userVoucher.id}`);
      },
    });
  }
  if (conditions?.transfer && !lock) {
    actions.push({
      icon: 'send',
      label: isRTL ? 'שליחה לארנק אחר' : 'Send to another wallet',
      hint:
        conditions.transfer === 'partial'
          ? isRTL ? 'את כל היתרה או חלק ממנה' : 'All of the balance or part of it'
          : isRTL ? 'את כל היתרה' : 'The whole balance',
      onClick: () => setActionsOpen(false),
    });
  }
  actions.push({
    icon: 'ios_share',
    label: isRTL ? 'שיתוף' : 'Share',
    hint: isRTL ? 'שליחת פרטי המתנה' : 'Send the gift details',
    onClick: () => setActionsOpen(false),
  });

  // Detail screens slide in from the reading-direction "forward" side.
  const dir = isRTL ? -1 : 1;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[90] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          className="relative pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[88dvh]"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>

          <button
            onClick={onClose}
            aria-label={isRTL ? 'סגירה' : 'Close'}
            className="absolute top-4 end-4 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors"
          >
            <X size={18} className="text-text-primary" />
          </button>

          {!help && !openKey && !actionsOpen && (
            <button
              onClick={() => setActionsOpen(true)}
              aria-label={isRTL ? 'פעולות' : 'Actions'}
              className="absolute top-4 start-4 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors"
            >
              <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>more_vert</span>
            </button>
          )}

          <div className="overflow-y-auto overscroll-contain px-6 pb-8 pt-2">
            <AnimatePresence mode="wait" initial={false}>
              {help ? (
                <motion.div
                  key="help"
                  initial={{ opacity: 0, x: 24 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 * dir }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <HelpView help={help} isRTL={isRTL} onBack={() => setHelp(null)} />
                </motion.div>
              ) : actionsOpen ? (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, x: 24 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 * dir }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3 mb-2 pe-12">
                    <button
                      type="button"
                      onClick={() => setActionsOpen(false)}
                      aria-label={isRTL ? 'חזרה' : 'Back'}
                      className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>
                        {isRTL ? 'arrow_forward' : 'arrow_back'}
                      </span>
                    </button>
                    <h3 className="text-xl font-bold text-text-primary">{isRTL ? 'פעולות' : 'Actions'}</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={a.onClick}
                        className="w-full flex items-center gap-3.5 py-4 text-start active:opacity-70 transition-opacity"
                      >
                        <span className="w-11 h-11 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>{a.icon}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-bold text-text-primary">{a.label}</span>
                          <span className="block text-[12px] text-text-muted mt-0.5">{a.hint}</span>
                        </span>
                        <span className="material-symbols-outlined text-text-muted flex-shrink-0" style={{ fontSize: 20 }}>
                          {isRTL ? 'chevron_left' : 'chevron_right'}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : openKey && openRow && conditions ? (
                <motion.div
                  key={openKey}
                  initial={{ opacity: 0, x: 24 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 * dir }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ConditionDetail
                    kind={openKey}
                    conditions={conditions}
                    title={openRow.title}
                    isRTL={isRTL}
                    locale={locale}
                    onBack={() => setOpenKey(null)}
                    onHelp={setHelp}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -24 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 * dir }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Large centered card face */}
                  <div className="relative mx-auto mb-5" style={{ maxWidth: 260 }}>
                    <div
                      className={`relative w-full rounded-xl overflow-hidden ${lock ? 'shadow-md grayscale opacity-60' : 'shadow-xl'}`}
                      style={{ aspectRatio: '1.586 / 1', backgroundColor: bg }}
                    >
                      {voucher.cardImage ? (
                        <img
                          src={voucher.cardImage}
                          alt={voucher.merchantName}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ objectPosition: voucher.cardImagePosition || 'center' }}
                        />
                      ) : voucher.brandLogo ? (
                        <div className="absolute inset-0 flex items-center justify-center px-6">
                          <img
                            src={voucher.brandLogo}
                            alt={voucher.merchantName}
                            className="h-16 w-auto max-w-[64%] object-contain"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center px-6">
                          <span className="text-xl font-extrabold text-white text-center leading-tight">
                            {voucher.merchantName}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Lock badge — sits on the greyed card, not greyed itself */}
                    {lock && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                            lock
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-text-primary text-center mb-4 flex items-center justify-center gap-2">
                    {title}
                    {lock && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                        {isRTL ? 'נעולה' : 'Locked'}
                      </span>
                    )}
                  </h3>

                  {/* Unlock progress — counted from the member's own spending */}
                  {lock && (
                    <div className="mb-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-bold text-text-primary">
                          {isRTL
                            ? `צברת ${money(lock.progress)} מתוך ${money(lock.threshold)} קאשבק`
                            : `${money(lock.progress)} of ${money(lock.threshold)} cashback earned`}
                        </p>
                        {/* The 30-day window, as time left — more urgent than a date */}
                        <p className="text-[12px] font-semibold text-primary flex-shrink-0">
                          {daysLeftLabel(daysUntil(lock.unlockBy), isRTL)}
                        </p>
                      </div>
                      <div className="mt-2.5 h-3 rounded-[4px] bg-border/70 overflow-hidden">
                        <div
                          className="h-full rounded-[4px] bg-primary"
                          style={{ width: `${Math.min(100, (lock.progress / lock.threshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {details.length > 0 && (
                    <dl className="space-y-2.5 mb-6">
                      {details.map((d) => (
                        <div key={d.label} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-text-muted">{d.label}</dt>
                          <dd className="text-sm font-bold text-text-primary tabular-nums" dir={d.ltr ? 'ltr' : undefined}>
                            {d.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {rows.length > 0 ? (
                    <AdvancedConditionsList
                      rows={rows}
                      isRTL={isRTL}
                      onOpen={setOpenKey}
                    />
                  ) : (
                    <p className="text-sm text-text-secondary leading-relaxed text-center">
                      {isRTL ? voucher.termsAndConditionsHe : voucher.termsAndConditions}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </>,
    document.body,
  );
}
