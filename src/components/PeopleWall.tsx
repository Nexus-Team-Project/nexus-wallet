import { useLanguage } from '../i18n/LanguageContext';

interface PeopleWallProps {
  /** Footer CTA tap — the About page passes its auth-gated wallet opener. */
  onCtaClick?: () => void;
}

/**
 * PeopleWall — the marketing site's "trusted by leaders" portrait wall
 * (nexus-website Testimonials.tsx), rebuilt inside the About page's white
 * card shell. The site version fans 14 portraits across 8 staggered columns
 * and drops down to 4 on mobile by hiding the last four columns; here the
 * card is always phone-width, so all 14 are redistributed across those 4
 * columns instead of half of them going missing.
 *
 * The staggers are gentler than the site's (±8–24px rather than ±40–64px):
 * inside a card the big offsets would either punch through the padding or
 * need the column tops clipped.
 */

const IMAGE_BASE = '/testimonials';
const img = (n: number) => `${IMAGE_BASE}/person-${n}.webp`;

/** Four columns; `null` is a blank tile — the gaps are what make the wall
 *  read as scattered rather than as a plain grid. */
const COLUMNS: Array<{ slots: (number | null)[]; stagger: string }> = [
  { slots: [1, 2, 3, null], stagger: 'translate-y-4' },
  { slots: [4, 5, 6, 7], stagger: '-translate-y-2' },
  { slots: [8, 9, 10, null], stagger: 'translate-y-6' },
  { slots: [11, 12, 13, 14], stagger: 'translate-y-0' },
];

export default function PeopleWall({ onCtaClick }: PeopleWallProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5"
    >
      {/* py-8 absorbs the column staggers so the shifted columns stay inside
          the card's own padding instead of poking past it. */}
      <div className="grid grid-cols-4 gap-2 py-8">
        {COLUMNS.map((column, colIndex) => (
          <div key={colIndex} className={`flex flex-col gap-2 ${column.stagger}`}>
            {column.slots.map((n, slotIndex) =>
              n === null ? (
                <div
                  key={slotIndex}
                  className="w-full aspect-[4/5] rounded-xl bg-surface border border-border/60"
                />
              ) : (
                <img
                  key={slotIndex}
                  src={img(n)}
                  alt=""
                  aria-hidden
                  className="w-full aspect-square object-cover rounded-xl border border-border/60"
                  loading="lazy"
                  draggable={false}
                />
              ),
            )}
          </div>
        ))}
      </div>

      {/* Footer CTA — big label + circular arrow, 28px like the other
          sentence-length labels on the page. */}
      <button
        onClick={onCtaClick}
        className="flex items-center justify-between gap-3 w-full pt-4 active:opacity-70"
      >
        <span className="text-[28px] font-semibold tracking-tight leading-[1.05] text-start text-text-primary">
          {isHe ? (
            <>
              אלפי אנשים כבר בפנים.
              <br />
              אל תישארו מאחור.
            </>
          ) : (
            <>
              Thousands are already in.
              <br />
              Don't get left behind.
            </>
          )}
        </span>
        <span className="w-12 h-12 bg-[#b1b1b1] rounded-full flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>{arrow}</span>
        </span>
      </button>
    </section>
  );
}
