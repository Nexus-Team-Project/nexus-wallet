import { useLanguage } from '../../i18n/LanguageContext';
import { useInViewVideo } from '../../hooks/useInViewVideo';

export interface CategoryRowItem {
  id: string;
  name: string;
  nameHe: string;
  /** Product image. When absent, `emoji` is shown instead. */
  image?: string;
  /** Emoji/icon shown when there's no image (e.g. a tenant benefit). */
  emoji?: string;
  price?: number;
  currency?: string;
  /** Tap handler — wired by the page (e.g. navigate to the product). */
  onClick?: () => void;
}

interface CategoryRowStoreProps {
  /** Category heading (the "store" title). Hidden when `titleInMedia`. */
  title: string;
  titleHe: string;
  /** Optional small line above the title. */
  subtitle?: string;
  subtitleHe?: string;
  /** The product tiles shown in the horizontal category row. */
  items: CategoryRowItem[];
  /** Outer card background — the category/brand accent colour. */
  accentColor?: string;
  /** 'light' = bright wash, 'dark' = black wash over the media. */
  variant?: 'light' | 'dark';
  /** Promo copy shown in the outer card's foot. */
  promo?: { saveLabel: string; condition: string };
  /** Background media for the inner card (video wins over image, image over gradient). */
  bgVideo?: string;
  bgImage?: string;
  /** Animated colourful gradient background (CSS, no file) — drifts slowly. */
  bgGradient?: string;
  /** object-position for the background media (e.g. 'center', 'top'). */
  mediaPosition?: string;
  /** When the title is baked into the media: hide the overlaid title and keep
   *  the wash to the bottom only, so the media's text stays visible. */
  titleInMedia?: boolean;
  /** Fix the inner card's proportions (e.g. '2 / 3' to match the Castro card)
   *  so its height scales with width. Content is pinned to the bottom. */
  aspectRatio?: string;
  /** Glass-blur the product tile images (e.g. a locked teaser for unverified
   *  users — the layout stays identical, only the images are frosted). */
  blurItems?: boolean;
  /** When set, replaces the "Shop all" row with a prominent CTA button. */
  cta?: { label: string; onClick: () => void };
  /** "See all" / "Shop all" handler. */
  onSeeAll?: () => void;
}

// Pick a legible text colour (near-black / white) for a given hex background.
function readableText(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}

/**
 * CategoryRowStore — an in-page "store" that is actually a CATEGORY ROW. It
 * reuses the BrandFeatureStore card-within-a-card shell (accent outer card →
 * media inner card → header → CTA → promo foot), but instead of one brand's
 * product grid the inner card holds a horizontal, scrollable row of products
 * for a category.
 *
 * With `titleInMedia` the overlaid title is dropped (the background video/image
 * already shows the category title) and the wash is pushed to the bottom so the
 * media's baked-in text stays visible; the row + CTA sit at the foot. Pair it
 * with `aspectRatio` to match the height of the brand cards above it.
 */
export default function CategoryRowStore({
  title,
  titleHe,
  subtitle,
  subtitleHe,
  items,
  accentColor = '#3a3a3a',
  variant = 'dark',
  promo,
  bgVideo,
  bgImage,
  bgGradient,
  mediaPosition = 'center',
  titleInMedia = false,
  aspectRatio,
  blurItems = false,
  cta,
  onSeeAll,
}: CategoryRowStoreProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const isDark = variant === 'dark';
  // Background video only plays while the card is in view (see hook).
  const videoRef = useInViewVideo<HTMLVideoElement>();

  const outerText = readableText(accentColor);
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  // Full wash for the default card; bottom-only when the title lives in the
  // media OR when there's an animated gradient (so its colour stays vivid up
  // top and only the foot — where the title/row sit — is darkened).
  const overlay = titleInMedia || bgGradient
    ? 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 56%)'
    : isDark
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.80) 100%)'
      : 'linear-gradient(to bottom, rgba(165,148,148,0.78) 0%, rgba(165,148,148,0.92) 100%)';

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 rounded-3xl overflow-hidden shadow-xl"
      style={{ background: accentColor }}
    >
      {/* Inner card — media background under a colour wash. */}
      <div
        className="relative rounded-[20px] overflow-hidden text-white flex flex-col"
        style={{ aspectRatio }}
      >
        {bgVideo ? (
          <video
            ref={videoRef}
            src={bgVideo}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: mediaPosition }}
          />
        ) : bgImage ? (
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: mediaPosition }}
          />
        ) : bgGradient ? (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: bgGradient,
              backgroundSize: '220% 220%',
              animation: 'lava-flow 14s ease-in-out infinite',
            }}
          />
        ) : null}
        <div className="absolute inset-0" aria-hidden style={{ background: overlay }} />

        {/* "More" affordance, top corner — kept when the title is in the media
            (there's no header row in that mode). */}
        {titleInMedia && (
          <button
            type="button"
            onClick={onSeeAll}
            aria-label={isHe ? 'עוד' : 'More'}
            className="absolute z-10 top-4 active:opacity-60"
            style={{ insetInlineEnd: 16 }}
          >
            <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>more_horiz</span>
          </button>
        )}

        <div className={`relative z-10 p-6 ${aspectRatio ? 'mt-auto' : ''}`}>
          {/* Header — only when the title isn't already in the media. */}
          {!titleInMedia && (
            <div className="flex items-start justify-between mb-5">
              <div className="min-w-0">
                {(subtitle || subtitleHe) && (
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-white/70 mb-1">
                    {isHe ? subtitleHe : subtitle}
                  </p>
                )}
                <h2 className="text-2xl font-bold tracking-tight leading-tight">
                  {isHe ? titleHe : title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onSeeAll}
                aria-label={isHe ? 'עוד' : 'More'}
                className="shrink-0 active:opacity-60"
              >
                <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>more_horiz</span>
              </button>
            </div>
          )}

          {/* Category ROW — horizontal scrolling product tiles */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={it.onClick}
                className="shrink-0 w-[132px] text-start active:scale-[0.98] transition-transform"
              >
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={isHe ? it.nameHe : it.name}
                      className={`w-full h-full object-cover ${blurItems ? 'blur-[10px] scale-110' : ''}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : it.emoji ? (
                    <span aria-hidden style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}>
                      {it.emoji}
                    </span>
                  ) : null}
                  {/* Frosted-glass veil — locked teaser for unverified users. */}
                  {blurItems && <div aria-hidden className="absolute inset-0 bg-white/15" />}
                  {it.price != null && (
                    <span
                      className="absolute top-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[10px] font-bold text-white"
                      style={{ insetInlineStart: 8 }}
                      dir="ltr"
                    >
                      {it.currency}{it.price}
                    </span>
                  )}
                </div>
                {!blurItems && (
                  <p className="mt-2 text-[13px] font-semibold text-white truncate leading-tight">
                    {isHe ? it.nameHe : it.name}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Bottom action — big label + circular arrow. A CTA may override the
              label/handler (e.g. the locked teaser), but keeps the same look. */}
          <button
            type="button"
            onClick={cta?.onClick ?? onSeeAll}
            className="mt-6 w-full flex items-center justify-between gap-3 active:opacity-70"
          >
            <span
              className={`tracking-tight ${
                cta
                  ? 'text-sm font-semibold whitespace-nowrap'
                  : 'text-3xl font-medium'
              }`}
            >
              {cta?.label ?? (isHe ? 'לכל הקטגוריה' : 'Shop all')}
            </span>
            <span className="shrink-0 flex items-center justify-center rounded-full bg-white/20 text-white w-10 h-10">
              <span className="material-symbols-rounded block" style={{ fontSize: 20 }}>{arrow}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Promo — outer card foot, on the accent colour. */}
      {promo && (
        <div className="py-3.5 px-6 text-center text-sm font-medium" style={{ color: outerText }}>
          <span className="bg-primary text-white px-2 py-0.5 rounded text-[11px] font-bold" style={{ marginInlineEnd: 6 }}>
            {promo.saveLabel}
          </span>
          {promo.condition}
        </div>
      )}
    </section>
  );
}
