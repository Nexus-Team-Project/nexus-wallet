import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface NotYouSheetProps {
  open: boolean;
  orgName: string;
  orgColor: string;
  onClose: () => void;
  onSwitchUser: () => void;
  onChangeOrg: () => void;
  onContinueAsIs: () => void;
}

interface Option {
  icon: string;
  label: string;
  desc: string;
  onClick: () => void;
  variant: 'default' | 'muted';
}

export default function NotYouSheet({
  open,
  orgName,
  orgColor,
  onClose,
  onSwitchUser,
  onChangeOrg,
  onContinueAsIs,
}: NotYouSheetProps) {
  const { t } = useLanguage();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop tap
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const options: Option[] = [
    {
      icon: 'person_off',
      label: t.authFlow.notYouSwitchUserLabel,
      desc: t.authFlow.notYouSwitchUserDesc,
      onClick: onSwitchUser,
      variant: 'default',
    },
    {
      icon: 'corporate_fare',
      label: t.authFlow.notYouChangeOrgLabel,
      desc: t.authFlow.notYouChangeOrgDesc,
      onClick: onChangeOrg,
      variant: 'default',
    },
    {
      icon: 'check_circle',
      label: t.authFlow.notYouContinueLabel,
      desc: t.authFlow.notYouContinueDesc,
      onClick: onContinueAsIs,
      variant: 'muted',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[80] transition-all duration-300"
        style={{
          background: open ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
          pointerEvents: open ? 'auto' : 'none',
          backdropFilter: open ? 'blur(2px)' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-1/2 z-[90] w-full max-w-md -translate-x-1/2 transition-transform duration-300 ease-out"
        style={{
          transform: open
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(100%)',
        }}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl pb-safe-area-inset-bottom">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {t.authFlow.notYouSheetTitle}
              </p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  close
                </span>
              </button>
            </div>

            {/* Org badge */}
            <div
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${orgColor}18` }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '14px', color: orgColor, fontVariationSettings: "'FILL' 1" }}
              >
                business
              </span>
              <span className="text-xs font-bold" style={{ color: orgColor }}>
                {orgName}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="px-4 py-3 flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.onClick}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-right
                  transition-all duration-150 active:scale-[0.98]
                  ${opt.variant === 'muted'
                    ? 'bg-surface hover:bg-border/40'
                    : 'bg-white border-2 border-border hover:border-primary/40 hover:bg-primary/5'
                  }
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${opt.variant === 'muted' ? 'bg-border/60' : 'bg-primary/10'}
                  `}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '20px',
                      color: opt.variant === 'muted' ? '#9ca3af' : orgColor,
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {opt.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm leading-snug ${opt.variant === 'muted' ? 'text-text-muted' : 'text-text-primary'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined flex-shrink-0 text-text-muted"
                  style={{ fontSize: '18px' }}
                >
                  arrow_back
                </span>
              </button>
            ))}
          </div>

          {/* Bottom safe area padding */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}
