import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { translations } from './translations';
import type { Language, Direction, TranslationKeys } from './types';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const language: Language = lang === 'en' ? 'en' : 'he';
  const direction: Direction = language === 'he' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback(
    (newLang: Language) => {
      const currentPath = location.pathname;
      const newPath = currentPath.replace(`/${language}`, `/${newLang}`);
      navigate(newPath);
    },
    [language, location.pathname, navigate],
  );

  // Memoised so the context value is referentially stable across renders —
  // otherwise every one of the ~120 `useLanguage()` consumers re-renders on
  // any provider render (e.g. a route change), even when the language is
  // unchanged.
  const value = useMemo(
    () => ({ language, direction, t, setLanguage, isRTL }),
    [language, direction, t, setLanguage, isRTL],
  );

  return (
    <LanguageContext.Provider value={value}>
      <div dir={direction} className={isRTL ? 'font-hebrew' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
