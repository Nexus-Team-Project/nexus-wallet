import Skeleton from '../ui/Skeleton'
import GradientSkeletonCard from '../ui/GradientSkeletonCard'

/** Horizontal slider row — title bar + 3 gradient voucher cards. */
export function SkeletonSliderRow({ startIndex = 0 }: { startIndex?: number }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-10 rounded-md" />
      </div>
      <div className="flex gap-3 px-5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <GradientSkeletonCard
            key={i}
            index={startIndex + i}
            className="w-[75vw] max-w-[300px]"
            imageHeight="20vh"
          />
        ))}
      </div>
    </section>
  )
}

/** Circle-avatar row — brand logos + labels (BrandSlider). */
export function SkeletonCircleRow({ count = 7 }: { count?: number }) {
  return (
    <section className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-12 rounded-md" />
      </div>
      <div className="flex gap-4 px-5 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <Skeleton variant="circular" width="60px" height="60px" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Big portrait card — mirrors CategoryRowStore with aspectRatio="2/3"
 * (used by TenantOffers and NearYou).
 */
export function SkeletonCategoryRowCard() {
  return (
    <div className="mb-6 mx-5">
      <div
        className="w-full rounded-[20px] animate-pulse bg-border"
        style={{ aspectRatio: '2/3' }}
      />
    </div>
  )
}

/**
 * Brand feature card — mirrors BrandFeatureStore (golf, H&M).
 * Outer coloured band + inner card with product 2×2 grid + footer promo.
 */
export function SkeletonBrandFeatureCard() {
  return (
    <div className="mb-6 mx-5 animate-pulse">
      <div className="rounded-[20px] bg-border overflow-hidden">
        {/* Inner card placeholder */}
        <div className="m-3 rounded-[16px] bg-border/60">
          {/* Hero image area */}
          <div className="w-full rounded-[16px] bg-border" style={{ aspectRatio: '4/3' }} />
          {/* Product 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-border" style={{ aspectRatio: '1' }} />
            ))}
          </div>
          {/* Shop all row */}
          <div className="h-10 mx-3 mb-3 rounded-xl bg-border" />
        </div>
        {/* Promo footer */}
        <div className="px-5 py-3">
          <div className="h-4 w-24 rounded bg-border/60" />
          <div className="h-3 w-36 rounded bg-border/60 mt-1.5" />
        </div>
      </div>
    </div>
  )
}

/**
 * Brand catalog card — mirrors BrandCatalogStore (rhode, Yves Rocher).
 * White card with header, 2×2 product grid, and "Shop all" footer.
 */
export function SkeletonBrandCatalogCard() {
  return (
    <section className="mb-6 mx-5 animate-pulse">
      <div className="bg-white rounded-[24px] border border-border p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton variant="circular" width="44px" height="44px" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* 2×2 product grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="rounded-2xl" height="130px" />
          ))}
        </div>
        {/* Shop all footer */}
        <Skeleton variant="rectangular" className="w-full" height="44px" />
      </div>
    </section>
  )
}

/** Simple banner placeholder (ReferralBanner). */
export function SkeletonBanner() {
  return (
    <div className="mb-6 mx-5">
      <Skeleton variant="rectangular" className="w-full rounded-[20px]" height="96px" />
    </div>
  )
}

/**
 * Recently-viewed dark card — mirrors the 3×3 tile grid with dark background.
 */
export function SkeletonRecentlyViewed() {
  return (
    <div className="mb-6 mx-5 animate-pulse">
      <div className="rounded-[24px] overflow-hidden bg-neutral-900">
        <div className="grid grid-cols-3 gap-2 p-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-neutral-800" style={{ height: '80px' }} />
          ))}
        </div>
        <div className="h-12 border-t border-neutral-800 flex items-center justify-center">
          <div className="h-3 w-28 rounded bg-neutral-800" />
        </div>
      </div>
    </div>
  )
}
