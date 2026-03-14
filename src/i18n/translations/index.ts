import { commonTranslations } from './common';
import { homeTranslations } from './home';
import { storeTranslations } from './store';
import { walletTranslations } from './wallet';
import { activityTranslations } from './activity';
import { profileTranslations } from './profile';
import { authTranslations } from './auth';
import { registrationTranslations } from './registration';
import { authFlowTranslations } from './authFlow';
import { categoryTranslations } from './category';
import type { Translations } from '../types';

const navTranslations = {
  en: {
    home: 'Home',
    store: 'Purchases',
    wallet: 'Wallet',
    activity: 'Activity',
    more: 'Profile',
  },
  he: {
    home: 'בית',
    store: 'רכישות',
    wallet: 'ארנק',
    activity: 'פעילות',
    more: 'פרופיל',
  },
};

export const translations: Translations = {
  en: {
    common: commonTranslations.en,
    home: homeTranslations.en,
    store: storeTranslations.en,
    wallet: walletTranslations.en,
    activity: activityTranslations.en,
    profile: profileTranslations.en,
    nav: navTranslations.en,
    auth: authTranslations.en,
    registration: registrationTranslations.en,
    authFlow: authFlowTranslations.en,
    category: categoryTranslations.en,
  },
  he: {
    common: commonTranslations.he,
    home: homeTranslations.he,
    store: storeTranslations.he,
    wallet: walletTranslations.he,
    activity: activityTranslations.he,
    profile: profileTranslations.he,
    nav: navTranslations.he,
    auth: authTranslations.he,
    registration: registrationTranslations.he,
    authFlow: authFlowTranslations.he,
    category: categoryTranslations.he,
  },
};
