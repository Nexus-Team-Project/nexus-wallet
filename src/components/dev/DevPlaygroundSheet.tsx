import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import NotificationTestPanel from './NotificationTestPanel';
import ChatTestPanel from './ChatTestPanel';

interface DevPlaygroundSheetProps {
  onClose: () => void;
}

// Three tool cards on the main view. Tapping one swaps into a sub-view.
type View = 'menu' | 'notifications' | 'chat';

export default function DevPlaygroundSheet({ onClose }: DevPlaygroundSheetProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const [view, setView] = useState<View>('menu');

  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  // Lock body scroll while the sheet is open so the gradient/page
  // underneath doesn't drift around as the user drags the sheet.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[99] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />
      <div
        ref={sheetRef}
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[100] bg-white rounded-t-3xl animate-slide-up max-h-[85vh] flex flex-col"
      >
        {/* Drag pill */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          {view !== 'menu' ? (
            <button
              type="button"
              onClick={() => setView('menu')}
              className="flex items-center gap-1 text-text-primary"
              aria-label="Back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {lang === 'he' ? 'arrow_forward' : 'arrow_back'}
              </span>
            </button>
          ) : (
            <span className="w-6" /> /* spacer */
          )}
          <h3 className="text-lg font-bold text-text-primary">
            {view === 'menu' && 'Dev Playground'}
            {view === 'notifications' && (language === 'he' ? 'בדיקת התראות' : 'Notification tests')}
            {view === 'chat' && (language === 'he' ? 'בדיקת צ\'אט' : 'Chat tests')}
          </h3>
          <button
            type="button"
            onClick={dismiss}
            className="text-text-muted active:scale-90 transition-transform"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-10 overflow-y-auto">
          {view === 'menu' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  navigate(`/${lang}/auth-flow/test`);
                  dismiss();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-warning/5 border border-warning/20 hover:bg-warning/10 active:scale-[0.98] transition-all text-start"
              >
                <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center text-2xl">
                  🧪
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">
                    {language === 'he' ? 'בדיקת זרימת אימות' : 'Auth flow test'}
                  </p>
                  <p className="text-xs text-text-muted leading-snug">
                    {language === 'he'
                      ? 'דמה משתמשים, ארגונים ומסלולי הצטרפות'
                      : 'Simulate users, orgs and onboarding paths'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 22 }}>
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView('notifications')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 active:scale-[0.98] transition-all text-start"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}
                  >
                    notifications_active
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">
                    {language === 'he' ? 'בדיקת התראות לייב' : 'Live notification tests'}
                  </p>
                  <p className="text-xs text-text-muted leading-snug">
                    {language === 'he'
                      ? 'ירה toast לפי קטגוריה, בחן batching ו-priorities'
                      : 'Fire toasts by category; test batching & priorities'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 22 }}>
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView('chat')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.98] transition-all text-start"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-emerald-600"
                    style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}
                  >
                    support_agent
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">
                    {language === 'he' ? 'בדיקת כפתורי צ\'אט' : 'Chat FAB tests'}
                  </p>
                  <p className="text-xs text-text-muted leading-snug">
                    {language === 'he'
                      ? 'הפעל/כבה צ\'אט נציג, החלף מצב הקלדה, איפוס מיקום'
                      : 'Toggle human-agent chat, simulate typing, reset positions'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 22 }}>
                  chevron_right
                </span>
              </button>
            </div>
          ) : view === 'notifications' ? (
            <NotificationTestPanel language={language} />
          ) : (
            <ChatTestPanel language={language} />
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
