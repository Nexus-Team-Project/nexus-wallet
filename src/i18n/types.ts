import type { translations } from './translations';

export type Language = 'en' | 'he';
export type Direction = 'ltr' | 'rtl';

export type TranslationKeys = (typeof translations)['en'];
export type Translations = typeof translations;
