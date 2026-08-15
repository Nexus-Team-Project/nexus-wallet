import { CreditCard, Nfc, BadgePercent, Plane } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CardLinkPerksCardProps {
  /** Footer CTA tap — the About page passes its auth-gated wallet opener. */
  onCtaClick?: () => void;
}

/**
 * CardLinkPerksCard — the home feed's white product-catalog card structure
 * (BrandCatalogStore / rhode-style: header row, 2×2 grey tiles with a corner
 * tag, big footer CTA + circular arrow), repurposed as a pitch card for the
 * "link your existing card" story: it's free, nothing to issue, you pay at
 * the register as usual, cashback lands in the wallet — and the card
 * issuer's own perks (points, miles, volume cashback) keep accruing.
 */
export default function CardLinkPerksCard({ onCtaClick }: CardLinkPerksCardProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  const tiles = [
    {
      icon: CreditCard,
      tag: '₪0',
      title: isHe ? 'מצמידים כרטיס קיים' : 'Link your existing card',
      sub: isHe ? 'בלי להנפיק כרטיס חדש' : 'Nothing new to issue',
    },
    {
      icon: Nfc,
      tag: isHe ? 'קופה' : 'POS',
      title: isHe ? 'משלמים כרגיל' : 'Pay as usual',
      sub: isHe ? 'בכל קופה, כמו תמיד' : 'At any register, like always',
    },
    {
      icon: BadgePercent,
      tag: isHe ? 'עד 60%' : 'Up to 60%',
      title: isHe ? 'קאשבק על כל קנייה' : 'Cashback on every purchase',
      sub: isHe ? 'נכנס ישר לארנק' : 'Straight into your wallet',
    },
    {
      icon: Plane,
      tag: '+',
      title: isHe ? 'ההטבות נשארות' : 'Your perks stay',
      // Careful claim: only volume-based issuer benefits — points, miles,
      // volume cashback — not merchant-specific issuer discounts.
      sub: isHe
        ? 'נקודות, טיסות וקאשבק מחברת האשראי ממשיכים להיצבר'
        : 'Issuer points, miles and volume cashback keep accruing',
    },
  ];

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5"
    >
      {/* Header — icon chip + title + "free" sub-row, dark chip on the end */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface shrink-0">
            <CreditCard size={24} strokeWidth={1.8} className="text-text-primary" />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold text-text-primary leading-tight">
              {isHe ? 'הכרטיס שלכם, משודרג' : 'Your card, upgraded'}
            </span>
            <span className="text-xs font-medium text-text-muted mt-0.5">
              {isHe ? 'חינם • בלי כרטיס חדש' : 'Free • no new card'}
            </span>
          </span>
        </div>
        <span className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-semibold bg-bg-dark text-white">
          {isHe ? 'חינם' : 'Free'}
        </span>
      </header>

      {/* 2×2 perk tiles — same grey tile + corner tag as the product grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {tiles.map(({ icon: Icon, tag, title, sub }) => (
          <div
            key={title}
            className="relative bg-[#f5f5f5] rounded-2xl p-4 pt-8 flex flex-col items-center justify-center text-center gap-2 aspect-[1/1.2]"
          >
            <span
              className="absolute top-3 bg-[#b1b1b1] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm"
              style={{ insetInlineStart: 12 }}
              dir="ltr"
            >
              {tag}
            </span>
            <Icon size={30} strokeWidth={1.6} className="text-text-primary" />
            <span className="text-sm font-bold text-text-primary leading-tight">{title}</span>
            <span className="text-xs text-text-muted leading-snug">{sub}</span>
          </div>
        ))}
      </div>

      {/* Footer CTA — big label + circular arrow */}
      <button onClick={onCtaClick} className="flex items-center justify-between w-full pt-2 active:opacity-70">
        <span className="text-4xl font-semibold tracking-tight text-text-primary">
          {isHe ? 'מצמידים כרטיס' : 'Link a card'}
        </span>
        <span className="w-12 h-12 bg-[#b1b1b1] rounded-full flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>{arrow}</span>
        </span>
      </button>
    </section>
  );
}
