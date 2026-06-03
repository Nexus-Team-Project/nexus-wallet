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
 * Positioning: top-center (horizontally centered, near the top of the screen),
 * with 16px side gaps on mobile so the toast stays exactly centered and never
 * overflows the left/right edges on a phone.
 */
import { Toaster } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

/** Small gap from the top edge so the toast clears the status bar / notch. */
const TOP_OFFSET = '16px';

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
      offset={{ top: TOP_OFFSET }}
      mobileOffset={{ top: TOP_OFFSET, left: '16px', right: '16px' }}
    />
  );
}
