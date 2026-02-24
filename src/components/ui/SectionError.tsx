import { useEffect } from 'react';

interface SectionErrorProps {
  /** Section name for logging & report email */
  section: string;
  /** Called when the user taps "Try again" */
  onRetry: () => void;
  /** Support email for "Report" button (optional) */
  supportEmail?: string;
}

/** Lightweight error monitor — replace with Sentry.captureMessage() in production */
function reportError(section: string) {
  console.error(`[nexus-wallet] Section load failed: ${section} — ${new Date().toISOString()}`);
  // TODO: Sentry.captureMessage(`Section error: ${section}`)
}

/**
 * An error card that sits inline in the horizontal slider row.
 * Sized to match the skeleton/content cards so the layout doesn't shift.
 */
export default function SectionError({ section, onRetry, supportEmail = 'support@nexus.app' }: SectionErrorProps) {
  useEffect(() => {
    reportError(section);
  }, [section]);

  const subject = encodeURIComponent(`[Nexus] Error loading ${section}`);
  const body = encodeURIComponent(
    `Hi,\n\nThe "${section}" section failed to load.\n\nTime: ${new Date().toLocaleString()}\n\nPlease investigate.`,
  );
  const mailtoHref = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <section className="mb-6">
      {/* Section header — faded pulse to hint something was here */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="h-5 w-36 rounded bg-border animate-pulse" />
      </div>

      {/* Slider row — error card + ghost card */}
      <div className="flex gap-3 px-5 overflow-hidden">

        {/* Error card — same width/height as a real slider card */}
        <div
          className="flex-none w-[75vw] max-w-[300px] rounded-lg border border-border bg-surface overflow-hidden shrink-0 flex flex-col"
          style={{ height: '20vh', minHeight: '140px' }}
        >
          {/* Icon + message */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <span
              className="material-symbols-outlined text-text-muted"
              style={{ fontSize: '28px', fontVariationSettings: "'FILL' 0" }}
            >
              cloud_off
            </span>
            <p className="text-xs text-text-secondary font-medium leading-snug">
              משהו השתבש בטעינה
            </p>
          </div>

          {/* Action bar at the bottom — split Retry / Report */}
          <div className="flex border-t border-border divide-x divide-border rtl:divide-x-reverse">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-primary active:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>refresh</span>
              נסה שוב
            </button>
            <a
              href={mailtoHref}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-text-muted active:bg-border/50 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>flag</span>
              דווח
            </a>
          </div>
        </div>

        {/* Ghost card — faded placeholder showing more would have loaded */}
        <div
          className="flex-none w-[75vw] max-w-[300px] rounded-lg border border-border/40 bg-border/20 shrink-0 animate-pulse"
          style={{ height: '20vh', minHeight: '140px' }}
        />
      </div>
    </section>
  );
}
