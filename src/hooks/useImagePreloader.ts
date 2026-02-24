import { useState, useEffect } from 'react';

interface PreloadResult {
  loaded: boolean;
  failed: Set<string>;
}

/**
 * Preloads a list of image URLs before rendering.
 * Returns `loaded=true` once all images have settled (resolved or failed).
 * Failed URLs are available in `failed` for fallback rendering.
 */
export function useImagePreloader(urls: string[]): PreloadResult {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (urls.length === 0) {
      setLoaded(true);
      return;
    }

    let settled = 0;
    const failedUrls = new Set<string>();

    const onSettle = (url: string, ok: boolean) => {
      if (!ok) failedUrls.add(url);
      settled++;
      if (settled === urls.length) {
        setFailed(new Set(failedUrls));
        setLoaded(true);
      }
    };

    urls.forEach((url) => {
      const img = new Image();
      img.onload = () => onSettle(url, true);
      img.onerror = () => onSettle(url, false);
      img.src = url;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join(',')]);

  return { loaded, failed };
}
