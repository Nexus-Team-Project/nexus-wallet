import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface ClubInfoSectionProps {
  stats: { members: number; cashback: number; rating: number };
  links?: { website?: string; instagram?: string; facebook?: string };
  /** "About us" copy — shown clamped with a "more" toggle. */
  about: string;
  aboutHe: string;
  /** Localized club name — used for the share title. */
  clubName: string;
}

/**
 * Animated cashback counter. Counts up from 0 to `target` on mount, then keeps
 * ticking upward so the accumulated total reads as live / always-growing.
 */
function CashbackCounter({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let current = 0;
    let start: number | null = null;
    const duration = 1200;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      current = Math.round(target * eased);
      setValue(current);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Live accumulation — keep the number creeping up.
        intervalId = setInterval(() => {
          current += Math.floor(Math.random() * 3) + 1;
          setValue(current);
        }, 2500);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (intervalId) clearInterval(intervalId);
    };
  }, [target]);

  return <>₪{value.toLocaleString()}</>;
}

/**
 * Club header rendered at the top of the white content section (not overlaid on
 * the hero): the share + social actions, the member-count / cashback / rating
 * stats, and an expandable "About us" block.
 */
export default function ClubInfoSection({ stats, links, about, aboutHe, clubName }: ClubInfoSectionProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const aboutText = isHe ? aboutHe : about;

  const handleShare = async () => {
    const url = window.location.href;
    const title = isHe ? `מועדון ${clubName}` : `${clubName} club`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet — noop */
    }
  };

  const iconBtn =
    'h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface border border-border/60 text-text-primary active:scale-95 transition-transform';

  return (
    <section className="px-6 pt-5 pb-2">
      {/* Stats — member count + accumulated cashback + rating */}
      <div className="flex items-stretch rounded-2xl bg-surface border border-border/50 overflow-hidden">
        <div className="flex-1 flex flex-col items-center py-4">
          <span className="text-2xl font-extrabold text-text-primary leading-none">
            {stats.members.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-text-muted mt-1.5">
            {isHe ? 'חברים' : 'Members'}
          </span>
        </div>

        <div className="w-px bg-border/60 my-3" />

        <div className="flex-1 flex flex-col items-center py-4">
          <span className="text-2xl font-extrabold text-text-primary leading-none tabular-nums">
            <CashbackCounter target={stats.cashback} />
          </span>
          <span className="text-xs font-medium text-text-muted mt-1.5">
            {isHe ? 'קאשבק שנצבר' : 'Cashback earned'}
          </span>
        </div>

        <div className="w-px bg-border/60 my-3" />

        <div className="flex-1 flex flex-col items-center py-4">
          <span className="inline-flex items-center gap-1 text-2xl font-extrabold text-text-primary leading-none">
            {stats.rating.toFixed(1)}
            <span
              className="material-symbols-rounded text-amber-400"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </span>
          <span className="text-xs font-medium text-text-muted mt-1.5">
            {isHe ? 'דירוג' : 'Rating'}
          </span>
        </div>
      </div>

      {/* Actions — share + social links */}
      <div className="flex items-center gap-3 mt-4">
        <button onClick={handleShare} aria-label={isHe ? 'שיתוף' : 'Share'} className={iconBtn}>
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>ios_share</span>
        </button>

        {links?.website && (
          <a href={links.website} target="_blank" rel="noopener noreferrer" aria-label="Website" className={iconBtn}>
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>language</span>
          </a>
        )}
        {links?.instagram && (
          <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5.5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        )}
        {links?.facebook && (
          <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={iconBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12Z" />
            </svg>
          </a>
        )}

        {copied && (
          <span className="text-xs font-medium text-text-muted">
            {isHe ? 'הקישור הועתק' : 'Link copied'}
          </span>
        )}
      </div>

      {/* About us — clamped with a "more" toggle */}
      {aboutText && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {isHe ? 'עלינו' : 'About us'}
          </h2>
          <p
            className={`text-sm text-text-secondary leading-relaxed whitespace-pre-line ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            {aboutText}
          </p>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-1.5 text-sm font-semibold text-primary active:opacity-70 transition-opacity"
          >
            {expanded ? (isHe ? 'פחות' : 'Less') : (isHe ? 'עוד' : 'More')}
          </button>
        </div>
      )}
    </section>
  );
}
