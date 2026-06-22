import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
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
  /** Top-corner brand lockup: a square logo tile + title (e.g. a tenant club
   *  header), pinned to the top-start corner of the card. */
  topLogo?: string;
  topTitle?: string;
  /** Optional sky pill shown ABOVE the top title (e.g. "Learn more"). */
  topBadge?: { label: string; onClick?: () => void };
  /** When set, the top logo + title become a button (e.g. open the tenant page). */
  onTopClick?: () => void;
  /** Background media for the inner card (video wins over image, image over gradient). */
  bgVideo?: string;
  /** Playback speed for `bgVideo` (e.g. 2 = 2× / fast hyperlapse feel). */
  bgVideoRate?: number;
  bgImage?: string;
  /** Animated colourful gradient background (CSS, no file) — drifts slowly. */
  bgGradient?: string;
  /** object-position for the background media (e.g. 'center', 'top'). */
  mediaPosition?: string;
  /** object-fit for the background media. 'cover' (default) fills + crops;
   *  'contain' fits the whole frame inside the card (no cropping) — use it
   *  for landscape clips whose baked-in text would otherwise be cropped. */
  mediaFit?: 'cover' | 'contain';
  /** Padding around the media element (CSS padding string, e.g. '0 20px'),
   *  insetting the clip from the card edges so its baked-in text gets margin.
   *  The accent background shows in the gap. */
  mediaInset?: string;
  /** Vertical shift for the media (CSS translateY value, e.g. '-16%'). Use a
   *  negative value to push the clip up so its centered text clears the
   *  product slider that sits over the card's foot. The revealed bottom is
   *  covered by the slider + wash. */
  mediaShiftY?: string;
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

/**
 * LazyProductTile — shows a skeleton placeholder until the tile enters the
 * horizontal scroll container's visible area, then fades in the real content.
 * The IntersectionObserver root is the scroll container, so items 1-2 tiles
 * off-screen stay as skeleton and reveal as the user swipes right.
 */
function LazyProductTile({
  children,
  scrollRoot,
  index,
}: {
  children: ReactNode
  scrollRoot: RefObject<HTMLDivElement | null>
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    const root = scrollRoot.current
    if (!el || !root) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect() }
      },
      { root, rootMargin: '0px 80px 0px 80px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [scrollRoot])

  return (
    <div ref={ref} className="shrink-0 w-[132px]">
      {visible ? (
        <div
          className="animate-fade-in"
          style={{
            animationDelay: `${Math.min(index, 5) * 40}ms`,
            animationFillMode: 'backwards',
          }}
        >
          {children}
        </div>
      ) : (
        /* Skeleton matches the tile: 132px wide, 3/4 aspect image + text bar */
        <div>
          <div className="w-full aspect-[3/4] rounded-2xl bg-white/20 animate-pulse" />
          <div className="mt-2 h-3 w-4/5 rounded bg-white/20 animate-pulse" />
        </div>
      )}
    </div>
  )
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
  topLogo,
  topTitle,
  topBadge,
  onTopClick,
  bgVideo,
  bgVideoRate,
  bgImage,
  bgGradient,
  mediaPosition = 'center',
  mediaFit = 'cover',
  mediaInset,
  mediaShiftY,
  titleInMedia = false,
  aspectRatio,
  blurItems = false,
  cta,
  onSeeAll,
}: CategoryRowStoreProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const isDark = variant === 'dark';
  const videoRef = useInViewVideo<HTMLVideoElement>();
  // Root for per-tile IntersectionObserver — items outside this container stay as skeleton.
  const scrollRef = useRef<HTMLDivElement>(null);

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
            className={`absolute inset-0 w-full h-full ${mediaFit === 'contain' ? 'object-contain' : 'object-cover'}`}
            style={{ objectPosition: mediaPosition, padding: mediaInset, boxSizing: mediaInset ? 'border-box' : undefined, transform: mediaShiftY ? `translateY(${mediaShiftY})` : undefined }}
            onLoadedMetadata={bgVideoRate ? (e) => { e.currentTarget.playbackRate = bgVideoRate; } : undefined}
            onPlay={bgVideoRate ? (e) => { e.currentTarget.playbackRate = bgVideoRate; } : undefined}
          />
        ) : bgImage ? (
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full ${mediaFit === 'contain' ? 'object-contain' : 'object-cover'}`}
            style={{ objectPosition: mediaPosition, padding: mediaInset, boxSizing: mediaInset ? 'border-box' : undefined, transform: mediaShiftY ? `translateY(${mediaShiftY})` : undefined }}
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

        {/* Top brand lockup — an optional semi-transparent "learn more" pill
            sits ABOVE the square logo tile + title, pinned top-start (so the
            pill aligns to the logo's edge and can overflow toward the title). */}
        {topTitle && (
          <div className="absolute top-3 z-10 flex flex-col items-start gap-2" style={{ insetInlineStart: 16 }}>
            {topBadge && (
              <button
                type="button"
                onClick={topBadge.onClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm active:scale-95 transition-transform"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>info</span>
                {topBadge.label}
              </button>
            )}
            {(() => {
              const inner = (
                <>
                  {topLogo && (
                    <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md shrink-0">
                      <img
                        src={topLogo}
                        alt=""
                        aria-hidden
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </span>
                  )}
                  <span
                    className="text-lg font-bold text-white whitespace-nowrap"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
                  >
                    {topTitle}
                  </span>
                </>
              );
              return onTopClick ? (
                <button
                  type="button"
                  onClick={onTopClick}
                  className="flex items-center gap-3 active:scale-95 transition-transform"
                >
                  {inner}
                </button>
              ) : (
                <div className="flex items-center gap-3">{inner}</div>
              );
            })()}
          </div>
        )}

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
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {items.map((it, index) => (
              <LazyProductTile key={it.id} scrollRoot={scrollRef} index={index}>
                <button
                  type="button"
                  onClick={it.onClick}
                  className="w-[132px] text-start active:scale-[0.98] transition-transform"
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
              </LazyProductTile>
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
