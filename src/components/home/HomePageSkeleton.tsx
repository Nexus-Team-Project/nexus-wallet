import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for HomePage.
 * Shown while the initial data (vouchers, recommendations) is loading.
 * Each section mirrors the real layout so there's no layout shift on reveal.
 */
export default function HomePageSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* ── HeroBanner ── */}
      <section className="mb-5 px-4">
        <Skeleton variant="rectangular" className="w-full rounded-xl" height="220px" />
        {/* dots row */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Skeleton variant="rectangular" className="rounded-full" width="20px" height="8px" />
          <Skeleton variant="circular" width="8px" height="8px" />
          <Skeleton variant="circular" width="8px" height="8px" />
          <Skeleton variant="circular" width="24px" height="24px" />
        </div>
      </section>

      {/* ── BrandSlider ── */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <div className="flex gap-4 px-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton variant="circular" width="60px" height="60px" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* ── TopStores ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-10 rounded-md" />
        </div>
        <div className="flex gap-3 px-5 overflow-hidden">
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="120px" height="200px" />
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
        </div>
      </section>

      {/* ── NearYou ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-10 rounded-md" />
        </div>
        <div className="flex gap-3 px-5 overflow-hidden">
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
        </div>
      </section>

      {/* ── ActiveOffers ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-10 rounded-md" />
        </div>
        <div className="flex gap-3 px-5 overflow-hidden">
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="120px" height="200px" />
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
          <Skeleton variant="rectangular" className="rounded-lg shrink-0" width="300px" height="200px" />
        </div>
      </section>
    </div>
  );
}
