import { useState, forwardRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business, Product, Service } from '../../types/search.types';
import type { Branch } from '../../types/branch.types';
import type { Voucher } from '../../types/voucher.types';

/* ─── Accordion Shell ──────────────────────────────────────────────── */

interface AccordionSectionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, badge, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 active:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          {badge && (
            <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span
          className="material-symbols-outlined text-text-secondary transition-transform duration-300"
          style={{ fontSize: 20, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-6 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Description Section ──────────────────────────────────────────── */

function DescriptionSection({ business }: { business: Business }) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const text = (isHe ? business.descriptionHe : business.description) || '';
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > 150;

  if (!text) return null;

  return (
    <AccordionSection title={t.business.description}>
      <p className="text-sm text-text-secondary leading-relaxed">
        {truncated && !expanded ? text.slice(0, 150) + '...' : text}
      </p>
      {truncated && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-xs font-semibold mt-2"
        >
          {expanded ? t.business.readLess : t.business.readMore}
        </button>
      )}
    </AccordionSection>
  );
}

/* ─── Opening Hours Section ────────────────────────────────────────── */

function OpeningHoursSection({ branches }: { branches: Branch[] }) {
  const { t } = useLanguage();

  if (branches.length === 0) return null;

  // Use first branch as representative hours
  const branch = branches[0];
  const isAlwaysOpen = branch.openHour === undefined;
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday
  const currentHour = now.getHours();

  const dayNames = [
    t.business.sunday, t.business.monday, t.business.tuesday,
    t.business.wednesday, t.business.thursday, t.business.friday, t.business.saturday,
  ];

  let statusBadge = '';
  let statusColor = '';

  if (isAlwaysOpen) {
    statusBadge = t.business.alwaysOpen;
    statusColor = 'text-success';
  } else if (branch.openHour !== undefined && branch.closeHour !== undefined) {
    const isOpen = branch.closeHour > branch.openHour
      ? currentHour >= branch.openHour && currentHour < branch.closeHour
      : currentHour >= branch.openHour || currentHour < branch.closeHour;

    if (isOpen) {
      statusBadge = `${t.business.openNow} · ${t.business.closesAt}${branch.closeHour}:00`;
      statusColor = 'text-success';
    } else {
      statusBadge = `${t.business.closedNow} · ${t.business.opensAt}${branch.openHour}:00`;
      statusColor = 'text-text-muted';
    }
  }

  return (
    <AccordionSection title={t.business.openingHours} badge={statusBadge ? undefined : undefined}>
      {/* Status line */}
      <div className={`flex items-center gap-2 mb-3 ${statusColor}`}>
        <div className={`w-2 h-2 rounded-full ${statusColor === 'text-success' ? 'bg-success' : 'bg-text-muted'}`} />
        <span className="text-sm font-medium">{statusBadge}</span>
      </div>

      {/* Days table */}
      <div className="space-y-2">
        {dayNames.map((day, i) => (
          <div
            key={i}
            className={`flex justify-between text-sm py-1 px-2 rounded-lg ${i === currentDay ? 'bg-primary/5 font-semibold' : ''}`}
          >
            <span className={i === currentDay ? 'text-primary' : 'text-text-primary'}>{day}</span>
            <span className={i === currentDay ? 'text-primary' : 'text-text-secondary'} dir="ltr">
              {isAlwaysOpen
                ? t.business.alwaysOpen
                : `${branch.openHour ?? '?'}:00 - ${branch.closeHour ?? '?'}:00`}
            </span>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}

/* ─── Locations Section ────────────────────────────────────────────── */

function LocationsSection({ branches }: { branches: Branch[] }) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  if (branches.length === 0) return null;

  return (
    <AccordionSection title={t.business.locations} badge={`${branches.length}`}>
      <div className="space-y-3">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="flex items-start gap-3 bg-surface rounded-2xl p-3"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
                location_on
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {isHe ? branch.nameHe : branch.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {isHe ? branch.addressHe : branch.address}
              </p>
              {branch.openHour !== undefined && (
                <p className="text-xs text-text-muted mt-0.5" dir="ltr">
                  {branch.openHour}:00 - {branch.closeHour}:00
                </p>
              )}
            </div>
            <button
              onClick={() => window.open(`https://waze.com/ul?ll=${branch.lat},${branch.lng}&navigate=yes`)}
              className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                navigation
              </span>
            </button>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}

/* ─── Offers Section ───────────────────────────────────────────────── */

interface OffersSectionProps {
  vouchers: Voucher[];
  onSelect: (v: Voucher) => void;
}

const OffersSection = forwardRef<HTMLDivElement, OffersSectionProps>(
  function OffersSection({ vouchers, onSelect }, ref) {
    const { t, language } = useLanguage();
    const isHe = language === 'he';

    if (vouchers.length === 0) return null;

    return (
      <div ref={ref}>
        <AccordionSection title={t.business.offers} badge={`${vouchers.length}`} defaultOpen>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 -mx-1 pb-1">
            {vouchers.map((v) => (
              <button
                key={v.id}
                onClick={() => onSelect(v)}
                className="min-w-[200px] bg-surface rounded-2xl overflow-hidden shrink-0 text-start active:scale-[0.98] transition-transform"
              >
                {/* Card top */}
                <div className="relative p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{v.image}</span>
                    <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                      {v.discountPercent}%
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">{v.merchantName}</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5 line-clamp-1">
                    {isHe ? v.titleHe : v.title}
                  </p>
                </div>
                {/* Card bottom */}
                <div className="px-4 pb-3 flex items-center justify-between">
                  <span className="text-base font-bold text-primary">
                    ₪{v.discountedPrice}
                  </span>
                  <span className="text-xs text-text-muted line-through">
                    ₪{v.originalPrice}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </AccordionSection>
      </div>
    );
  }
);

/* ─── Products Section ─────────────────────────────────────────────── */

function ProductsSection({ products }: { products: Product[] }) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  if (products.length === 0) return null;

  return (
    <AccordionSection title={t.business.products} badge={`${products.length}`}>
      <div className="flex overflow-x-auto hide-scrollbar gap-3 -mx-1 pb-1">
        {products.map((p) => (
          <div
            key={p.id}
            className="min-w-[160px] bg-surface rounded-2xl p-4 shrink-0"
          >
            <span className="text-3xl block mb-2">{p.image}</span>
            <p className="text-sm font-semibold text-text-primary line-clamp-1">
              {isHe ? p.nameHe : p.name}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
              {isHe ? p.descriptionHe : p.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-primary">₪{p.price}</span>
              {p.originalPrice && (
                <span className="text-xs text-text-muted line-through">₪{p.originalPrice}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}

/* ─── Services Section ─────────────────────────────────────────────── */

function ServicesSection({ services }: { services: Service[] }) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  if (services.length === 0) return null;

  return (
    <AccordionSection title={t.business.services}>
      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-full"
          >
            <span className="text-base">{s.icon}</span>
            <span className="text-xs font-medium text-text-primary">
              {isHe ? s.nameHe : s.name}
            </span>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}

/* ─── Main Export ──────────────────────────────────────────────────── */

export { DescriptionSection, OpeningHoursSection, LocationsSection, OffersSection, ProductsSection, ServicesSection };
