import { useState, type ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface DarkPitchCardProps {
  /** Big headline at the top of the card. Omit when the body lays the
   *  headline out itself (e.g. beside artwork). */
  title?: string;
  /** Optional body between the title and the "learn more" row. */
  children?: ReactNode;
  /** Small label on the footer row. Defaults to "למד עוד" / "Learn more". */
  moreLabel?: string;
  /** Content revealed by the accordion when the footer row is tapped. */
  moreContent?: ReactNode;
}

/**
 * DarkPitchCard — the About page's dark gradient card shell, extracted from
 * LovedBrandsGrid so further sections can reuse it: big title on top, free-
 * form body, and a "learn more" row whose side arrow rotates to point down
 * while an accordion panel expands below it. The panel is in normal flow, so
 * opening it pushes the rest of the page down rather than overlaying it.
 */
export default function DarkPitchCard({
  title,
  children,
  moreLabel,
  moreContent,
}: DarkPitchCardProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [open, setOpen] = useState(false);

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-5 mb-6 rounded-3xl p-5 text-white"
      style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)' }}
    >
      {title && (
        <h2 className="text-[28px] font-semibold leading-[1.05] tracking-tight">{title}</h2>
      )}

      {children}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 w-full flex items-center justify-between active:opacity-80 transition-opacity"
      >
        <span className="text-sm font-medium text-white/60">
          {moreLabel ?? (isHe ? 'למד עוד' : 'Learn more')}
        </span>
        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          {/* Side arrow; rotates to point down while the accordion is open. */}
          <span
            className="material-symbols-rounded text-white/90 block transition-transform duration-300"
            style={{ fontSize: 22, transform: open ? `rotate(${isHe ? -90 : 90}deg)` : 'none' }}
          >
            {isHe ? 'arrow_back' : 'arrow_forward'}
          </span>
        </span>
      </button>

      {/* Accordion panel — grid-rows trick animates height 0→auto without
          measuring; the inner overflow-hidden clips while collapsed. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="pt-4 text-sm leading-relaxed text-white/70">{moreContent}</div>
        </div>
      </div>
    </section>
  );
}
