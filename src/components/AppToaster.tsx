/**
 * AppToaster — the app's single sonner <Toaster>, made language-aware.
 *
 * sonner portals its toasts to <body>, outside the LanguageProvider's
 * `dir` wrapper, so without an explicit `dir` every toast renders LTR. That
 * left-aligns Hebrew copy and puts the close button / icon on the wrong side.
 * This component reads the active language and passes the matching `dir`, so
 * Hebrew toasts are right-to-left and English toasts stay left-to-right. It
 * must be rendered inside a LanguageProvider.
 *
 * Positioning: horizontally centered and placed around the vertical middle of
 * the screen (`top: 45vh`), with 16px side gaps on mobile so the toast never
 * overflows the left/right edges on a phone.
 */
import { Toaster } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

/** Distance from the top so the toast sits around the screen's vertical middle. */
const MIDDLE_OFFSET = '45vh';

/**
 * Render the global toaster with the current language's text direction.
 * @returns the configured sonner Toaster element.
 */
export default function AppToaster() {
  const { direction } = useLanguage();
  return (
    <Toaster
      position="top-center"
      richColors
      dir={direction}
      offset={{ top: MIDDLE_OFFSET }}
      mobileOffset={{ top: MIDDLE_OFFSET, left: '16px', right: '16px' }}
    />
  );
}
